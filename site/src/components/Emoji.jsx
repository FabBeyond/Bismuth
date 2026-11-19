import { getCDN } from "../discord";

export default function Emoji({ value, size = 24 }) {
  const match = value?.match(/^<(a?):(\w+):(\d+)>$/);

  if (!match) return <span style={{ fontSize: size }}>{value}</span>;

  const [, animated, name, id] = match;
  return (
    <img
      src={getCDN(`/emojis/${id}.${animated ? "gif" : "png"}?size=64`)}
      alt={`:${name}:`}
      title={`:${name}:`}
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  );
}
