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
