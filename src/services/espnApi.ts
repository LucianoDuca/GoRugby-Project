// ─── ESPN Rugby API — frontend client ────────────────────────────────────────
// Base: https://site.api.espn.com/apis/site/v2/sports/rugby/{leagueId}/scoreboard
// No API key required, no rate limits, CORS allowed.

import type { NormalisedMatch, MatchStatus } from './rugbyApi';

// ── ESPN raw types ────────────────────────────────────────────────────────────

interface EspnLogo {
  href: string;
  width: number;
  height: number;
}

interface EspnLeague {
  id: string;
  name: string;
  abbreviation: string;
  slug: string;
  logos: EspnLogo[];
  season?: { year: number };
}

interface EspnWeek {
  number: number;
  text: string;
}

interface EspnAddress {
  city: string;
  country?: string;
}

interface EspnVenue {
  fullName: string;
  address: EspnAddress;
}

interface EspnTeam {
  id: string;
  displayName: string;
  abbreviation: string;
  logo: string;
}

interface EspnLineScore {
  value: number;
}

interface EspnCompetitor {
  id: string;
  homeAway: 'home' | 'away';
  team: EspnTeam;
  score: string;
  linescores?: EspnLineScore[];
}

interface EspnStatusType {
  id: string;
  name: string;
  state: 'pre' | 'in' | 'post';
  completed: boolean;
  description: string;
  detail: string;
  shortDetail: string;
}

interface EspnStatus {
  clock: number;
  displayClock: string;
  period: number;
  type: EspnStatusType;
}

interface EspnCompetition {
  id: string;
  date: string;
  venue?: EspnVenue;
  competitors: EspnCompetitor[];
  status: EspnStatus;
}

interface EspnEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  season: { year: number; type: number; slug: string; };
  week?: EspnWeek;
  competitions: EspnCompetition[];
}

interface EspnScoreboardResponse {
  leagues: EspnLeague[];
  events: EspnEvent[];
}

// ── Verified ESPN rugby league IDs (from sports.core.api.espn.com/v2/sports/rugby/leagues) ─

export const ESPN_LEAGUES = {
  SIX_NATIONS:         180659,
  RUGBY_CHAMPIONSHIP:  244293,
  WORLD_CUP:           164205,
  PREMIERSHIP:         267979,   // Gallagher Prem
  TOP_14:              270559,   // French Top 14
  URC:                 270557,   // United Rugby Championship
  SUPER_RUGBY_PACIFIC: 242041,
  CHAMPIONS_CUP:       271937,   // European Rugby Champions Cup
  MAJOR_LEAGUE_RUGBY:  289262,
  CURRIE_CUP:          270555,
  URBA_PRIMERA_A:      2009,     // Argentine rugby
  URBA_TOP_14_ARG:     289279,   // URBA Top 14 (Argentina)
  INTERNATIONAL_TESTS: 289234,
} as const;

export type EspnLeagueId = typeof ESPN_LEAGUES[keyof typeof ESPN_LEAGUES];

export interface EspnNormalisedLeague {
  id: number;
  name: string;
  slug: string;
  logo: string;
  season?: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/rugby';

function hashStringToInt(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function toEspnDate(d: Date): string {
  const y   = d.getUTCFullYear();
  const m   = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function mapState(state: 'pre' | 'in' | 'post'): MatchStatus {
  return state === 'in' ? 'live' : state === 'post' ? 'finished' : 'upcoming';
}

// ── Normalisation ─────────────────────────────────────────────────────────────

function normaliseEvent(event: EspnEvent, league: EspnLeague | undefined): NormalisedMatch {
  const comp        = event.competitions[0];
  const st          = comp?.status;
  const state       = st?.type?.state ?? 'pre';
  const matchStatus = mapState(state);

  const home = comp?.competitors?.find(c => c.homeAway === 'home');
  const away = comp?.competitors?.find(c => c.homeAway === 'away');

  const homeTeam = home?.team ?? { id: '0', displayName: 'TBD', abbreviation: '---', logo: '' };
  const awayTeam = away?.team ?? { id: '0', displayName: 'TBD', abbreviation: '---', logo: '' };

  let homeScore: number | undefined;
  let awayScore: number | undefined;
  if (state !== 'pre') {
    const hs  = home ? parseInt(home.score, 10) : NaN;
    const as_ = away ? parseInt(away.score, 10) : NaN;
    homeScore = isNaN(hs)  ? undefined : hs;
    awayScore = isNaN(as_) ? undefined : as_;
  }

  let minute: string | undefined;
  if (matchStatus === 'live' && st) {
    const clk    = st.displayClock;
    const detail = st.type.shortDetail;
    minute = clk && detail ? `${clk} - ${detail}` : (clk || detail || undefined);
  }

  const eventDate = new Date(event.date);
  const date      = eventDate.toISOString().slice(0, 10);
  const time      = `${String(eventDate.getUTCHours()).padStart(2,'0')}:${String(eventDate.getUTCMinutes()).padStart(2,'0')}`;

  const parsedId  = parseInt(event.id, 10);
  const id        = isNaN(parsedId) ? hashStringToInt(event.id) : parsedId;

  const leagueName = league?.name ?? 'Rugby';
  const leagueId   = league ? (parseInt(league.id, 10) || hashStringToInt(league.id)) : 0;
  const leagueLogo = league?.logos?.find(l => !l.href.includes('ESPN-icon'))?.href
                  ?? league?.logos?.[0]?.href ?? '';

  const country = comp?.venue?.address?.country ?? 'World';

  const homeLines = home?.linescores ?? [];
  const awayLines = away?.linescores ?? [];
  const periods: NormalisedMatch['periods'] = {};
  if (homeLines[0] != null || awayLines[0] != null) {
    periods.first  = { home: homeLines[0]?.value ?? null, away: awayLines[0]?.value ?? null };
  }
  if (homeLines[1] != null || awayLines[1] != null) {
    periods.second = { home: homeLines[1]?.value ?? null, away: awayLines[1]?.value ?? null };
  }

  return {
    id, home: homeTeam.displayName, homeId: homeTeam.id, homeLogo: homeTeam.logo,
    away: awayTeam.displayName, awayId: awayTeam.id, awayLogo: awayTeam.logo,
    homeScore, awayScore, status: matchStatus, minute, date, time,
    tournament: leagueName, tournamentId: leagueId, tournamentLogo: leagueLogo,
    country, season: String(event.season?.year ?? ''),
    round: event.week?.text,
    periods: Object.keys(periods).length > 0 ? periods : undefined,
  };
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function fetchScoreboard(leagueId: number, params: Record<string, string> = {}): Promise<EspnScoreboardResponse> {
  const qs  = new URLSearchParams({ limit: '200', ...params }).toString();
  const url = `${ESPN_BASE}/${leagueId}/scoreboard?${qs}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`ESPN ${res.status} for league ${leagueId}`);
  return res.json() as Promise<EspnScoreboardResponse>;
}

function dedupe(matches: NormalisedMatch[]): NormalisedMatch[] {
  const seen = new Set<number>();
  return matches.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });
}

// ── Public API ────────────────────────────────────────────────────────────────

export const espnApi = {
  /** Today's matches across all ESPN rugby leagues (parallel calls). */
  async getTodayGames(): Promise<NormalisedMatch[]> {
    const today  = toEspnDate(new Date());
    const results = await Promise.allSettled(
      Object.values(ESPN_LEAGUES).map(id =>
        fetchScoreboard(id, { dates: today }).then(d =>
          (d.events ?? []).map(e => normaliseEvent(e, d.leagues?.[0]))
        ).catch(() => [] as NormalisedMatch[])
      )
    );
    return dedupe(
      results
        .filter((r): r is PromiseFulfilledResult<NormalisedMatch[]> => r.status === 'fulfilled')
        .flatMap(r => r.value)
    );
  },

  /** Matches for a specific date (YYYY-MM-DD). */
  async getGamesByDate(date: string): Promise<NormalisedMatch[]> {
    const espnDate = date.replace(/-/g, '');
    const results  = await Promise.allSettled(
      Object.values(ESPN_LEAGUES).map(id =>
        fetchScoreboard(id, { dates: espnDate }).then(d =>
          (d.events ?? []).map(e => normaliseEvent(e, d.leagues?.[0]))
        ).catch(() => [] as NormalisedMatch[])
      )
    );
    return dedupe(
      results
        .filter((r): r is PromiseFulfilledResult<NormalisedMatch[]> => r.status === 'fulfilled')
        .flatMap(r => r.value)
    );
  },

  /** Next N days of upcoming games. */
  async getUpcomingGames(daysAhead = 5): Promise<NormalisedMatch[]> {
    const today = new Date();
    const dates = Array.from({ length: Math.min(daysAhead, 14) }, (_, i) => {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() + i + 1);
      return toEspnDate(d);
    });
    const all: NormalisedMatch[] = [];
    for (const espnDate of dates) {
      const dayResults = await Promise.allSettled(
        Object.values(ESPN_LEAGUES).map(id =>
          fetchScoreboard(id, { dates: espnDate }).then(d =>
            (d.events ?? []).map(e => normaliseEvent(e, d.leagues?.[0]))
          ).catch(() => [] as NormalisedMatch[])
        )
      );
      dayResults
        .filter((r): r is PromiseFulfilledResult<NormalisedMatch[]> => r.status === 'fulfilled')
        .forEach(r => all.push(...r.value));
    }
    return dedupe(all);
  },

  /** All matches for a single ESPN league (current season). */
  async getLeagueGames(leagueId: number, dateFrom?: string, dateTo?: string): Promise<NormalisedMatch[]> {
    try {
      const params: Record<string, string> = {};
      if (dateFrom && dateTo) params.dates = `${dateFrom.replace(/-/g,'')}${dateTo.replace(/-/g,'')}`;
      else if (dateFrom)      params.dates = dateFrom.replace(/-/g, '');
      const data = await fetchScoreboard(leagueId, params);
      return (data.events ?? []).map(e => normaliseEvent(e, data.leagues?.[0]));
    } catch {
      return [];
    }
  },

  /** All available ESPN rugby leagues. */
  async getLeagues(): Promise<EspnNormalisedLeague[]> {
    const results = await Promise.allSettled(
      Object.values(ESPN_LEAGUES).map(id =>
        fetchScoreboard(id, { limit: '1' }).then(d => d.leagues?.[0])
      )
    );
    const seen = new Set<number>();
    const leagues: EspnLeague[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value != null) leagues.push(r.value);
    }
    return leagues
      .reduce<EspnNormalisedLeague[]>((acc, l) => {
        const numId = parseInt(l.slug, 10) || hashStringToInt(l.id);
        if (!seen.has(numId)) {
          seen.add(numId);
          acc.push({
            id:     numId,
            name:   l.name,
            slug:   l.slug,
            logo:   l.logos?.find(x => !x.href.includes('ESPN-icon'))?.href ?? l.logos?.[0]?.href ?? '',
            season: l.season?.year,
          });
        }
        return acc;
      }, []);
  },
};
