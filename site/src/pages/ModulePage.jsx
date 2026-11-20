import { Link, useParams } from "react-router";
import { MODULES } from "../modules";
import NotFound from "./NotFound";

export default function ModulePage() {
  const { moduleId } = useParams();
  const Part = MODULES.find((m) => m.id === moduleId)?.Component;
  if (!Part) return <NotFound />;

  return (
    <>
      <Link to=".." className="btn back-btn">
        BACK
      </Link>
      <Part />
    </>
  );
}
