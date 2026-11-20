export default function RoleSelect({ roles, value, onChange }) {
  return (
    <select
      className="input"
      aria-label="Role"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="" disabled>
        Select a role
      </option>
      {roles.map((role) => (
        <option key={role.id} value={role.id}>
          {role.name}
        </option>
      ))}
    </select>
  );
}
