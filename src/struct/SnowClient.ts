import { Client, ClientOptions, Snowflake, User } from 'discord.js';

import { SnowOptions } from '../typings';

class SnowClient extends Client {
  public ownerID: Snowflake | Snowflake[];
  public testingGuildID?: Snowflake;

  public constructor(options: SnowOptions = {}, clientOptions: ClientOptions) {
    super(clientOptions);

    const { ownerID = '', testingGuildID } = options;

    this.ownerID = ownerID;
    this.testingGuildID = testingGuildID;
  }

  public isOwner(user: string | User) {
    const id = this.users.resolveId(user);
    return Array.isArray(this.ownerID)
      ? this.ownerID.includes(id)
      : id === this.ownerID;
  }
}

export default SnowClient;
