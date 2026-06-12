import React, { useState } from 'react';
import { matches } from '../data/mockData';
import { MatchCard } from './Home';

type Filter = 'all' | 'live' | 'upcoming' | 'finished';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',      label: 'Todos' },
  { id: 'live',     label: '🔴 En vivo' },
  { id: 'upcoming', label: 'Próximos' },
  { id: 'finished', label: 'Finalizados' },
];

export default function Matches() {
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = filter === 'all' ? matches : matches.filter(m => m.status === filter);

  return (
    <div>
      <div className="filter-tabs">
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`filter-tab${filter === f.id ? ' active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏉</div>
          <p>No hay partidos en esta categoría</p>
        </div>
      ) : (
        <div className="match-list">
          {filtered.map(m => <MatchCard key={m.id} match={m} />)}
        </div>
      )}
    </div>
  );
}
