// ─── ID Mapping Table ─────────────────────────────────────────────────────────
// Links ESPN league/team IDs → TheSportsDB IDs → Highlightly IDs.
// TheSportsDB league IDs verified at: https://www.thesportsdb.com (free browse)
// Highlightly IDs: fill in once you have API access and run getLeagues().
// ESPN league IDs come from espnApi.ts ESPN_LEAGUES.

export interface LeagueMapping {
  name:           string;
  espnId:         number;
  theSportsDbId:  string;
  highlightlyId:  number | null;  // null until confirmed via API
  season:         number;         // current season year
}

/** Master league mapping table. */
export const LEAGUE_MAP: LeagueMapping[] = [
  {
    name:           'Six Nations',
    espnId:         180659,
    theSportsDbId:  '4467',
    highlightlyId:  null,
    season:         2025,
  },
  {
    name:           'Rugby Championship',
    espnId:         244293,
    theSportsDbId:  '4582',
    highlightlyId:  null,
    season:         2025,
  },
  {
    name:           'Rugby World Cup',
    espnId:         164205,
    theSportsDbId:  '4588',
    highlightlyId:  null,
    season:         2023,
  },
  {
    name:           'United Rugby Championship',
    espnId:         270559,
    theSportsDbId:  '4795',
    highlightlyId:  null,
    season:         2025,
  },
  {
    name:           'Premiership Rugby',
    espnId:         267979,
    theSportsDbId:  '4304',
    highlightlyId:  null,
    season:         2025,
  },
  {
    name:           'Top 14',
    espnId:         271937,
    theSportsDbId:  '4586',
    highlightlyId:  null,
    season:         2025,
  },
  {
    name:           'Heineken Champions Cup',
    espnId:         289234,
    theSportsDbId:  '4797',
    highlightlyId:  null,
    season:         2025,
  },
  {
    name:           'Super Rugby Pacific',
    espnId:         242041,
    theSportsDbId:  '4583',
    highlightlyId:  null,
    season:         2025,
  },
  {
    name:           'The Rugby Championship',
    espnId:         244293,
    theSportsDbId:  '4582',
    highlightlyId:  null,
    season:         2025,
  },
  {
    name:           'Pacific Nations Cup',
    espnId:         270227,
    theSportsDbId:  '4591',
    highlightlyId:  null,
    season:         2025,
  },
  {
    name:           'Currie Cup',
    espnId:         284386,
    theSportsDbId:  '4590',
    highlightlyId:  null,
    season:         2025,
  },
  {
    name:           'National Rugby Championship',
    espnId:         289245,
    theSportsDbId:  '4584',
    highlightlyId:  null,
    season:         2025,
  },
  {
    name:           'Americas Rugby Championship',
    espnId:         282110,
    theSportsDbId:  '4589',
    highlightlyId:  null,
    season:         2025,
  },
];

// ── Team name alias table ─────────────────────────────────────────────────────
// Accounts for naming differences across APIs.
// Key: canonical name (ESPN); Value: array of known aliases.

export const TEAM_ALIASES: Record<string, string[]> = {
  'New Zealand':           ['All Blacks', 'New Zealand All Blacks', 'NZ'],
  'South Africa':          ['Springboks', 'South Africa Springboks', 'RSA'],
  'England':               ['England Rugby', 'ENG'],
  'France':                ['France Rugby', 'FRA'],
  'Ireland':               ['Ireland Rugby', 'IRL'],
  'Australia':             ['Wallabies', 'Australia Wallabies', 'AUS'],
  'Argentina':             ['Pumas', 'Los Pumas', 'Argentina Pumas', 'ARG'],
  'Scotland':              ['Scotland Rugby', 'SCO'],
  'Wales':                 ['Wales Rugby', 'WAL'],
  'Italy':                 ['Italy Rugby', 'ITA'],
  'Leinster':              ['Leinster Rugby'],
  'Munster':               ['Munster Rugby'],
  'Ulster':                ['Ulster Rugby'],
  'Connacht':              ['Connacht Rugby'],
  'Stormers':              ['DHL Stormers'],
  'Bulls':                 ['Vodacom Bulls'],
  'Lions':                 ['Emirates Lions'],
  'Sharks':                ['Cell C Sharks', 'Hollywoodbets Sharks'],
  'Crusaders':             ['Canterbury Crusaders'],
  'Blues':                 ['Auckland Blues'],
  'Chiefs':                ['Waikato Chiefs'],
  'Highlanders':           ['Otago Highlanders'],
  'Hurricanes':            ['Wellington Hurricanes'],
  'Brumbies':              ['ACT Brumbies'],
  'Reds':                  ['Queensland Reds'],
  'Waratahs':              ['NSW Waratahs'],
  'Western Force':         ['Force'],
  'Toulouse':              ['Stade Toulousain'],
  'La Rochelle':           ['Stade Rochelais'],
  'Racing 92':             ['Racing Metro 92'],
};

// ── Lookup helpers ────────────────────────────────────────────────────────────

/** Find mapping by ESPN league ID. */
export function mappingByEspnId(espnId: number): LeagueMapping | undefined {
  return LEAGUE_MAP.find(l => l.espnId === espnId);
}

/** Find mapping by TheSportsDB league ID. */
export function mappingByTsdbId(tsdbId: string): LeagueMapping | undefined {
  return LEAGUE_MAP.find(l => l.theSportsDbId === tsdbId);
}

/** Find mapping by Highlightly league ID. */
export function mappingByHighlightlyId(hlId: number): LeagueMapping | undefined {
  return LEAGUE_MAP.find(l => l.highlightlyId === hlId);
}

/**
 * Fuzzy team name match: normalises both strings and checks aliases.
 * Returns true if nameA and nameB refer to the same team.
 */
export function teamsMatch(nameA: string, nameB: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const a    = norm(nameA);
  const b    = norm(nameB);
  if (a === b) return true;

  for (const [canonical, aliases] of Object.entries(TEAM_ALIASES)) {
    const all = [canonical, ...aliases].map(norm);
    if (all.includes(a) && all.includes(b)) return true;
  }
  return false;
}

/**
 * Find a match across APIs by team names + date.
 * Use to link an ESPN match to a TheSportsDB or Highlightly event.
 */
export function matchByTeamDate<T extends { home: string; away: string; date: string }>(
  events: T[],
  home: string,
  away: string,
  date: string,
): T | undefined {
  return events.find(
    e =>
      e.date === date &&
      teamsMatch(e.home, home) &&
      teamsMatch(e.away, away),
  );
}
