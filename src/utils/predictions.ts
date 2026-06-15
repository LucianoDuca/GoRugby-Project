const STORAGE_KEY = 'gorugby_predictions';

export interface Prediction {
  id: string;
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  tournament: string;
  matchDate: string;
  pick: 'home' | 'away';
  createdAt: string;
  resolved: boolean;
  homeScore?: number;
  awayScore?: number;
  correct?: boolean;
}

export function loadPredictions(): Prediction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Prediction[];
  } catch { /* ignore */ }
  return [];
}

export function savePredictions(p: Prediction[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function addPrediction(
  matchId: number,
  homeTeam: string,
  awayTeam: string,
  tournament: string,
  matchDate: string,
  pick: 'home' | 'away',
): Prediction {
  const pred: Prediction = {
    id: `pred_${matchId}_${Date.now()}`,
    matchId,
    homeTeam,
    awayTeam,
    tournament,
    matchDate,
    pick,
    createdAt: new Date().toISOString(),
    resolved: false,
  };
  const all = loadPredictions();
  savePredictions([...all, pred]);
  return pred;
}

export function resolvePrediction(
  pred: Prediction,
  homeScore: number,
  awayScore: number,
): Prediction {
  const homeWon = homeScore > awayScore;
  const correct = pred.pick === 'home' ? homeWon : !homeWon;
  return {
    ...pred,
    resolved: true,
    homeScore,
    awayScore,
    correct,
  };
}

export function getPredictionStats(predictions: Prediction[]): {
  total: number;
  resolved: number;
  correct: number;
  accuracy: number;
  pending: number;
  streak: number;
} {
  const resolved  = predictions.filter(p => p.resolved);
  const correct   = resolved.filter(p => p.correct === true).length;
  const pending   = predictions.filter(p => !p.resolved).length;
  const accuracy  = resolved.length > 0 ? Math.round((correct / resolved.length) * 100) : 0;

  const sorted = [...resolved].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  let streak = 0;
  for (const p of sorted) {
    if (p.correct === true) streak++;
    else break;
  }

  return { total: predictions.length, resolved: resolved.length, correct, accuracy, pending, streak };
}
