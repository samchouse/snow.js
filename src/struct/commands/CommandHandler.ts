import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { Collection, CommandInteraction, Message } from 'discord.js';
import {
  APIApplicationCommandOption,
  ApplicationCommandOptionType
} from 'discord.js/node_modules/discord-api-types/payloads/v9/_interactions/slashCommands';

import { CommandHandlerOptions } from '../../typings';
import { BuiltInReasons, CommandHandlerEvents } from '../../utils/Constants';
import SnowError from '../../utils/SnowError';
import SnowClient from '../SnowClient';
import SnowHandler from '../SnowHandler';
import InhibitorHandler from '../inhibitors/InhibitorHandler';
import Command from './Command';

class CommandHandler extends SnowHandler {
  public blockBots: boolean;
  public blockClient: boolean;
  public fetchMembers: boolean;
  public defaultCooldown: number;
  public ignoreCooldown: string | string[];
  public commands: Collection<string, string>;
  public modules!: Collection<string, Command>;
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

  private registeredAllCommands: boolean;

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
    this.registeredAllCommands = false;

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
      this.client.on('messageCreate', async (message: Message) => {
        await this.runAllTypeInhibitors(message);
      });
      this.client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand()) return;
        await this.handle(interaction);
      });

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.client.setInterval(async () => {
        const registerCommand = async () => {
          this.registeredAllCommands = true;

          const parents = new Collection<string, Command[]>();
          const commands = this.modules.map((command) => {
            if (command.parent) {
              parents.has(
                `${command.parent.name}:${command.parent.description}`
              )
                ? parents
                    .get(
                      `${command.parent.name}:${command.parent.description}`
                    )!
                    .push(command)
                : parents.set(
                    `${command.parent.name}:${command.parent.description}`,
                    [command]
                  );

              return undefined;
            }

            const slashCommand = new SlashCommandBuilder()
              .setName(command.name)
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
          });

          const commandsWithSubcommands = parents.map((commands, parent) => {
            const [name, description] = parent.split(':');

            const slashCommand = new SlashCommandBuilder()
              .setName(name!)
              .setDescription(description!);

            commands.map((command) => {
              slashCommand.addSubcommand((subcommand) => {
                subcommand
                  .setName(command.name)
                  .setDescription(command.description);

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
                              arg.choices.map(({ name, value }) => [
                                name,
                                value
                              ])
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
                              arg.choices.map(({ name, value }) => [
                                name,
                                value
                              ])
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
                              arg.choices.map(({ name, value }) => [
                                name,
                                value
                              ])
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

          let filtered = commands.filter(
            (command) => command !== undefined
          ) as SlashCommandBuilder[];
          filtered = filtered.concat(commandsWithSubcommands);

          const rest = new REST({ version: '9' }).setToken(this.client.token!);

          try {
            const jsonCommands = filtered.map((command) => command.toJSON());

            const apiCommands = (await rest.get(
              Routes.applicationCommands(this.client.user!.id)
            )) as {
              name: string;
              description: string;
              options: APIApplicationCommandOption[] | undefined;
            }[];

            const unchangedCommands = jsonCommands.filter((command) =>
              apiCommands.find(
                (apiCommand) =>
                  apiCommand.name === command.name &&
                  apiCommand.description === command.description &&
                  apiCommand.options?.length === command.options.length &&
                  !apiCommand.options
                    .map((option) => {
                      const found = command.options.find((o) => {
                        const initialChecks =
                          o.name === option.name &&
                          o.description === option.description &&
                          o.type === option.type &&
                          o.required === option.required;

                        const choicesCheck =
                          (o.type === ApplicationCommandOptionType.String ||
                            o.type === ApplicationCommandOptionType.Integer ||
                            o.type === ApplicationCommandOptionType.Number) &&
                          (option.type ===
                            ApplicationCommandOptionType.String ||
                            option.type ===
                              ApplicationCommandOptionType.Integer ||
                            option.type ===
                              ApplicationCommandOptionType.Number) &&
                          o.choices &&
                          option.choices &&
                          o.choices.length === option.choices.length &&
                          !o.choices
                            .map((choice) => {
                              const foundChoice = option.choices!.find(
                                (c) =>
                                  c.name === choice.name &&
                                  c.value === choice.value
                              );

                              return foundChoice ? true : false;
                            })
                            .includes(false);

                        return initialChecks && choicesCheck;
                      });

                      return found ? true : false;
                    })
                    .includes(false)
              )
            );

            if (
              !unchangedCommands.length ||
              (unchangedCommands.length === jsonCommands.length &&
                unchangedCommands.length === apiCommands.length)
            ) {
              if (
                process.env['NODE_ENV'] === 'development' &&
                this.client.testingGuildID?.length
              ) {
                if (Array.isArray(this.client.testingGuildID)) {
                  for (const guildID of this.client.testingGuildID) {
                    await rest.put(
                      Routes.applicationGuildCommands(
                        this.client.user!.id,
                        guildID
                      ),
                      {
                        body: jsonCommands
                      }
                    );
                  }
                } else {
                  await rest.put(
                    Routes.applicationGuildCommands(
                      this.client.user!.id,
                      this.client.testingGuildID
                    ),
                    {
                      body: jsonCommands
                    }
                  );
                }
              } else {
                await rest.put(
                  Routes.applicationCommands(this.client.user!.id),
                  {
                    body: jsonCommands
                  }
                );
              }
            }
          } catch (err) {
            console.error(err);
          }
        };

        if (this.loaded && !this.registeredAllCommands) await registerCommand();
      }, 10);
    });
  }

  public register(command: Command, filepath: string) {
    super.register(command, filepath);

    if (!command.name) throw new Error(`No name for ${command.id}`);

    this.commands.set(command.id.toLowerCase(), command.name.toLowerCase());
  }

  public deregister(command: Command) {
    this.commands.delete(command.id.toLowerCase());

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

    if (this.runPermissionChecks(interaction, command)) return true;

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

    const rawArgs = command.args?.map((arg) => {
      switch (arg.type) {
        case 'boolean':
          return {
            name: arg.id,
            value: interaction.options.getBoolean(arg.name)
          };
        case 'integer':
          return {
            name: arg.id,
            value: interaction.options.getInteger(arg.name)
          };
        case 'number':
          return {
            name: arg.id,
            value: interaction.options.getNumber(arg.name)
          };
        case 'string':
          return {
            name: arg.id,
            value: interaction.options.getString(arg.name)
          };
        case 'user':
          return {
            name: arg.id,
            value: interaction.options.getUser(arg.name)
          };
        case 'mentionable':
          return {
            name: arg.id,
            value: interaction.options.getMentionable(arg.name)
          };
        case 'channel':
          return {
            name: arg.id,
            value: interaction.options.getChannel(arg.name)
          };
        case 'role':
          return {
            name: arg.id,
            value: interaction.options.getRole(arg.name)
          };
        case 'member':
          return {
            name: arg.id,
            value: interaction.options.getMember(arg.name)
          };
      }
    });

    let args = {};
    rawArgs?.forEach((arg) => (args = { ...args, [arg.name]: arg.value }));

    this.emit(
      CommandHandlerEvents.COMMAND_STARTED,
      interaction,
      command,
      rawArgs
    );

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
    try {
      const result = this.modules.find(
        (c) =>
          c.parent?.name === interaction.commandName &&
          c.name === interaction.options.getSubcommand()
      );
      if (result) return result;
    } catch {}

    const result = this.modules.find((c) => c.name === interaction.commandName);
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
