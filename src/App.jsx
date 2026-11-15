import "./index.css";
import pyramid from "./assets/MainPagePyramid.svg";
import bismuthLogo from "./assets/BismuthLogo.svg";
import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Outlet,
  Link,
  useNavigate,
  useParams,
} from "react-router";
import { LogOutIcon } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "";
let guildsPromise = null;
const ADMINISTRATOR = 0x8n;
const MANAGE_GUILD = 0x20n;

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="dashboard/:guildId" element={<ServerSettings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function Layout() {
  return (
    <div className="main">
      <Navbar />
      <Outlet />
    </div>
  );
}

function Home() {
  return (
    <div className="content">
      <div className="top-part">
        <div className="left-part">
          <p className="page-title">Element 83, now in your Discord.</p>
          <p className="page-subtitle">
            Bismuth is an open-source, 100% free, general purpose Discord bot.
            Built with modules you can enable at your will.
          </p>
        </div>
        <div className="right-part">
          <PyramidSchematic />
        </div>
      </div>
    </div>
  );
}
function Dashboard() {
  const [guilds, setGuilds] = useState(null);

  useEffect(() => {
    let ignore = false;
    fetchGuilds()
      .then((g) => !ignore && setGuilds(g))
      .catch(() => !ignore && setGuilds(null));
    return () => {
      ignore = true;
    };
  }, []);

  if (!guilds) {
    return <p className="loading-guilds">Loading Servers...</p>;
  }

  const manageable = guilds.filter(canManage);
  console.log(manageable);
  return (
    <div className="dashboard-server-select">
      {manageable.map((item) => (
        <div key={item.id} className="server">
          <GuildIcon guild={item} />
          <p>{item.name}</p>
          <div style={{ flex: 1 }}></div>
          <Link to={`/dashboard/${item.id}`} className="manage-btn">
            MANAGE
          </Link>
        </div>
      ))}
    </div>
  );
}
function NotFound() {
  return <p>Not Found</p>;
}
function ServerSettings() {
  const { guildId } = useParams();
  return null;
}
function GuildIcon({ guild }) {
  const url = guildIconUrl(guild);
  if (url) return <img src={url} alt="" className="guild-icon" />;

  const initials = guild.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3);
  return <div className="guild-icon guild-icon-fallback">{initials}</div>;
}
function guildIconUrl(guild, size = 128) {
  if (!guild.icon) return null;

  const ext = guild.icon.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${ext}?size=${size}`;
}

function canManage(guild) {
  const perms = BigInt(guild.permissions);
  return (
    guild.owner ||
    (perms & ADMINISTRATOR) === ADMINISTRATOR ||
    (perms & MANAGE_GUILD) === MANAGE_GUILD
  );
}

function PyramidSchematic() {
  return (
    <div className="pyramid-schematic">
      <img src={pyramid} alt="pyramid" />
      <table className="pyramid-table">
        <tbody>
          <tr>
            <td>PROJECT</td>
            <td>BISMUTH BOT</td>
          </tr>
          <tr>
            <td>LICENSE</td>
            <td>OPEN SOURCE</td>
          </tr>
          <tr>
            <td>REVISION</td>
            <td>ALPHA - NOT RELEASED</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function avatarUrl(user) {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`;
  }
  const index = Number((BigInt(user.id) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}
function fetchGuilds() {
  if (guildsPromise) return guildsPromise;

  guildsPromise = fetch(`${API_URL}/api/guilds`, { credentials: "include" })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .catch((err) => {
      guildsPromise = null;
      throw err;
    });

  return guildsPromise;
}

function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  async function logout() {
    await fetch(`${API_URL}/api/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    navigate("/");
  }

  return (
    <div className="nav-bar">
      <div className="nav-left">
        <img src={bismuthLogo} alt="bismuth logo" />
        <Link className="title" to="/">
          BISMUTH
        </Link>
      </div>
      <div className="nav-right">
        <a href="https://github.com/FabBeyond/BismuthBot" target="_blank">
          BOT SOURCE
        </a>
        <a href="https://github.com/FabBeyond/BismuthWebsite" target="_blank">
          SITE SOURCE
        </a>
        <a href="https://github.com/FabBeyond/BismuthApi" target="_blank">
          API SOURCE
        </a>
        {user ? (
          <>
            <button
              className="login-button"
              onClick={() => navigate("/dashboard")}
              title="Log out"
            >
              <img src={avatarUrl(user)} alt="" />
              {(user.global_name ?? user.username).toUpperCase()}
            </button>
            <LogOutIcon className="logout-icon" onClick={() => logout()} />
          </>
        ) : (
          <a href={`${API_URL}/auth/login`} className="login-button">
            LOG IN WITH DISCORD
          </a>
        )}
      </div>
    </div>
  );
}

export default App;
