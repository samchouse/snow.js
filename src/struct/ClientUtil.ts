import {
  BaseFetchOptions,
  BufferResolvable,
  Collection,
  Guild,
  GuildMember,
  MessageAttachment,
  MessageEmbed,
  MessageEmbedOptions,
  Permissions,
  Snowflake,
  User,
  Emoji,
  Role,
  GuildChannel
} from 'discord.js';
import { Stream } from 'stream';
import SnowClient from './SnowClient';

class ClientUtil {
  public readonly client: SnowClient;

  public constructor(client: SnowClient) {
    this.client = client;
  }

  public resolveUser(
    text: string,
    users: Collection<Snowflake, User>,
    caseSensitive = false,
    wholeWord = false
  ) {
    return (
      users.get(text) ??
      users.find((user) => this.checkUser(text, user, caseSensitive, wholeWord))
    );
  }

  public resolveUsers(
    text: string,
    users: Collection<Snowflake, User>,
    caseSensitive = false,
    wholeWord = false
  ) {
    return users.filter((user) =>
      this.checkUser(text, user, caseSensitive, wholeWord)
    );
  }

  public checkUser(
    text: string,
    user: User,
    caseSensitive = false,
    wholeWord = false
  ) {
    if (user.id === text) return true;

    const reg = /<@!?(\d{17,19})>/;
    const match = reg.exec(text);

    if (match && user.id === match[1]) return true;

    text = caseSensitive ? text : text.toLowerCase();
    const username = caseSensitive
      ? user.username
      : user.username.toLowerCase();
    const discrim = user.discriminator;

    if (!wholeWord) {
      return (
        username.includes(text) ||
        (username.includes(text.split('#')[0] ?? '') &&
          discrim.includes(text.split('#')[1] ?? ''))
      );
    }

    return (
      username === text ||
      (username === text.split('#')[0] && discrim === text.split('#')[1])
    );
  }

  public resolveMember(
    text: string,
    members: Collection<Snowflake, GuildMember>,
    caseSensitive = false,
    wholeWord = false
  ) {
    return (
      members.get(text) ??
      members.find((member) =>
        this.checkMember(text, member, caseSensitive, wholeWord)
      )
    );
  }

  public resolveMembers(
    text: string,
    members: Collection<Snowflake, GuildMember>,
    caseSensitive = false,
    wholeWord = false
  ) {
    return members.filter((member) =>
      this.checkMember(text, member, caseSensitive, wholeWord)
    );
  }

  public checkMember(
    text: string,
    member: GuildMember,
    caseSensitive = false,
    wholeWord = false
  ) {
    if (member.id === text) return true;

    const reg = /<@!?(\d{17,19})>/;
    const match = reg.exec(text);

    if (match && member.id === match[1]) return true;

    text = caseSensitive ? text : text.toLowerCase();
    const username = caseSensitive
      ? member.user.username
      : member.user.username.toLowerCase();
    const displayName = caseSensitive
      ? member.displayName
      : member.displayName.toLowerCase();
    const discrim = member.user.discriminator;

    if (!wholeWord) {
      return (
        displayName.includes(text) ||
        username.includes(text) ||
        ((username.includes(text.split('#')[0] ?? '') ||
          displayName.includes(text.split('#')[0] ?? '')) &&
          discrim.includes(text.split('#')[1] ?? ''))
      );
    }

    return (
      displayName === text ||
      username === text ||
      ((username === text.split('#')[0] ||
        displayName === text.split('#')[0]) &&
        discrim === text.split('#')[1])
    );
  }

  public resolveChannel(
    text: string,
    channels: Collection<Snowflake, GuildChannel>,
    caseSensitive = false,
    wholeWord = false
  ) {
    return (
      channels.get(text) ??
      channels.find((channel) =>
        this.checkChannel(text, channel, caseSensitive, wholeWord)
      )
    );
  }

  public resolveChannels(
    text: string,
    channels: Collection<Snowflake, GuildChannel>,
    caseSensitive = false,
    wholeWord = false
  ) {
    return channels.filter((channel) =>
      this.checkChannel(text, channel, caseSensitive, wholeWord)
    );
  }

  public checkChannel(
    text: string,
    channel: GuildChannel,
    caseSensitive = false,
    wholeWord = false
  ) {
    if (channel.id === text) return true;

    const reg = /<#(\d{17,19})>/;
    const match = reg.exec(text);

    if (match && channel.id === match[1]) return true;

    text = caseSensitive ? text : text.toLowerCase();
    const name = caseSensitive ? channel.name : channel.name.toLowerCase();

    if (!wholeWord) {
      return name.includes(text) || name.includes(text.replace(/^#/, ''));
    }

    return name === text || name === text.replace(/^#/, '');
  }

  public resolveRole(
    text: string,
    roles: Collection<Snowflake, Role>,
    caseSensitive = false,
    wholeWord = false
  ) {
    return (
      roles.get(text) ??
      roles.find((role) => this.checkRole(text, role, caseSensitive, wholeWord))
    );
  }

  public resolveRoles(
    text: string,
    roles: Collection<Snowflake, Role>,
    caseSensitive = false,
    wholeWord = false
  ) {
    return roles.filter((role) =>
      this.checkRole(text, role, caseSensitive, wholeWord)
    );
  }

  public checkRole(
    text: string,
    role: Role,
    caseSensitive = false,
    wholeWord = false
  ) {
    if (role.id === text) return true;

    const reg = /<@&(\d{17,19})>/;
    const match = reg.exec(text);

    if (match && role.id === match[1]) return true;

    text = caseSensitive ? text : text.toLowerCase();
    const name = caseSensitive ? role.name : role.name.toLowerCase();

    if (!wholeWord) {
      return name.includes(text) || name.includes(text.replace(/^@/, ''));
    }

    return name === text || name === text.replace(/^@/, '');
  }

  public resolveEmoji(
    text: string,
    emojis: Collection<Snowflake, Emoji>,
    caseSensitive = false,
    wholeWord = false
  ) {
    return (
      emojis.get(text) ??
      emojis.find((emoji) =>
        this.checkEmoji(text, emoji, caseSensitive, wholeWord)
      )
    );
  }

  public resolveEmojis(
    text: string,
    emojis: Collection<Snowflake, Emoji>,
    caseSensitive = false,
    wholeWord = false
  ) {
    return emojis.filter((emoji) =>
      this.checkEmoji(text, emoji, caseSensitive, wholeWord)
    );
  }

  public checkEmoji(
    text: string,
    emoji: Emoji,
    caseSensitive = false,
    wholeWord = false
  ) {
    if (emoji.id === text) return true;

    const reg = /<a?:[a-zA-Z0-9_]+:(\d{17,19})>/;
    const match = reg.exec(text);

    if (match && emoji.id === match[1]) return true;

    text = caseSensitive ? text : text.toLowerCase();
    const name = caseSensitive ? emoji.name : emoji.name?.toLowerCase();

    if (!wholeWord) {
      return name?.includes(text) ?? name?.includes(text.replace(/:/, ''));
    }

    return name === text || name === text.replace(/:/, '');
  }

  public resolveGuild(
    text: string,
    guilds: Collection<Snowflake, Guild>,
    caseSensitive = false,
    wholeWord = false
  ) {
    return (
      guilds.get(text) ??
      guilds.find((guild) =>
        this.checkGuild(text, guild, caseSensitive, wholeWord)
      )
    );
  }

  public resolveGuilds(
    text: string,
    guilds: Collection<Snowflake, Guild>,
    caseSensitive = false,
    wholeWord = false
  ) {
    return guilds.filter((guild) =>
      this.checkGuild(text, guild, caseSensitive, wholeWord)
    );
  }

  public checkGuild(
    text: string,
    guild: Guild,
    caseSensitive = false,
    wholeWord = false
  ) {
    if (guild.id === text) return true;

    text = caseSensitive ? text : text.toLowerCase();
    const name = caseSensitive ? guild.name : guild.name.toLowerCase();

    if (!wholeWord) return name.includes(text);
    return name === text;
  }

  public permissionNames() {
    return Object.keys(Permissions.FLAGS);
  }

  public resolvePermissionNumber(number: number) {
    const resolved = [];

    for (const key of Object.keys(Permissions.FLAGS)) {
      if (number & (Permissions.FLAGS[key] as number)) resolved.push(key);
    }

    return resolved;
  }

  public compareStreaming(oldMember: GuildMember, newMember: GuildMember) {
    const s1 = oldMember.presence?.activities.find(
      (c) => c.type === 'STREAMING'
    );
    const s2 = newMember.presence?.activities.find(
      (c) => c.type === 'STREAMING'
    );
    if (s1 === s2) return 0;
    if (s1) return 1;
    if (s2) return 2;
    return 0;
  }

  public async fetchMember(guild: Guild, id: string, cache?: BaseFetchOptions) {
    const user = await this.client.users.fetch(id, cache);
    return guild.members.fetch(user);
  }

  public embed(data?: MessageEmbed | MessageEmbedOptions) {
    return new MessageEmbed(data);
  }

  public attachment(file: BufferResolvable | Stream, name?: string) {
    return new MessageAttachment(file, name);
  }

  public collection<K, V>(iterable: Iterable<[K, V]>) {
    return new Collection(iterable);
  }
}

export default ClientUtil;
