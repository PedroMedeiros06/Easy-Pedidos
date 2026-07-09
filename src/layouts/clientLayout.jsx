import { Outlet } from "react-router-dom";
import Sidebar from "../components/admin/Sidebar";

export default function ClientLayout() {
  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      <Sidebar />

      <main className="flex-1 ml-64 p-2">
        <Outlet />
      </main>
    </div>
  );
}