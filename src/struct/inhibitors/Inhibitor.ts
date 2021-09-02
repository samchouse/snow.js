import { CommandInteraction, Message } from 'discord.js';
import { InhibitorOptions } from '../../typings';
import SnowError from '../../utils/SnowError';
import Command from '../commands/Command';
import SnowModule from '../SnowModule';

class Inhibitor extends SnowModule {
  public reason: string;
  public type: string;
  public priority: number;

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
