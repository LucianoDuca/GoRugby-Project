import React from 'react';
import { Home, CalendarDays, MessageCircle, Trophy, Shield, UserRound, Settings, Lock, LogOut, TrendingUp, Play } from 'lucide-react';
import { useAuth, useLive, Section } from '../app/main';
import { loadPredictions, getPredictionStats } from '../utils/predictions';

interface Props {
  section: Section;
  setSection: (s: Section) => void;
}

const NAV_MAIN: { id: Section; label: string; Icon: React.ElementType }[] = [
  { id: 'home',        label: 'Inicio',    Icon: Home },
  { id: 'matches',     label: 'Partidos',  Icon: CalendarDays },
  { id: 'community',   label: 'Comunidad', Icon: MessageCircle },
  { id: 'tournaments', label: 'Torneos',   Icon: Trophy },
  { id: 'clubs',       label: 'Clubes',    Icon: Shield },
  { id: 'highlights',  label: 'Highlights', Icon: Play },
];

const NAV_USER: { id: Section; label: string; Icon: React.ElementType }[] = [
  { id: 'profile',  label: 'Mi Perfil', Icon: UserRound },
  { id: 'settings', label: 'Ajustes',   Icon: Settings },
];

export default function Sidebar({ section, setSection }: Props) {
  const { user, logout } = useAuth();
  const { liveCount }    = useLive();

  const preds   = loadPredictions();
  const pstats  = getPredictionStats(preds);
  const pending = pstats.pending;

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
        {NAV_MAIN.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-btn${section === id ? ' active' : ''}`}
            onClick={() => setSection(id)}
          >
            <Icon size={16} />
            {label}
            {id === 'matches' && liveCount > 0 && (
              <span className="nav-badge-live">{liveCount}</span>
            )}
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
            {id === 'profile' && pending > 0 && (
              <span className="nav-badge">{pending}</span>
            )}
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

      {pstats.total > 0 && (
        <div className="sidebar-pred-mini">
          <TrendingUp size={12} />
          <span>{pstats.accuracy}% precisión</span>
          <span className="sidebar-pred-streak">
            {pstats.streak > 1 ? `${pstats.streak} seguidas` : `${pstats.correct}/${pstats.resolved}`}
          </span>
        </div>
      )}

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
