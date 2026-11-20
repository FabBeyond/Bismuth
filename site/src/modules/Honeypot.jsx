import { useParams } from "react-router";
import { api, useApi } from "../api";
import StatusMessage from "../components/StatusMessage";
import { ChannelSelect, Select } from "../components/Select.jsx";
import { useState } from "react";
import DeleteButton from "../components/DeleteButton.jsx";

const ACTIONS = [
  { id: "kick", name: "Kick" },
  { id: "ban", name: "Ban" },
];

export default function Honeypot() {
  const { guildId } = useParams();
  const channels = useApi(`/guilds/${guildId}/channels`);
  const existingHP = useApi(`/guilds/${guildId}/modules/honeypot`);
  const [channelId, setChannelId] = useState("");
  const [action, setAction] = useState("");
  const [deleteSeconds, setDeleteSeconds] = useState("");
  const [message, setMessage] = useState("");

  if (channels.loading || (existingHP.loading && !existingHP.data))
    return <StatusMessage>Loading...</StatusMessage>;
  if (channels.error || existingHP.error)
    return <StatusMessage>Couldn't load server data.</StatusMessage>;

  const channelName = (id) =>
    channels.data.find((c) => c.id === id)?.name ?? "deleted-channel";

  async function addHoneypotChannel() {
    await api(`/guilds/${guildId}/modules/honeypot`, {
      method: "POST",
      body: {
        channel_id: channelId,
        action: action,
        ...(deleteSeconds !== "" && { delete_seconds: Number(deleteSeconds) }),
        ...(message !== "" && { message }),
      },
    });
    existingHP.reload();
  }
  async function deleteHoneypot(hp) {
    await api(`/guilds/${guildId}/modules/honeypot/${hp.channel_id}`, {
      method: "DELETE",
    });
    existingHP.reload();
  }

  return (
    <div className="module-page">
      <h1 className="section-title">HONEYPOT</h1>
      <div className="panel">
        <div className="field-row">
          <div className="field">
            <label className="field-label" htmlFor="honeypot-channel">
              CHANNEL
            </label>
            <ChannelSelect
              id="honeypot-channel"
              channels={channels.data}
              value={channelId}
              onChange={setChannelId}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="honeypot-action">
              ACTION
            </label>
            <Select
              items={ACTIONS}
              value={action}
              onChange={setAction}
              placeholder="Select an action"
              label="Action"
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="honeypot-delete-seconds" className="field-label">
              HONEYPOT DELETE SECONDS
            </label>
            <input
              id="honeypot-delete-seconds"
              className="input"
              type="text"
              placeholder="e.g. 3600"
              value={deleteSeconds}
              onChange={(e) => setDeleteSeconds(e.target.value)}
            />
            <p className="field-hint">Seconds of messages to delete</p>
          </div>
          <div className="field">
            <label htmlFor="honeypot-message" className="field-label">
              MESSAGE
            </label>
            <input
              id="honeypot-message"
              className="input"
              type="text"
              placeholder="e.g. You have been honeypotted"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="field-hint">Message to dm, empty for no dm</p>
          </div>
          <div className="field">
            <span className="field-label" aria-hidden="true">
              &nbsp;
            </span>
            <button className="btn btn-outline" onClick={addHoneypotChannel}>
              ADD
            </button>
          </div>
        </div>
      </div>

      <h2 className="section-title">EXISTING HONEYPOTS</h2>
      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>CHANNEL</th>
              <th>ACTION</th>
              <th>MESSAGE</th>
              <th>DELETE SECONDS</th>
              <th>DELETE</th>
            </tr>
          </thead>
          <tbody>
            {existingHP.data.map((hp) => (
              <tr key={`${hp.channel_id}-${guildId}`}>
                <td>#{channelName(hp.channel_id)}</td>
                <td>{hp.action}</td>
                <td>{hp.message ? hp.message : ""}</td>
                <td>{hp.delete_seconds}</td>
                <td>
                  <DeleteButton
                    label="Delete reaction role"
                    onClick={() => deleteHoneypot(hp)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
