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
  { id: 1, home: 'Mendoza Rugby', homeId: 'mrc', away: 'Marista RC', awayId: 'mar', homeScore: 21, awayScore: 17, status: 'live', minute: "62'", date: '2026-06-12', time: '16:00', tournament: 'Top 8 Cuyo', venue: 'Cancha Central' },
  { id: 2, home: 'Los Tordos', homeId: 'lot', away: 'Teqüe RC', awayId: 'teq', homeScore: 34, awayScore: 22, status: 'finished', date: '2026-06-08', time: '15:30', tournament: 'Top 8 Cuyo', venue: 'Tordos Park' },
  { id: 3, home: 'Peumayén RC', homeId: 'peq', away: 'Banco RC', awayId: 'brc', status: 'upcoming', date: '2026-06-14', time: '16:00', tournament: 'Regional Plata', venue: 'Campo Peumayén' },
  { id: 4, home: 'Mendoza Rugby', homeId: 'mrc', away: 'Los Tordos', awayId: 'lot', homeScore: 18, awayScore: 28, status: 'finished', date: '2026-06-01', time: '17:00', tournament: 'Top 8 Cuyo', venue: 'Cancha Central' },
  { id: 5, home: 'Teqüe RC', homeId: 'teq', away: 'Peumayén RC', awayId: 'peq', homeScore: 12, awayScore: 15, status: 'finished', date: '2026-05-25', time: '15:30', tournament: 'Top 8 Cuyo', venue: 'Cancha Teqüe' },
  { id: 6, home: 'Marista RC', homeId: 'mar', away: 'Banco RC', awayId: 'brc', status: 'upcoming', date: '2026-06-21', time: '16:30', tournament: 'Top 8 Cuyo', venue: 'Luján de Cuyo' },
];

export const tournaments: Tournament[] = [
  { id: 't1', name: 'Top 8 Cuyo', status: 'active', teams: 8, category: 'Primera División', startDate: '2026-03-01' },
  { id: 't2', name: 'Regional Plata', status: 'active', teams: 12, category: 'Segunda División', startDate: '2026-04-15' },
  { id: 't3', name: 'Juveniles M18', status: 'upcoming', teams: 16, category: 'Juveniles', startDate: '2026-07-05' },
  { id: 't4', name: 'Copa Vendimia 2026', status: 'upcoming', teams: 8, category: 'Copa', startDate: '2026-08-01' },
  { id: 't5', name: 'Clausura 2025', status: 'finished', teams: 8, category: 'Primera División', startDate: '2025-08-01' },
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
    question: '¿Cuál es el mejor estadio de la región?',
    options: [
      { id: 'o1', text: 'Tordos Park', votes: 89 },
      { id: 'o2', text: 'Cancha Central (MRC)', votes: 76 },
      { id: 'o3', text: 'Luján de Cuyo (Marista)', votes: 54 },
    ],
    expiresAt: '2026-06-20',
    voters: [],
  },
];

export const notifications: Notification[] = [
  { id: 'n1', text: 'Mendoza Rugby vs Marista RC está EN VIVO', time: 'Hace 5 min', read: false },
  { id: 'n2', text: 'Los Tordos ganó 34-22 contra Teqüe RC', time: 'Hace 4 días', read: false },
  { id: 'n3', text: 'Nueva encuesta: ¿Quién gana el Top 8?', time: 'Hace 2 días', read: true },
  { id: 'n4', text: 'Tu predicción fue correcta: Los Tordos ganó', time: 'Hace 4 días', read: true },
  { id: 'n5', text: 'Próximo partido: Peumayén vs Banco RC · Sáb 16:00', time: 'Hace 1 día', read: true },
];
