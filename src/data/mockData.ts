// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  clubId?: string;
  joinedAt: string;
  followedClubs: string[];
  followedIntlTeams?: string[];   // "<teamId>|<leagueName>" e.g. "23|Six Nations"
  totalReviews: number;
  totalPredictions: number;
  bio?: string;
}

export interface Club {
  id: string;
  name: string;
  city: string;
  field: string;
  followers: number;
  affiliates: number;
  logo: string;
  founded: number;
}

export interface Match {
  id: number;
  home: string;
  homeId: string;
  away: string;
  awayId: string;
  homeScore?: number;
  awayScore?: number;
  status: 'live' | 'finished' | 'upcoming';
  minute?: string;
  date: string;
  time: string;
  tournament: string;
  venue?: string;
  country?: string;
  region?: string;
}

export interface TournamentNode {
  id: string;
  name: string;
  flag?: string;
  icon?: string;
  type: 'continent' | 'country' | 'region' | 'competition';
  children?: TournamentNode[];
  status?: 'active' | 'upcoming' | 'finished';
  teams?: number;
  category?: string;
  startDate?: string;
}

export interface Tournament {
  id: string;
  name: string;
  status: 'active' | 'upcoming' | 'finished';
  teams: number;
  category: string;
  startDate: string;
}

export interface Player {
  id: string;
  name: string;
  clubId: string;
  nationality: string;
  category: string;
  position: string;
}

export interface Review {
  id: string;
  matchId: number;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  expiresAt: string;
  voters: string[];
}

export interface PostComment {
  id: string;
  userId: string;
  userName: string;
  userInitials: string;
  text: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
}

export interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  userInitials: string;
  text: string;
  imageUrl?: string;
  type: 'post' | 'poll';
  poll?: Poll;
  createdAt: string;
  likes: number;
  likedBy: string[];
  comments: PostComment[];
  reposts: number;
}

export interface Notification {
  id: string;
  text: string;
  time: string;
  read: boolean;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

export const clubs: Club[] = [
  { id: 'mrc', name: 'Mendoza Rugby', city: 'Mendoza', field: 'Cancha Central', followers: 4210, affiliates: 1220, logo: 'MR', founded: 1958 },
  { id: 'mar', name: 'Marista RC', city: 'Mendoza', field: 'Luján de Cuyo', followers: 3890, affiliates: 980, logo: 'MC', founded: 1964 },
  { id: 'lot', name: 'Los Tordos', city: 'Godoy Cruz', field: 'Tordos Park', followers: 3510, affiliates: 870, logo: 'LT', founded: 1961 },
  { id: 'peq', name: 'Peumayén RC', city: 'Mendoza', field: 'Campo Peumayén', followers: 2840, affiliates: 620, logo: 'PR', founded: 1972 },
  { id: 'brc', name: 'Banco RC', city: 'Mendoza', field: 'Cancha Banco', followers: 2200, affiliates: 540, logo: 'BR', founded: 1980 },
  { id: 'teq', name: 'Teqüe RC', city: 'San Rafael', field: 'Cancha Teqüe', followers: 1980, affiliates: 420, logo: 'TQ', founded: 1975 },
];

export const matches: Match[] = [
  { id: 1, home: 'Mendoza Rugby', homeId: 'mrc', away: 'Marista RC', awayId: 'mar', homeScore: 21, awayScore: 17, status: 'live', minute: "62'", date: '2026-06-13', time: '16:00', tournament: 'Top 8 Cuyo', venue: 'Cancha Central', country: 'Argentina', region: 'Cuyo' },
  { id: 2, home: 'Los Tordos', homeId: 'lot', away: 'Teqüe RC', awayId: 'teq', homeScore: 34, awayScore: 22, status: 'finished', date: '2026-06-08', time: '15:30', tournament: 'Top 8 Cuyo', venue: 'Tordos Park', country: 'Argentina', region: 'Cuyo' },
  { id: 3, home: 'Peumayén RC', homeId: 'peq', away: 'Banco RC', awayId: 'brc', status: 'upcoming', date: '2026-06-14', time: '16:00', tournament: 'Regional Plata', venue: 'Campo Peumayén', country: 'Argentina', region: 'Cuyo' },
  { id: 4, home: 'Mendoza Rugby', homeId: 'mrc', away: 'Los Tordos', awayId: 'lot', homeScore: 18, awayScore: 28, status: 'finished', date: '2026-06-01', time: '17:00', tournament: 'Top 8 Cuyo', venue: 'Cancha Central', country: 'Argentina', region: 'Cuyo' },
  { id: 5, home: 'Teqüe RC', homeId: 'teq', away: 'Peumayén RC', awayId: 'peq', homeScore: 12, awayScore: 15, status: 'finished', date: '2026-05-25', time: '15:30', tournament: 'Top 8 Cuyo', venue: 'Cancha Teqüe', country: 'Argentina', region: 'Cuyo' },
  { id: 6, home: 'Marista RC', homeId: 'mar', away: 'Banco RC', awayId: 'brc', status: 'upcoming', date: '2026-06-21', time: '16:30', tournament: 'Top 8 Cuyo', venue: 'Luján de Cuyo', country: 'Argentina', region: 'Cuyo' },
];

export const tournaments: Tournament[] = [
  { id: 't1', name: 'Top 8 Cuyo', status: 'active', teams: 8, category: 'Primera División', startDate: '2026-03-01' },
  { id: 't2', name: 'Regional Plata', status: 'active', teams: 12, category: 'Segunda División', startDate: '2026-04-15' },
  { id: 't3', name: 'Juveniles M18', status: 'upcoming', teams: 16, category: 'Juveniles', startDate: '2026-07-05' },
  { id: 't4', name: 'Copa Vendimia 2026', status: 'upcoming', teams: 8, category: 'Copa', startDate: '2026-08-01' },
  { id: 't5', name: 'Clausura 2025', status: 'finished', teams: 8, category: 'Primera División', startDate: '2025-08-01' },
];

export const tournamentTree: TournamentNode[] = [
  {
    id: 'americas',
    name: 'Américas',
    icon: '🌎',
    type: 'continent',
    children: [
      {
        id: 'argentina',
        name: 'Argentina',
        flag: '🇦🇷',
        type: 'country',
        children: [
          {
            id: 'uar-nacional',
            name: 'UAR — Nacional',
            type: 'region',
            children: [
              { id: 'nrc', name: 'Nacional de Clubes', type: 'competition', status: 'upcoming', teams: 16, category: 'Nacional', startDate: '2026-08-01' },
              { id: 'superliga', name: 'Súperliga Americana', type: 'competition', status: 'active', teams: 4, category: 'Internacional', startDate: '2026-02-01' },
            ],
          },
          {
            id: 'urba',
            name: 'URBA — Buenos Aires',
            type: 'region',
            children: [
              { id: 'top12urba', name: 'Top 12 URBA', type: 'competition', status: 'active', teams: 12, category: 'Primera División', startDate: '2026-03-15' },
              { id: 'copa-urba', name: 'Copa URBA', type: 'competition', status: 'active', teams: 8, category: 'Copa', startDate: '2026-04-01' },
              { id: 'juv-urba', name: 'Juveniles M19 URBA', type: 'competition', status: 'upcoming', teams: 16, category: 'Juveniles', startDate: '2026-07-01' },
            ],
          },
          {
            id: 'cuyo',
            name: 'Cuyo',
            type: 'region',
            children: [
              { id: 't1', name: 'Top 8 Cuyo', type: 'competition', status: 'active', teams: 8, category: 'Primera División', startDate: '2026-03-01' },
              { id: 't2', name: 'Regional Plata', type: 'competition', status: 'active', teams: 12, category: 'Segunda División', startDate: '2026-04-15' },
              { id: 't3', name: 'Juveniles M19', type: 'competition', status: 'upcoming', teams: 16, category: 'Juveniles', startDate: '2026-07-05' },
              { id: 't4', name: 'Copa Vendimia 2026', type: 'competition', status: 'upcoming', teams: 8, category: 'Copa', startDate: '2026-08-01' },
              { id: 't5', name: 'Clausura 2025', type: 'competition', status: 'finished', teams: 8, category: 'Primera División', startDate: '2025-08-01' },
            ],
          },
          {
            id: 'noa',
            name: 'NOA — Noroeste',
            type: 'region',
            children: [
              { id: 'camp-noa', name: 'Campeonato NOA', type: 'competition', status: 'active', teams: 10, category: 'Primera División', startDate: '2026-03-10' },
              { id: 'copa-norte', name: 'Copa Norte', type: 'competition', status: 'upcoming', teams: 8, category: 'Copa', startDate: '2026-07-15' },
            ],
          },
          {
            id: 'pam',
            name: 'PAM — Pampeana',
            type: 'region',
            children: [
              { id: 'camp-pam', name: 'Campeonato Pampeano', type: 'competition', status: 'active', teams: 14, category: 'Primera División', startDate: '2026-03-20' },
              { id: 'juv-pam', name: 'Juveniles M17', type: 'competition', status: 'upcoming', teams: 12, category: 'Juveniles', startDate: '2026-07-20' },
            ],
          },
        ],
      },
      {
        id: 'uruguay',
        name: 'Uruguay',
        flag: '🇺🇾',
        type: 'country',
        children: [
          {
            id: 'uru-union',
            name: 'Unión de Rugby del Uruguay',
            type: 'region',
            children: [
              { id: 'super10-uru', name: 'Súper 10 Uruguay', type: 'competition', status: 'active', teams: 10, category: 'Primera División', startDate: '2026-04-01' },
            ],
          },
        ],
      },
      {
        id: 'chile',
        name: 'Chile',
        flag: '🇨🇱',
        type: 'country',
        children: [
          {
            id: 'federugby',
            name: 'FederRugby Chile',
            type: 'region',
            children: [
              { id: 'liga-chile', name: 'Liga Nacional de Rugby', type: 'competition', status: 'active', teams: 8, category: 'Primera División', startDate: '2026-04-10' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'europe',
    name: 'Europa',
    icon: '🌍',
    type: 'continent',
    children: [
      {
        id: 'france',
        name: 'Francia',
        flag: '🇫🇷',
        type: 'country',
        children: [
          {
            id: 'lnr',
            name: 'Ligue Nationale de Rugby',
            type: 'region',
            children: [
              { id: 'top14', name: 'Top 14', type: 'competition', status: 'finished', teams: 14, category: 'Primera División', startDate: '2025-09-05' },
              { id: 'prod2', name: 'Pro D2', type: 'competition', status: 'finished', teams: 16, category: 'Segunda División', startDate: '2025-09-05' },
              { id: 'fed1', name: 'Fédérale 1', type: 'competition', status: 'finished', teams: 16, category: 'Tercera División', startDate: '2025-09-12' },
            ],
          },
        ],
      },
      {
        id: 'england',
        name: 'Inglaterra',
        flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        type: 'country',
        children: [
          {
            id: 'rfu',
            name: 'Rugby Football Union',
            type: 'region',
            children: [
              { id: 'prem', name: 'Gallagher Premiership', type: 'competition', status: 'active', teams: 10, category: 'Primera División', startDate: '2025-09-14' },
              { id: 'champ', name: 'Championship', type: 'competition', status: 'active', teams: 14, category: 'Segunda División', startDate: '2025-09-21' },
            ],
          },
        ],
      },
      {
        id: 'ireland',
        name: 'Irlanda',
        flag: '🇮🇪',
        type: 'country',
        children: [
          {
            id: 'irfu',
            name: 'Irish Rugby Football Union',
            type: 'region',
            children: [
              { id: 'urc', name: 'United Rugby Championship', type: 'competition', status: 'active', teams: 16, category: 'Internacional', startDate: '2025-09-20' },
              { id: 'ail', name: 'All-Ireland League', type: 'competition', status: 'active', teams: 20, category: 'Nacional', startDate: '2025-10-05' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'international',
    name: 'Internacional',
    icon: '🏆',
    type: 'continent',
    children: [
      {
        id: 'world-rugby-org',
        name: 'World Rugby',
        flag: '🌐',
        type: 'country',
        children: [
          {
            id: 'intl-comps',
            name: 'Competiciones Mundiales',
            type: 'region',
            children: [
              { id: 'rugby-champ', name: 'The Rugby Championship', type: 'competition', status: 'upcoming', teams: 4, category: 'Internacional', startDate: '2026-07-12' },
              { id: 'six-nations', name: 'Six Nations 2026', type: 'competition', status: 'finished', teams: 6, category: 'Internacional', startDate: '2026-02-01' },
              { id: 'wr-sevens', name: 'HSBC World Rugby Sevens', type: 'competition', status: 'active', teams: 12, category: 'Sevens', startDate: '2025-11-01' },
              { id: 'nations-cup', name: 'Autumn Nations Cup', type: 'competition', status: 'upcoming', teams: 8, category: 'Internacional', startDate: '2026-11-01' },
            ],
          },
        ],
      },
    ],
  },
];

export const players: Player[] = [
  { id: 'p1', name: 'Tomás Pérez', clubId: 'mrc', nationality: 'Argentina', category: 'Primera', position: 'Apertura' },
  { id: 'p2', name: 'Juan López', clubId: 'mar', nationality: 'Argentina', category: 'M19', position: 'Pilar' },
  { id: 'p3', name: 'Carlos Vera', clubId: 'lot', nationality: 'Argentina', category: 'Primera', position: 'Hooker' },
  { id: 'p4', name: 'Miguel Torres', clubId: 'peq', nationality: 'Argentina', category: 'Primera', position: 'Fly-half' },
];

export const seedUsers: User[] = [
  { id: 'admin', name: 'Admin GoRugby', email: 'admin@gorugby.com', password: 'admin123', role: 'admin', clubId: 'mrc', joinedAt: '2025-01-01', followedClubs: ['mrc', 'lot'], totalReviews: 8, totalPredictions: 15, bio: 'Administrador de la plataforma Go Rugby.' },
  { id: 'demo', name: 'Demo User', email: 'demo@gorugby.com', password: 'demo123', role: 'user', clubId: 'mar', joinedAt: '2025-03-15', followedClubs: ['mar'], totalReviews: 2, totalPredictions: 4, bio: 'Hincha fanático del rugby cuyano.' },
];

export const initialReviews: Review[] = [
  { id: 'r1', matchId: 2, userId: 'admin', userName: 'Admin GoRugby', rating: 5, comment: 'Partidazo de Los Tordos. Jugaron un rugby espectacular en la segunda mitad, con picks y goes irresistibles. ¡Excelente nivel!', createdAt: '2026-06-08T18:30:00', likes: 12, likedBy: [] },
  { id: 'r2', matchId: 2, userId: 'demo', userName: 'Demo User', rating: 4, comment: 'Muy buen partido, Teqüe se quedó sin aire en el último cuarto. La defensa de Los Tordos fue clave.', createdAt: '2026-06-08T19:00:00', likes: 5, likedBy: [] },
  { id: 'r3', matchId: 4, userId: 'demo', userName: 'Demo User', rating: 3, comment: 'Los Tordos remontó de manera increíble. Mendoza Rugby dominó la primera parte pero no pudo aguantar el ritmo.', createdAt: '2026-06-01T20:00:00', likes: 3, likedBy: [] },
];

export const initialPolls: Poll[] = [
  {
    id: 'poll1',
    question: '¿Quién ganará el Top 8 Cuyo 2026?',
    options: [
      { id: 'o1', text: 'Mendoza Rugby', votes: 142 },
      { id: 'o2', text: 'Los Tordos', votes: 98 },
      { id: 'o3', text: 'Marista RC', votes: 67 },
      { id: 'o4', text: 'Otro equipo', votes: 23 },
    ],
    expiresAt: '2026-06-30',
    voters: [],
  },
  {
    id: 'poll2',
    question: '¿Cuál es el mejor estadio de Cuyo?',
    options: [
      { id: 'o1', text: 'Tordos Park', votes: 89 },
      { id: 'o2', text: 'Cancha Central (MRC)', votes: 76 },
      { id: 'o3', text: 'Luján de Cuyo (Marista)', votes: 54 },
    ],
    expiresAt: '2026-06-20',
    voters: [],
  },
];

export const initialPosts: SocialPost[] = [
  {
    id: 'post1',
    userId: 'admin',
    userName: 'Admin GoRugby',
    userInitials: 'AG',
    text: '¡Qué partidazo en la Cancha Central! Mendoza Rugby vs Marista RC dominando el maul desde los 20 minutos del primer tiempo. El nivel del Top 8 este año está para destacar. 💪🏉 #TopOchoRugby',
    type: 'post',
    createdAt: '2026-06-13T16:30:00',
    likes: 47,
    likedBy: [],
    comments: [
      { id: 'c1', userId: 'demo', userName: 'Demo User', userInitials: 'DU', text: '¡Totalmente! El line out de Mendoza estuvo brutal, ganaron casi todos los propios', createdAt: '2026-06-13T16:45:00', likes: 8, likedBy: [] },
      { id: 'c2', userId: 'admin', userName: 'Admin GoRugby', userInitials: 'AG', text: 'Y el scrum también. Marista no pudo aguantar la presión en el segundo tiempo 🔥', createdAt: '2026-06-13T16:50:00', likes: 5, likedBy: [] },
    ],
    reposts: 12,
  },
  {
    id: 'poll-post1',
    userId: 'admin',
    userName: 'Admin GoRugby',
    userInitials: 'AG',
    text: '¿Quién creen que va a consagrarse campeón del Top 8 Cuyo 2026? El campeonato está muy reñido este año 🏆',
    type: 'poll',
    poll: {
      id: 'poll1',
      question: '¿Quién ganará el Top 8 Cuyo 2026?',
      options: [
        { id: 'o1', text: 'Mendoza Rugby', votes: 142 },
        { id: 'o2', text: 'Los Tordos', votes: 98 },
        { id: 'o3', text: 'Marista RC', votes: 67 },
        { id: 'o4', text: 'Otro equipo', votes: 23 },
      ],
      expiresAt: '2026-06-30',
      voters: [],
    },
    createdAt: '2026-06-11T09:00:00',
    likes: 89,
    likedBy: [],
    comments: [
      { id: 'c3', userId: 'demo', userName: 'Demo User', userInitials: 'DU', text: 'Voté Mendoza Rugby, pero Los Tordos me sorprendieron este año. ¡Cualquiera puede ganar!', createdAt: '2026-06-11T09:30:00', likes: 12, likedBy: [] },
      { id: 'c4', userId: 'admin', userName: 'Admin GoRugby', userInitials: 'AG', text: 'Los Tordos viene en gran momento pero Mendoza en casa es otro equipo 👀', createdAt: '2026-06-11T10:00:00', likes: 7, likedBy: [] },
    ],
    reposts: 34,
  },
  {
    id: 'post2',
    userId: 'demo',
    userName: 'Demo User',
    userInitials: 'DU',
    text: 'Analizando el Teqüe vs Los Tordos. Tremenda diferencia física en la segunda mitad. Teqüe se quedó sin nafta en el minuto 60 y Los Tordos aprovechó con 3 tries seguidos. Rugby de manual 🏉',
    type: 'post',
    createdAt: '2026-06-08T20:15:00',
    likes: 23,
    likedBy: [],
    comments: [],
    reposts: 5,
  },
  {
    id: 'poll-post2',
    userId: 'demo',
    userName: 'Demo User',
    userInitials: 'DU',
    text: 'Pregunta del día 🏟️ ¿Cuál es el mejor estadio de la región para ir a ver rugby?',
    type: 'poll',
    poll: {
      id: 'poll2',
      question: '¿Cuál es el mejor estadio de Cuyo?',
      options: [
        { id: 'o1', text: 'Tordos Park', votes: 89 },
        { id: 'o2', text: 'Cancha Central (MRC)', votes: 76 },
        { id: 'o3', text: 'Luján de Cuyo (Marista)', votes: 54 },
      ],
      expiresAt: '2026-06-20',
      voters: [],
    },
    createdAt: '2026-06-10T14:00:00',
    likes: 45,
    likedBy: [],
    comments: [
      { id: 'c5', userId: 'admin', userName: 'Admin GoRugby', userInitials: 'AG', text: 'Tordos Park tiene el mejor ambiente sin dudas, pero Cancha Central tiene la mejor superficie de césped', createdAt: '2026-06-10T14:30:00', likes: 18, likedBy: [] },
    ],
    reposts: 9,
  },
];

export const notifications: Notification[] = [
  { id: 'n1', text: 'Mendoza Rugby vs Marista RC está EN VIVO', time: 'Hace 5 min', read: false },
  { id: 'n2', text: 'Los Tordos ganó 34-22 contra Teqüe RC', time: 'Hace 4 días', read: false },
  { id: 'n3', text: 'Nueva encuesta: ¿Quién gana el Top 8?', time: 'Hace 2 días', read: true },
  { id: 'n4', text: 'Tu predicción fue correcta: Los Tordos ganó', time: 'Hace 4 días', read: true },
  { id: 'n5', text: 'Próximo partido: Peumayén vs Banco RC · Sáb 16:00', time: 'Hace 1 día', read: true },
];
