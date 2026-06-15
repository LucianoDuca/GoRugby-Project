import React, { useEffect, useState } from 'react';
import { Activity, CalendarDays, Trophy, Users, ArrowRight } from 'lucide-react';
import { clubs, tournaments, notifications, Match } from '../data/mockData';
import { matches as mockMatches } from '../data/mockData';
import { Section } from '../app/main';
import { ClubBadge } from './ClubLogo';
import { useAuth } from '../app/main';
import { NormalisedMatch } from '../services/rugbyApi';
import { espnApi, ESPN_LEAGUES } from '../services/espnApi';

interface Props { setSection: (s: Section) => void; }

// Minimal type satisfied by both Match (mockData) and NormalisedMatch (API)
type MatchLike = {
  id: number;
  home: string;
  homeId: string;
  homeLogo?: string;
  away: string;
  awayId: string;
  awayLogo?: string;
  homeScore?: number;
  awayScore?: number;
  status: 'live' | 'upcoming' | 'finished';
  minute?: string;
  date: string;
  time: string;
  tournament: string;
  venue?: string;
};

export function MatchCard({ match: m }: { match: MatchLike }) {
  const homeInit = m.home.split(' ').map(w => w[0]).slice(0, 2).join('');
  const awayInit = m.away.split(' ').map(w => w[0]).slice(0, 2).join('');

  return (
    <div className="match-card">
      <div className="match-card-header">
        <span className="match-tournament-label">{m.tournament}</span>
        <span className={`status-badge ${m.status}`}>
          {m.status === 'live' ? 'En vivo' : m.status === 'finished' ? 'Finalizado' : 'Próximo'}
        </span>
      </div>
      <div className="match-teams">
        <div className="match-team">
          {m.homeLogo
            ? <img src={m.homeLogo} alt={m.home} style={{ width: 44, height: 44, objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <ClubBadge clubId={m.homeId} initials={homeInit} size={44} />
          }
          <div className="match-team-name">{m.home}</div>
        </div>
        <div className="match-score-block">
          {m.status === 'upcoming' ? (
            <div style={{ textAlign: 'center' }}>
              <div className="match-upcoming-time">{m.time}</div>
              <div className="match-upcoming-date">{m.date}</div>
            </div>
          ) : (
            <>
              <div className="match-score-nums">
                <span>{m.homeScore ?? '-'}</span>
                <span className="match-score-sep"> – </span>
                <span>{m.awayScore ?? '-'}</span>
              </div>
              {m.status === 'live' && <span className="match-score-time">{m.minute}</span>}
            </>
          )}
        </div>
        <div className="match-team">
          {m.awayLogo
            ? <img src={m.awayLogo} alt={m.away} style={{ width: 44, height: 44, objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <ClubBadge clubId={m.awayId} initials={awayInit} size={44} />
          }
          <div className="match-team-name">{m.away}</div>
        </div>
      </div>
      {m.venue && <div className="match-venue">{m.venue}</div>}
    </div>
  );
}

export default function Home({ setSection }: Props) {
  const { user } = useAuth();

  const [apiMatches,  setApiMatches]  = useState<NormalisedMatch[]>([]);
  const [apiLoading,  setApiLoading]  = useState(true);

  useEffect(() => {
    Promise.allSettled([
      espnApi.getTodayGames(),
      espnApi.getLeagueGames(ESPN_LEAGUES.SIX_NATIONS,         undefined, undefined),
      espnApi.getLeagueGames(ESPN_LEAGUES.RUGBY_CHAMPIONSHIP,  undefined, undefined),
      espnApi.getUpcomingGames(3),
    ]).then(results => {
      const all = results
        .filter((r): r is PromiseFulfilledResult<NormalisedMatch[]> => r.status === 'fulfilled')
        .flatMap(r => r.value);

      const seen = new Set<number>();
      const unique = all
        .filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; })
        .sort((a, b) => {
          if (a.status === 'live'     && b.status !== 'live')     return -1;
          if (b.status === 'live'     && a.status !== 'live')     return 1;
          if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
          return a.date.localeCompare(b.date);
        });

      setApiMatches(unique);
      setApiLoading(false);
    });
  }, []);

  // Prefer API data for counts; fall back to mock
  const liveCount     = apiMatches.length > 0
    ? apiMatches.filter(m => m.status === 'live').length
    : mockMatches.filter(m => m.status === 'live').length;

  const upcomingCount = apiMatches.length > 0
    ? apiMatches.filter(m => m.status === 'upcoming').length
    : mockMatches.filter(m => m.status === 'upcoming').length;

  const activeCount   = tournaments.filter(t => t.status === 'active').length;
  const totalAffil    = clubs.reduce((s, c) => s + c.affiliates, 0);

  // Followed club matches stay on mock data (local clubs)
  const followedMatches: Match[] = user?.followedClubs.length
    ? mockMatches.filter(m => user.followedClubs.includes(m.homeId) || user.followedClubs.includes(m.awayId))
    : [];

  // Main matches: API when available, mock as fallback
  const displayMatches: MatchLike[] = apiMatches.length > 0
    ? apiMatches.slice(0, 5)
    : (mockMatches.slice(0, 4) as MatchLike[]);

  const nextUpcoming = apiMatches.find(m => m.status === 'upcoming')
    ?? mockMatches.find(m => m.status === 'upcoming');

  return (
    <div>
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, #050d1a 0%, #081c12 55%, #0c3320 100%)',
        borderRadius: 12, padding: '20px 24px', marginBottom: 20, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', top: -90, right: -40 }} />
        <div style={{ zIndex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
            Bienvenido, {user?.name.split(' ')[0]}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
            {liveCount > 0
              ? `${liveCount} partido${liveCount > 1 ? 's' : ''} en vivo ahora mismo`
              : 'Próximo: ' + (nextUpcoming?.date ?? 'próximamente')}
          </div>
        </div>
        {liveCount > 0 && (
          <button className="btn btn-primary btn-sm" style={{ zIndex: 1 }} onClick={() => setSection('matches')}>
            Ver en vivo <ArrowRight size={13} />
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card c-red">
          <div className="stat-card-icon"><Activity size={18} /></div>
          <div className="stat-label">En vivo</div>
          <div className="stat-value">{liveCount}</div>
          <div className="stat-change up">Ahora mismo</div>
        </div>
        <div className="stat-card c-blue">
          <div className="stat-card-icon"><CalendarDays size={18} /></div>
          <div className="stat-label">Próximos</div>
          <div className="stat-value">{upcomingCount}</div>
          <div className="stat-change">Esta semana</div>
        </div>
        <div className="stat-card c-gold">
          <div className="stat-card-icon"><Trophy size={18} /></div>
          <div className="stat-label">Torneos</div>
          <div className="stat-value">{activeCount}</div>
          <div className="stat-change up">En curso</div>
        </div>
        <div className="stat-card c-green">
          <div className="stat-card-icon"><Users size={18} /></div>
          <div className="stat-label">Afiliados</div>
          <div className="stat-value">{(totalAffil / 1000).toFixed(1)}k</div>
          <div className="stat-change up">↑ 3% este mes</div>
        </div>
      </div>

      <div className="content-grid">
        <div>
          {/* Followed club matches (local mock data) */}
          {followedMatches.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <span className="card-title"><Trophy size={15} /> Mis equipos</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setSection('matches')}>Ver todos →</button>
              </div>
              <div className="match-list">
                {followedMatches.slice(0, 2).map(m => <MatchCard key={m.id} match={m as MatchLike} />)}
              </div>
            </div>
          )}

          {/* Recent / live — API data */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                {apiMatches.length > 0 ? 'Partidos internacionales' : 'Partidos recientes y en vivo'}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setSection('matches')}>Ver todos →</button>
            </div>
            {apiLoading && apiMatches.length === 0 ? (
              <div style={{ padding: '12px 0' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ padding: '10px 16px', opacity: 0.4 }}>
                    <div style={{ height: 11, background: 'var(--border)', borderRadius: 3, width: '40%', marginBottom: 8 }} />
                    <div style={{ height: 16, background: 'var(--border)', borderRadius: 3, width: '70%' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="match-list">
                {displayMatches.map(m => <MatchCard key={m.id} match={m} />)}
              </div>
            )}
          </div>

          {/* Club ranking */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <span className="card-title"><Trophy size={15} /> Ranking de clubes</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setSection('clubs')}>Ver clubes →</button>
            </div>
            <table className="data-table">
              <thead><tr><th>#</th><th>Club</th><th>Ciudad</th><th>Seguidores</th></tr></thead>
              <tbody>
                {[...clubs].sort((a, b) => b.followers - a.followers).map((c, i) => (
                  <tr key={c.id}>
                    <td><strong style={{ color: i < 3 ? 'var(--gold)' : 'var(--text-2)' }}>#{i + 1}</strong></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ClubBadge clubId={c.id} initials={c.logo} size={26} />
                        <strong>{c.name}</strong>
                      </div>
                    </td>
                    <td>{c.city}</td>
                    <td>{c.followers.toLocaleString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          {/* Notifications */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Actividad reciente</span>
              <span className="tag tag-red">{notifications.filter(n => !n.read).length} nuevas</span>
            </div>
            {notifications.map(n => (
              <div key={n.id} className="notif-item">
                {!n.read && <div className="notif-dot-indicator" />}
                <div style={{ paddingLeft: n.read ? 16 : 0 }}>
                  <div className="notif-text">{n.text}</div>
                  <div className="notif-time">{n.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tournaments */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <span className="card-title">Torneos</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setSection('tournaments')}>Ver todos →</button>
            </div>
            {tournaments.filter(t => t.status !== 'finished').map(t => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 0', borderBottom: '1px solid var(--border-2)'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{t.category} · {t.teams} equipos</div>
                </div>
                <span className={`tag ${t.status === 'active' ? 'tag-green' : 'tag-blue'}`}>
                  {t.status === 'active' ? 'Activo' : 'Próximo'}
                </span>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header"><span className="card-title">Accesos rápidos</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {([
                ['Comunidad',   'community'],
                ['Clubes',      'clubs'],
                ['Predicciones','community'],
                ['Encuestas',   'community'],
              ] as [string, Section][]).map(([label, dest]) => (
                <button key={label} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => setSection(dest)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
