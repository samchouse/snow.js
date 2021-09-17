import { version } from '../package.json';
import SnowClient from './struct/SnowClient';
import SnowHandler from './struct/SnowHandler';
import SnowModule from './struct/SnowModule';
import Command from './struct/commands/Command';
import CommandHandler from './struct/commands/CommandHandler';
import Inhibitor from './struct/inhibitors/Inhibitor';
import InhibitorHandler from './struct/inhibitors/InhibitorHandler';
import Listener from './struct/listeners/Listener';
import ListenerHandler from './struct/listeners/ListenerHandler';
import Parent from './struct/parents/Parent';
import {
  ArgumentOptions,
  BaseArgumentOptions,
  BooleanArgumentOptions,
  ChannelArgumentOptions,
  CommandHandlerOptions,
  CommandOptions,
  InhibitorOptions,
  IntegerArgumentOptions,
  ListenerOptions,
  LoadPredicate,
  MemberArgumentOptions,
  MentionableArgumentOptions,
  NumberArgumentOptions,
  RoleArgumentOptions,
  SnowHandlerOptions,
  SnowModuleOptions,
  SnowOptions,
  StringArgumentOptions,
  UserArgumentOptions
} from './typings';
import Category from './utils/Category';
import * as Constants from './utils/Constants';
import SnowError from './utils/SnowError';

export {
  SnowClient,
  SnowHandler,
  SnowModule,
  Command,
  CommandHandler,
  Inhibitor,
  InhibitorHandler,
  Listener,
  ListenerHandler,
  SnowError,
  Category,
  Parent,
  Constants,
  version
};

export type {
  ArgumentOptions,
  BaseArgumentOptions,
  BooleanArgumentOptions,
  ChannelArgumentOptions,
  CommandHandlerOptions,
  CommandOptions,
  InhibitorOptions,
  IntegerArgumentOptions,
  ListenerOptions,
  LoadPredicate,
  MemberArgumentOptions,
  MentionableArgumentOptions,
  NumberArgumentOptions,
  RoleArgumentOptions,
  SnowHandlerOptions,
  SnowModuleOptions,
  SnowOptions,
  StringArgumentOptions,
  UserArgumentOptions
};
