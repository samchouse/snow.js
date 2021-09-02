import EventEmitter from 'events';
import { ListenerOptions } from '../../typings';
import SnowError from '../../utils/SnowError';
import SnowModule from '../SnowModule';

class Listener extends SnowModule {
  public emitter: string | EventEmitter;
  public event: string;
  public type: string;

  public constructor(
    id: string,
    { category, emitter = '', event = '', type = 'on' }: ListenerOptions = {}
  ) {
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
