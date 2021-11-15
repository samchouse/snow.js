import { ClientEvents, PermissionResolvable, Snowflake } from 'discord.js';
import EventEmitter from 'events';

import SnowModule from '../struct/SnowModule';
import { CommandHandlerEvents } from '../utils/Constants';

type ValueOf<T> = T[keyof T];

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
  testingGuildID?: Snowflake | Snowflake[];
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
  event?:
    | keyof ClientEvents
    | ValueOf<typeof CommandHandlerEvents>
    | 'EventNotSet';
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
  typing?: boolean;
  cooldown?: number;
  ratelimit?: number;
  ownerOnly?: boolean;
  description?: string;
  channel?: 'guild' | 'dm';
  args?: ArgumentOptions[];
  defaultPermission?: boolean;
  ignoreCooldown?: Snowflake | Snowflake[];
  parent?: { name: string; description: string };
  userPermissions?: PermissionResolvable | PermissionResolvable[];
  clientPermissions?: PermissionResolvable | PermissionResolvable[];
  permissions?: { id: string; type: 'ROLE' | 'USER'; permission: boolean }[];
}
