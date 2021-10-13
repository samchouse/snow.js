import { Collection } from 'discord.js';
import EventEmitter from 'events';

import { ListenerOptions } from '../../typings';
import Category from '../../utils/Category';
import SnowError from '../../utils/SnowError';
import SnowModule from '../SnowModule';
import ListenerHandler from './ListenerHandler';

class Listener extends SnowModule {
  public event: string;
  public type: string;
  public handler!: ListenerHandler;
  public emitter: string | EventEmitter;
  public categories!: Collection<string, Category<string, Listener>>;

  public constructor(
    id: string,
    {
      category,
      emitter = '',
      event = 'EventNotSet',
      type = 'on'
    }: ListenerOptions = {}
  ) {
    if (event === 'EventNotSet') throw new Error(`Listener ${id} has no event`);

    super(id, { category });

    this.emitter = emitter;
    this.event = event;
    this.type = type;
  }

  public exec(..._arr: any[]): any | Promise<any> {
    throw new SnowError('NOT_IMPLEMENTED', this.constructor.name, 'exec');
  }
}

export default Listener;
