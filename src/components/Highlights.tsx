import { useState, useEffect, useCallback } from 'react';
import { Play, RefreshCw, ExternalLink, Trophy, Calendar, WifiOff } from 'lucide-react';
import { NormalisedMatch } from '../services/rugbyApi';
import { highlightlyApi } from '../services/highlightlyApi';
import MatchModal from './MatchModal';

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${parseInt(d, 10)} ${months[parseInt(mo, 10) - 1]} ${y}`;
}

// ── Highlight card ────────────────────────────────────────────────────────────

function HighlightCard({ match: m, onOpen }: { match: NormalisedMatch; onOpen: (m: NormalisedMatch) => void }) {
  const score = m.homeScore !== undefined && m.awayScore !== undefined
    ? `${m.homeScore} – ${m.awayScore}`
    : null;

  return (
    <div
      className="card"
      style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .2s, transform .2s' }}
      onClick={() => onOpen(m)}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '';
        (e.currentTarget as HTMLDivElement).style.transform = '';
      }}
    >
      {/* Thumbnail / Play area */}
      <div style={{
        position: 'relative',
        aspectRatio: '16/9',
        background: 'linear-gradient(135deg, var(--surface-3) 0%, var(--surface-2) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {m.tournamentLogo && (
          <img
            src={m.tournamentLogo}
            alt=""
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', opacity: 0.08, filter: 'blur(2px)',
            }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}

        {/* Team logos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
          {m.homeLogo ? (
            <img src={m.homeLogo} alt={m.home}
              style={{ width: 44, height: 44, objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
              {m.home.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
          )}

          {score ? (
            <div style={{ textAlign: 'center', padding: '4px 12px', background: 'rgba(0,0,0,0.5)', borderRadius: 6, backdropFilter: 'blur(4px)' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: 1 }}>{score}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginTop: 2 }}>FT</div>
            </div>
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Play size={18} fill="white" color="white" />
            </div>
          )}

          {m.awayLogo ? (
            <img src={m.awayLogo} alt={m.away}
              style={{ width: 44, height: 44, objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text-2)' }}>
              {m.away.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
          )}
        </div>

        {/* Play overlay */}
        {m.highlightUrl && (
          <a
            href={m.highlightUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: 'absolute', bottom: 8, right: 8,
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 20,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
              color: '#fff', fontSize: 11, fontWeight: 600, textDecoration: 'none',
            }}
            onClick={e => e.stopPropagation()}
          >
            <Play size={10} fill="white" /> Ver highlight
            <ExternalLink size={9} />
          </a>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
          {m.tournamentLogo && (
            <img src={m.tournamentLogo} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {m.tournament}
          </span>
          {m.round && (
            <span style={{ fontSize: 10, color: 'var(--text-3)' }}>· {m.round}</span>
          )}
        </div>

        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
          {m.home} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>vs</span> {m.away}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-3)' }}>
          <Calendar size={10} />
          {formatDate(m.date)}
        </div>
      </div>
    </div>
  );
}

// ── Empty / error states ──────────────────────────────────────────────────────

function EmptyState({ error }: { error: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      {error ? (
        <>
          <WifiOff size={36} style={{ color: 'var(--text-3)', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
            Highlights no disponibles
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 380, margin: '0 auto' }}>
            Configurá tu <code style={{ fontSize: 12, padding: '1px 5px', background: 'var(--surface-2)', borderRadius: 3 }}>HIGHLIGHTLY_API_KEY</code> en{' '}
            <code style={{ fontSize: 12, padding: '1px 5px', background: 'var(--surface-2)', borderRadius: 3 }}>.env.local</code> para ver videos de partidos.
          </p>
        </>
      ) : (
        <>
          <Play size={36} style={{ color: 'var(--text-3)', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
            Sin highlights por ahora
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Los videos aparecen aquí cuando estén disponibles para partidos recientes.
          </p>
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Highlights() {
  const [matches,    setMatches]    = useState<NormalisedMatch[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);
  const [modalMatch, setModalMatch] = useState<NormalisedMatch | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      // Try last 7 days — pick whichever day had finished games with highlights
      const dates = Array.from({ length: 7 }, (_, i) => daysAgo(i));
      const results = await Promise.allSettled(
        dates.map(date => highlightlyApi.getFixtures({ date }))
      );
      const all = results
        .filter((r): r is PromiseFulfilledResult<NormalisedMatch[]> => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .filter(m => m.status === 'finished');

      // Deduplicate
      const seen = new Set<number>();
      const unique = all.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });

      // Sort: matches with highlight video first, then by date desc
      unique.sort((a, b) => {
        const aHas = !!a.highlightUrl;
        const bHas = !!b.highlightUrl;
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
        return b.date.localeCompare(a.date);
      });

      setMatches(unique);
      if (unique.length === 0) setError(false); // show empty (not error)
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Group by tournament
  const grouped = matches.reduce<Record<string, NormalisedMatch[]>>((acc, m) => {
    const key = m.tournament;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const withHighlights = matches.filter(m => m.highlightUrl).length;

  return (
    <div className="highlights-page">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Play size={18} color="var(--accent)" />
            <span style={{ fontSize: 18, fontWeight: 800 }}>Highlights</span>
            {withHighlights > 0 && (
              <span className="tag tag-green">{withHighlights} videos</span>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
            Videos de los últimos partidos de rugby
          </p>
        </div>
        <button
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12, padding: '4px 8px' }}
          onClick={load}
          disabled={loading}
        >
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Actualizar
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="card" style={{ padding: 0, overflow: 'hidden', opacity: 0.4 + i * 0.05 }}>
              <div style={{ aspectRatio: '16/9', background: 'var(--surface-2)' }} />
              <div style={{ padding: '12px 14px' }}>
                <div style={{ height: 10, background: 'var(--border)', borderRadius: 3, width: '60%', marginBottom: 8 }} />
                <div style={{ height: 14, background: 'var(--border)', borderRadius: 3, width: '80%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState error={error} />
      ) : (
        Object.entries(grouped).map(([tournament, ms]) => (
          <div key={tournament} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              {ms[0]?.tournamentLogo && (
                <img src={ms[0].tournamentLogo} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              <Trophy size={13} color="var(--accent)" />
              <span style={{ fontSize: 13, fontWeight: 700 }}>{tournament}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{ms.length} partido{ms.length !== 1 ? 's' : ''}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {ms.map(m => (
                <HighlightCard key={m.id} match={m} onOpen={setModalMatch} />
              ))}
            </div>
          </div>
        ))
      )}

      {modalMatch && (
        <MatchModal match={modalMatch} onClose={() => setModalMatch(null)} />
      )}
    </div>
  );
}
