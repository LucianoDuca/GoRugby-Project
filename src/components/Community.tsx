import React, { useState, useEffect } from 'react';
import { Heart, Star } from 'lucide-react';
import { useAuth } from '../app/main';
import { matches, initialReviews, initialPolls } from '../data/mockData';
import type { Review, Poll } from '../data/mockData';

function loadReviews(): Review[] {
  try {
    const stored = localStorage.getItem('gorugby_reviews');
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  const seed = [...initialReviews];
  localStorage.setItem('gorugby_reviews', JSON.stringify(seed));
  return seed;
}

function saveReviews(r: Review[]) { localStorage.setItem('gorugby_reviews', JSON.stringify(r)); }

function loadPolls(): Poll[] {
  try {
    const stored = localStorage.getItem('gorugby_polls');
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  const seed = [...initialPolls];
  localStorage.setItem('gorugby_polls', JSON.stringify(seed));
  return seed;
}

function savePolls(p: Poll[]) { localStorage.setItem('gorugby_polls', JSON.stringify(p)); }

const completedMatches = matches.filter(m => m.status === 'finished' || m.status === 'live');

export default function Community() {
  const { user } = useAuth();
  const [reviews, setReviews]   = useState<Review[]>(loadReviews);
  const [polls, setPolls]       = useState<Poll[]>(loadPolls);
  const [tab, setTab]           = useState<'reviews' | 'polls'>('reviews');

  // Review form state
  const [selectedMatch, setSelectedMatch] = useState('');
  const [rating, setRating]               = useState(0);
  const [hoverRating, setHoverRating]     = useState(0);
  const [comment, setComment]             = useState('');
  const [formError, setFormError]         = useState('');

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) { setFormError('Seleccioná un partido'); return; }
    if (!rating)         { setFormError('Ponele una valoración al partido'); return; }
    if (comment.trim().length < 10) { setFormError('Escribí al menos 10 caracteres'); return; }

    const newReview: Review = {
      id: `r_${Date.now()}`,
      matchId: Number(selectedMatch),
      userId: user!.id,
      userName: user!.name,
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
    };
    const updated = [newReview, ...reviews];
    setReviews(updated);
    saveReviews(updated);
    setSelectedMatch('');
    setRating(0);
    setComment('');
    setFormError('');
  };

  const toggleLike = (reviewId: string) => {
    if (!user) return;
    const updated = reviews.map(r => {
      if (r.id !== reviewId) return r;
      const liked = r.likedBy.includes(user.id);
      return {
        ...r,
        likes: liked ? r.likes - 1 : r.likes + 1,
        likedBy: liked ? r.likedBy.filter(id => id !== user.id) : [...r.likedBy, user.id],
      };
    });
    setReviews(updated);
    saveReviews(updated);
  };

  const votePoll = (pollId: string, optionId: string) => {
    if (!user) return;
    const updated = polls.map(p => {
      if (p.id !== pollId) return p;
      if (p.voters.includes(user.id)) return p;
      return {
        ...p,
        voters: [...p.voters, user.id],
        options: p.options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o),
      };
    });
    setPolls(updated);
    savePolls(updated);
  };

  return (
    <div>
      <div className="filter-tabs" style={{ marginBottom: 22 }}>
        <button className={`filter-tab${tab === 'reviews' ? ' active' : ''}`} onClick={() => setTab('reviews')}>Reseñas</button>
        <button className={`filter-tab${tab === 'polls'   ? ' active' : ''}`} onClick={() => setTab('polls')}>Encuestas</button>
      </div>

      {tab === 'reviews' && (
        <div className="content-grid">
          <div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Reseñas de la comunidad</span>
                <span className="tag tag-gray">{reviews.length} reseñas</span>
              </div>
              {reviews.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">✍️</div><p>Sé el primero en dejar una reseña</p></div>
              ) : (
                <div className="match-list">
                  {reviews.map(r => {
                    const match = matches.find(m => m.id === r.matchId);
                    const liked = user ? r.likedBy.includes(user.id) : false;
                    return (
                      <div key={r.id} className="review-card">
                        <div className="review-header">
                          <div className="review-avatar">{r.userName.split(' ').map(w => w[0]).slice(0,2).join('')}</div>
                          <div className="review-meta">
                            <div className="review-name">{r.userName}</div>
                            <div className="review-date">{new Date(r.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          </div>
                          <StarDisplay rating={r.rating} />
                        </div>
                        <p className="review-text">{r.comment}</p>
                        <div className="review-footer">
                          <button className={`review-like${liked ? ' liked' : ''}`} onClick={() => toggleLike(r.id)}>
                            <Heart size={13} /> {r.likes}
                          </button>
                          {match && (
                            <span className="review-match-tag">{match.home} vs {match.away}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Escribir reseña</span>
              </div>
              <form onSubmit={submitReview}>
                <div className="form-group">
                  <label>Partido</label>
                  <select value={selectedMatch} onChange={e => setSelectedMatch(e.target.value)}>
                    <option value="">Seleccionar partido...</option>
                    {completedMatches.map(m => (
                      <option key={m.id} value={m.id}>{m.home} vs {m.away} · {m.date}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Valoración</label>
                  <div className="stars" style={{ padding: '4px 0' }}>
                    {[1,2,3,4,5].map(n => (
                      <Star
                        key={n}
                        size={28}
                        className={`star${(hoverRating || rating) >= n ? ' filled' : ' empty'}`}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(n)}
                        fill={(hoverRating || rating) >= n ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Comentario</label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="¿Qué te pareció el partido? Contá tu experiencia..."
                    rows={4}
                  />
                </div>
                {formError && <p className="form-error">{formError}</p>}
                <button type="submit" className="btn btn-primary full">Publicar reseña</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {tab === 'polls' && (
        <div className="content-grid-3">
          {polls.map(poll => {
            const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
            const hasVoted   = user ? poll.voters.includes(user.id) : false;
            return (
              <div key={poll.id} className="poll-card">
                <div className="poll-question">{poll.question}</div>
                <div className="poll-options">
                  {poll.options.map(opt => {
                    const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                    return (
                      <div
                        key={opt.id}
                        className={`poll-option${hasVoted ? ' voted' : ''}`}
                        onClick={() => !hasVoted && votePoll(poll.id, opt.id)}
                      >
                        <div className="poll-progress" style={{ width: hasVoted ? `${pct}%` : '0%' }} />
                        <div className="poll-option-inner">
                          <span className="poll-option-text">{opt.text}</span>
                          {hasVoted && <span className="poll-option-pct">{pct}%</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="poll-footer">
                  {hasVoted ? `${totalVotes.toLocaleString('es-AR')} votos · Vence: ${poll.expiresAt}` : `Votá · Vence: ${poll.expiresAt}`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={14} className={`star${rating >= n ? ' filled' : ' empty'}`} fill={rating >= n ? 'currentColor' : 'none'} style={{ cursor: 'default' }} />
      ))}
    </div>
  );
}
