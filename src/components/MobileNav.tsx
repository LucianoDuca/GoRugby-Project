import React from 'react';
import { Home, CalendarDays, MessageCircle, UserRound, MoreHorizontal, Shield } from 'lucide-react';
import { Section } from '../app/main';

interface Props {
  section:    Section;
  setSection: (s: Section) => void;
}

const TABS: { id: Section; label: string; Icon: React.ElementType }[] = [
  { id: 'home',      label: 'Inicio',    Icon: Home },
  { id: 'matches',   label: 'Partidos',  Icon: CalendarDays },
  { id: 'community', label: 'Comunidad', Icon: MessageCircle },
  { id: 'clubs',     label: 'Clubes',    Icon: Shield },
  { id: 'profile',   label: 'Perfil',    Icon: UserRound },
];

export default function MobileNav({ section, setSection }: Props) {
  return (
    <nav className="mobile-nav">
      {TABS.map(({ id, label, Icon }) => {
        const active = section === id;
        return (
          <button
            key={id}
            className={`mobile-nav-btn${active ? ' active' : ''}`}
            onClick={() => setSection(id)}
          >
            {active && <div className="mobile-nav-indicator" />}
            <Icon size={20} />
            <span className="mobile-nav-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
