const TEXT_CHANNEL = 0;

// Shared base for all dropdowns. Pass `id` when a <label htmlFor> points at it,
// otherwise `label` is used as the accessible name.
function Select({
  items,
  value,
  onChange,
  placeholder,
  label,
  id,
  format = (item) => item.name,
}) {
  return (
    <select
      id={id}
      className="input"
      aria-label={id ? undefined : label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {format(item)}
        </option>
      ))}
    </select>
  );
}

export function RoleSelect({ roles, ...props }) {
  return (
    <Select items={roles} placeholder="Select a role" label="Role" {...props} />
  );
}

export function ChannelSelect({ channels, ...props }) {
  return (
    <Select
      items={channels.filter((c) => c.type === TEXT_CHANNEL)}
      placeholder="Select a channel"
      label="Channel"
      format={(c) => `#${c.name}`}
      {...props}
    />
  );
}
