import { useEffect, useState } from "react";
import { Link } from "react-router";
import { API_URL } from "../api";
import { canManage, INVITE_URL } from "../discord";
import { fetchGuilds } from "../guilds";
import GuildIcon from "../components/GuildIcon";
import StatusMessage from "../components/StatusMessage";

export default function Dashboard() {
  const [guilds, setGuilds] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    fetchGuilds()
      .then((g) => !ignore && setGuilds(g))
      .catch((err) => !ignore && setError(err));
    return () => {
      ignore = true;
    };
  }, [attempt]);

  if (error?.status === 401) {
    return (
      <StatusMessage
        action={
          <a href={`${API_URL}/auth/login`} className="btn login-button">
            LOG IN WITH DISCORD
          </a>
        }
      >
        Log in to see your servers
      </StatusMessage>
    );
  }
  if (error) {
    return (
      <StatusMessage
        action={
          <button
            className="btn login-button"
            onClick={() => {
              setError(null);
              setAttempt((a) => a + 1);
            }}
          >
            RETRY
          </button>
        }
      >
        Couldn't load servers.
      </StatusMessage>
    );
  }
  if (!guilds) {
    return <StatusMessage>Loading Servers...</StatusMessage>;
  }

  const manageable = guilds.filter(canManage);
  if (manageable.length === 0) {
    return <StatusMessage>No servers you can manage</StatusMessage>;
  }

  return (
    <div className="server-grid">
      {manageable.map((guild) => (
        <div key={guild.id} className="server">
          <GuildIcon guild={guild} />
          <p className="server-name">{guild.name}</p>
          {guild.bot_in_guild ? (
            <Link to={`/dashboard/${guild.id}`} className="btn btn-lg">
              MANAGE
            </Link>
          ) : (
            <a href={INVITE_URL(guild.id)} className="btn btn-lg">
              INVITE
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
