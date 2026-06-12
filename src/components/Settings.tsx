import React, { useState } from 'react';
import { useTheme, AccentColor, ThemeMode, FontSize } from '../app/main';
import { useAuth } from '../app/main';

const ACCENTS: { id: AccentColor; color: string; label: string }[] = [
  { id: 'green',  color: '#059669', label: 'Esmeralda' },
  { id: 'blue',   color: '#2563eb', label: 'Azul' },
  { id: 'purple', color: '#7c3aed', label: 'Violeta' },
  { id: 'red',    color: '#dc2626', label: 'Rojo' },
  { id: 'gold',   color: '#d97706', label: 'Dorado' },
  { id: 'cyan',   color: '#0891b2', label: 'Cian' },
];

export default function Settings() {
  const { theme, accent, fontSize, setTheme, setAccent, setFontSize } = useTheme();
  const { user, updateUser } = useAuth();

  // Notification prefs (persisted in localStorage)
  const [notifMatch,    setNotifMatch]    = useState(() => JSON.parse(localStorage.getItem('notif_match')    ?? 'true'));
  const [notifCommunity,setNotifCommunity]= useState(() => JSON.parse(localStorage.getItem('notif_community')  ?? 'true'));
  const [notifNews,     setNotifNews]     = useState(() => JSON.parse(localStorage.getItem('notif_news')     ?? 'false'));
  const [notifPredict,  setNotifPredict]  = useState(() => JSON.parse(localStorage.getItem('notif_predict')  ?? 'true'));
  const [publicProfile, setPublicProfile] = useState(() => JSON.parse(localStorage.getItem('profile_public') ?? 'true'));

  const persistNotif = (key: string, val: boolean) => localStorage.setItem(key, JSON.stringify(val));

  return (
    <div style={{ maxWidth: 680 }}>

      {/* Apariencia */}
      <div className="settings-section">
        <h3>Apariencia</h3>

        <div className="settings-row">
          <div>
            <div className="settings-label">Tema</div>
            <div className="settings-desc">Cambia entre modo claro, oscuro o automático</div>
          </div>
          <div className="radio-group">
            {([['light','☀️ Claro'],['dark','🌙 Oscuro'],['system','⚙️ Auto']] as [ThemeMode,string][]).map(([id,label]) => (
              <button key={id} className={`radio-btn${theme === id ? ' selected' : ''}`} onClick={() => setTheme(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-label">Color de acento</div>
            <div className="settings-desc">Personaliza el color principal de la interfaz</div>
          </div>
          <div className="accent-swatches">
            {ACCENTS.map(a => (
              <button
                key={a.id}
                className={`accent-swatch${accent === a.id ? ' selected' : ''}`}
                style={{ background: a.color }}
                title={a.label}
                onClick={() => setAccent(a.id)}
              />
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-label">Tamaño de texto</div>
            <div className="settings-desc">Ajusta la legibilidad del contenido</div>
          </div>
          <div className="radio-group">
            {([['normal','Normal'],['large','Grande'],['xlarge','Muy grande']] as [FontSize,string][]).map(([id,label]) => (
              <button key={id} className={`radio-btn${fontSize === id ? ' selected' : ''}`} onClick={() => setFontSize(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Idioma */}
      <div className="settings-section">
        <h3>Idioma</h3>
        <div className="settings-row">
          <div>
            <div className="settings-label">Idioma de la aplicación</div>
            <div className="settings-desc">Cambia el idioma en toda la plataforma</div>
          </div>
          <div className="radio-group">
            <button className="radio-btn selected">🇦🇷 Español</button>
            <button className="radio-btn" style={{ opacity: 0.5, cursor: 'not-allowed' }}>🇬🇧 English</button>
            <button className="radio-btn" style={{ opacity: 0.5, cursor: 'not-allowed' }}>🇧🇷 Português</button>
          </div>
        </div>
      </div>

      {/* Notificaciones */}
      <div className="settings-section">
        <h3>Notificaciones</h3>
        <NotifRow label="Partidos en vivo"    desc="Alertas cuando comienza un partido de tu club"     on={notifMatch}     toggle={() => { setNotifMatch((v: boolean) => !v);     persistNotif('notif_match', !notifMatch); }} />
        <NotifRow label="Comunidad"           desc="Respuestas a tus reseñas y predicciones"          on={notifCommunity} toggle={() => { setNotifCommunity((v: boolean) => !v); persistNotif('notif_community', !notifCommunity); }} />
        <NotifRow label="Noticias de clubes"  desc="Publicaciones de los clubes que seguís"           on={notifNews}      toggle={() => { setNotifNews((v: boolean) => !v);      persistNotif('notif_news', !notifNews); }} />
        <NotifRow label="Predicciones"        desc="Resultados de tus predicciones al finalizar"      on={notifPredict}   toggle={() => { setNotifPredict((v: boolean) => !v);   persistNotif('notif_predict', !notifPredict); }} />
      </div>

      {/* Privacidad */}
      <div className="settings-section">
        <h3>Privacidad</h3>
        <div className="settings-row">
          <div>
            <div className="settings-label">Perfil público</div>
            <div className="settings-desc">Otros usuarios pueden ver tu perfil y reseñas</div>
          </div>
          <button
            className={`toggle${publicProfile ? ' on' : ''}`}
            onClick={() => { setPublicProfile((v: boolean) => !v); localStorage.setItem('profile_public', JSON.stringify(!publicProfile)); }}
          />
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Mostrar club favorito</div>
            <div className="settings-desc">Visible en tu perfil público</div>
          </div>
          <button className="toggle on" />
        </div>
      </div>

      {/* Cuenta */}
      <div className="settings-section">
        <h3>Cuenta</h3>
        <div className="admin-stat-row">
          <span>Email</span>
          <strong style={{ fontSize: 13 }}>{user?.email}</strong>
        </div>
        <div className="admin-stat-row">
          <span>Miembro desde</span>
          <strong>{user?.joinedAt}</strong>
        </div>
        <div className="admin-stat-row">
          <span>Rol</span>
          <span className={`tag ${user?.role === 'admin' ? 'tag-red' : 'tag-green'}`}>
            {user?.role === 'admin' ? 'Administrador' : 'Aficionado'}
          </span>
        </div>
      </div>

      {/* Zona de peligro */}
      <div className="settings-section">
        <h3>Zona de peligro</h3>
        <div className="settings-row">
          <div>
            <div className="settings-label">Eliminar cuenta</div>
            <div className="settings-desc">Acción permanente e irreversible</div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => alert('Esta funcionalidad requiere confirmación por email.')}>
            Eliminar cuenta
          </button>
        </div>
      </div>

    </div>
  );
}

function NotifRow({ label, desc, on, toggle }: { label: string; desc: string; on: boolean; toggle: () => void }) {
  return (
    <div className="settings-row">
      <div>
        <div className="settings-label">{label}</div>
        <div className="settings-desc">{desc}</div>
      </div>
      <button className={`toggle${on ? ' on' : ''}`} onClick={toggle} />
    </div>
  );
}
