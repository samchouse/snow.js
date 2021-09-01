import SnowError from '../../utils/SnowError';
import SnowHandler from '../SnowHandler';
import { isEventEmitter } from '../../utils/Utils';
import Listener from './Listener';
import { SnowHandlerOptions } from '../../typings';
import SnowClient from '../SnowClient';

class ListenerHandler extends SnowHandler {
  public constructor(
    client: SnowClient,
    {
      directory,
      classToHandle = Listener,
      extensions = ['.js', '.ts'],
      automateCategories,
      loadFilter
    }: SnowHandlerOptions = {}
  ) {
    if (
      !(
        classToHandle.prototype instanceof Listener ||
        classToHandle === Listener
      )
    ) {
      throw new SnowError(
        'INVALID_CLASS_TO_HANDLE',
        classToHandle.name,
        Listener.name
      );
    }

    super(client, {
      directory,
      classToHandle,
      extensions,
      automateCategories,
      loadFilter
    });
  }

  public override register(listener: Listener, filepath: string) {
    super.register(listener, filepath);
    listener.exec = listener.exec.bind(listener);
    this.addToEmitter(listener.id);
    return listener;
  }

  public override deregister(listener: Listener) {
    this.removeFromEmitter(listener.id);
    super.deregister(listener);
  }

  public addToEmitter(id: string) {
    const listener = this.modules.get(id.toString());
    if (!listener)
      throw new SnowError('MODULE_NOT_FOUND', this.classToHandle.name, id);

    const emitter = isEventEmitter(listener.emitter)
      ? listener.emitter
      : this.emitters.get(listener.emitter);
    if (!isEventEmitter(emitter))
      throw new SnowError('INVALID_TYPE', 'emitter', 'EventEmitter', true);

    if (listener.type === 'once') {
      emitter.once(listener.event, listener.exec);
      return listener;
    }

    emitter.on(listener.event, listener.exec);
    return listener;
  }

  public removeFromEmitter(id: string) {
    const listener = this.modules.get(id.toString());
    if (!listener)
      throw new SnowError('MODULE_NOT_FOUND', this.classToHandle.name, id);

    const emitter = isEventEmitter(listener.emitter)
      ? listener.emitter
      : this.emitters.get(listener.emitter);
    if (!isEventEmitter(emitter))
      throw new SnowError('INVALID_TYPE', 'emitter', 'EventEmitter', true);

    emitter.removeListener(listener.event, listener.exec);
    return listener;
  }

  public setEmitters(emitters) {
    for (const [key, value] of Object.entries(emitters)) {
      if (!isEventEmitter(value))
        throw new SnowError('INVALID_TYPE', key, 'EventEmitter', true);
      this.emitters.set(key, value);
    }

    return this;
  }
}

export default ListenerHandler;
