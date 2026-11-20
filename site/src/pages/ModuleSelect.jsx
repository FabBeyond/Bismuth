import { useParams } from "react-router";
import { useApi } from "../api";
import { MODULES } from "../modules";
import Module from "../components/Module";
import StatusMessage from "../components/StatusMessage";

export default function ModuleSelect() {
  const { guildId } = useParams();
  const { data, loading } = useApi(`/guilds/${guildId}/modules`);

  if (loading) return <StatusMessage>Loading...</StatusMessage>;
  if (!data) return <StatusMessage>Failed to load modules.</StatusMessage>;

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
