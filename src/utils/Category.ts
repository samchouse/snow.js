import { Collection } from 'discord.js';

import type { SnowModule } from '../struct/SnowModule';

export class Category<U, V extends SnowModule> extends Collection<U, V> {
  public id: string;

  public constructor(id: string, iterable?: Iterable<readonly [U, V]>) {
    iterable ? super(iterable) : super();

    this.id = id;
  }

  public reloadAll() {
    for (const module of Array.from(this.values())) {
      if (module.filepath) module.reload();
    }
  }

  public removeAll() {
    for (const module of Array.from(this.values())) {
      if (module.filepath) module.remove();
    }
  }
}
