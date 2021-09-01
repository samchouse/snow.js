import { Message, PermissionResolvable, Snowflake } from 'discord.js';
import EventEmitter from 'events';
import Command from '../struct/commands/Command';

import SnowModule from '../struct/SnowModule';

export type LoadPredicate = (filepath: string) => boolean;

export type MissingPermissionSupplier = (
  message: Message
) => Promise<any> | any;

export type IgnoreCheckPredicate = (
  message: Message,
  command: Command
) => boolean;

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
  type: string;
  description: string;
  required: boolean;
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
  ignoreCooldown?: Snowflake | Snowflake[] | IgnoreCheckPredicate;
  ignorePermissions?: Snowflake | Snowflake[] | IgnoreCheckPredicate;
}

export interface CommandOptions extends SnowModuleOptions {
  parent?: string;
  description?: string;
  args?: ArgumentOptions[];
  channel?: 'guild' | 'dm';
  cooldown?: number;
  ratelimit?: number;
  typing?: boolean;
  ownerOnly?: boolean;
  clientPermissions?:
    | PermissionResolvable
    | PermissionResolvable[]
    | MissingPermissionSupplier;
  ignoreCooldown?: Snowflake | Snowflake[] | IgnoreCheckPredicate;
  userPermissions?:
    | PermissionResolvable
    | PermissionResolvable[]
    | MissingPermissionSupplier;
}
