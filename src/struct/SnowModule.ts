import Category from '../utils/Category';
import SnowClient from './SnowClient';
import SnowHandler from './SnowHandler';

class SnowModule {
  public category!: Category;
  public categoryID: string;
  public client!: SnowClient;
  public filepath!: string;
  public handler!: SnowHandler;
  public id: string;

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
