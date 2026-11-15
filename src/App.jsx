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
import EmojiPicker from "emoji-picker-react";

const API_URL = import.meta.env.VITE_API_URL ?? "";
let guildsPromise = null;
const ADMINISTRATOR = 0x8n;
const MANAGE_GUILD = 0x20n;
const dashboardParts = {
  null: ModuleSelect,
  reactionroles: ReactionRoles,
  autoroles: AutoRoles,
};

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

  return (
    <div className="dashboard-server-select">
      {manageable.map((item) => (
        <div key={item.id} className="server">
          <GuildIcon guild={item} />
          <p>{item.name}</p>
          <div style={{ flex: 1 }}></div>
          <Link to={`/dashboard/${item.id}`} className="manage-btn">
            {item.bot_in_guild ? "MANAGE" : "INVITE"}
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
  const [openModule, setOpenModule] = useState(null);

  const OpenPart = dashboardParts[openModule];

  return (
    <>
      {openModule && <ModuleBackButton setOpenModule={setOpenModule} />}
      <OpenPart setOpenModule={setOpenModule} />
    </>
  );
}
function ModuleSelect({ setOpenModule }) {
  const [enabledModules, setEnabledModules] = useState();
  const { guildId } = useParams();

  useEffect(() => {
    fetch(`${API_URL}/api/guilds/${guildId}/modules`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(setEnabledModules)
      .catch(() => setEnabledModules(null));
  }, [guildId]);

  const enabled = Object.fromEntries(
    (enabledModules ?? []).map((item) => [item.module_id, item.enabled]),
  );

  return (
    <div className="modules">
      <Module
        title="REACTION ROLES"
        setOpenModule={setOpenModule}
        enabled={enabled.reactionroles ?? false}
        moduleId="reactionroles"
      />
      <Module
        title="AUTO ROLES"
        setOpenModule={setOpenModule}
        enabled={enabled.autoroles ?? false}
        moduleId="autoroles"
      />
    </div>
  );
}
function ModuleBackButton({ setOpenModule }) {
  return (
    <button onClick={() => setOpenModule(null)} className="module-back-btn">
      BACK
    </button>
  );
}
// oh when the miseryyyyy is code rotteddddd
function ReactionRoles({ setOpenModule }) {
  const [channels, setChannels] = useState([]);
  const [emojis, setEmojis] = useState([]);
  const [emoji, setEmoji] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { guildId } = useParams();

  useEffect(() => {
    async function getChannelsAndEmojis() {
      const res = await fetch(`${API_URL}/api/guilds/${guildId}/channels`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setChannels(await res.json());

      const resEmojis = await fetch(`${API_URL}/api/guilds/${guildId}/emojis`, {
        credentials: "include",
      });
      if (!resEmojis.ok) throw new Error(`HTTP ${res.status}`);
      setEmojis(await resEmojis.json());
    }
    getChannelsAndEmojis();
  }, [guildId]);

  return (
    <div className="reaction-roles">
      <p className="rr-title">REACTION ROLES</p>
      <div className="rr-adder">
        <select>
          {channels
            .filter((item) => item.type == 0)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
        </select>
        <div className="emoji-field">
          <button onClick={() => setPickerOpen((o) => !o)}>
            {emoji ? <Emoji value={emoji} /> : "PICK EMOJI"}
          </button>
        </div>
        {pickerOpen && (
          <div className="emoji-popup">
            <EmojiPicker
              theme="dark"
              customEmojis={emojis.map((e) => ({
                id: e.id,
                names: [e.name],
                imgUrl: `https://cdn.discordapp.com/emojis/${e.id}.${e.animated ? "gif" : "png"}`,
              }))}
              onEmojiClick={(e) => {
                if (e.isCustom) {
                  const g = emojis.find((x) => x.id === e.emoji);
                  setEmoji(`<${g.animated ? "a" : ""}:${g.name}:${g.id}>`);
                } else {
                  setEmoji(e.emoji);
                }
                setPickerOpen(false);
              }}
            />
          </div>
        )}
        <button>ADD</button>
      </div>
    </div>
  );
}
function Emoji({ value, size = 24 }) {
  const match = value?.match(/^<(a?):(\w+):(\d+)>$/);

  if (!match) return <span style={{ fontSize: size }}>{value}</span>;

  const [, animated, name, id] = match;
  return (
    <img
      src={`https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "png"}?size=64`}
      alt={`:${name}:`}
      title={`:${name}:`}
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  );
}
function AutoRoles() {}
function Module({ title, setOpenModule, enabled, moduleId }) {
  const [isOn, setIsOn] = useState(enabled);
  const { guildId } = useParams();

  //eslint-disable-next-line
  useEffect(() => setIsOn(enabled), [enabled]);

  async function toggleModule() {
    const res = await fetch(
      `${API_URL}/api/guilds/${guildId}/modules/${moduleId}`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled: !isOn }),
      },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  return (
    <div
      className={`module ${isOn ? "on" : ""}`}
      onClick={async () => {
        try {
          await toggleModule();
          setIsOn(!isOn);
        } catch (err) {
          console.log(err);
        }
      }}
    >
      <p className="module-title">{title}</p>
      <p className="module-cte">CLICK TO {isOn ? "DISABLE" : "ENABLE"}</p>
      <div style={{ flex: 1 }}></div>
      <button
        className="module-settings-btn"
        onClick={(e) => {
          setOpenModule(moduleId);
          e.stopPropagation();
        }}
      >
        SETTINGS
      </button>
    </div>
  );
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
