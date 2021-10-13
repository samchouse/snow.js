import { Collection } from 'discord.js';

import SnowModule from '../struct/SnowModule';

class Category<U, V extends SnowModule> extends Collection<U, V> {
  public id: string;

  public constructor(id: string, iterable?: Iterable<readonly [U, V]>) {
    iterable ? super(iterable) : super();

    this.id = id;
  }

  public reloadAll() {
    for (const command of Array.from(this.values())) {
      if (command.filepath) command.reload();
    }

    return this;
  }

  public removeAll() {
    for (const command of Array.from(this.values())) {
      if (command.filepath) command.remove();
    }

    return this;
  }

  public toString() {
    return this.id;
  }
}

export default Category;
