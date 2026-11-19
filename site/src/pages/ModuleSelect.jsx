import { useParams } from "react-router";
import { useApi } from "../api";
import { MODULES } from "../modules";
import Module from "../components/Module";

export default function ModuleSelect() {
  const { guildId } = useParams();
  const { data, loading } = useApi(`/guilds/${guildId}/modules`);

  if (loading) return <p className="loading-guilds">Loading...</p>;

  if (!data) return <p>Failed to load modules.</p>;

  const enabled = Object.fromEntries(
    data.map((item) => [item.module_id, item.enabled]),
  );

  return (
    <div className="modules">
      {MODULES.map((m) => (
        <Module
          key={m.id}
          title={m.title}
          enabled={enabled[m.id] ?? false}
          moduleId={m.id}
        />
      ))}
    </div>
  );
}
