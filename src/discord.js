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
