import { useState, lazy, Suspense } from "react";
import { useParams } from "react-router";
import { PlusIcon, ArchiveXIcon } from "lucide-react";
import { api, useApi } from "../api";
import { getCDN } from "../discord";
import Emoji from "../components/Emoji";

const EmojiPicker = lazy(() => import("emoji-picker-react"));

// oh when the miseryyyyy is code rotteddddd
export default function ReactionRoles() {
  const [emoji, setEmoji] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [messagIdInput, setMessageIdInput] = useState("");
  const { guildId } = useParams();
  const [channelId, setChannelId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [existingMessage, setExistingMessage] = useState(true);
  const [text, setText] = useState("");

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
    return <p className="loading-guilds">Loading...</p>;
  if (channels.error || emojis.error || roles.error || existingRR.error)
    return <p className="loading-guilds">Couldn't load server data.</p>;

  const channelName = (id) =>
    channels.data.find((c) => c.id === id)?.name ?? "deleted-channel";
  const roleName = (id) =>
    roles.data.find((r) => r.id === id)?.name ?? "deleted-role";

  return (
    <div className="reaction-roles">
      <p className="rr-title">REACTION ROLES</p>
      <div className="rr-adder">
        <div className="rr-type-picker">
          <button
            className={existingMessage ? "selected" : ""}
            onClick={() => setExistingMessage(true)}
          >
            EXISTING MESSAGE
          </button>
          <button
            className={existingMessage ? "" : "selected"}
            onClick={() => setExistingMessage(false)}
          >
            SEND NEW MESSAGE
          </button>
        </div>
        <div
          className="rr-message-inputs"
          style={
            existingMessage
              ? {}
              : { display: "flex", flexDirection: "column", gap: "20px" }
          }
        >
          <div className="channel-select">
            <p>CHANNEL</p>
            <select
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
            >
              <option value="" disabled>
                Select a channel
              </option>
              {channels.data
                .filter((item) => item.type == 0)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {"#" + item.name}
                  </option>
                ))}
            </select>
          </div>
          {existingMessage ? (
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
          ) : (
            <div className="new-message">
              <p className="textarea-title">Message</p>
              <p className="textarea-subtitle">
                Supports discords markdown features
              </p>
              <textarea
                className="new-msg-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={2000}
              ></textarea>
            </div>
          )}
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
              <Suspense fallback={<p>Loading...</p>}>
                <div className="emoji-popup">
                  <EmojiPicker
                    theme="dark"
                    customEmojis={emojis.data.map((e) => ({
                      id: e.id,
                      names: [e.name],
                      imgUrl: getCDN(
                        `/emojis/${e.id}.${e.animated ? "gif" : "png"}`,
                      ),
                    }))}
                    onEmojiClick={(e) => {
                      if (e.isCustom) {
                        const g = emojis.data.find((x) => x.id === e.emoji);
                        setEmoji(
                          `<${g.animated ? "a" : ""}:${g.name}:${g.id}>`,
                        );
                      } else {
                        setEmoji(e.emoji);
                      }
                      setPickerOpen(false);
                    }}
                  />
                </div>
              </Suspense>
            )}
          </div>
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
            <option value="" disabled>
              Select a role
            </option>
            {roles.data.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <button
            className="rr-add-button"
            onClick={async () => {
              let result;
              if (!existingMessage) {
                result = await api(
                  `/guilds/${guildId}/channels/${channelId}/messages`,
                  {
                    method: "POST",
                    body: {
                      message: text,
                    },
                  },
                );
                if (!result.message_id) {
                  console.log("Couldnt send message");
                  return;
                }
              }
              await api(`/guilds/${guildId}/modules/reactionroles`, {
                method: "POST",
                body: {
                  channel_id: channelId,
                  role_id: roleId,
                  emoji: emoji,
                  message_id: existingMessage
                    ? messagIdInput
                    : result.message_id,
                },
              });
              existingRR.reload();
            }}
          >
            ADD
          </button>
        </div>
      </div>
      <p className="rr-title">EXISTING REACTION ROLES</p>
      <div className="rr-adder">
        <table className="rr-table">
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
                  <button
                    onClick={async () => {
                      await api(
                        `/guilds/${guildId}/modules/reactionroles/${rr.message_id}?emoji=${encodeURIComponent(rr.emoji)}`,
                        { method: "DELETE" },
                      );
                      existingRR.reload();
                    }}
                  >
                    <ArchiveXIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
