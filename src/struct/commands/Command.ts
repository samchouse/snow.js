import {
  APIInteractionDataResolvedChannel,
  APIInteractionDataResolvedGuildMember,
  APIRole
} from 'discord-api-types/v9';
import {
  CommandInteraction,
  GuildChannel,
  GuildMember,
  Role,
  User
} from 'discord.js';
import { ArgumentOptions, CommandOptions } from '../../typings';
import SnowError from '../../utils/SnowError';
import SnowModule from '../SnowModule';
import Argument from './arguments/Argument';
import ArgumentRunner from './arguments/ArgumentRunner';
import ContentParser from './ContentParser';

class Command extends SnowModule {
  public typing: boolean;
  public contentParser: ContentParser;
  public channel: any;
  public ownerOnly: boolean;
  public editable: boolean;
  public cooldown: number | null;
  public ratelimit: any;
  public argumentDefaults: any;
  public description: any;
  public clientPermissions: any;
  public userPermissions: any;
  public regex: any;
  public condition: any;
  public before: any;
  public ignoreCooldown: any;
  public ignorePermissions: any;
  public argumentRunner: any;
  public argumentGenerator: any;
  public args?: ArgumentOptions[];

  public constructor(id: string, options: CommandOptions = {}) {
    super(id, { category: options.category });

    const {
      args = this.args ?? [],
      quoted = true,
      separator,
      channel = null,
      ownerOnly = false,
      editable = true,
      typing = false,
      cooldown = null,
      ratelimit = 1,
      argumentDefaults = {},
      description = '',
      clientPermissions = this.clientPermissions,
      userPermissions = this.userPermissions,
      regex = this.regex,
      condition = this.condition || (() => false),
      before = this.before || (() => undefined),
      ignoreCooldown,
      ignorePermissions,
      flags = [],
      optionFlags = []
    } = options;

    const { flagWords, optionFlagWords } = Array.isArray(args)
      ? ContentParser.getFlags(args)
      : { flagWords: flags, optionFlagWords: optionFlags };

    this.contentParser = new ContentParser({
      flagWords,
      optionFlagWords,
      quoted,
      separator
    });

    this.argumentRunner = new ArgumentRunner(this);
    this.argumentGenerator = Array.isArray(args)
      ? ArgumentRunner.fromArguments(
          args.map((arg) => [arg.id, new Argument(this, arg)])
        )
      : args.bind(this);

    this.channel = channel;

    this.ownerOnly = Boolean(ownerOnly);

    this.editable = Boolean(editable);

    this.typing = Boolean(typing);

    this.cooldown = cooldown;

    this.ratelimit = ratelimit;

    this.argumentDefaults = argumentDefaults;

    this.description = Array.isArray(description)
      ? description.join('\n')
      : description;

    this.clientPermissions =
      typeof clientPermissions === 'function'
        ? clientPermissions.bind(this)
        : clientPermissions;

    this.userPermissions =
      typeof userPermissions === 'function'
        ? userPermissions.bind(this)
        : userPermissions;

    this.regex = typeof regex === 'function' ? regex.bind(this) : regex;

    this.condition = condition.bind(this);

    this.before = before.bind(this);

    this.ignoreCooldown =
      typeof ignoreCooldown === 'function'
        ? ignoreCooldown.bind(this)
        : ignoreCooldown;

    this.ignorePermissions =
      typeof ignorePermissions === 'function'
        ? ignorePermissions.bind(this)
        : ignorePermissions;
  }

  public exec(
    _interaction: CommandInteraction,
    _args?: (
      | string
      | number
      | boolean
      | User
      | APIInteractionDataResolvedChannel
      | GuildChannel
      | Role
      | APIRole
      | GuildMember
      | APIInteractionDataResolvedGuildMember
      | null
    )[]
  ) {
    throw new SnowError('NOT_IMPLEMENTED', this.constructor.name, 'exec');
  }

  public parse(interaction: CommandInteraction) {
    const parsed = this.contentParser.parse(interaction);
    return this.argumentRunner.run(interaction, parsed, this.argumentGenerator);
  }
}

export default Command;
