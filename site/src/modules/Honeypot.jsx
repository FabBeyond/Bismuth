import { useParams } from "react-router";
import { useApi } from "../api";

export default function Honeypot() {
  const guildId = useParams();
  const channels = useApi(`/guilds/${guildId}/channels`);
  const existingHP = useApi(`/guilds/${guildId}/modules/honeypot`, {
    method: "GET",
  });

  if (channels.loading && !existingHP.data)
    return <p className="loading-guilds">Loading...</p>;
  if (channels.error || existingHP.error)
    return <p className="loading-guilds">Couldn't load server data.</p>;
}
