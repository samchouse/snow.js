import { Client, ClientOptions, Snowflake, User } from 'discord.js';

import { SnowOptions } from '../typings';

class SnowClient extends Client {
  public ownerID: Snowflake | Snowflake[];
  public testingGuildID?: Snowflake;
  public timeouts: Set<NodeJS.Timeout>;
  public intervals: Set<NodeJS.Timeout>;
  public immediates: Set<NodeJS.Immediate>;

  public constructor(options: SnowOptions = {}, clientOptions: ClientOptions) {
    super(clientOptions);

    const { ownerID = '', testingGuildID } = options;

    this.ownerID = ownerID;
    this.testingGuildID = testingGuildID;

    this.timeouts = new Set();
    this.intervals = new Set();
    this.immediates = new Set();
  }

  public isOwner(user: string | User) {
    const id = this.users.resolveId(user);
    return Array.isArray(this.ownerID)
      ? this.ownerID.includes(id)
      : id === this.ownerID;
  }

  public setTimeout(
    callback: (...args: any[]) => void,
    delay?: number,
    ...args: any[]
  ) {
    const timeout = setTimeout(() => {
      callback(...args);
      this.timeouts.delete(timeout);
    }, delay);
    this.timeouts.add(timeout);
    return timeout;
  }

  public clearTimeout(timeout: NodeJS.Timeout) {
    clearTimeout(timeout);
    this.timeouts.delete(timeout);
  }

  public setInterval(
    callback: (...args: any[]) => void,
    delay?: number,
    ...args: any[]
  ) {
    const interval = setInterval(callback, delay, ...args);
    this.intervals.add(interval);
    return interval;
  }

  public clearInterval(interval: NodeJS.Timeout) {
    clearInterval(interval);
    this.intervals.delete(interval);
  }

  public setImmediate(callback: (...args: any[]) => void, ...args: any[]) {
    const immediate = setImmediate(callback, ...args);
    this.immediates.add(immediate);
    return immediate;
  }

  public clearImmediate(immediate: NodeJS.Immediate) {
    clearImmediate(immediate);
    this.immediates.delete(immediate);
  }
}

export default SnowClient;
