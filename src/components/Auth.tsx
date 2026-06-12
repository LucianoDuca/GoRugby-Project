import React, { useState } from 'react';
import { useAuth } from '../app/main';
import { clubs } from '../data/mockData';

type Tab = 'login' | 'signup';

export default function Auth() {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState<Tab>('login');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupClub, setSignupClub] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  const switchTab = (t: Tab) => {
    setTab(t);
    setLoginError('');
    setSignupError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) { setLoginError('Completá todos los campos'); return; }
    setLoginLoading(true);
    setLoginError('');
    const result = await login(loginEmail, loginPassword);
    setLoginLoading(false);
    if (!result.success) setLoginError(result.message ?? 'Error al iniciar sesión');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword) {
      setSignupError('Completá todos los campos obligatorios'); return;
    }
    if (signupPassword !== signupConfirm) { setSignupError('Las contraseñas no coinciden'); return; }
    if (signupPassword.length < 6) { setSignupError('La contraseña debe tener al menos 6 caracteres'); return; }
    setSignupLoading(true);
    setSignupError('');
    const result = await signup({ name: signupName.trim(), email: signupEmail.trim(), password: signupPassword, clubId: signupClub || undefined });
    setSignupLoading(false);
    if (!result.success) setSignupError(result.message ?? 'Error al registrarse');
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-logo-big">GR</div>
        <h2>Go Rugby</h2>
        <p>La comunidad digital para aficionados del rugby en Cuyo y toda Argentina</p>
        <div className="auth-features">
          <div className="auth-feature"><div className="auth-feature-dot" /><span>Resultados en tiempo real</span></div>
          <div className="auth-feature"><div className="auth-feature-dot" /><span>Reseñas y valoraciones de partidos</span></div>
          <div className="auth-feature"><div className="auth-feature-dot" /><span>Encuestas y predicciones</span></div>
          <div className="auth-feature"><div className="auth-feature-dot" /><span>Comunidad de aficionados</span></div>
        </div>
      </div>

      <div className="auth-form-side">
        <h1>{tab === 'login' ? 'Bienvenido de vuelta' : 'Crear cuenta'}</h1>
        <p>{tab === 'login' ? 'Ingresá a tu cuenta para continuar' : 'Unite a la comunidad Go Rugby'}</p>

        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => switchTab('login')}>Iniciar sesión</button>
          <button className={`auth-tab${tab === 'signup' ? ' active' : ''}`} onClick={() => switchTab('signup')}>Registrarse</button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="tu@email.com" className={loginError ? 'error' : ''} autoComplete="email" />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" className={loginError ? 'error' : ''} autoComplete="current-password" />
            </div>
            {loginError && <p className="form-error">{loginError}</p>}
            <button type="submit" className="btn btn-primary full" disabled={loginLoading}>
              {loginLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
            <div className="auth-hint">
              Demo admin: admin@gorugby.com / admin123<br />
              Demo usuario: demo@gorugby.com / demo123
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label>Nombre completo *</label>
              <input type="text" value={signupName} onChange={e => setSignupName(e.target.value)} placeholder="Ej: Juan García" autoComplete="name" />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} placeholder="tu@email.com" autoComplete="email" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Contraseña *</label>
                <input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} placeholder="Mín. 6 caracteres" autoComplete="new-password" />
              </div>
              <div className="form-group">
                <label>Confirmar contraseña *</label>
                <input type="password" value={signupConfirm} onChange={e => setSignupConfirm(e.target.value)} placeholder="Repetir contraseña" autoComplete="new-password" />
              </div>
            </div>
            <div className="form-group">
              <label>Club de preferencia (opcional)</label>
              <select value={signupClub} onChange={e => setSignupClub(e.target.value)}>
                <option value="">Seleccionar club...</option>
                {clubs.map(c => <option key={c.id} value={c.id}>{c.name} — {c.city}</option>)}
              </select>
            </div>
            {signupError && <p className="form-error">{signupError}</p>}
            <button type="submit" className="btn btn-primary full" disabled={signupLoading}>
              {signupLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
