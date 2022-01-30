import { Client, ClientOptions, Snowflake, User } from 'discord.js';

import type { ClientOptions as SnowClientOptions } from '../typings';

export class SnowClient extends Client {
  public ownerId?: Snowflake | Snowflake[];
  public testingGuildId?: Snowflake | Snowflake[];

  public constructor(options: SnowClientOptions, clientOptions: ClientOptions) {
    super(clientOptions);

    this.ownerId = options.ownerId;
    this.testingGuildId = options.testingGuildId;
  }

  public isOwner(user: Snowflake | User) {
    const id = this.users.resolveId(user);
    return Array.isArray(this.ownerId)
      ? this.ownerId.includes(id)
      : this.ownerId === id;
  }
}
