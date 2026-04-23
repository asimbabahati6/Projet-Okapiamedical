import { Outlet } from 'react-router-dom';
import { RBACNavigation } from './RBACNavigation';

export function StaffLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <RBACNavigation />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
