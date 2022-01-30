import {
  APIInteractionDataResolvedChannel,
  APIInteractionDataResolvedGuildMember,
  APIRole
} from 'discord-api-types/v9';
import {
  Collection,
  CommandInteraction,
  GuildChannel,
  GuildMember,
  Role,
  User
} from 'discord.js';

import { CommandOptions } from '../../typings';
import Category from '../../utils/Category';
import SnowError from '../../utils/SnowError';
import SnowModule from '../SnowModule';
import CommandHandler from './CommandHandler';

class Command extends SnowModule {
  public handler!: CommandHandler;
  public name: CommandOptions['name'];
  public args: CommandOptions['args'];
  public parent: CommandOptions['parent'];
  public typing: CommandOptions['typing'];
  public channel: CommandOptions['channel'];
  public cooldown: CommandOptions['cooldown'];
  public ratelimit: CommandOptions['ratelimit'];
  public ownerOnly: CommandOptions['ownerOnly'];
  public description: CommandOptions['description'];
  public permissions: CommandOptions['permissions'];
  public ignoreCooldown: CommandOptions['ignoreCooldown'];
  public userPermissions: CommandOptions['userPermissions'];
  public defaultPermission: CommandOptions['defaultPermission'];
  public clientPermissions: CommandOptions['clientPermissions'];
  public categories!: Collection<string, Category<string, Command>>;

  public constructor(
    id: string,
    options: CommandOptions = {
      name: 'SnowJSCommandHasNoName',
      description: 'SnowJSCommandHasNoDescription'
    }
  ) {
    if (options.name === 'SnowJSCommandHasNoName')
      throw new Error(`Command ${id} has no name`);
    if (options.description === 'SnowJSCommandHasNoDescription')
      throw new Error(`Command ${id} has no name`);

    super(id, { category: options.category });

    const {
      name,
      args = this.args ?? [],
      parent,
      channel,
      ownerOnly = false,
      typing = false,
      cooldown,
      ratelimit = 1,
      description = '',
      clientPermissions = this.clientPermissions,
      userPermissions = this.userPermissions,
      ignoreCooldown,
      defaultPermission = true,
      permissions = []
    } = options;

    this.name = name;
    this.args = args;
    this.typing = typing;
    this.parent = parent;
    this.channel = channel;
    this.cooldown = cooldown;
    this.ratelimit = ratelimit;
    this.ownerOnly = ownerOnly;
    this.description = description;
    this.permissions = permissions;
    this.ignoreCooldown = ignoreCooldown;
    this.userPermissions = userPermissions;
    this.clientPermissions = clientPermissions;
    this.defaultPermission = defaultPermission;
  }

  public exec(
    _interaction: CommandInteraction,
    _args?: Record<
      string,
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
    >
  ): any | Promise<any> {
    throw new SnowError('NOT_IMPLEMENTED', this.constructor.name, 'exec');
  }
}

export default Command;
