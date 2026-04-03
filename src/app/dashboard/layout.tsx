'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '../../stores/useStore';
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
  TrendingDown
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/members', label: 'Members', icon: Users },
  { href: '/dashboard/contributions', label: 'Contributions', icon: Wallet },
  { href: '/dashboard/loans', label: 'Loans', icon: Banknote },
  { href: '/dashboard/savings', label: 'Savings & Shares', icon: PiggyBank },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
  { href: '/dashboard/meetings', label: 'Meetings', icon: Calendar },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAF8' }}>
      <aside style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: '280px',
        background: 'white',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : undefined,
        transition: 'transform 150ms ease-out',
      }} className="sidebar">
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
                Githirioni SHG
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>
                Management System
              </div>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
            className="lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', overflow: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
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
          className="lg:hidden"
        />
      )}

      <main style={{
        flex: 1,
        marginLeft: '280px',
        minHeight: '100vh',
      }}>
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
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px'
            }}
            className="lg:hidden"
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

      <style jsx>{`
        @media (max-width: 1023px) {
          aside {
            transform: translateX(-100%) !important;
          }
          aside.sidebar {
            transform: none !important;
          }
          main {
            margin-left: 0 !important;
          }
          header button.lg\\:hidden {
            display: block !important;
          }
        }
        @media (min-width: 1024px) {
          header button.lg\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}