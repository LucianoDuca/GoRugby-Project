export const clubs = [
  { name: 'Mendoza Rugby', city: 'Mendoza', field: 'Cancha Central', followers: 4210, affiliates: 1220, logo: 'https://placehold.co/72x72?text=MR' },
  { name: 'Marista RC', city: 'Mendoza', field: 'Luján', followers: 3890, affiliates: 980, logo: 'https://placehold.co/72x72?text=MC' },
  { name: 'Los Tordos', city: 'Godoy Cruz', field: 'Tordos Park', followers: 3510, affiliates: 870, logo: 'https://placehold.co/72x72?text=LT' },
];
export const matches = [
  { id: 1, home: 'Mendoza Rugby', away: 'Marista RC', score: '21 - 17', status: 'En vivo', tournament: 'Top 8 Cuyo' },
  { id: 2, home: 'Los Tordos', away: 'Teqüe', score: 'Final 34 - 22', status: 'Finalizado', tournament: 'Top 8 Cuyo' },
  { id: 3, home: 'Peumayén', away: 'Banco RC', score: 'Sábado 16:00', status: 'Próximo', tournament: 'Regional' },
];
export const tournaments = [
  { name: 'Top 8 Cuyo', status: 'Activo', teams: 8 },
  { name: 'Regional Plata', status: 'Activo', teams: 12 },
  { name: 'Juveniles M18', status: 'Próximo', teams: 16 },
];
export const players = [
  { name: 'Tomás Pérez', club: 'Mendoza Rugby', nationality: 'Argentina', category: 'Primera' },
  { name: 'Juan López', club: 'Marista RC', nationality: 'Argentina', category: 'M19' },
];
export const notifications = ['Comenzó el partido', 'Resultado final disponible', 'Nueva noticia publicada', 'Tu club publicó algo', 'Tu predicción acertó'];
