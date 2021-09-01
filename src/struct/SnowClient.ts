import { Client, ClientOptions, Snowflake, User } from 'discord.js';
import ClientUtil from './ClientUtil';

import { SnowOptions } from '../typings';

class SnowClient extends Client {
  public ownerID: Snowflake | Snowflake[];
  public util: ClientUtil;

  public constructor(options: SnowOptions = {}, clientOptions: ClientOptions) {
    super(clientOptions);

    const { ownerID = '' } = options;
    this.ownerID = ownerID;

    this.util = new ClientUtil(this);
  }

  public isOwner(user: string | User) {
    const id = this.users.resolveId(user);
    return Array.isArray(this.ownerID)
      ? this.ownerID.includes(id)
      : id === this.ownerID;
  }
}

export default SnowClient;
