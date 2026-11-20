import { useState } from "react";
import { useParams } from "react-router";
import { api, useApi } from "../api";
import DeleteButton from "../components/DeleteButton";
import { RoleSelect } from "../components/Select";
import StatusMessage from "../components/StatusMessage";

export default function AutoRoles() {
  const { guildId } = useParams();
  const [roleId, setRoleId] = useState("");
  const autoRoles = useApi(`/guilds/${guildId}/modules/autoroles`);
  const roles = useApi(`/guilds/${guildId}/roles`);

  if ((autoRoles.loading && !autoRoles.data) || roles.loading)
    return <StatusMessage>Loading...</StatusMessage>;
  if (autoRoles.error || roles.error)
    return <StatusMessage>Couldn't load server data.</StatusMessage>;

  const roleName = (id) =>
    roles.data.find((r) => r.id === id)?.name ?? "deleted-role";

  async function addAutoRole() {
    await api(`/guilds/${guildId}/modules/autoroles`, {
      method: "POST",
      body: { role_id: roleId },
    });
    autoRoles.reload();
  }

  async function deleteAutoRole(id) {
    await api(`/guilds/${guildId}/modules/autoroles/${id}`, {
      method: "DELETE",
    });
    autoRoles.reload();
  }

  return (
    <div className="module-page">
      <h1 className="section-title">AUTO ROLES</h1>
      <div className="panel panel-row">
        <RoleSelect roles={roles.data} value={roleId} onChange={setRoleId} />
        <button className="btn btn-outline" onClick={addAutoRole}>
          ADD
        </button>
      </div>

      <h2 className="section-title">EXISTING AUTO ROLES</h2>
      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>ROLE</th>
              <th>DELETE</th>
            </tr>
          </thead>
          <tbody>
            {autoRoles.data.map((ar) => (
              <tr key={ar.role_id}>
                <td>{roleName(ar.role_id)}</td>
                <td>
                  <DeleteButton
                    label={`Remove auto role ${roleName(ar.role_id)}`}
                    onClick={() => deleteAutoRole(ar.role_id)}
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
