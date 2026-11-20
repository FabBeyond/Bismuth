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

  // The toggle button's click area is stretched over the whole card in CSS,
  // so clicking anywhere toggles, while the settings button sits on top.
  return (
    <div className={`module ${isOn ? "on" : ""}`}>
      <button className="module-toggle" onClick={toggle} aria-pressed={isOn}>
        <span className="module-title">{title}</span>
        <span className="module-hint">
          CLICK TO {isOn ? "DISABLE" : "ENABLE"}
        </span>
      </button>
      <button
        className="btn btn-lg module-settings-btn"
        onClick={() => navigate(moduleId)}
      >
        SETTINGS
      </button>
    </div>
  );
}
