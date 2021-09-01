export const SnowHandlerEvents = {
  LOAD: 'load',
  REMOVE: 'remove'
};

export const BuiltInReasons = {
  CLIENT: 'client',
  BOT: 'bot',
  OWNER: 'owner',
  GUILD: 'guild',
  DM: 'dm'
};

export const CommandHandlerEvents = {
  MESSAGE_BLOCKED: 'messageBlocked',
  MESSAGE_INVALID: 'messageInvalid',
  COMMAND_BLOCKED: 'commandBlocked',
  COMMAND_STARTED: 'commandStarted',
  COMMAND_FINISHED: 'commandFinished',
  COMMAND_CANCELLED: 'commandCancelled',
  COMMAND_LOCKED: 'commandLocked',
  MISSING_PERMISSIONS: 'missingPermissions',
  COOLDOWN: 'cooldown',
  IN_PROMPT: 'inPrompt',
  ERROR: 'error'
};
