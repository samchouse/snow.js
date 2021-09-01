import SnowError from '../../utils/SnowError';
import SnowHandler from '../SnowHandler';
import Inhibitor from './Inhibitor';
import Command from '../commands/Command';
import { Collection, CommandInteraction, Message } from 'discord.js';
import SnowClient from '../SnowClient';
import { SnowHandlerOptions } from '../../typings';

class InhibitorHandler extends SnowHandler {
  public constructor(
    client: SnowClient,
    {
      directory,
      classToHandle = Inhibitor,
      extensions = ['.js', '.ts'],
      automateCategories,
      loadFilter
    }: SnowHandlerOptions = {}
  ) {
    if (
      !(
        classToHandle.prototype instanceof Inhibitor ||
        classToHandle === Inhibitor
      )
    ) {
      throw new SnowError(
        'INVALID_CLASS_TO_HANDLE',
        classToHandle.name,
        Inhibitor.name
      );
    }

    super(client, {
      directory,
      classToHandle,
      extensions,
      automateCategories,
      loadFilter
    });
  }

  public async test(
    type: string,
    messageOrInteraction: Message | CommandInteraction,
    command?: Command
  ) {
    if (!this.modules.size) return null;

    const inhibitors = (this.modules as Collection<string, Inhibitor>).filter(
      (i) => i.type === type
    );
    if (!inhibitors.size) return null;

    const promises = [];

    for (const inhibitor of inhibitors.values()) {
      promises.push(
        (async () => {
          const inhibited = await inhibitor.exec(messageOrInteraction, command);
          if (inhibited) return inhibitor;
          return null;
        })()
      );
    }

    const inhibitedInhibitors = (await Promise.all(promises)).filter((r) => r);
    if (!inhibitedInhibitors.length) return null;

    inhibitedInhibitors.sort((a, b) => (b?.priority ?? 0) - (a?.priority ?? 0));
    return inhibitedInhibitors[0]?.reason;
  }
}

export default InhibitorHandler;
