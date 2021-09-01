import { Collection, CommandInteraction, Message } from 'discord.js';
import { CommandHandlerOptions, IgnoreCheckPredicate } from '../../typings';
import { BuiltInReasons, CommandHandlerEvents } from '../../utils/Constants';
import SnowError from '../../utils/SnowError';
import { isPromise } from '../../utils/Utils';
import InhibitorHandler from '../inhibitors/InhibitorHandler';
import ListenerHandler from '../listeners/ListenerHandler';
import SnowClient from '../SnowClient';
import SnowHandler from '../SnowHandler';
import Command from './Command';

class CommandHandler extends SnowHandler {
  public resolver: any;
  public blockBots: boolean;
  public blockClient: boolean;
  public fetchMembers: boolean;
  public commands: Set<string>;
  public defaultCooldown: number;
  public inhibitorHandler: InhibitorHandler | null;
  public ignoreCooldown: string | string[] | IgnoreCheckPredicate;
  public ignorePermissions: string | string[] | IgnoreCheckPredicate;
  public cooldowns: Collection<
    string,
    {
      [key: string]: {
        timer: NodeJS.Timeout;
        end: number;
        uses: number;
      } | null;
    }
  >;

  public constructor(
    client: SnowClient,
    {
      directory,
      classToHandle = Command,
      extensions = ['.js', '.ts'],
      automateCategories,
      loadFilter,
      blockClient = true,
      blockBots = true,
      fetchMembers = false,
      defaultCooldown = 0,
      ignoreCooldown = client.ownerID,
      ignorePermissions = []
    }: CommandHandlerOptions = {}
  ) {
    if (
      !(classToHandle.prototype instanceof Command || classToHandle === Command)
    ) {
      throw new SnowError(
        'INVALID_CLASS_TO_HANDLE',
        classToHandle.name,
        Command.name
      );
    }

    super(client, {
      directory,
      classToHandle,
      extensions,
      automateCategories,
      loadFilter
    });

    this.inhibitorHandler = null;

    this.fetchMembers = fetchMembers;
    this.blockClient = blockClient;
    this.blockBots = blockBots;
    this.defaultCooldown = defaultCooldown;
    this.ignoreCooldown = ignoreCooldown;
    this.ignorePermissions = ignorePermissions;

    this.commands = new Set();
    this.cooldowns = new Collection();
    this.resolver = new TypeResolver(this);

    this.setup();
  }

  private setup() {
    this.client.once('ready', () => {
      this.client.on('message', async (message: Message) => {
        await this.runAllTypeInhibitors(message);
      });
      this.client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand()) return;
        await this.handle(interaction);
      });
    });
  }

  public override register(command: Command, filepath?: string) {
    super.register(command, filepath);

    const id = command.id.toLowerCase();

    const conflict = this.commands.has(id);
    if (conflict) throw new SnowError('ALIAS_CONFLICT', command.id);

    this.commands.add(id);
  }

  public override deregister(command: Command) {
    const id = command.id.toLowerCase();

    this.commands.delete(id);

    super.deregister(command);
  }

  public async handle(interaction: CommandInteraction) {
    try {
      if (
        this.fetchMembers &&
        interaction.guild &&
        !interaction.member &&
        !interaction.webhook.id
      )
        await interaction.guild.members.fetch(interaction.user);

      if (await this.runAllTypeInhibitors(interaction)) return false;

      if (await this.runPreTypeInhibitors(interaction)) return false;

      const command = this.parseCommand(interaction);

      let ran: boolean | null = false;
      if (command) ran = await this.handleDirectCommand(interaction, command);

      if (!ran) {
        this.emit(CommandHandlerEvents.MESSAGE_INVALID, interaction);
        return false;
      }

      return ran;
    } catch (err: any) {
      this.emitError(err, interaction);
      return null;
    }
  }

  public async handleDirectCommand(
    interaction: CommandInteraction,
    command: Command,
    ignore = false
  ) {
    try {
      if (!ignore) {
        if (await this.runPostTypeInhibitors(interaction, command))
          return false;
      }

      return await this.runCommand(interaction, command);
    } catch (err) {
      this.emitError(err, interaction, command);
      return null;
    }
  }

  public async runAllTypeInhibitors(
    messageOrInteraction: Message | CommandInteraction
  ) {
    const reason = this.inhibitorHandler
      ? await this.inhibitorHandler.test('all', messageOrInteraction)
      : null;

    if (reason !== null) {
      this.emit(
        CommandHandlerEvents.MESSAGE_BLOCKED,
        messageOrInteraction,
        reason
      );
    } else if (
      this.blockClient &&
      (messageOrInteraction instanceof Message
        ? messageOrInteraction.author.id === this.client.user?.id
        : messageOrInteraction.user.id === this.client.user?.id)
    ) {
      this.emit(
        CommandHandlerEvents.MESSAGE_BLOCKED,
        messageOrInteraction,
        BuiltInReasons.CLIENT
      );
    } else if (
      this.blockBots &&
      (messageOrInteraction instanceof Message
        ? messageOrInteraction.author.bot
        : messageOrInteraction.user.bot)
    ) {
      this.emit(
        CommandHandlerEvents.MESSAGE_BLOCKED,
        messageOrInteraction,
        BuiltInReasons.BOT
      );
    } else {
      return false;
    }

    return true;
  }

  public async runPreTypeInhibitors(interaction: CommandInteraction) {
    const reason = this.inhibitorHandler
      ? await this.inhibitorHandler.test('pre', interaction)
      : null;

    if (reason === null) {
      return false;
    }

    this.emit(CommandHandlerEvents.MESSAGE_BLOCKED, interaction, reason);

    return true;
  }

  public async runPostTypeInhibitors(
    interaction: CommandInteraction,
    command: Command
  ) {
    if (command.ownerOnly) {
      const isOwner = this.client.isOwner(interaction.user);
      if (!isOwner) {
        this.emit(
          CommandHandlerEvents.COMMAND_BLOCKED,
          interaction,
          command,
          BuiltInReasons.OWNER
        );
        return true;
      }
    }

    if (command.channel === 'guild' && !interaction.guild) {
      this.emit(
        CommandHandlerEvents.COMMAND_BLOCKED,
        interaction,
        command,
        BuiltInReasons.GUILD
      );
      return true;
    }

    if (command.channel === 'dm' && interaction.guild) {
      this.emit(
        CommandHandlerEvents.COMMAND_BLOCKED,
        interaction,
        command,
        BuiltInReasons.DM
      );
      return true;
    }

    if (await this.runPermissionChecks(interaction, command)) {
      return true;
    }

    const reason = this.inhibitorHandler
      ? await this.inhibitorHandler.test('post', interaction, command)
      : null;

    if (reason !== null) {
      this.emit(
        CommandHandlerEvents.COMMAND_BLOCKED,
        interaction,
        command,
        reason
      );
      return true;
    }

    if (this.runCooldowns(interaction, command)) {
      return true;
    }

    return false;
  }

  public async runPermissionChecks(
    interaction: CommandInteraction,
    command: Command
  ) {
    if (command.clientPermissions) {
      if (typeof command.clientPermissions === 'function') {
        let missing = command.clientPermissions(interaction);
        if (isPromise(missing)) missing = await missing;

        if (missing !== null) {
          this.emit(
            CommandHandlerEvents.MISSING_PERMISSIONS,
            interaction,
            command,
            'client',
            missing
          );
          return true;
        }
      } else if (interaction.guild && interaction.channel?.type !== 'DM') {
        const missing = interaction.channel
          ?.permissionsFor(this.client.user!)
          ?.missing(command.clientPermissions);
        if (missing?.length) {
          this.emit(
            CommandHandlerEvents.MISSING_PERMISSIONS,
            interaction,
            command,
            'client',
            missing
          );
          return true;
        }
      }
    }

    if (command.userPermissions) {
      const ignorer = command.ignorePermissions || this.ignorePermissions;
      const isIgnored = Array.isArray(ignorer)
        ? ignorer.includes(interaction.user.id)
        : typeof ignorer === 'function'
        ? ignorer(interaction, command)
        : interaction.user.id === ignorer;

      if (!isIgnored) {
        if (typeof command.userPermissions === 'function') {
          let missing = command.userPermissions(interaction);
          if (isPromise(missing)) missing = await missing;

          if (missing !== null) {
            this.emit(
              CommandHandlerEvents.MISSING_PERMISSIONS,
              interaction,
              command,
              'user',
              missing
            );
            return true;
          }
        } else if (interaction.guild && interaction.channel?.type !== 'DM') {
          const missing = interaction.channel
            ?.permissionsFor(interaction.user)
            ?.missing(command.userPermissions);
          if (missing?.length) {
            this.emit(
              CommandHandlerEvents.MISSING_PERMISSIONS,
              interaction,
              command,
              'user',
              missing
            );
            return true;
          }
        }
      }
    }

    return false;
  }

  public runCooldowns(interaction: CommandInteraction, command: Command) {
    const ignorer = command.ignoreCooldown || this.ignoreCooldown;
    const isIgnored = Array.isArray(ignorer)
      ? ignorer.includes(interaction.user.id)
      : typeof ignorer === 'function'
      ? ignorer(interaction, command)
      : interaction.user.id === ignorer;

    if (isIgnored) return false;

    const time = command.cooldown ? command.cooldown : this.defaultCooldown;
    if (!time) return false;

    const endTime = Number(interaction.createdTimestamp) + time;

    const id = interaction.user.id;
    if (!this.cooldowns.has(id)) this.cooldowns.set(id, {});

    if (!this.cooldowns.get(id)![command.id]) {
      this.cooldowns.get(id)![command.id] = {
        timer: setTimeout(() => {
          if (this.cooldowns.get(id)![command.id]) {
            clearTimeout(this.cooldowns.get(id)![command.id]!.timer);
          }
          this.cooldowns.get(id)![command.id] = null;

          if (!Object.keys(this.cooldowns.get(id)!).length) {
            this.cooldowns.delete(id);
          }
        }, time).unref(),
        end: endTime,
        uses: 0
      };
    }

    const entry = this.cooldowns.get(id)![command.id]!;

    if (entry.uses >= command.ratelimit) {
      const end = entry.end;
      const diff = end - interaction.createdTimestamp;

      this.emit(CommandHandlerEvents.COOLDOWN, interaction, command, diff);
      return true;
    }

    entry.uses++;
    return false;
  }

  public async runCommand(interaction: CommandInteraction, command: Command) {
    if (command.typing) {
      interaction.channel?.sendTyping();
    }

    const args = command.args?.map((arg) => {
      switch (arg.type) {
        case 'boolean':
          return interaction.options.getBoolean(arg.id);
        case 'integer':
          return interaction.options.getInteger(arg.id);
        case 'number':
          return interaction.options.getNumber(arg.id);
        case 'string':
          return interaction.options.getString(arg.id);
        case 'user':
          return interaction.options.getUser(arg.id);
        case 'mentionable':
          return interaction.options.getMentionable(arg.id);
        case 'channel':
          return interaction.options.getChannel(arg.id);
        case 'role':
          return interaction.options.getRole(arg.id);
        case 'member':
          return interaction.options.getMember(arg.id);
      }
    });

    this.emit(CommandHandlerEvents.COMMAND_STARTED, interaction, command, args);

    const ret = await command.exec(interaction, args);

    this.emit(
      CommandHandlerEvents.COMMAND_FINISHED,
      interaction,
      command,
      args,
      ret
    );

    return true;
  }

  public parseCommand(interaction: CommandInteraction) {
    const name = interaction.options.getSubcommand()
      ? interaction.options.getSubcommand()
      : interaction.commandName;

    const result = (this.modules as Collection<string, Command>).get(name);
    if (result) return result;

    return null;
  }

  public emitError(
    err: any,
    interaction: CommandInteraction,
    command?: Command
  ) {
    if (this.listenerCount(CommandHandlerEvents.ERROR)) {
      this.emit(CommandHandlerEvents.ERROR, err, interaction, command);
      return;
    }

    throw err;
  }

  public findCommand(name: string) {
    return (this.modules as Collection<string, Command>).get(
      name.toLowerCase()
    );
  }

  public useInhibitorHandler(inhibitorHandler: InhibitorHandler) {
    this.inhibitorHandler = inhibitorHandler;
    this.resolver.inhibitorHandler = inhibitorHandler;

    return this;
  }

  public useListenerHandler(listenerHandler: ListenerHandler) {
    this.resolver.listenerHandler = listenerHandler;

    return this;
  }
}

export default CommandHandler;
