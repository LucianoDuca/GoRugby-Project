// ─── Highlightly (RapidAPI) — frontend client ────────────────────────────────
// All calls go through /api/highlightly?_e=<endpoint>&... (Vercel Edge proxy).
// Dev: same path intercepted by vite.config.ts plugin.
// API key & host are NEVER exposed to the browser.

import type { NormalisedMatch, MatchStatus } from './rugbyApi';

// ── Raw Highlightly types (adjust to match actual API response shape) ──────────

export interface HLTeam {
  id: number;
  name: string;
  logo: string;      // URL to HD crest
  country?: string;
}

export interface HLScore {
  home: number | null;
  away: number | null;
}

export interface HLPeriods {
  first?:   HLScore;
  second?:  HLScore;
  extra?:   HLScore;
}

export interface HLStatus {
  // Typical RapidAPI short statuses: "NS" | "1H" | "HT" | "2H" | "FT" | "AET" | "PEN" | "PST"
  short:   string;
  elapsed: number | null; // minutes played
}

export interface HLFixture {
  id:       number;
  date:     string;        // ISO 8601
  timezone: string;
  venue?: {
    name:    string;
    city:    string;
    country: string;
  };
  status:   HLStatus;
}

export interface HLEvent {
  fixture:    HLFixture;
  league: {
    id:     number;
    name:   string;
    logo:   string;
    season: number;
    round:  string;
    country?: string;
  };
  teams: {
    home: HLTeam;
    away: HLTeam;
  };
  goals:    HLScore;
  score:    HLPeriods;
  highlight?: string;  // URL to highlight video
}

export interface HLPlayer {
  id:     number;
  name:   string;
  number: number;
  pos:    string; // e.g. "8", "10", "SH"
}

export interface HLLineup {
  team:       HLTeam;
  formation?: string;
  startXI:    HLPlayer[];
  substitutes: HLPlayer[];
}

export interface HLStanding {
  rank:  number;
  team:  HLTeam;
  points: number;
  goalsDiff: number;
  group?: string;
  all: {
    played: number;
    win:    number;
    draw:   number;
    lose:   number;
    goals:  HLScore;
  };
}

// ── Normalisation ─────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, MatchStatus> = {
  NS: 'upcoming', TBD: 'upcoming', PST: 'upcoming',
  '1H': 'live', HT: 'live', '2H': 'live', ET: 'live', BT: 'live', P: 'live', INT: 'live',
  FT: 'finished', AET: 'finished', PEN: 'finished', AWD: 'finished', WO: 'finished',
};

function normaliseEvent(e: HLEvent): NormalisedMatch {
  const status: MatchStatus = STATUS_MAP[e.fixture.status.short] ?? 'upcoming';
  const dt   = new Date(e.fixture.date);
  const date = dt.toISOString().slice(0, 10);
  const time = `${String(dt.getUTCHours()).padStart(2,'0')}:${String(dt.getUTCMinutes()).padStart(2,'0')}`;

  let homeScore: number | undefined;
  let awayScore: number | undefined;
  if (status !== 'upcoming') {
    if (e.goals.home != null) homeScore = e.goals.home;
    if (e.goals.away != null) awayScore = e.goals.away;
  }

  const periods: NormalisedMatch['periods'] = {};
  if (e.score.first)  periods.first  = { home: e.score.first.home,  away: e.score.first.away  };
  if (e.score.second) periods.second = { home: e.score.second.home, away: e.score.second.away };
  if (e.score.extra)  periods.overtime = { home: e.score.extra.home, away: e.score.extra.away };

  return {
    id:             e.fixture.id,
    home:           e.teams.home.name,
    homeId:         String(e.teams.home.id),
    homeLogo:       e.teams.home.logo,
    away:           e.teams.away.name,
    awayId:         String(e.teams.away.id),
    awayLogo:       e.teams.away.logo,
    homeScore,
    awayScore,
    status,
    minute:         status === 'live' && e.fixture.status.elapsed != null
                      ? `${e.fixture.status.elapsed}'`
                      : undefined,
    date,
    time,
    tournament:     e.league.name,
    tournamentId:   e.league.id,
    tournamentLogo: e.league.logo,
    country:        e.league.country ?? e.teams.home.country ?? '',
    season:         String(e.league.season),
    round:          e.league.round,
    periods:        Object.keys(periods).length ? periods : undefined,
    highlightUrl:   e.highlight,
  };
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function get<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
  const qs = new URLSearchParams({ _e: endpoint });
  for (const [k, v] of Object.entries(params)) qs.set(k, String(v));
  const res = await fetch(`/api/highlightly?${qs.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Highlightly ${res.status} for ${endpoint}`);
  return res.json() as Promise<T>;
}

// ── Normalised standings type ─────────────────────────────────────────────────

export interface HLNormalisedStanding {
  position:  number;
  teamId:    number;
  teamName:  string;
  teamLogo:  string;
  played:    number;
  won:       number;
  drawn:     number;
  lost:      number;
  points:    number;
  diff:      number;
  group?:    string;
}

// ── Public API ────────────────────────────────────────────────────────────────

export const highlightlyApi = {
  /** Returns true if the proxy is configured (key + host env vars are set on server). */
  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch('/api/highlightly?_e=status');
      return res.status !== 500;
    } catch {
      return false;
    }
  },

  /** Today's fixtures across all leagues (or specific league). */
  async getFixtures(params: {
    league?: number;
    date?: string;   // YYYY-MM-DD
    season?: number;
    live?: 'all';
  } = {}): Promise<NormalisedMatch[]> {
    const p: Record<string, string | number> = {};
    if (params.league) p.league = params.league;
    if (params.date)   p.date   = params.date;
    if (params.season) p.season = params.season;
    if (params.live)   p.live   = params.live;

    const data = await get<{ response: HLEvent[] }>('fixtures', p);
    return (data.response ?? []).map(normaliseEvent);
  },

  /** Current live fixtures. */
  async getLiveFixtures(): Promise<NormalisedMatch[]> {
    const data = await get<{ response: HLEvent[] }>('fixtures', { live: 'all' });
    return (data.response ?? []).map(normaliseEvent);
  },

  /** Standings for a league+season. */
  async getStandings(leagueId: number, season: number): Promise<HLNormalisedStanding[]> {
    const data = await get<{ response: { league: { standings: HLStanding[][] } }[] }>(
      'standings', { league: leagueId, season }
    );
    const raw = data.response?.[0]?.league?.standings?.[0] ?? [];
    return raw.map(s => ({
      position: s.rank,
      teamId:   s.team.id,
      teamName: s.team.name,
      teamLogo: s.team.logo,
      played:   s.all.played,
      won:      s.all.win,
      drawn:    s.all.draw,
      lost:     s.all.lose,
      points:   s.points,
      diff:     s.goalsDiff,
      group:    s.group,
    }));
  },

  /** Lineups for a specific fixture (published 24–48h before kick-off). */
  async getLineups(fixtureId: number): Promise<HLLineup[]> {
    const data = await get<{ response: HLLineup[] }>('fixtures/lineups', { fixture: fixtureId });
    return data.response ?? [];
  },

  /** Highlight video URL for a finished fixture. */
  async getHighlight(fixtureId: number): Promise<string | null> {
    const data = await get<{ response: HLEvent[] }>('fixtures', { id: fixtureId });
    return data.response?.[0]?.highlight ?? null;
  },

  /** All leagues available in Highlightly. */
  async getLeagues(): Promise<{ id: number; name: string; logo: string; country: string }[]> {
    const data = await get<{ response: { league: { id: number; name: string; logo: string }; country: { name: string } }[] }>('leagues');
    return (data.response ?? []).map(r => ({
      id:      r.league.id,
      name:    r.league.name,
      logo:    r.league.logo,
      country: r.country.name,
    }));
  },
};

// ── Extend NormalisedMatch to include highlight URL ───────────────────────────
// (declared here; consumed by MatchModal and future Highlights section)
declare module './rugbyApi' {
  interface NormalisedMatch {
    highlightUrl?: string;
  }
}
