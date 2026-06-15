import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, X } from 'lucide-react';
import { Section, useLive } from '../app/main';
import { notifications, matches, clubs, tournaments } from '../data/mockData';

const TITLES: Record<Section, string> = {
  home:        'Inicio',
  matches:     'Partidos',
  community:   'Comunidad',
  tournaments: 'Torneos',
  clubs:       'Clubes',
  profile:     'Mi Perfil',
  admin:       'Panel Administrativo',
  settings:    'Ajustes',
};

interface Props {
  section:    Section;
  setSection: (s: Section) => void;
}

export default function TopBar({ section, setSection }: Props) {
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [query,      setQuery]      = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const { liveMatches } = useLive();

  const notifRef  = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current  && !notifRef.current.contains(e.target as Node))  setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) { setSearchOpen(false); setQuery(''); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const q = query.toLowerCase().trim();
  const matchResults = q ? matches.filter(m => m.home.toLowerCase().includes(q) || m.away.toLowerCase().includes(q) || m.tournament.toLowerCase().includes(q)) : [];
  const clubResults  = q ? clubs.filter(c => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)) : [];
  const tournResults = q ? tournaments.filter(t => t.name.toLowerCase().includes(q)) : [];
  const hasResults   = matchResults.length > 0 || clubResults.length > 0 || tournResults.length > 0;

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setSearchOpen(false); setQuery(''); }
  };

  return (
    <div className="topbar-wrapper">
      <header className="topbar">
        <span className="topbar-title">{TITLES[section]}</span>

        <div className="topbar-right">
          {/* Search */}
          <div ref={searchRef} style={{ position: 'relative' }}>
            <div className="topbar-search">
              <Search size={13} color="var(--text-3)" />
              <input
                placeholder="Buscar partidos, clubes..."
                value={query}
                onChange={e => { setQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={handleSearchKey}
              />
              {query && (
                <button className="btn-icon" style={{ width: 20, height: 20 }} onClick={() => { setQuery(''); setSearchOpen(false); }}>
                  <X size={12} />
                </button>
              )}
            </div>

            {searchOpen && q.length > 1 && (
              <div className="search-results" style={{ left: 0, right: 'auto' }}>
                {!hasResults ? (
                  <div style={{ padding: '14px', fontSize: 13, color: 'var(--text-3)' }}>Sin resultados para "{query}"</div>
                ) : (
                  <>
                    {matchResults.length > 0 && (
                      <>
                        <div className="search-result-group-title">Partidos</div>
                        {matchResults.slice(0, 3).map(m => (
                          <div key={m.id} className="search-result-item" onClick={() => { setSection('matches'); setSearchOpen(false); setQuery(''); }}>
                            <div className="search-result-name">{m.home} vs {m.away}</div>
                            <div className="search-result-sub">{m.tournament} · {m.date}</div>
                          </div>
                        ))}
                      </>
                    )}
                    {clubResults.length > 0 && (
                      <>
                        <div className="search-result-group-title">Clubes</div>
                        {clubResults.slice(0, 3).map(c => (
                          <div key={c.id} className="search-result-item" onClick={() => { setSection('clubs'); setSearchOpen(false); setQuery(''); }}>
                            <div className="search-result-name">{c.name}</div>
                            <div className="search-result-sub">{c.city} · {c.followers.toLocaleString('es-AR')} seguidores</div>
                          </div>
                        ))}
                      </>
                    )}
                    {tournResults.length > 0 && (
                      <>
                        <div className="search-result-group-title">Torneos</div>
                        {tournResults.slice(0, 2).map(t => (
                          <div key={t.id} className="search-result-item" onClick={() => { setSection('tournaments'); setSearchOpen(false); setQuery(''); }}>
                            <div className="search-result-name">{t.name}</div>
                            <div className="search-result-sub">{t.category} · {t.teams} equipos</div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button className="topbar-icon-btn" onClick={() => setNotifOpen(v => !v)} title="Notificaciones">
              <Bell size={17} />
              {unread > 0 && <span className="notif-dot" />}
            </button>

            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">
                  <span className="notif-dropdown-title">Notificaciones</span>
                  {unread > 0 && <span className="tag tag-red">{unread} nuevas</span>}
                </div>
                {notifications.map(n => (
                  <div key={n.id} className="notif-item">
                    {!n.read && <div className="notif-dot-indicator" style={{ flexShrink: 0, marginTop: 5 }} />}
                    <div style={{ paddingLeft: n.read ? 16 : 0 }}>
                      <div className="notif-text">{n.text}</div>
                      <div className="notif-time">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Live ticker — only shows when there are live games */}
      {liveMatches.length > 0 && (
        <div className="live-ticker">
          <span className="ticker-label">LIVE</span>
          <div className="ticker-track">
            <div className="ticker-content">
              {[...liveMatches, ...liveMatches].map((m, i) => (
                <span key={i} className="ticker-item">
                  {m.home} <strong>{m.homeScore ?? 0}–{m.awayScore ?? 0}</strong> {m.away}
                  <span className="ticker-sep">·</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
