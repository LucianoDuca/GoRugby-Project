import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import { tournaments, matches } from '../data/mockData';

type Filter = 'all' | 'active' | 'upcoming' | 'finished';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',      label: 'Todos' },
  { id: 'active',   label: 'Activos' },
  { id: 'upcoming', label: 'Próximos' },
  { id: 'finished', label: 'Finalizados' },
];

const STATUS_LABEL: Record<string, string> = {
  active:   'Activo',
  upcoming: 'Próximo',
  finished: 'Finalizado',
};
const STATUS_TAG: Record<string, string> = {
  active:   'tag-green',
  upcoming: 'tag-blue',
  finished: 'tag-gray',
};

export default function Tournaments() {
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = filter === 'all' ? tournaments : tournaments.filter(t => t.status === filter);

  return (
    <div>
      <div className="filter-tabs">
        {FILTERS.map(f => (
          <button key={f.id} className={`filter-tab${filter === f.id ? ' active' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="tournaments-list">
        {filtered.map(t => {
          const tournamentMatches = matches.filter(m => m.tournament === t.name);
          return (
            <div key={t.id} className="tournament-card">
              <div className="tournament-icon">
                <Trophy size={22} color="white" />
              </div>
              <div className="tournament-info">
                <div className="tournament-name">{t.name}</div>
                <div className="tournament-meta">{t.category} · Inicio: {t.startDate}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span className={`tag ${STATUS_TAG[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                <span className="tournament-teams">{t.teams} equipos</span>
                {tournamentMatches.length > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{tournamentMatches.length} partidos</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
