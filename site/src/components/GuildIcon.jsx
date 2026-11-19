import { guildIconUrl } from "../discord";

export default function GuildIcon({ guild }) {
  const url = guildIconUrl(guild);
  if (url) return <img src={url} alt="" className="guild-icon" />;

  const initials = guild.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3);
  return <div className="guild-icon guild-icon-fallback">{initials}</div>;
}
