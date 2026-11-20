import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { LogOutIcon } from "lucide-react";
import bismuthLogo from "../assets/BismuthLogo.svg";
import { api, API_URL } from "../api";
import { avatarUrl } from "../discord";
import { clearGuildsCache } from "../guilds";

export default function Navbar() {
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
    clearGuildsCache();
    navigate("/");
  }

  return (
    <header className="nav-bar">
      <div className="nav-left">
        <img className="nav-logo" src={bismuthLogo} alt="" />
        <Link className="nav-title" to="/">
          BISMUTH
        </Link>
      </div>
      <nav className="nav-right">
        <a
          className="nav-link"
          href="https://github.com/FabBeyond/Bismuth"
          target="_blank"
          rel="noreferrer"
        >
          Source Code
        </a>
        {user ? (
          <>
            <button
              className="btn login-button"
              onClick={() => navigate("/dashboard")}
            >
              <img src={avatarUrl(user)} alt="" />
              {(user.global_name ?? user.username).toUpperCase()}
            </button>
            <button className="icon-btn" onClick={logout} aria-label="Log out">
              <LogOutIcon />
            </button>
          </>
        ) : (
          <a href={`${API_URL}/auth/login`} className="btn login-button">
            LOG IN WITH DISCORD
          </a>
        )}
      </nav>
    </header>
  );
}
