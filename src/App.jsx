import "./index.css";
import { Routes, Route, Outlet } from "react-router";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ServerSettings from "./pages/ServerSettings";
import ModuleSelect from "./pages/ModuleSelect";
import ModulePage from "./pages/ModulePage";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="dashboard/:guildId" element={<ServerSettings />}>
          <Route index element={<ModuleSelect />} />
          <Route path=":moduleId" element={<ModulePage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function Layout() {
  return (
    <div className="main">
      <Navbar />
      <Outlet />
    </div>
  );
}

export default App;
