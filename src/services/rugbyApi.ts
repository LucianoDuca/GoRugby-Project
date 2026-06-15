// ─── api-sports.io Rugby API — frontend client ───────────────────────────────
// All calls go through /api/rugby (Vercel Edge proxy in prod, Vite proxy in dev)
// so the API key is never exposed to the browser.

const BASE = '/api/rugby';

// ── Raw API types (verified against actual v1.rugby.api-sports.io responses) ─

interface ApiResponse<T> {
  results: number;
  response: T[];
  errors?: Record<string, string> | unknown[];
}

export interface ApiGame {
  id: number;
  date: string;          // "2024-04-06T18:30:00+00:00"
  time: string;          // "18:30"
  timestamp: number;
  timezone: string;
  week: string | null;
  status: {
    long: string;
    short: 'NS' | '1H' | 'HT' | '2H' | 'ET' | 'BT' | 'P' | 'INT' | 'FT' | 'AOT' | 'AP' | 'AET' | 'AWD' | 'WO' | 'CANC' | 'PST' | string;
    timer?: number | null;
  };
  country: {
    id: number;
    name: string;
    code: string | null;
    flag: string | null;
  };
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
    season: number;
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  scores: { home: number | null; away: number | null };
  periods: {
    first:           { home: number | null; away: number | null };
    second:          { home: number | null; away: number | null };
    overtime:        { home: number | null; away: number | null };
    second_overtime: { home: number | null; away: number | null };
  };
}

export interface ApiLeague {
  id: number;
  name: string;
  type: string;
  logo: string;
  country: { name: string; code: string | null; flag: string | null };
  seasons: { season: number; current: boolean; start: string; end: string }[];
}

export interface ApiTeam {
  id: number;
  name: string;
  logo: string;
  country: { name: string; flag: string | null };
}

export interface ApiStanding {
  position: number;
  team: { id: number; name: string; logo: string };
  points: number;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  'points-for': number;
  'points-against': number;
}

// ── Normalised app types ──────────────────────────────────────────────────────

export type MatchStatus = 'live' | 'upcoming' | 'finished';

export interface NormalisedMatch {
  id: number;
  home: string;
  homeId: string;
  homeLogo: string;
  away: string;
  awayId: string;
  awayLogo: string;
  homeScore?: number;
  awayScore?: number;
  status: MatchStatus;
  minute?: string;
  date: string;
  time: string;
  tournament: string;
  tournamentId: number;
  tournamentLogo: string;
  country: string;
  season: string;
  round?: string;
  periods?: {
    first?:    { home: number | null; away: number | null };
    second?:   { home: number | null; away: number | null };
    overtime?: { home: number | null; away: number | null };
  };
}

export interface NormalisedLeague {
  id: number;
  name: string;
  logo: string;
  country: string;
  countryFlag: string | null;
  type: string;
  currentSeason: string;
}

export interface NormalisedTeam {
  id: number;
  name: string;
  logo: string;
  country: string;
}

export interface NormalisedStanding {
  position: number;
  teamId: number;
  teamName: string;
  teamLogo: string;
  points: number;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  pointsFor: number;
  pointsAgainst: number;
  diff: number;
}

// ── Status mapping ────────────────────────────────────────────────────────────

const LIVE_STATUSES     = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT']);
const FINISHED_STATUSES = new Set(['FT', 'AOT', 'AP', 'AET', 'AWD', 'WO']);

function mapStatus(short: string): MatchStatus {
  if (LIVE_STATUSES.has(short))     return 'live';
  if (FINISHED_STATUSES.has(short)) return 'finished';
  return 'upcoming';
}

function minuteLabel(g: ApiGame): string | undefined {
  if (g.status.short === 'HT') return 'MT';
  if (g.status.timer != null)  return `${g.status.timer}'`;
  return undefined;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Normalisers ───────────────────────────────────────────────────────────────

export function normaliseGame(g: ApiGame): NormalisedMatch {
  const datePart = g.date.split('T')[0];
  const status   = mapStatus(g.status.short);
  return {
    id:             g.id,
    home:           g.teams.home.name,
    homeId:         String(g.teams.home.id),
    homeLogo:       g.teams.home.logo,
    away:           g.teams.away.name,
    awayId:         String(g.teams.away.id),
    awayLogo:       g.teams.away.logo,
    homeScore:      g.scores.home ?? undefined,
    awayScore:      g.scores.away ?? undefined,
    status,
    minute:         status === 'live' ? minuteLabel(g) : undefined,
    date:           datePart,
    time:           g.time,
    tournament:     g.league.name,
    tournamentId:   g.league.id,
    tournamentLogo: g.league.logo,
    country:        g.country.name,
    season:         String(g.league.season),
    round:          g.week ?? undefined,
    periods: {
      first:    g.periods?.first    ?? undefined,
      second:   g.periods?.second   ?? undefined,
      overtime: g.periods?.overtime ?? undefined,
    },
  };
}

function normaliseLeague(l: ApiLeague): NormalisedLeague {
  const current = l.seasons?.find(s => s.current) ?? l.seasons?.[l.seasons.length - 1];
  return {
    id:            l.id,
    name:          l.name,
    logo:          l.logo,
    country:       l.country.name,
    countryFlag:   l.country.flag,
    type:          l.type,
    currentSeason: String(current?.season ?? ''),
  };
}

function normaliseTeam(t: ApiTeam): NormalisedTeam {
  return { id: t.id, name: t.name, logo: t.logo, country: t.country.name };
}

function normaliseStanding(s: ApiStanding): NormalisedStanding {
  const pf = s['points-for']      ?? 0;
  const pa = s['points-against']  ?? 0;
  return {
    position:      s.position,
    teamId:        s.team.id,
    teamName:      s.team.name,
    teamLogo:      s.team.logo,
    points:        s.points,
    played:        s.played,
    won:           s.won,
    lost:          s.lost,
    drawn:         s.drawn,
    pointsFor:     pf,
    pointsAgainst: pa,
    diff:          pf - pa,
  };
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function get<T>(path: string, params: Record<string, string | number> = {}): Promise<T[]> {
  const qs  = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  ).toString();
  const url = `${BASE}/${path}${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body: ApiResponse<T> = await res.json();
  if (body.errors && !Array.isArray(body.errors) && Object.keys(body.errors).length > 0) {
    throw new Error(JSON.stringify(body.errors));
  }
  return body.response ?? [];
}

// ── Public API ────────────────────────────────────────────────────────────────

export const rugbyApi = {
  /** Today's games (all statuses — no season restriction) */
  getTodayGames(): Promise<NormalisedMatch[]> {
    return get<ApiGame>('games', { date: todayUTC() }).then(r => r.map(normaliseGame));
  },

  /** Games for a specific date */
  getGamesByDate(date: string): Promise<NormalisedMatch[]> {
    return get<ApiGame>('games', { date }).then(r => r.map(normaliseGame));
  },

  /** Next N days of upcoming games (parallel date queries, no season restriction) */
  getUpcomingGames(daysAhead = 5): Promise<NormalisedMatch[]> {
    const today = new Date();
    const dates = Array.from({ length: daysAhead }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i + 1);
      return d.toISOString().slice(0, 10);
    });
    return Promise.allSettled(dates.map(date => get<ApiGame>('games', { date })))
      .then(results =>
        results
          .filter((r): r is PromiseFulfilledResult<ApiGame[]> => r.status === 'fulfilled')
          .flatMap(r => r.value.map(normaliseGame))
      );
  },

  /** All games for a league + season (free plan: 2022–2024 only) */
  getFixtures(leagueId: number, season: number): Promise<NormalisedMatch[]> {
    return get<ApiGame>('games', { league: leagueId, season }).then(r => r.map(normaliseGame));
  },

  /** All available leagues */
  getLeagues(): Promise<NormalisedLeague[]> {
    return get<ApiLeague>('leagues').then(r => r.map(normaliseLeague));
  },

  /** Teams in a league */
  getTeams(leagueId: number, season: number): Promise<NormalisedTeam[]> {
    return get<ApiTeam>('teams', { league: leagueId, season }).then(r => r.map(normaliseTeam));
  },

  /** Standings for a league */
  getStandings(leagueId: number, season: number): Promise<NormalisedStanding[]> {
    return get<ApiStanding>('standings', { league: leagueId, season }).then(r => r.map(normaliseStanding));
  },
};

// ── Well-known league IDs (verified from api-sports.io /leagues endpoint) ────

export const LEAGUES = {
  SIX_NATIONS:        51,   // Europe
  RUGBY_CHAMPIONSHIP: 85,   // World
  WORLD_CUP:          69,   // World
  PREMIERSHIP:        13,   // England
  TOP_14:             16,   // France
  URC:                76,   // United Rugby Championship
  SUPER_RUGBY:        71,   // World
  AMERICAS:          100,   // Americas Championship
  TOP_12_ARG:          1,   // Argentina Top 12
} as const;

export type LeagueId = typeof LEAGUES[keyof typeof LEAGUES];
