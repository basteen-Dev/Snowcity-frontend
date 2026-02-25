import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import useAdminTheme from '../../hooks/useAdminTheme';
import { useDispatch } from 'react-redux';
import { adminHydratePermissions } from '../../features/auth/adminAuthThunks';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const dispatch = useDispatch();

  useAdminTheme();

  React.useEffect(() => {
    dispatch(adminHydratePermissions()).catch(() => { });
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Subtle background gradients */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(59,130,246,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(14,165,233,0.06),transparent_50%)]" />
      </div>

      <div className="relative z-10 flex">
        {/* Desktop sidebar */}
        <div className="hidden md:block flex-shrink-0">
          <AdminSidebar collapsed={collapsed} onClose={() => { }} />
        </div>

        {/* Mobile sidebar */}
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-neutral-900 z-50 shadow-2xl">
              <AdminSidebar collapsed={false} onClose={() => setMobileOpen(false)} />
            </div>
          </>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <AdminTopbar
            onToggleSidebar={() => setCollapsed((v) => !v)}
            onToggleMobile={() => setMobileOpen((v) => !v)}
          />
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}