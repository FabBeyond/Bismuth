import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { api } from "../api";

export default function Module({ title, enabled, moduleId }) {
  const [isOn, setIsOn] = useState(enabled);
  const [pending, setPending] = useState(false);
  const { guildId } = useParams();
  const navigate = useNavigate();

  async function toggle() {
    if (pending) return;
    const next = !isOn;
    setPending(true);
    try {
      await api(`/guilds/${guildId}/modules/${moduleId}/toggle`, {
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
