// ─── api-sports.io Rugby API — frontend client ───────────────────────────────
// All calls go through /api/rugby (Vercel Edge proxy in prod, Vite proxy in dev)
// so the API key is never exposed to the browser.

const BASE = '/api/rugby';

// ── Raw API types ─────────────────────────────────────────────────────────────

interface ApiResponse<T> {
  results: number;
  response: T[];
  errors?: Record<string, string>;
}

export interface ApiFixture {
  id: number;
  date: string;
  time: string;
  timezone: string;
  week: string | null;
  status: {
    long: string;
    short: 'NS' | '1H' | 'HT' | '2H' | 'ET' | 'FT' | 'AOT' | 'AP' | 'CANC' | 'PST' | string;
    timer: number | null;
  };
  league: {
    id: number;
    name: string;
    logo: string;
    season: string;
    round: string | null;
    country: { name: string; code: string | null; flag: string | null };
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  scores: { home: number | null; away: number | null };
  periods: { first: number | null; second: number | null };
}

export interface ApiLeague {
  id: number;
  name: string;
  type: string;
  logo: string;
  country: { name: string; code: string | null; flag: string | null };
  seasons: { season: string | number }[];
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

const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT']);
const FINISHED_STATUSES = new Set(['FT', 'AOT', 'AP', 'AET', 'AWD', 'WO']);

function mapStatus(short: string): MatchStatus {
  if (LIVE_STATUSES.has(short)) return 'live';
  if (FINISHED_STATUSES.has(short)) return 'finished';
  return 'upcoming';
}

function minuteLabel(fixture: ApiFixture): string | undefined {
  const s = fixture.status;
  if (s.short === 'HT') return 'MT';
  if (s.timer != null) return `${s.timer}'`;
  return undefined;
}

// ── Normalisers ───────────────────────────────────────────────────────────────

export function normaliseFixture(f: ApiFixture): NormalisedMatch {
  const datePart = f.date.split('T')[0];
  const timePart = f.time ?? f.date.split('T')[1]?.slice(0, 5) ?? '';
  const status = mapStatus(f.status.short);
  return {
    id: f.id,
    home: f.teams.home.name,
    homeId: String(f.teams.home.id),
    homeLogo: f.teams.home.logo,
    away: f.teams.away.name,
    awayId: String(f.teams.away.id),
    awayLogo: f.teams.away.logo,
    homeScore: f.scores.home ?? undefined,
    awayScore: f.scores.away ?? undefined,
    status,
    minute: status === 'live' ? minuteLabel(f) : undefined,
    date: datePart,
    time: timePart,
    tournament: f.league.name,
    tournamentId: f.league.id,
    tournamentLogo: f.league.logo,
    country: f.league.country.name,
    season: f.league.season,
    round: f.league.round ?? undefined,
  };
}

function normaliseLeague(l: ApiLeague): NormalisedLeague {
  const seasons = l.seasons ?? [];
  const current = seasons[seasons.length - 1]?.season ?? '';
  return {
    id: l.id,
    name: l.name,
    logo: l.logo,
    country: l.country.name,
    countryFlag: l.country.flag,
    type: l.type,
    currentSeason: String(current),
  };
}

function normaliseTeam(t: ApiTeam): NormalisedTeam {
  return {
    id: t.id,
    name: t.name,
    logo: t.logo,
    country: t.country.name,
  };
}

function normaliseStanding(s: ApiStanding): NormalisedStanding {
  const pf = s['points-for'] ?? 0;
  const pa = s['points-against'] ?? 0;
  return {
    position: s.position,
    teamId: s.team.id,
    teamName: s.team.name,
    teamLogo: s.team.logo,
    points: s.points,
    played: s.played,
    won: s.won,
    lost: s.lost,
    drawn: s.drawn,
    pointsFor: pf,
    pointsAgainst: pa,
    diff: pf - pa,
  };
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function get<T>(path: string, params: Record<string, string | number> = {}): Promise<T[]> {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  ).toString();
  const url = `${BASE}/${path}${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body: ApiResponse<T> = await res.json();
  if (body.errors && Object.keys(body.errors).length > 0) {
    throw new Error(JSON.stringify(body.errors));
  }
  return body.response ?? [];
}

// ── Public API ────────────────────────────────────────────────────────────────

export const rugbyApi = {
  /** All live fixtures right now */
  getLiveFixtures(): Promise<NormalisedMatch[]> {
    return get<ApiFixture>('fixtures', { live: 'all' }).then(r => r.map(normaliseFixture));
  },

  /** Fixtures by league + season (defaults to 2025) */
  getFixtures(leagueId: number, season = 2025): Promise<NormalisedMatch[]> {
    return get<ApiFixture>('fixtures', { league: leagueId, season }).then(r => r.map(normaliseFixture));
  },

  /** Upcoming fixtures (next N days) for all major leagues */
  getUpcomingFixtures(leagueId: number, season = 2025, next = 20): Promise<NormalisedMatch[]> {
    return get<ApiFixture>('fixtures', { league: leagueId, season, next }).then(r => r.map(normaliseFixture));
  },

  /** All available leagues */
  getLeagues(): Promise<NormalisedLeague[]> {
    return get<ApiLeague>('leagues').then(r => r.map(normaliseLeague));
  },

  /** Leagues for a specific country */
  getLeaguesByCountry(country: string): Promise<NormalisedLeague[]> {
    return get<ApiLeague>('leagues', { country }).then(r => r.map(normaliseLeague));
  },

  /** Teams in a league */
  getTeams(leagueId: number, season = 2025): Promise<NormalisedTeam[]> {
    return get<ApiTeam>('teams', { league: leagueId, season }).then(r => r.map(normaliseTeam));
  },

  /** Standings for a league */
  getStandings(leagueId: number, season = 2025): Promise<NormalisedStanding[]> {
    return get<ApiStanding>('standings', { league: leagueId, season }).then(r => r.map(normaliseStanding));
  },
};

// ── Well-known league IDs (api-sports.io) ────────────────────────────────────

export const LEAGUES = {
  SIX_NATIONS:          4,
  RUGBY_CHAMPIONSHIP:   5,
  WORLD_CUP:            6,
  PREMIERSHIP:          2,
  TOP_14:               3,
  URC:                  7,
  SUPER_RUGBY:          8,
  WORLD_RUGBY_SEVENS:  15,
} as const;

export type LeagueId = typeof LEAGUES[keyof typeof LEAGUES];
