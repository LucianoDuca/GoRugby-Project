import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/styles.css';
import { seedUsers, User } from '../data/mockData';
import { NormalisedMatch } from '../services/rugbyApi';
import { espnApi } from '../services/espnApi';
import Auth from '../components/Auth';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import MobileNav from '../components/MobileNav';
import Home from '../components/Home';
import Matches from '../components/Matches';
import Community from '../components/Community';
import Profile from '../components/Profile';
import Clubs from '../components/Clubs';
import Tournaments from '../components/Tournaments';
import Admin from '../components/Admin';
import Settings from '../components/Settings';
import Highlights from '../components/Highlights';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Section = 'home' | 'matches' | 'community' | 'tournaments' | 'clubs' | 'highlights' | 'profile' | 'admin' | 'settings';

// ─── Auth Context ─────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  login:      (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup:     (data: { name: string; email: string; password: string; clubId?: string }) => Promise<{ success: boolean; message?: string }>;
  logout:     () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => useContext(AuthContext)!;

// ─── Theme Context ────────────────────────────────────────────────────────────

export type ThemeMode   = 'light' | 'dark' | 'system';
export type AccentColor = 'green' | 'blue' | 'purple' | 'red' | 'gold' | 'cyan';
export type FontSize    = 'normal' | 'large' | 'xlarge';

interface ThemeContextType {
  theme:       ThemeMode;
  accent:      AccentColor;
  fontSize:    FontSize;
  setTheme:    (t: ThemeMode) => void;
  setAccent:   (a: AccentColor) => void;
  setFontSize: (f: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);
export const useTheme = () => useContext(ThemeContext)!;

// ─── Live Context ─────────────────────────────────────────────────────────────

interface LiveContextType {
  liveCount:    number;
  liveMatches:  NormalisedMatch[];
  todayMatches: NormalisedMatch[];
  apiOnline:    boolean;
}

const LiveContext = createContext<LiveContextType>({ liveCount: 0, liveMatches: [], todayMatches: [], apiOnline: true });
export const useLive = () => useContext(LiveContext);;

// ─── Persistence helpers ──────────────────────────────────────────────────────

function getUsers(): User[] {
  try {
    const s = localStorage.getItem('gorugby_users');
    if (s) return JSON.parse(s);
  } catch { /* ignore */ }
  localStorage.setItem('gorugby_users', JSON.stringify(seedUsers));
  return [...seedUsers];
}
function saveUsers(u: User[]) { localStorage.setItem('gorugby_users', JSON.stringify(u)); }

function store<T>(key: string, val: T) { localStorage.setItem(key, JSON.stringify(val)); }
function load<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); if (s !== null) return JSON.parse(s) as T; } catch { /* ignore */ }
  return fallback;
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(() => {
    try {
      const id = localStorage.getItem('gorugby_session');
      if (id) { const u = getUsers(); return u.find(x => x.id === id) ?? null; }
    } catch { /* ignore */ }
    return null;
  });
  const [section, setSection] = useState<Section>('home');

  // Theme state
  const [theme,    setThemeState]    = useState<ThemeMode>  (() => load('gorugby_theme',    'light'));
  const [accent,   setAccentState]   = useState<AccentColor>(() => load('gorugby_accent',   'green'));
  const [fontSize, setFontSizeState] = useState<FontSize>   (() => load('gorugby_fontsize', 'normal'));

  // Live data — fetched once per 5 min, shared via LiveContext
  const [todayMatches, setTodayMatches] = useState<NormalisedMatch[]>([]);
  const [apiOnline,    setApiOnline]    = useState(true);

  useEffect(() => {
    if (!user) return;
    const doFetch = () =>
      espnApi.getTodayGames()
        .then(d => { setTodayMatches(d); setApiOnline(true); })
        .catch(() => setApiOnline(false));
    doFetch();
    const id = setInterval(doFetch, 5 * 60_000);
    return () => clearInterval(id);
  }, [user]);

  const liveMatches = todayMatches.filter(m => m.status === 'live');
  const liveCtx: LiveContextType = { liveCount: liveMatches.length, liveMatches, todayMatches, apiOnline };

  // Apply theme to DOM
  useEffect(() => {
    const resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.setAttribute('data-theme',    resolved);
    document.documentElement.setAttribute('data-accent',   accent);
    document.documentElement.setAttribute('data-fontsize', fontSize);
  }, [theme, accent, fontSize]);

  const setTheme    = useCallback((t: ThemeMode)   => { setThemeState(t);    store('gorugby_theme',    t); }, []);
  const setAccent   = useCallback((a: AccentColor)  => { setAccentState(a);   store('gorugby_accent',   a); }, []);
  const setFontSize = useCallback((f: FontSize)     => { setFontSizeState(f); store('gorugby_fontsize', f); }, []);

  // Auth handlers
  const login = useCallback(async (email: string, password: string) => {
    const users = getUsers();
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return { success: false, message: 'Email o contraseña incorrectos' };
    localStorage.setItem('gorugby_session', found.id);
    setUser(found);
    return { success: true };
  }, []);

  const signup = useCallback(async (data: { name: string; email: string; password: string; clubId?: string }) => {
    const users = getUsers();
    if (users.find(u => u.email === data.email))
      return { success: false, message: 'Este email ya está registrado' };
    const nu: User = {
      id: `u_${Date.now()}`, name: data.name, email: data.email, password: data.password,
      role: 'user', clubId: data.clubId || undefined,
      joinedAt: new Date().toISOString().split('T')[0],
      followedClubs: data.clubId ? [data.clubId] : [],
      totalReviews: 0, totalPredictions: 0,
    };
    saveUsers([...users, nu]);
    localStorage.setItem('gorugby_session', nu.id);
    setUser(nu);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('gorugby_session');
    setUser(null);
    setSection('home');
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    if (!user) return;
    const updated: User = { ...user, ...data };
    const users = getUsers();
    saveUsers(users.map(u => u.id === updated.id ? updated : u));
    localStorage.setItem('gorugby_session', updated.id);
    setUser(updated);
  }, [user]);

  const authCtx: AuthContextType  = { user, login, signup, logout, updateUser };
  const themeCtx: ThemeContextType = { theme, accent, fontSize, setTheme, setAccent, setFontSize };

  if (!user) {
    return (
      <ThemeContext.Provider value={themeCtx}>
        <AuthContext.Provider value={authCtx}>
          <Auth />
        </AuthContext.Provider>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={themeCtx}>
      <AuthContext.Provider value={authCtx}>
        <LiveContext.Provider value={liveCtx}>
          <div className="app-shell">
            <Sidebar section={section} setSection={setSection} />
            <div className="main-content">
              <TopBar section={section} setSection={setSection} />
              <div className="page-content">
                {section === 'home'        && <Home setSection={setSection} />}
                {section === 'matches'     && <Matches />}
                {section === 'community'   && <Community />}
                {section === 'tournaments' && <Tournaments />}
                {section === 'clubs'       && <Clubs />}
                {section === 'highlights'  && <Highlights />}
                {section === 'profile'     && <Profile />}
                {section === 'admin'       && user.role === 'admin' && <Admin />}
                {section === 'settings'    && <Settings />}
              </div>
            </div>
            <MobileNav section={section} setSection={setSection} />
          </div>
        </LiveContext.Provider>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
