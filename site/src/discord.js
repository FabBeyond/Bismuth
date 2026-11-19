const CDN_URL = "https://cdn.discordapp.com";
const ADMINISTRATOR = 0x8n;
const MANAGE_GUILD = 0x20n;

export function getCDN(path) {
  return CDN_URL + path;
}

export function canManage(guild) {
  const perms = BigInt(guild.permissions);
  return (
    guild.owner ||
    (perms & ADMINISTRATOR) === ADMINISTRATOR ||
    (perms & MANAGE_GUILD) === MANAGE_GUILD
  );
}

export function avatarUrl(user) {
  if (user.avatar) {
    return getCDN(`/avatars/${user.id}/${user.avatar}.png?size=64`);
  }
  const index = Number((BigInt(user.id) >> 22n) % 6n);
  return getCDN(`/embed/avatars/${index}.png`);
}

export function guildIconUrl(guild, size = 128) {
  if (!guild.icon) return null;

  const ext = guild.icon.startsWith("a_") ? "gif" : "png";
  return getCDN(`/icons/${guild.id}/${guild.icon}.${ext}?size=${size}`);
}

export const INVITE_URL = (guildId) =>
  `https://discord.com/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID}` +
  `&scope=bot+applications.commands&permissions=268504128` +
  `&guild_id=${guildId}&disable_guild_select=true`;
