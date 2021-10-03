import Category from '../utils/Category';
import SnowClient from './SnowClient';
import SnowHandler from './SnowHandler';

class SnowModule {
  public id: string;
  public filepath!: string;
  public categoryID: string;
  public client!: SnowClient;
  public category!: Category;
  public handler!: SnowHandler;

  public constructor(id: string, { category = 'default' } = {}) {
    this.id = id;
    this.categoryID = category;
  }

  public reload() {
    return this.handler.reload(this.id);
  }

  public remove() {
    return this.handler.remove(this.id);
  }

  public toString() {
    return this.id;
  }
}

export default SnowModule;
