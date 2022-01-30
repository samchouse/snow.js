import { Collection } from 'discord.js';
import EventEmitter from 'events';
import path from 'path';

import type { HandlerOptions, LoadPredicate, NodeJSModule } from '../typings';
import { Category } from '../utils/Category';
import { SnowError } from '../utils/SnowError';
import type { SnowClient } from './SnowClient';
import { SnowModule } from './SnowModule';

export class SnowHandler extends EventEmitter {
  public client: SnowClient;
  public directory: string;
  public extensions: string[];
  public automateCategories: boolean;
  public loadFilter: LoadPredicate;
  public modules: Collection<string, SnowModule>;
  public categories: Collection<string, Category<string, SnowModule>>;

  public constructor(
    client: SnowClient,
    {
      directory = '.',
      extensions = ['.js', '.ts'],
      automateCategories = true,
      loadFilter = () => true
    }: HandlerOptions
  ) {
    super();

    this.client = client;

    this.directory = directory;
    this.extensions = extensions;
    this.automateCategories = automateCategories;
    this.loadFilter = loadFilter;

    this.modules = new Collection();
    this.categories = new Collection();
  }

  public register(module: SnowModule, filepath: string) {
    module.filepath = filepath;
    module.client = this.client;
    module.handler = this;

    this.modules.set(module.id, module);

    if (module.categoryId === 'default' && this.automateCategories) {
      const dirs = path.dirname(filepath).split(path.sep);
      module.categoryId = dirs[dirs.length - 1];
    }

    if (!this.categories.has(module.categoryId))
      this.categories.set(module.categoryId, new Category(module.categoryId));

    const category = this.categories.get(module.categoryId)!;
    module.category = category;
    category.set(module.id, module);
  }

  public deregister(module: SnowModule) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    if (module.filepath) delete require.cache[require.resolve(module.filepath)];

    this.modules.delete(module.id);
    module.category.delete(module.id);
  }

  public load(filepath: string, isReload = false) {
    if (!this.extensions.includes(path.extname(filepath))) return;
    if (filepath.endsWith('.d.ts')) return;

    const findExport = (
      module?: NodeJSModule
    ): typeof SnowModule | undefined => {
      if (!module) return;
      if (module.prototype instanceof SnowModule)
        return module as typeof SnowModule;

      return module.default ? findExport(module.default) : undefined;
    };

    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const Module = findExport(require(filepath) as NodeJSModule | undefined);
    if (!Module) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete require.cache[require.resolve(filepath)];
      return;
    }

    const module = new Module();
  }

  public remove(id: string) {}

  public removeAll() {
    for (const mod of Array.from(this.modules.values())) {
      if (mod.filepath) this.remove(mod.id);
    }

    return this;
  }

  public reload(id: string) {}

  public reloadAll() {
    for (const mod of Array.from(this.modules.values())) {
      if (mod.filepath) this.reload(mod.id);
    }

    return this;
  }
}
