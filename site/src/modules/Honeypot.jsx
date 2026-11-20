import { useParams } from "react-router";
import { useApi } from "../api";
import StatusMessage from "../components/StatusMessage";

export default function Honeypot() {
  const { guildId } = useParams();
  const channels = useApi(`/guilds/${guildId}/channels`);
  const existingHP = useApi(`/guilds/${guildId}/modules/honeypot`);

  if (channels.loading || (existingHP.loading && !existingHP.data))
    return <StatusMessage>Loading...</StatusMessage>;
  if (channels.error || existingHP.error)
    return <StatusMessage>Couldn't load server data.</StatusMessage>;
}
