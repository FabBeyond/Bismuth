import { api, useApi } from "../api.js";
import { useParams } from "react-router";
import { ArchiveXIcon } from "lucide-react";
import { useState } from "react";

export default function AutoRoles() {
  const { guildId } = useParams();
  const [roleId, setRoleId] = useState("");
  const existingAR = useApi(`/guilds/${guildId}/modules/autoroles`, {
    method: "GET",
  });
  const roles = useApi(`/guilds/${guildId}/roles`);
  const channels = useApi(`/guilds/${guildId}/channels`);

  if (
    (existingAR.loading && !existingAR.data) ||
    roles.loading ||
    channels.loading
  )
    return <p className="loading-guilds">Loading...</p>;
  if (existingAR.error || roles.error || channels.error)
    return <p className="loading-guilds">Couldn't load server data.</p>;

  const roleName = (id) =>
    roles.data.find((r) => r.id === id)?.name ?? "deleted-role";

  return (
    <div className="reaction-roles">
      <p className="rr-title">AUTO ROLES</p>
      <div className="rr-adder autoroles">
        <div className="rr-message-inputs">
          <div className="channel-select">
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
          </div>
        </div>
        <div className="emoji-role-inputs">
          <button
            className="rr-add-button"
            onClick={async () => {
              await api(`/guilds/${guildId}/modules/autoroles`, {
                method: "POST",
                body: { role_id: roleId },
              });
              existingAR.reload();
            }}
          >
            ADD
          </button>
        </div>
      </div>
      <p className="rr-title">EXISTING AUTO ROLES</p>
      <div className="rr-adder">
        <table className="rr-table">
          <thead>
            <tr>
              <th>ROLE</th>
              <th>DELETE</th>
            </tr>
          </thead>
          <tbody>
            {existingAR.data.map((rr) => (
              <tr key={rr.role_id}>
                <td>{roleName(rr.role_id)}</td>
                <td>
                  <button
                    onClick={async () => {
                      await api(
                        `/guilds/${guildId}/modules/autoroles/${rr.role_id}`,
                        { method: "DELETE" },
                      );
                      existingAR.reload();
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
