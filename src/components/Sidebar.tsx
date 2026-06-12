import React from 'react';
import { Home, CalendarDays, MessageCircle, Trophy, Shield, UserRound, Settings, Lock, LogOut } from 'lucide-react';
import { useAuth, Section } from '../app/main';

interface Props {
  section: Section;
  setSection: (s: Section) => void;
}

const NAV_MAIN: { id: Section; label: string; Icon: React.ElementType; badge?: number }[] = [
  { id: 'home',        label: 'Inicio',    Icon: Home },
  { id: 'matches',     label: 'Partidos',  Icon: CalendarDays, badge: 1 },
  { id: 'community',   label: 'Comunidad', Icon: MessageCircle },
  { id: 'tournaments', label: 'Torneos',   Icon: Trophy },
  { id: 'clubs',       label: 'Clubes',    Icon: Shield },
];

const NAV_USER: { id: Section; label: string; Icon: React.ElementType }[] = [
  { id: 'profile',  label: 'Mi Perfil', Icon: UserRound },
  { id: 'settings', label: 'Ajustes',   Icon: Settings },
];

export default function Sidebar({ section, setSection }: Props) {
  const { user, logout } = useAuth();

  const initials = user?.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') ?? '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">GR</div>
        <div className="sidebar-brand-text">
          <strong>Go Rugby</strong>
          <span>Community App</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Principal</div>
        {NAV_MAIN.map(({ id, label, Icon, badge }) => (
          <button
            key={id}
            className={`nav-btn${section === id ? ' active' : ''}`}
            onClick={() => setSection(id)}
          >
            <Icon size={16} />
            {label}
            {badge ? <span className="nav-badge">{badge}</span> : null}
          </button>
        ))}

        <div className="sidebar-section-label" style={{ marginTop: 8 }}>Mi cuenta</div>
        {NAV_USER.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-btn${section === id ? ' active' : ''}`}
            onClick={() => setSection(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="sidebar-section-label" style={{ marginTop: 8 }}>Administración</div>
            <button
              className={`nav-btn${section === 'admin' ? ' active' : ''}`}
              onClick={() => setSection('admin')}
            >
              <Lock size={16} />
              Panel Admin
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name}</div>
          <div className="sidebar-user-role">
            {user?.role === 'admin' ? 'Administrador' : 'Aficionado'}
          </div>
        </div>
        <button className="sidebar-logout" onClick={logout} title="Cerrar sesión">
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}
