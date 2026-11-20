import { ArchiveXIcon } from "lucide-react";

export default function DeleteButton({ onClick, label = "Delete" }) {
  return (
    <button className="icon-btn" onClick={onClick} aria-label={label}>
      <ArchiveXIcon />
    </button>
  );
}
