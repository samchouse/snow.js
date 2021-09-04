import { Collection } from 'discord.js';
import EventEmitter from 'events';
import fs from 'fs';
import path from 'path';

import { LoadPredicate, SnowHandlerOptions } from '../typings';
import Category from '../utils/Category';
import { SnowHandlerEvents } from '../utils/Constants';
import SnowError from '../utils/SnowError';
import SnowClient from './SnowClient';
import SnowModule from './SnowModule';

class SnowHandler extends EventEmitter {
  public client: SnowClient;
  public directory: string;
  public extensions: Set<string>;
  public automateCategories: boolean;
  public classToHandle: typeof SnowModule;
  public loadFilter: LoadPredicate;
  public modules: Collection<string, SnowModule>;
  public categories: Collection<string, Category>;

  public constructor(
    client: SnowClient,
    {
      directory = '.',
      extensions = ['.js', '.json', '.ts'],
      automateCategories = false,
      classToHandle = SnowModule,
      loadFilter = () => true
    }: SnowHandlerOptions
  ) {
    super();

    this.client = client;
    this.directory = directory;
    this.extensions = new Set(extensions);
    this.automateCategories = Boolean(automateCategories);
    this.classToHandle = classToHandle;
    this.loadFilter = loadFilter;
    this.modules = new Collection();
    this.categories = new Collection();
  }

  public register(mod: SnowModule, filepath: string) {
    mod.filepath = filepath;
    mod.client = this.client;
    mod.handler = this;
    this.modules.set(mod.id, mod);

    if (mod.categoryID === 'default' && this.automateCategories) {
      const dirs = path.dirname(filepath).split(path.sep);
      mod.categoryID = dirs[dirs.length - 1]!;
    }

    if (!this.categories.has(mod.categoryID)) {
      this.categories.set(mod.categoryID, new Category(mod.categoryID));
    }

    const category = this.categories.get(mod.categoryID)!;
    mod.category = category;
    category.set(mod.id, mod);
  }

  public deregister(mod: SnowModule) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    if (mod.filepath) delete require.cache[require.resolve(mod.filepath)];
    this.modules.delete(mod.id);
    mod.category!.delete(mod.id);
  }

  public load(filepath: string, isReload = false) {
    let mod = function findExport(this: SnowHandler, m: any): any {
      if (!m) return null;
      if (m.prototype instanceof this.classToHandle) return m;
      return m.default ? findExport.call(this, m.default) : null;
      /* eslint-disable @typescript-eslint/no-var-requires */
      /* eslint-disable @typescript-eslint/no-require-imports */
    }.call(this, require(filepath));
    /* eslint-enable @typescript-eslint/no-var-requires */
    /* eslint-enable @typescript-eslint/no-require-imports */

    if (mod && mod.prototype instanceof this.classToHandle) {
      mod = new mod(this);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete require.cache[require.resolve(filepath)];
      return undefined;
    }

    if (this.modules.has(mod.id))
      throw new SnowError('ALREADY_LOADED', this.classToHandle.name, mod.id);

    this.register(mod, filepath);
    this.emit(SnowHandlerEvents.LOAD, mod, isReload);
    return mod;
  }

  public loadAll(directory = this.directory, filter = this.loadFilter) {
    const filepaths = SnowHandler.readdirRecursive(directory);
    for (let filepath of filepaths) {
      filepath = path.resolve(filepath);
      if (filter(filepath)) this.load(filepath);
    }

    return this;
  }

  public remove(id: string) {
    const mod = this.modules.get(id.toString());
    if (!mod)
      throw new SnowError('MODULE_NOT_FOUND', this.classToHandle.name, id);

    this.deregister(mod);

    this.emit(SnowHandlerEvents.REMOVE, mod);
    return mod;
  }

  public removeAll() {
    for (const mod of Array.from(this.modules.values())) {
      if (mod.filepath) this.remove(mod.id);
    }

    return this;
  }

  public reload(id: string) {
    const mod = this.modules.get(id.toString());
    if (!mod)
      throw new SnowError('MODULE_NOT_FOUND', this.classToHandle.name, id);
    if (!mod.filepath)
      throw new SnowError('NOT_RELOADABLE', this.classToHandle.name, id);

    this.deregister(mod);

    const filepath = mod.filepath;
    const newMod = this.load(filepath, true);
    return newMod;
  }

  public reloadAll() {
    for (const mod of Array.from(this.modules.values())) {
      if (mod.filepath) this.reload(mod.id);
    }

    return this;
  }

  public findCategory(name: string) {
    return this.categories.find((category) => {
      return category.id.toLowerCase() === name.toLowerCase();
    });
  }

  public static readdirRecursive(directory: string) {
    const result = [];

    (function read(dir) {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filepath = path.join(dir, file);

        if (fs.statSync(filepath).isDirectory()) {
          read(filepath);
        } else {
          result.push(filepath);
        }
      }
    })(directory);

    return result;
  }
}

export default SnowHandler;
