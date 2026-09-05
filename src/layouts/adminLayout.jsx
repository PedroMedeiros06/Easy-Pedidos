import { Outlet } from "react-router-dom";
import Sidebar from "../components/admin/sidebar";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
