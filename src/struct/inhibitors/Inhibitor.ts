import { Collection, CommandInteraction, Message } from 'discord.js';

import { InhibitorOptions } from '../../typings';
import Category from '../../utils/Category';
import SnowError from '../../utils/SnowError';
import SnowModule from '../SnowModule';
import Command from '../commands/Command';
import InhibitorHandler from './InhibitorHandler';

class Inhibitor extends SnowModule {
  public type: string;
  public reason: string;
  public priority: number;
  public handler!: InhibitorHandler;
  public categories!: Collection<string, Category<string, Inhibitor>>;

  public constructor(
    id: string,
    {
      category,
      reason = '',
      priority = 0,
      type = 'post'
    }: InhibitorOptions = {}
  ) {
    super(id, { category });

    this.reason = reason;
    this.type = type;
    this.priority = priority;
  }

  public exec(
    _messageOrInteraction: Message | CommandInteraction,
    _command?: Command
  ): boolean | Promise<boolean> {
    throw new SnowError('NOT_IMPLEMENTED', this.constructor.name, 'exec');
  }
}

export default Inhibitor;
