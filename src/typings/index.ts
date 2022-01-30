import type { Snowflake } from 'discord-api-types';

export type LoadPredicate = (filepath: string) => boolean;

export interface NodeJSModule {
  prototype?: any;
  default?: { prototype?: any };
}

export interface ClientOptions {
  ownerId?: Snowflake | Snowflake[];
  testingGuildId?: Snowflake | Snowflake[];
}

export interface HandlerOptions {
  directory?: string;
  extensions?: string[];
  automateCategories?: boolean;
  loadFilter?: LoadPredicate;
}
