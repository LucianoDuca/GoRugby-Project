import React, { useEffect, useCallback, useState } from 'react';
import { X, TrendingUp, CheckCircle, XCircle, Clock, Trophy, MapPin } from 'lucide-react';
import { NormalisedMatch } from '../services/rugbyApi';
import { useAuth } from '../app/main';
import {
  Prediction,
  loadPredictions,
  savePredictions,
  addPrediction,
  resolvePrediction,
} from '../utils/predictions';

interface Props {
  match: NormalisedMatch;
  onClose: () => void;
}

function fallbackLogo(e: React.SyntheticEvent<HTMLImageElement>) {
  (e.currentTarget as HTMLImageElement).src =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56"%3E%3Ccircle cx="28" cy="28" r="28" fill="%23e4e4e7"/%3E%3Cellipse cx="28" cy="28" rx="12" ry="18" fill="none" stroke="%2371717a" stroke-width="2"/%3E%3Cline x1="16" y1="28" x2="40" y2="28" stroke="%2371717a" stroke-width="2"/%3E%3C/svg%3E';
}

function formatMatchTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 || 12;
  return `${display}:${m} ${suffix}`;
}

function formatMatchDate(date: string): string {
  if (!date) return '';
  const [y, mo, d] = date.split('-');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${parseInt(d, 10)} ${months[parseInt(mo, 10) - 1]} ${y}`;
}

export default function MatchModal({ match, onClose }: Props) {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>(() => loadPredictions());

  const existing = predictions.find(p => p.matchId === match.id);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handlePick = useCallback(
    (pick: 'home' | 'away') => {
      if (existing) return;
      const pred = addPrediction(
        match.id,
        match.home,
        match.away,
        match.tournament,
        match.date,
        pick,
      );
      let finalPred = pred;
      if (
        match.status === 'finished' &&
        match.homeScore !== undefined &&
        match.awayScore !== undefined
      ) {
        finalPred = resolvePrediction(pred, match.homeScore, match.awayScore);
        const all = loadPredictions();
        savePredictions(all.map(p => (p.id === finalPred.id ? finalPred : p)));
      }
      setPredictions(loadPredictions());
    },
    [existing, match],
  );

  const homeWon =
    match.status === 'finished' &&
    match.homeScore !== undefined &&
    match.awayScore !== undefined &&
    match.homeScore > match.awayScore;

  const awayWon =
    match.status === 'finished' &&
    match.homeScore !== undefined &&
    match.awayScore !== undefined &&
    match.awayScore > match.homeScore;

  const periods = (match as NormalisedMatch & {
    periods?: {
      first?: { home: number | null; away: number | null };
      second?: { home: number | null; away: number | null };
    };
  }).periods;

  const showPeriods =
    match.status === 'finished' &&
    match.homeScore !== undefined &&
    match.awayScore !== undefined &&
    periods != null &&
    (periods.first != null || periods.second != null);

  const pickedTeamName =
    existing?.pick === 'home' ? match.home : match.away;

  let predictionLabel: React.ReactNode = null;
  if (existing) {
    if (!existing.resolved || match.status !== 'finished') {
      predictionLabel = (
        <div className="modal-prediction-result">
          <Clock size={16} />
          <span>
            Tu predicción: <strong>{pickedTeamName}</strong> — Pendiente
          </span>
        </div>
      );
    } else if (existing.correct === true) {
      predictionLabel = (
        <div className="modal-prediction-result modal-prediction-correct">
          <CheckCircle size={16} />
          <span>
            Tu predicción: <strong>{pickedTeamName}</strong> — Correcto ✓
          </span>
        </div>
      );
    } else {
      predictionLabel = (
        <div className="modal-prediction-result modal-prediction-wrong">
          <XCircle size={16} />
          <span>
            Tu predicción: <strong>{pickedTeamName}</strong> — Incorrecto ✗
          </span>
        </div>
      );
    }
  }

  const showPredictionSection = user && (match.status === 'upcoming' || match.status === 'live' || existing);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-card" role="dialog" aria-modal="true">

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            {match.tournamentLogo && (
              <img
                src={match.tournamentLogo}
                alt={match.tournament}
                className="modal-tournament-logo"
                onError={fallbackLogo}
              />
            )}
            <div className="modal-header-info">
              <span className="modal-tournament-name">{match.tournament}</span>
              {match.round && (
                <span className="modal-round">{match.round}</span>
              )}
              <span className="modal-date-label">{formatMatchDate(match.date)}</span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Score section */}
        <div className="modal-score-section">
          {/* Home team */}
          <div className="modal-team">
            <img
              src={match.homeLogo}
              alt={match.home}
              className="modal-team-logo"
              onError={fallbackLogo}
            />
            <span className="modal-team-name">{match.home}</span>
            <span className={`modal-score-num${homeWon ? ' winner' : ''}`}>
              {match.homeScore !== undefined ? match.homeScore : '–'}
            </span>
          </div>

          {/* Centre status */}
          <div className="modal-vs">
            {match.status === 'live' ? (
              <div className="modal-live-badge">
                <span className="modal-live-dot" />
                <span>EN VIVO</span>
                {match.minute && <span className="modal-live-minute">{match.minute}</span>}
              </div>
            ) : match.status === 'finished' ? (
              <div className="modal-ft-badge">
                <Trophy size={14} />
                <span>FT</span>
              </div>
            ) : (
              <div className="modal-time-badge">
                <Clock size={14} />
                <span>{formatMatchTime(match.time)}</span>
              </div>
            )}
          </div>

          {/* Away team */}
          <div className="modal-team">
            <img
              src={match.awayLogo}
              alt={match.away}
              className="modal-team-logo"
              onError={fallbackLogo}
            />
            <span className="modal-team-name">{match.away}</span>
            <span className={`modal-score-num${awayWon ? ' winner' : ''}`}>
              {match.awayScore !== undefined ? match.awayScore : '–'}
            </span>
          </div>
        </div>

        {/* Period scores */}
        {showPeriods && (
          <div className="modal-periods">
            {periods?.first != null &&
              periods.first.home !== null &&
              periods.first.away !== null && (
                <span>1° Tiempo: {periods.first.home} – {periods.first.away}</span>
              )}
            {periods?.second != null &&
              periods.second.home !== null &&
              periods.second.away !== null && (
                <span>2° Tiempo: {periods.second.home} – {periods.second.away}</span>
              )}
          </div>
        )}

        {/* Predictions section */}
        {showPredictionSection && (
          <div className="modal-prediction-section">
            <div className="modal-section-title">
              <TrendingUp size={13} />
              Predicción
            </div>

            {!existing && match.status === 'upcoming' ? (
              <div className="modal-pick-btns">
                <button
                  className="modal-pick-btn home"
                  onClick={() => handlePick('home')}
                >
                  Gana {match.home}
                </button>
                <button
                  className="modal-pick-btn away"
                  onClick={() => handlePick('away')}
                >
                  Gana {match.away}
                </button>
              </div>
            ) : (
              predictionLabel
            )}
          </div>
        )}

        {/* Footer */}
        <div className="modal-footer">
          <MapPin size={12} />
          <span>{match.country}</span>
          <span className="modal-footer-sep">·</span>
          <span>Temporada {match.season}</span>
        </div>
      </div>
    </div>
  );
}
