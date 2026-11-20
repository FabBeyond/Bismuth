import { useState, lazy, Suspense } from "react";
import { useParams } from "react-router";
import { PlusIcon } from "lucide-react";
import { api, useApi } from "../api";
import { getCDN } from "../discord";
import DeleteButton from "../components/DeleteButton";
import Emoji from "../components/Emoji";
import RoleSelect from "../components/RoleSelect";
import StatusMessage from "../components/StatusMessage";

const EmojiPicker = lazy(() => import("emoji-picker-react"));

// oh when the miseryyyyy is code rotteddddd
export default function ReactionRoles() {
  const { guildId } = useParams();
  const [existingMessage, setExistingMessage] = useState(true);
  const [channelId, setChannelId] = useState("");
  const [messageId, setMessageId] = useState("");
  const [text, setText] = useState("");
  const [emoji, setEmoji] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [roleId, setRoleId] = useState("");

  const channels = useApi(`/guilds/${guildId}/channels`);
  const emojis = useApi(`/guilds/${guildId}/emojis`);
  const roles = useApi(`/guilds/${guildId}/roles`);
  const existingRR = useApi(`/guilds/${guildId}/modules/reactionroles`);

  if (
    channels.loading ||
    emojis.loading ||
    roles.loading ||
    (existingRR.loading && !existingRR.data)
  )
    return <StatusMessage>Loading...</StatusMessage>;
  if (channels.error || emojis.error || roles.error || existingRR.error)
    return <StatusMessage>Couldn't load server data.</StatusMessage>;

  const channelName = (id) =>
    channels.data.find((c) => c.id === id)?.name ?? "deleted-channel";
  const roleName = (id) =>
    roles.data.find((r) => r.id === id)?.name ?? "deleted-role";

  function pickEmoji(e) {
    if (e.isCustom) {
      const custom = emojis.data.find((x) => x.id === e.emoji);
      setEmoji(`<${custom.animated ? "a" : ""}:${custom.name}:${custom.id}>`);
    } else {
      setEmoji(e.emoji);
    }
    setPickerOpen(false);
  }

  async function addReactionRole() {
    let targetMessageId = messageId;
    if (!existingMessage) {
      const result = await api(
        `/guilds/${guildId}/channels/${channelId}/messages`,
        { method: "POST", body: { message: text } },
      );
      if (!result.message_id) {
        console.log("Couldnt send message");
        return;
      }
      targetMessageId = result.message_id;
    }

    await api(`/guilds/${guildId}/modules/reactionroles`, {
      method: "POST",
      body: {
        channel_id: channelId,
        role_id: roleId,
        emoji: emoji,
        message_id: targetMessageId,
      },
    });
    existingRR.reload();
  }

  async function deleteReactionRole(rr) {
    await api(
      `/guilds/${guildId}/modules/reactionroles/${rr.message_id}?emoji=${encodeURIComponent(rr.emoji)}`,
      { method: "DELETE" },
    );
    existingRR.reload();
  }

  return (
    <div className="module-page">
      <h1 className="section-title">REACTION ROLES</h1>
      <div className="panel">
        <div className="segmented">
          <button
            aria-pressed={existingMessage}
            onClick={() => setExistingMessage(true)}
          >
            EXISTING MESSAGE
          </button>
          <button
            aria-pressed={!existingMessage}
            onClick={() => setExistingMessage(false)}
          >
            SEND NEW MESSAGE
          </button>
        </div>

        <div
          className={`field-row ${existingMessage ? "" : "field-row-stacked"}`}
        >
          <div className="field">
            <label className="field-label" htmlFor="rr-channel">
              CHANNEL
            </label>
            <select
              id="rr-channel"
              className="input"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
            >
              <option value="" disabled>
                Select a channel
              </option>
              {channels.data
                .filter((c) => c.type === 0)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.name}
                  </option>
                ))}
            </select>
          </div>

          {existingMessage ? (
            <div className="field">
              <label className="field-label" htmlFor="rr-message-id">
                MESSAGE ID
              </label>
              <input
                id="rr-message-id"
                className="input"
                type="text"
                placeholder="e.g. 1173048211934519356"
                value={messageId}
                onChange={(e) => setMessageId(e.target.value)}
              />
              <p className="field-hint">
                {
                  "In Discord: right-click the message -> Copy Message ID. Needs Developer Mode on"
                }
              </p>
            </div>
          ) : (
            <div>
              <label
                className="field-label field-label-large"
                htmlFor="rr-message-text"
              >
                Message
              </label>
              <p className="field-hint">Supports discords markdown features</p>
              <textarea
                id="rr-message-text"
                className="textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={2000}
              />
            </div>
          )}
        </div>
      </div>

      <div className="panel panel-attached">
        <div className="field-row field-row-bottom">
          <div className="field">
            <label className="field-label" htmlFor="rr-emoji">
              EMOJI
            </label>
            <button
              id="rr-emoji"
              className="btn btn-outline btn-square"
              onClick={() => setPickerOpen((open) => !open)}
            >
              {emoji ? <Emoji value={emoji} /> : <PlusIcon />}
            </button>
            {pickerOpen && (
              <Suspense fallback={<p>Loading...</p>}>
                <EmojiPicker
                  theme="dark"
                  customEmojis={emojis.data.map((e) => ({
                    id: e.id,
                    names: [e.name],
                    imgUrl: getCDN(
                      `/emojis/${e.id}.${e.animated ? "gif" : "png"}`,
                    ),
                  }))}
                  onEmojiClick={pickEmoji}
                />
              </Suspense>
            )}
          </div>
          <RoleSelect roles={roles.data} value={roleId} onChange={setRoleId} />
          <button className="btn btn-outline" onClick={addReactionRole}>
            ADD
          </button>
        </div>
      </div>

      <h2 className="section-title">EXISTING REACTION ROLES</h2>
      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>CHANNEL</th>
              <th>MESSAGE ID</th>
              <th>EMOJI</th>
              <th>ROLE</th>
              <th>DELETE</th>
            </tr>
          </thead>
          <tbody>
            {existingRR.data.map((rr) => (
              <tr key={`${rr.message_id}-${rr.emoji}`}>
                <td>#{channelName(rr.channel_id)}</td>
                <td>{rr.message_id}</td>
                <td>
                  <Emoji value={rr.emoji} />
                </td>
                <td>{roleName(rr.role_id)}</td>
                <td>
                  <DeleteButton
                    label="Delete reaction role"
                    onClick={() => deleteReactionRole(rr)}
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
