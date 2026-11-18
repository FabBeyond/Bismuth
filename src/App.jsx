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
import { LogOutIcon, PlusIcon } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { api, useApi, API_URL } from "./api";
import { getCDN, canManage } from "./discord";

let guildsPromise = null;
const MODULES = [
  { id: "reactionroles", title: "REACTION ROLES", Component: ReactionRoles },
  { id: "autoroles", title: "AUTO ROLES", Component: AutoRoles },
];
const INVITE_URL = (guildId) =>
  `https://discord.com/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID}` +
  `&scope=bot+applications.commands&permissions=268504128` +
  `&guild_id=${guildId}&disable_guild_select=true`;

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="dashboard/:guildId" element={<ServerSettings />}>
          <Route index element={<ModuleSelect />} />
          <Route path=":moduleId" element={<ModulePage />} />
        </Route>
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
function NotFound() {
  return <p>Not Found</p>;
}
function ServerSettings() {
  return <Outlet />;
}
function ModulePage() {
  const { moduleId } = useParams();
  const Part = MODULES.find((m) => m.id === moduleId)?.Component;
  if (!Part) return <NotFound />;

  return (
    <>
      <Link to=".." className="module-back-btn">
        BACK
      </Link>
      <Part />
    </>
  );
}
function ModuleSelect() {
  const { guildId } = useParams();
  const { data, loading } = useApi(`/guilds/${guildId}/modules`);

  if (loading) return <p className="loading-guilds">Loading...</p>;

  const enabled = Object.fromEntries(
    data.map((item) => [item.module_id, item.enabled]),
  );

  return (
    <div className="modules">
      {MODULES.map((m) => (
        <Module
          key={m.id}
          title={m.title}
          enabled={enabled.reactionroles ?? false}
          moduleId={m.id}
        />
      ))}
    </div>
  );
}
// oh when the miseryyyyy is code rotteddddd
function ReactionRoles() {
  const [emoji, setEmoji] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [messagIdInput, setMessageIdInput] = useState("");
  const { guildId } = useParams();
  const [channelId, setChannelId] = useState("");
  const [roleId, setRoleId] = useState("");

  const channels = useApi(`/guilds/${guildId}/channels`).data ?? [];
  const emojis = useApi(`/guilds/${guildId}/emojis`).data ?? [];
  const roles = useApi(`/guilds/${guildId}/roles`).data ?? [];

  if (channels.loading || emojis.loading || roles.loading)
    return <p>Loading...</p>;
  if (channels.error || emojis.error || roles.error)
    return <p>Couldn't load server data.</p>;

  return (
    <div className="reaction-roles">
      <p className="rr-title">REACTION ROLES</p>
      <div className="rr-adder">
        <div className="rr-type-picker">
          <button className="selected">EXISTING MESSAGE</button>
          <button>SEND NEW MESSAGE</button>
        </div>
        <div className="rr-message-inputs">
          <div className="channel-select">
            <p>CHANNEL</p>
            <select
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
            >
              <option value="" disabled>
                Select a channel
              </option>
              {channels
                .filter((item) => item.type == 0)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {"#" + item.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="message-id">
            <p>MESSAGE ID</p>
            <input
              type="text"
              placeholder="e.g. 1173048211934519356"
              value={messagIdInput}
              onChange={(e) => setMessageIdInput(e.target.value)}
            />
            <p>
              {
                "In Discord: right-click the message -> Copy Message ID. Needs Developer Mode on"
              }
            </p>
          </div>
        </div>
      </div>
      <div className="rr-emoji-role">
        <div className="emoji-role-inputs">
          <div className="emoji-picker">
            <p>EMOJI</p>
            <div className="emoji-field">
              <button onClick={() => setPickerOpen((o) => !o)}>
                {emoji ? <Emoji value={emoji} /> : <PlusIcon />}
              </button>
            </div>
            {pickerOpen && (
              <div className="emoji-popup">
                <EmojiPicker
                  theme="dark"
                  customEmojis={emojis.map((e) => ({
                    id: e.id,
                    names: [e.name],
                    imgUrl: getCDN(
                      `/emojis/${e.id}.${e.animated ? "gif" : "png"}`,
                    ),
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
          </div>
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
            <option value="" disabled>
              Select a role
            </option>
            {roles.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <button className="rr-add-button">ADD</button>
        </div>
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
      src={getCDN(`/emojis/${id}.${animated ? "gif" : "png"}?size=64`)}
      alt={`:${name}:`}
      title={`:${name}:`}
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  );
}
function AutoRoles() {}
function Module({ title, enabled, moduleId }) {
  const [isOn, setIsOn] = useState(enabled);
  const [pending, setPending] = useState(false);
  const { guildId } = useParams();
  const navigate = useNavigate();

  async function toggle() {
    if (pending) return;
    const next = !isOn;
    setPending(true);
    try {
      await api(`/guilds/${guildId}/modules/${moduleId}`, {
        method: "POST",
        body: { enabled: next },
      });
      setIsOn(next);
    } catch (err) {
      console.log(err);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={`module ${isOn ? "on" : ""}`} onClick={toggle}>
      <p className="module-title">{title}</p>
      <p className="module-cte">CLICK TO {isOn ? "DISABLE" : "ENABLE"}</p>
      <div style={{ flex: 1 }}></div>
      <button
        className="module-settings-btn"
        onClick={(e) => {
          e.stopPropagation();
          navigate(moduleId);
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
  return getCDN(`/icons/${guild.id}/${guild.icon}.${ext}?size=${size}`);
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
    return getCDN(`/avatars/${user.id}/${user.avatar}.png?size=64`);
  }
  const index = Number((BigInt(user.id) >> 22n) % 6n);
  return getCDN(`/embed/avatars/${index}.png`);
}
function fetchGuilds() {
  if (guildsPromise) return guildsPromise;

  guildsPromise = api("/guilds").catch((err) => {
    guildsPromise = null;
    throw err;
  });

  return guildsPromise;
}

function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api("/me")
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  async function logout() {
    try {
      await api("/logout", { method: "POST" });
    } catch (err) {
      console.log(err);
    }

    setUser(null);
    guildsPromise = null;
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
            >
              <img src={avatarUrl(user)} alt="" />
              {(user.global_name ?? user.username).toUpperCase()}
            </button>
            <button
              className="logout-btn"
              onClick={() => logout()}
              aria-label="Log out"
            >
              <LogOutIcon className="logout-icon" />
            </button>
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
