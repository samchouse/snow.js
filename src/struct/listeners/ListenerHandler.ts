import { Collection } from 'discord.js';
import EventEmitter from 'events';

import { SnowHandlerOptions } from '../../typings';
import SnowError from '../../utils/SnowError';
import SnowClient from '../SnowClient';
import SnowHandler from '../SnowHandler';
import Listener from './Listener';

class ListenerHandler extends SnowHandler {
  public emitters: Collection<string, EventEmitter>;

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

    this.emitters = new Collection();
    this.emitters.set('client', this.client);
  }

  public register(listener: Listener, filepath: string) {
    super.register(listener, filepath);
    listener.exec = listener.exec.bind(listener);
    this.addToEmitter(listener.id);
    return listener;
  }

  public deregister(listener: Listener) {
    this.removeFromEmitter(listener.id);
    super.deregister(listener);
  }

  public addToEmitter(id: string) {
    const listener = (this.modules as Collection<string, Listener>).get(
      id.toString()
    );
    if (!listener)
      throw new SnowError('MODULE_NOT_FOUND', this.classToHandle.name, id);

    const emitter =
      listener.emitter instanceof EventEmitter
        ? listener.emitter
        : this.emitters.get(listener.emitter);
    if (!(emitter instanceof EventEmitter))
      throw new SnowError('INVALID_TYPE', 'emitter', 'EventEmitter', true);

    if (listener.type === 'once') {
      emitter.once(listener.event, listener.exec);
      return listener;
    }

    emitter.on(listener.event, listener.exec);
    return listener;
  }

  public removeFromEmitter(id: string) {
    const listener = (this.modules as Collection<string, Listener>).get(
      id.toString()
    );
    if (!listener)
      throw new SnowError('MODULE_NOT_FOUND', this.classToHandle.name, id);

    const emitter =
      listener.emitter instanceof EventEmitter
        ? listener.emitter
        : this.emitters.get(listener.emitter);
    if (!(emitter instanceof EventEmitter))
      throw new SnowError('INVALID_TYPE', 'emitter', 'EventEmitter', true);

    emitter.removeListener(listener.event, listener.exec);
    return listener;
  }

  public setEmitters(emitters: Record<string, EventEmitter>) {
    for (const [key, value] of Object.entries(emitters)) {
      if (!(value instanceof EventEmitter))
        throw new SnowError('INVALID_TYPE', key, 'EventEmitter', true);
      this.emitters.set(key, value);
    }

    return this;
  }
}

export default ListenerHandler;
