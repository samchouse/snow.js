import Category from '../utils/Category';
import SnowClient from './SnowClient';
import SnowHandler from './SnowHandler';

class SnowModule {
  public category: Category<string, SnowModule> | null;
  public categoryID: string;
  public client: SnowClient | null;
  public filepath: string | null;
  public handler: SnowHandler | null;
  public id: string;

  public constructor(id: string, { category = 'default' } = {}) {
    this.id = id;
    this.categoryID = category;
    this.category = null;
    this.filepath = null;
    this.client = null;
    this.handler = null;
  }

  public reload() {
    return this.handler?.reload(this.id);
  }

  public remove() {
    return this.handler?.remove(this.id);
  }

  public toString() {
    return this.id;
  }
}

export default SnowModule;
