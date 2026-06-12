import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Menu, Trophy, Users, Shield, CalendarDays, MessageCircle, Settings, Lock, Bell, Search, UserRound } from 'lucide-react';
import '../styles/styles.css';
import { matches, clubs, tournaments, players, notifications } from '../data/mockData';

type Section = 'home' | 'matches' | 'community' | 'tournaments' | 'clubs' | 'profile' | 'admin' | 'settings';

const nav = [
  { id: 'home', label: 'Inicio', icon: Trophy },
  { id: 'matches', label: 'Partidos', icon: CalendarDays },
  { id: 'community', label: 'Comunidad', icon: MessageCircle },
  { id: 'tournaments', label: 'Torneos', icon: Trophy },
  { id: 'clubs', label: 'Clubes', icon: Shield },
  { id: 'profile', label: 'Mi Perfil', icon: UserRound },
  { id: 'admin', label: 'Panel Admin', icon: Lock },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

function App() {
  const [section, setSection] = useState<Section>('home');
  const [query, setQuery] = useState('');
  const filteredClubs = useMemo(() => clubs.filter(c => c.name.toLowerCase().includes(query.toLowerCase())), [query]);

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="logo">GR</div><div><strong>Go Rugby</strong><span>Community App</span></div></div>
      <nav>{nav.map(item => { const Icon = item.icon; return <button className={section === item.id ? 'active' : ''} onClick={() => setSection(item.id as Section)} key={item.id}><Icon size={18}/>{item.label}</button> })}</nav>
    </aside>
    <main>
      <header className="topbar"><button className="icon"><Menu /></button><div><h1>{nav.find(n => n.id === section)?.label}</h1><p>Esqueleto base basado en tu diagrama: usuario, admin, clubes, partidos, torneos, comunidad y ajustes.</p></div></header>
      {section === 'home' && <Home />}
      {section === 'matches' && <Matches />}
      {section === 'community' && <Community />}
      {section === 'tournaments' && <Tournaments />}
      {section === 'clubs' && <Clubs query={query} setQuery={setQuery} filteredClubs={filteredClubs} />}
      {section === 'profile' && <Profile />}
      {section === 'admin' && <Admin />}
      {section === 'settings' && <SettingsPage />}
    </main>
  </div>
}

function Home(){return <section className="grid"><Card title="Partidos en vivo" value="3"/><Card title="Clubes registrados" value={String(clubs.length)}/><Card title="Torneos activos" value={String(tournaments.length)}/><Card title="Afiliados totales" value="12.430"/><div className="panel wide"><h2>Ranking de clubes</h2>{clubs.map((c,i)=><div className="row" key={c.name}><b>#{i+1} {c.name}</b><span>{c.followers} seguidores</span></div>)}</div><div className="panel"><h2>Notificaciones</h2>{notifications.map(n=><p className="notice" key={n}>{n}</p>)}</div></section>}
function Matches(){return <section className="panel"><h2>Partidos</h2><div className="cards">{matches.map(m=><article className="match" key={m.id}><span className="badge">{m.status}</span><h3>{m.home} vs {m.away}</h3><p>{m.score}</p><small>{m.tournament}</small></article>)}</div></section>}
function Community(){return <section className="grid"><div className="panel"><h2>Encuestas</h2><p>¿Quién gana el clásico?</p><button>Votar</button></div><div className="panel"><h2>Predicciones</h2><p>Publicá tu predicción antes del partido.</p><button>Nueva predicción</button></div><div className="panel wide"><h2>Jugadores</h2>{players.map(p=><div className="row" key={p.name}><b>{p.name}</b><span>{p.club} · {p.category} · {p.nationality}</span></div>)}</div></section>}
function Tournaments(){return <section className="panel"><h2>Torneos</h2>{tournaments.map(t=><div className="row" key={t.name}><b>{t.name}</b><span>{t.status} · {t.teams} equipos</span></div>)}</section>}
function Clubs({query,setQuery,filteredClubs}: any){return <section className="panel"><div className="search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar club..."/></div>{filteredClubs.map((c:any)=><article className="club" key={c.name}><img src={c.logo}/><div><h3>{c.name}</h3><p>{c.city} · {c.field}</p><small>{c.followers} seguidores · {c.affiliates} afiliados</small></div><button>Afiliarme</button></article>)}</section>}
function Profile(){return <section className="grid"><div className="panel"><h2>Registro / Login</h2><input placeholder="Email"/><input placeholder="Contraseña" type="password"/><button>Ingresar</button></div><div className="panel"><h2>Mi club</h2><p>Club afiliado: Mendoza Rugby</p><p>Favoritos: 4</p></div><div className="panel wide"><h2>Notificaciones</h2>{notifications.map(n=><p className="notice" key={n}>{n}</p>)}</div></section>}
function Admin(){return <section className="grid admin"><AdminBox title="Gestión Usuarios" items={['Credenciales','Roles','Afiliaciones','Pagos']}/><AdminBox title="Gestión Clubes" items={['Crear Club','Editar Club','Estadísticas','Noticias']}/><AdminBox title="Gestión Partidos" items={['Crear Partido','Info']}/><AdminBox title="Gestión Torneos" items={['Crear Torneo','Historial','Estadísticas']}/><AdminBox title="Gestionar Noticias" items={['Crear Noticia','Editar Noticia','Eliminar Noticia']}/></section>}
function SettingsPage(){return <section className="grid"><AdminBox title="Idioma" items={['Portugués','Español','Inglés']}/><AdminBox title="Aspecto" items={['Oscuro','Claro','Automático']}/><AdminBox title="Cuenta" items={['Nombre','Contraseña','Añadir foto']}/></section>}
function Card({title,value}:{title:string,value:string}){return <div className="stat"><span>{title}</span><strong>{value}</strong></div>}
function AdminBox({title,items}:{title:string,items:string[]}){return <div className="panel"><h2>{title}</h2>{items.map(i=><button className="block" key={i}>{i}</button>)}</div>}

createRoot(document.getElementById('root')!).render(<App />);
