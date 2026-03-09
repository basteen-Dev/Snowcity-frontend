import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import useAdminTheme from '../../hooks/useAdminTheme';
import { useDispatch } from 'react-redux';
import { adminHydratePermissions } from '../../features/auth/adminAuthThunks';
import '../../AdminStyles.css';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const dispatch = useDispatch();

  useAdminTheme();

  React.useEffect(() => {
    dispatch(adminHydratePermissions()).catch(() => { });
  }, [dispatch]);

  return (
    <div className="admin-panel-theme min-h-screen">
      {/* Subtle background gradients */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(59,130,246,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(14,165,233,0.06),transparent_50%)]" />
      </div>

      <div className="relative z-10 flex h-screen overflow-hidden w-full">

        {/* Mobile Overlay */}
        {mobileOpen && (
          <div
            className="mobile-overlay"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <AdminSidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />

        {/* Main content */}
        <div className="main flex-1 flex flex-col min-w-0">
          <AdminTopbar
            onToggleSidebar={() => setCollapsed((v) => !v)}
            onToggleMobile={() => setMobileOpen((v) => !v)}
          />
          <main className="main-scroll p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}