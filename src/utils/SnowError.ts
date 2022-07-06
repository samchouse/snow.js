const Messages = {
  FILE_NOT_FOUND: (filename: string) => `File '${filename}' not found`,
  MODULE_NOT_FOUND: (constructor: string, id: string) =>
    `${constructor} '${id}' does not exist`,
  ALREADY_LOADED: (constructor: string, id: string) =>
    `${constructor} '${id}' is already loaded`,
  NOT_RELOADABLE: (constructor: string, id: string) =>
    `${constructor} '${id}' is not reloadable`,
  INVALID_CLASS_TO_HANDLE: (given: string, expected: string) =>
    `Class to handle ${given} is not a subclass of ${expected}`,
  ALIAS_CONFLICT: (alias: string, id: string, conflict: string) =>
    `Alias '${alias}' of '${id}' already exists on '${conflict}'`,
  UNKNOWN_MATCH_TYPE: (match: string) => `Unknown match type '${match}'`,
  NOT_INSTANTIABLE: (constructor: string) =>
    `${constructor} is not instantiable`,
  NOT_IMPLEMENTED: (constructor: string, method: string) =>
    `${constructor}#${method} has not been implemented`,
  INVALID_TYPE: (name: string, expected: string, vowel = false) =>
    `Value of '${name}' was not ${vowel ? 'an' : 'a'} ${expected}`
};

class SnowError extends Error {
  public code: string;

  public constructor(key: string, ...args: Array<string | boolean>) {
    if (
      !(Messages[key as keyof typeof Messages] as
        | typeof Messages[keyof typeof Messages]
        | undefined)
    )
      throw new TypeError(`Error key '${key}' does not exist`);

    // @ts-expect-error
    super(Messages[key as keyof typeof Messages](...args));

    this.code = key;
  }

  public get name() {
    return `SnowError [${this.code}]`;
  }
}

export default SnowError;
