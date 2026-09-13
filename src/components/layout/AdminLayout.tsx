import { ReactNode } from 'react';
import AdminSidebar from '../admin/AdminSidebar';
import '../admin/AdminLayout.css';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function AdminLayout({ children, title, subtitle, actions, onRefresh, isRefreshing }: AdminLayoutProps) {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <header className="admin-header">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <h1 style={{ margin: 0 }}>{title}</h1>
              {onRefresh && (
                <button 
                  className="btn btn-secondary btn-icon btn-sm" 
                  onClick={onRefresh} 
                  disabled={isRefreshing}
                  title="Actualizar datos"
                  style={{ width: 28, height: 28, padding: 0 }}
                >
                  <svg 
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    className={isRefreshing ? 'spin-animation' : ''}
                  >
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                </button>
              )}
            </div>
            {subtitle && <p style={{ margin: '4px 0 0 0' }}>{subtitle}</p>}
          </div>
          {actions && <div className="admin-header__actions">{actions}</div>}
        </header>
        {children}
      </main>
    </div>
  );
}
