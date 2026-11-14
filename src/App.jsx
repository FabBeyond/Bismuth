import "./index.css";
import pyramid from "./assets/MainPagePyramid.svg";
import bismuthLogo from "./assets/BismuthLogo.svg";
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "";

function App() {
  return (
    <div className="main">
      <Navbar />
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
    </div>
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

function Navbar() {
  const [user, setUser] = useState(null);

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
  }

  return (
    <div className="nav-bar">
      <div className="nav-left">
        <img src={bismuthLogo} alt="bismuth logo" />
        <p className="title">BISMUTH</p>
      </div>
      <div className="nav-right">
        <a href="https://github.com/FabBeyond/bismuthbot">BOT SOURCE</a>
        <a href="https://github.com/FabBeyond/bismuthsite">SITE SOURCE</a>
        {user ? (
          <button className="login-button" onClick={logout} title="Log out">
            <img src={avatarUrl(user)} alt="" />
            {(user.global_name ?? user.username).toUpperCase()}
          </button>
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
