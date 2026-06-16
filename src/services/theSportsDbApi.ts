// ─── TheSportsDB — free-key client (key = "1") ───────────────────────────────
// Browser-callable: no CORS issues, no auth headers needed.
// Free key ("1") gives access to: team info, past/next events, league info.
// Live scores (v2 endpoint) require a Patreon key — graceful fail on 401/403.
// Base: https://www.thesportsdb.com/api/v1/json/1/

import type { NormalisedMatch, MatchStatus } from './rugbyApi';

const BASE = 'https://www.thesportsdb.com/api/v1/json/1';

// ── Raw TheSportsDB types ─────────────────────────────────────────────────────

interface TSDBTeam {
  idTeam:        string;
  strTeam:       string;
  strTeamBadge:  string;  // HD logo URL
  strLeague?:    string;
  strCountry?:   string;
  strStadium?:   string;
  intFormedYear?: string;
  strDescriptionEN?: string;
}

interface TSDBEvent {
  idEvent:        string;
  strEvent:       string;
  strLeague:      string;
  idLeague:       string;
  strSeason:      string;
  strHomeTeam:    string;
  idHomeTeam:     string;
  strAwayTeam:    string;
  idAwayTeam:     string;
  intHomeScore:   string | null;
  intAwayScore:   string | null;
  dateEvent:      string;    // YYYY-MM-DD
  strTime:        string;    // HH:MM:SS (UTC)
  strStatus?:     string;    // "Match Finished" | null
  strProgress?:   string;    // minute e.g. "34'"
  strThumb?:      string;
  strVenue?:      string;
}

interface TSDBLiveEvent {
  idEvent:        string;
  strEvent:       string;
  strLeague:      string;
  idLeague:       string;
  strHomeTeam:    string;
  idHomeTeam:     string;
  strAwayTeam:    string;
  idAwayTeam:     string;
  intHomeScore:   string | null;
  intAwayScore:   string | null;
  strProgress?:   string;
  dateEvent:      string;
  strTime:        string;
}

interface TSDBLeague {
  idLeague:        string;
  strLeague:       string;
  strSport:        string;
  strLeagueBadge?: string;
  strCountry?:     string;
  strCurrentSeason?: string;
}

// ── Normalisation helpers ─────────────────────────────────────────────────────

function tsdbStatus(e: TSDBEvent): MatchStatus {
  if (e.strStatus === 'Match Finished') return 'finished';
  if (e.strProgress && e.strProgress.length > 0) return 'live';
  if (e.intHomeScore != null)  return 'live';
  return 'upcoming';
}

function normaliseEvent(e: TSDBEvent): NormalisedMatch {
  const status = tsdbStatus(e);
  const time   = (e.strTime ?? '').slice(0, 5); // "HH:MM"

  return {
    id:             Number(e.idEvent) || 0,
    home:           e.strHomeTeam,
    homeId:         e.idHomeTeam,
    homeLogo:       '',   // not in event payload; caller can enrich via idMapping
    away:           e.strAwayTeam,
    awayId:         e.idAwayTeam,
    awayLogo:       '',
    homeScore:      e.intHomeScore != null ? Number(e.intHomeScore) : undefined,
    awayScore:      e.intAwayScore != null ? Number(e.intAwayScore) : undefined,
    status,
    minute:         e.strProgress ?? undefined,
    date:           e.dateEvent,
    time,
    tournament:     e.strLeague,
    tournamentId:   Number(e.idLeague) || 0,
    tournamentLogo: '',
    country:        '',
    season:         e.strSeason,
  };
}

function normaliseLive(e: TSDBLiveEvent): NormalisedMatch {
  const time = (e.strTime ?? '').slice(0, 5);
  return {
    id:             Number(e.idEvent) || 0,
    home:           e.strHomeTeam,
    homeId:         e.idHomeTeam,
    homeLogo:       '',
    away:           e.strAwayTeam,
    awayId:         e.idAwayTeam,
    awayLogo:       '',
    homeScore:      e.intHomeScore != null ? Number(e.intHomeScore) : undefined,
    awayScore:      e.intAwayScore != null ? Number(e.intAwayScore) : undefined,
    status:         'live',
    minute:         e.strProgress ?? undefined,
    date:           e.dateEvent,
    time,
    tournament:     e.strLeague,
    tournamentId:   Number(e.idLeague) || 0,
    tournamentLogo: '',
    country:        '',
    season:         '',
  };
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`TheSportsDB ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

// ── Normalised team type ──────────────────────────────────────────────────────

export interface TSDBNormalisedTeam {
  id:          string;
  name:        string;
  logo:        string;
  country?:    string;
  stadium?:    string;
  formed?:     string;
  description?: string;
}

// ── Public API ────────────────────────────────────────────────────────────────

export const theSportsDbApi = {
  /** Search for a team by name. Used for cross-API logo/info lookups. */
  async searchTeam(name: string): Promise<TSDBNormalisedTeam | null> {
    const data = await get<{ teams: TSDBTeam[] | null }>(`/searchteams.php?t=${encodeURIComponent(name)}`);
    const t    = data.teams?.[0];
    if (!t) return null;
    return {
      id:          t.idTeam,
      name:        t.strTeam,
      logo:        t.strTeamBadge,
      country:     t.strCountry,
      stadium:     t.strStadium,
      formed:      t.intFormedYear,
      description: t.strDescriptionEN,
    };
  },

  /** Team details by TheSportsDB team ID. */
  async getTeamById(tsdbTeamId: string): Promise<TSDBNormalisedTeam | null> {
    const data = await get<{ teams: TSDBTeam[] | null }>(`/lookupteam.php?id=${tsdbTeamId}`);
    const t    = data.teams?.[0];
    if (!t) return null;
    return {
      id:          t.idTeam,
      name:        t.strTeam,
      logo:        t.strTeamBadge,
      country:     t.strCountry,
      stadium:     t.strStadium,
      formed:      t.intFormedYear,
      description: t.strDescriptionEN,
    };
  },

  /** Next 15 events for a league (by TheSportsDB league ID). */
  async getNextEvents(tsdbLeagueId: string | number): Promise<NormalisedMatch[]> {
    const data = await get<{ events: TSDBEvent[] | null }>(`/eventsnextleague.php?id=${tsdbLeagueId}`);
    return (data.events ?? []).map(normaliseEvent);
  },

  /** Last 15 events for a league (by TheSportsDB league ID). */
  async getPastEvents(tsdbLeagueId: string | number): Promise<NormalisedMatch[]> {
    const data = await get<{ events: TSDBEvent[] | null }>(`/eventspastleague.php?id=${tsdbLeagueId}`);
    return (data.events ?? []).map(normaliseEvent);
  },

  /**
   * Live scores across all sports.
   * Requires Patreon key (v2) — gracefully returns [] on free key (401/403).
   */
  async getLiveScores(): Promise<NormalisedMatch[]> {
    try {
      const res = await fetch('https://www.thesportsdb.com/api/v2/json/livescore.php?s=Rugby%20Union');
      if (res.status === 401 || res.status === 403) return [];  // free key limitation
      if (!res.ok) return [];
      const data = await res.json() as { events: TSDBLiveEvent[] | null };
      return (data.events ?? []).map(normaliseLive);
    } catch {
      return [];
    }
  },

  /**
   * Events on a specific date for a league.
   * date: YYYY-MM-DD
   */
  async getEventsByDate(tsdbLeagueId: string | number, date: string): Promise<NormalisedMatch[]> {
    const data = await get<{ events: TSDBEvent[] | null }>(
      `/eventsday.php?d=${date}&l=${tsdbLeagueId}`
    );
    return (data.events ?? []).map(normaliseEvent);
  },

  /** League info (name, badge, current season) by TheSportsDB league ID. */
  async getLeagueInfo(tsdbLeagueId: string | number): Promise<{
    id: string;
    name: string;
    badge?: string;
    country?: string;
    currentSeason?: string;
  } | null> {
    const data = await get<{ leagues: TSDBLeague[] | null }>(`/lookupleague.php?id=${tsdbLeagueId}`);
    const l    = data.leagues?.[0];
    if (!l) return null;
    return {
      id:            l.idLeague,
      name:          l.strLeague,
      badge:         l.strLeagueBadge,
      country:       l.strCountry,
      currentSeason: l.strCurrentSeason,
    };
  },
};
