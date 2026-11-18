import { useEffect, useState } from "react";
import { Link } from "react-router";
import { API_URL } from "../api";
import { canManage, INVITE_URL } from "../discord";
import { fetchGuilds } from "../guilds";
import GuildIcon from "../components/GuildIcon";

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
      <div className="loading-guilds log-in">
        <p>Log in to see your servers</p>
        <a href={`${API_URL}/auth/login`} className="login-button">
          LOG IN WITH DISCORD
        </a>
      </div>
    );
  }
  if (error) {
    return (
      <div className="loading-guilds">
        <p>Couldn't load servers.</p>
        <button
          className="login-button"
          onClick={() => {
            setError(null);
            setAttempt((a) => a + 1);
          }}
        >
          RETRY
        </button>
      </div>
    );
  }
  if (!guilds) {
    return <p className="loading-guilds">Loading Servers...</p>;
  }

  const manageable = guilds.filter(canManage);
  if (manageable.length === 0) {
    return <p className="loading-guilds">No servers you can manage</p>;
  }

  return (
    <div className="dashboard-server-select">
      {manageable.map((item) => (
        <div key={item.id} className="server">
          <GuildIcon guild={item} />
          <p>{item.name}</p>
          <div style={{ flex: 1 }}></div>
          {item.bot_in_guild ? (
            <Link to={`/dashboard/${item.id}`} className="manage-btn">
              MANAGE
            </Link>
          ) : (
            <a href={INVITE_URL(item.id)} className="manage-btn">
              INVITE
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
