import type { Category } from '../utils/Category';
import type { SnowClient } from './SnowClient';
import type { SnowHandler } from './SnowHandler';

export class SnowModule {
  public id: string;
  public filepath!: string;
  public categoryId: string;
  public handler!: SnowHandler;
  public client!: SnowClient;
  public category!: Category<string, SnowModule>;

  public constructor(
    id: string,
    { categoryId = 'default' }: { categoryId?: string } = {}
  ) {
    this.id = id;

    this.categoryId = categoryId;
  }

  public reload() {
    return this.handler.reload(this.id);
  }

  public remove() {
    return this.handler.remove(this.id);
  }
}
