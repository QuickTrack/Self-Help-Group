'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '../../stores/useStore';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { fetchGroupSettings } from '@/lib/store/groupSlice';
import { PermissionGuard } from '@/components/PermissionGuard';
import { 
  Leaf, 
  LayoutDashboard, 
  Users, 
  Wallet, 
  Banknote, 
  PiggyBank, 
  FileText, 
  Calendar, 
  Settings, 
  LogOut,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  Heart
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { href: '/dashboard/members', label: 'Members', icon: Users, permission: 'members.view' },
  { href: '/dashboard/contributions', label: 'Contributions', icon: Wallet, permission: 'contributions.view' },
  { href: '/dashboard/loans', label: 'Loans', icon: Banknote, permission: 'loans.view' },
  { href: '/dashboard/savings', label: 'Savings & Shares', icon: PiggyBank, permission: 'savings.view' },
  { href: '/dashboard/welfare', label: 'Welfare Fund', icon: Heart, permission: 'welfare.view' },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText, permission: 'reports.view' },
  { href: '/dashboard/meetings', label: 'Meetings', icon: Calendar, permission: 'meetings.view' },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, permission: 'settings.view' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useStore();
  const dispatch = useAppDispatch();
  const { settings: groupSettings } = useAppSelector(state => state.group);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchGroupSettings());
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const groupName = groupSettings?.groupName || 'Self Help Group';
  const shortName = groupName.split(' ').slice(0, 2).join(' ');

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    logout();
    router.push('/');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: '#F8FAF8' }}>
      <aside className="sidebar-hover-sidebar">
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#228B22',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Leaf size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1A1A1A' }}>
                {shortName}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>
                Management System
              </div>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', overflow: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <PermissionGuard key={item.href} permission={item.permission as any} fallback={null}>
                <Link
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: isActive ? '#228B22' : '#4A4A4A',
                    background: isActive ? '#EBF5EB' : 'transparent',
                    borderRadius: '6px',
                    marginBottom: '4px',
                    textDecoration: 'none',
                    borderLeft: isActive ? '3px solid #228B22' : '3px solid transparent',
                  }}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              </PermissionGuard>
            );
          })}
        </nav>

        <div style={{
          padding: '16px 12px',
          borderTop: '1px solid #E5E7EB'
        }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#EF4444',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main style={{
        flex: 1,
        marginLeft: sidebarOpen ? '280px' : '0',
        minHeight: '100vh',
        transition: 'margin-left 150ms ease-out',
      }} className="main-content">
        <header style={{
          height: '64px',
          background: 'white',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="mobile-menu-btn"
          >
            <Menu size={24} />
          </button>

          <div style={{ fontSize: '0.875rem', color: '#6B6B6B' }}>
            Welcome back, <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{user?.role}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: '#228B22',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}>
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}