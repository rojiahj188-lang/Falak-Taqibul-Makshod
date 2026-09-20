import React from 'react';
import {
  Clock,
  Sparkles,
  Compass,
  Glasses,
  MapPin,
  Settings,
  CircleDot
} from 'lucide-react';
import { NavTab } from '../types';

interface MobileBottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenSettings: () => void;
  onOpenLocationModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenLocationModal
}) => {
  const primaryNavItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'jadwal', label: 'Jadwal', icon: Clock },
    { id: 'kalkulatorkiblat', label: 'Kiblat 1.02', icon: Sparkles },
    { id: 'kiblat', label: 'Kompas GPS', icon: Compass },
    { id: 'modebaca', label: 'Mode Baca', icon: Glasses },
    { id: 'peta', label: 'Peta Akurasi', icon: MapPin }
  ];

  return (
    <nav
      id="mobile-bottom-bar"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around select-none"
      style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom, 0px))' }}
      aria-label="Navigasi Bawah Seluler Android & iOS"
    >
      {primaryNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            id={`mobile-nav-${item.id}`}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative min-w-[58px] ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg transition ${isActive ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''}`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 leading-none">
              {item.label}
            </span>
            {isActive && (
              <span className="absolute -bottom-1 h-1 w-5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
