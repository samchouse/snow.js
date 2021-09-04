import { Collection, CommandInteraction, Message } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { CommandHandlerOptions } from '../../typings';
import { BuiltInReasons, CommandHandlerEvents } from '../../utils/Constants';
import SnowError from '../../utils/SnowError';
import InhibitorHandler from '../inhibitors/InhibitorHandler';
import SnowClient from '../SnowClient';
import SnowHandler from '../SnowHandler';
import Command from './Command';
import { SlashCommandBuilder } from '@discordjs/builders';

class CommandHandler extends SnowHandler {
  public resolver: any;
  public blockBots: boolean;
  public blockClient: boolean;
  public fetchMembers: boolean;
  public defaultCooldown: number;
  public ignoreCooldown: string | string[];
  public commands: Collection<string, string>;
  public inhibitorHandler: InhibitorHandler | null;
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
      ignoreCooldown = client.ownerID
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

    this.commands = new Collection();
    this.cooldowns = new Collection();

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

  public override register(command: Command, filepath: string) {
    super.register(command, filepath);

    if (!command.name) throw new Error(`No name for ${command.id}`);

    const conflict = {
      id: this.commands.has(command.id.toLowerCase()),
      name:
        typeof this.commands.find(
          (name) => name === command.name!.toLowerCase()
        ) === 'string'
    };

    if (conflict.id || conflict.name)
      throw new SnowError('ALIAS_CONFLICT', command.id, command.name);

    this.commands.set(command.id.toLowerCase(), command.name.toLowerCase());
  }

  public override deregister(command: Command) {
    this.commands.delete(command.id.toLowerCase());

    super.deregister(command);
  }

  public override async loadAll(
    directory = this.directory,
    filter = this.loadFilter
  ) {
    await super.loadAll(directory, filter);

    const parents = new Collection<
      { name: string; description: string },
      Command[]
    >();
    const commands = (this.modules as Collection<string, Command>).map(
      (command) => {
        if (command.parent) {
          parents.has(command.parent)
            ? parents.get(command.parent)!.push(command)
            : parents.set(command.parent, [command]);

          return undefined;
        }

        const slashCommand = new SlashCommandBuilder()
          .setName(command.name!)
          .setDescription(command.description);

        if (command.args)
          command.args.forEach((arg) => {
            switch (arg.type) {
              case 'boolean':
                slashCommand.addBooleanOption((option) =>
                  option
                    .setName(arg.name)
                    .setDescription(arg.description)
                    .setRequired(arg.required ?? false)
                );
                break;
              case 'integer':
                slashCommand.addIntegerOption((option) => {
                  option
                    .setName(arg.name)
                    .setDescription(arg.description)
                    .setRequired(arg.required ?? false);

                  if (arg.choices)
                    option.addChoices(
                      arg.choices.map(({ name, value }) => [name, value])
                    );

                  return option;
                });
                break;
              case 'number':
                slashCommand.addNumberOption((option) => {
                  option
                    .setName(arg.name)
                    .setDescription(arg.description)
                    .setRequired(arg.required ?? false);

                  if (arg.choices)
                    option.addChoices(
                      arg.choices.map(({ name, value }) => [name, value])
                    );

                  return option;
                });
                break;
              case 'string':
                slashCommand.addStringOption((option) => {
                  option
                    .setName(arg.name)
                    .setDescription(arg.description)
                    .setRequired(arg.required ?? false);

                  if (arg.choices)
                    option.addChoices(
                      arg.choices.map(({ name, value }) => [name, value])
                    );

                  return option;
                });
                break;
              case 'user':
                slashCommand.addUserOption((option) =>
                  option
                    .setName(arg.name)
                    .setDescription(arg.description)
                    .setRequired(arg.required ?? false)
                );
                break;
              case 'mentionable':
                slashCommand.addMentionableOption((option) =>
                  option
                    .setName(arg.name)
                    .setDescription(arg.description)
                    .setRequired(arg.required ?? false)
                );
                break;
              case 'channel':
                slashCommand.addChannelOption((option) =>
                  option
                    .setName(arg.name)
                    .setDescription(arg.description)
                    .setRequired(arg.required ?? false)
                );
                break;
              case 'role':
                slashCommand.addRoleOption((option) =>
                  option
                    .setName(arg.name)
                    .setDescription(arg.description)
                    .setRequired(arg.required ?? false)
                );
                break;
              case 'member':
                slashCommand.addUserOption((option) =>
                  option
                    .setName(arg.name)
                    .setDescription(arg.description)
                    .setRequired(arg.required ?? false)
                );
                break;
            }
          });

        return slashCommand;
      }
    );

    const commandsWithSubcommands = parents.map((commands, parent) => {
      const slashCommand = new SlashCommandBuilder()
        .setName(parent.name)
        .setDescription(parent.description);

      commands.map((command) => {
        slashCommand.addSubcommand((subcommand) => {
          subcommand.setName(command.name!).setDescription(command.description);

          if (command.args)
            command.args.forEach((arg) => {
              switch (arg.type) {
                case 'boolean':
                  subcommand.addBooleanOption((option) =>
                    option
                      .setName(arg.name)
                      .setDescription(arg.description)
                      .setRequired(arg.required ?? false)
                  );
                  break;
                case 'integer':
                  subcommand.addIntegerOption((option) => {
                    option
                      .setName(arg.name)
                      .setDescription(arg.description)
                      .setRequired(arg.required ?? false);

                    if (arg.choices)
                      option.addChoices(
                        arg.choices.map(({ name, value }) => [name, value])
                      );

                    return option;
                  });
                  break;
                case 'number':
                  subcommand.addNumberOption((option) => {
                    option
                      .setName(arg.name)
                      .setDescription(arg.description)
                      .setRequired(arg.required ?? false);

                    if (arg.choices)
                      option.addChoices(
                        arg.choices.map(({ name, value }) => [name, value])
                      );

                    return option;
                  });
                  break;
                case 'string':
                  subcommand.addStringOption((option) => {
                    option
                      .setName(arg.name)
                      .setDescription(arg.description)
                      .setRequired(arg.required ?? false);

                    if (arg.choices)
                      option.addChoices(
                        arg.choices.map(({ name, value }) => [name, value])
                      );

                    return option;
                  });
                  break;
                case 'user':
                  subcommand.addUserOption((option) =>
                    option
                      .setName(arg.name)
                      .setDescription(arg.description)
                      .setRequired(arg.required ?? false)
                  );
                  break;
                case 'mentionable':
                  subcommand.addMentionableOption((option) =>
                    option
                      .setName(arg.name)
                      .setDescription(arg.description)
                      .setRequired(arg.required ?? false)
                  );
                  break;
                case 'channel':
                  subcommand.addChannelOption((option) =>
                    option
                      .setName(arg.name)
                      .setDescription(arg.description)
                      .setRequired(arg.required ?? false)
                  );
                  break;
                case 'role':
                  subcommand.addRoleOption((option) =>
                    option
                      .setName(arg.name)
                      .setDescription(arg.description)
                      .setRequired(arg.required ?? false)
                  );
                  break;
                case 'member':
                  subcommand.addUserOption((option) =>
                    option
                      .setName(arg.name)
                      .setDescription(arg.description)
                      .setRequired(arg.required ?? false)
                  );
                  break;
              }
            });

          return subcommand;
        });
      });

      return slashCommand;
    });

    const filtered = commands.filter(
      (command) => command !== undefined
    ) as SlashCommandBuilder[];
    filtered.concat(commandsWithSubcommands);

    const rest = new REST({ version: '9' }).setToken(this.client.token!);

    try {
      await rest.put(Routes.applicationCommands(this.client.user!.id), {
        body: filtered.map((command) => command.toJSON())
      });
    } catch (err) {
      console.error(err);
    }

    return this;
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

  public runPermissionChecks(
    interaction: CommandInteraction,
    command: Command
  ) {
    if (command.clientPermissions) {
      if (interaction.guild && interaction.channel?.type !== 'DM') {
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
      if (interaction.guild && interaction.channel?.type !== 'DM') {
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

    return false;
  }

  public runCooldowns(interaction: CommandInteraction, command: Command) {
    const ignorer = command.ignoreCooldown ?? this.ignoreCooldown;
    const isIgnored = Array.isArray(ignorer)
      ? ignorer.includes(interaction.user.id)
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
    if (command.typing) interaction.channel?.sendTyping();

    const args = command.args?.map((arg) => {
      switch (arg.type) {
        case 'boolean':
          return interaction.options.getBoolean(arg.name);
        case 'integer':
          return interaction.options.getInteger(arg.name);
        case 'number':
          return interaction.options.getNumber(arg.name);
        case 'string':
          return interaction.options.getString(arg.name);
        case 'user':
          return interaction.options.getUser(arg.name);
        case 'mentionable':
          return interaction.options.getMentionable(arg.name);
        case 'channel':
          return interaction.options.getChannel(arg.name);
        case 'role':
          return interaction.options.getRole(arg.name);
        case 'member':
          return interaction.options.getMember(arg.name);
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

  public useInhibitorHandler(inhibitorHandler: InhibitorHandler) {
    this.inhibitorHandler = inhibitorHandler;

    return this;
  }
}

export default CommandHandler;
