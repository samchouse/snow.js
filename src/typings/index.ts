import { PermissionResolvable, Snowflake } from 'discord.js';
import EventEmitter from 'events';

import SnowModule from '../struct/SnowModule';

export type LoadPredicate = (filepath: string) => boolean;

export type ArgumentOptions =
  | BooleanArgumentOptions
  | StringArgumentOptions
  | UserArgumentOptions
  | RoleArgumentOptions
  | ChannelArgumentOptions
  | NumberArgumentOptions
  | IntegerArgumentOptions
  | MentionableArgumentOptions
  | MemberArgumentOptions;

export interface SnowOptions {
  ownerID?: Snowflake | Snowflake[];
  testingGuildID?: Snowflake;
}

export interface SnowModuleOptions {
  category?: string;
}

export interface BooleanArgumentOptions extends BaseArgumentOptions {
  type: 'boolean';
}

export interface UserArgumentOptions extends BaseArgumentOptions {
  type: 'user';
}

export interface MemberArgumentOptions extends BaseArgumentOptions {
  type: 'member';
}

export interface RoleArgumentOptions extends BaseArgumentOptions {
  type: 'role';
}

export interface ChannelArgumentOptions extends BaseArgumentOptions {
  type: 'channel';
}

export interface MentionableArgumentOptions extends BaseArgumentOptions {
  type: 'mentionable';
}

export interface StringArgumentOptions extends BaseArgumentOptions {
  type: 'string';
  choices?: { name: string; value: string }[];
}

export interface NumberArgumentOptions extends BaseArgumentOptions {
  type: 'number';
  choices?: { name: string; value: number }[];
}

export interface IntegerArgumentOptions extends BaseArgumentOptions {
  type: 'integer';
  choices?: { name: string; value: number }[];
}

export interface InhibitorOptions extends SnowModuleOptions {
  reason?: string;
  type?: string;
  priority?: number;
}

export interface ListenerOptions extends SnowModuleOptions {
  emitter?: string | EventEmitter;
  event?: string;
  type?: string;
}

export interface BaseArgumentOptions {
  id: string;
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

export interface SnowHandlerOptions {
  directory?: string;
  extensions?: string[] | Set<string>;
  automateCategories?: boolean;
  classToHandle?: typeof SnowModule;
  loadFilter?: LoadPredicate;
}

export interface CommandHandlerOptions extends SnowHandlerOptions {
  blockBots?: boolean;
  blockClient?: boolean;
  defaultCooldown?: number;
  fetchMembers?: boolean;
  ignoreCooldown?: Snowflake | Snowflake[];
}

export interface CommandOptions extends SnowModuleOptions {
  name: string;
  parent?: { name: string; description: string };
  description?: string;
  args?: ArgumentOptions[];
  channel?: 'guild' | 'dm';
  cooldown?: number;
  ratelimit?: number;
  typing?: boolean;
  ownerOnly?: boolean;
  ignoreCooldown?: Snowflake | Snowflake[];
  clientPermissions?: PermissionResolvable | PermissionResolvable[];
  userPermissions?: PermissionResolvable | PermissionResolvable[];
}
