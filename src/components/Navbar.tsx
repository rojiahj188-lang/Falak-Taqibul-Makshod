import React from 'react';
import {
  Compass,
  Calendar,
  Calculator,
  BookOpen,
  MapPin,
  Moon,
  Sun,
  CloudCheck,
  CloudOff,
  Settings,
  Clock,
  CircleDot,
  Sparkles,
  Phone,
  Award
} from 'lucide-react';
import { CityLocation } from '../types';
import { KemenagLogo } from './KemenagLogo';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedCity: CityLocation;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  isOnline: boolean;
  cloudSyncStatus: 'synced' | 'pending' | 'offline';
  onOpenSettings: () => void;
  onOpenLocationModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedCity,
  darkMode,
  setDarkMode,
  isOnline,
  cloudSyncStatus,
  onOpenSettings,
  onOpenLocationModal
}) => {
  const tabs = [
    { id: 'jadwal', label: 'Jadwal Salat', icon: Clock },
    { id: 'kalkulatorkiblat', label: 'Kalkulator Kiblat 1.02', icon: Sparkles, badge: 'Baru' },
    { id: 'sertifikat', label: 'Sertifikat Kiblat', icon: Award, badge: 'PDF' },
    { id: 'kiblat', label: 'Arah Kiblat & GPS', icon: Compass },
    { id: 'rubu', label: "Rubu' Mujayyab", icon: CircleDot },
    { id: 'kalender', label: 'Kalender Hijriah', icon: Calendar },
    { id: 'kalkulator', label: 'Kalkulator Falak', icon: Calculator },
    { id: 'panduan', label: 'Panduan Kitab', icon: BookOpen }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/95 shadow-sm">
      {/* Institutional Top Ribbon with Kemenag RI and KUA Gerung */}
      <div className="bg-emerald-900 text-white text-[11px] py-1 px-4 sm:px-8 border-b border-emerald-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 truncate">
          <KemenagLogo size={18} className="shrink-0" />
          <span className="font-semibold text-emerald-100 truncate">
            KUA Kecamatan Gerung • Kemenag Kab. Lombok Barat (IPARI Lobar)
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-emerald-200 text-[10px] sm:text-[11px]">
          <span className="hidden md:inline">Pengembang: <strong>Husni, S. Kom. I</strong> (Penyuluh Agama Islam)</span>
          <a
            href="https://wa.me/6281915949627"
            target="_blank"
            rel="noreferrer"
            className="text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1"
          >
            <Phone className="h-3 w-3" />
            <span>081915949627</span>
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('jadwal')}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-neutral-800 shadow ring-1 ring-emerald-500/20 shrink-0 p-1">
              <KemenagLogo size={36} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-neutral-900 dark:text-white">
                  Falak Taqribul Maqshad
                </h1>
                <span className="hidden rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20 sm:inline-block dark:bg-emerald-950/50 dark:text-emerald-300">
                  Versi 1.02
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-serif line-clamp-1">
                KUA Kec. Gerung Lombok Barat NTB • تقريب المقصد
              </p>
            </div>
          </div>

          {/* Quick Location & Status Info */}
          <div className="flex items-center gap-2">
            <button
              id="btn-nav-location"
              onClick={onOpenLocationModal}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50/80 px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-200 dark:hover:bg-neutral-800 shadow-xs"
              title="Ganti Lokasi atau Koordinat GPS"
            >
              <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="max-w-[120px] truncate sm:max-w-[180px] font-semibold">
                {selectedCity.name}
              </span>
            </button>

            {/* Cloud Sync Badge */}
            <div
              className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs ${
                cloudSyncStatus === 'synced'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
              }`}
              title={isOnline ? 'Data tersinkronisasi aman di awan' : 'Mode Offline Aktif'}
            >
              {isOnline ? (
                <CloudCheck className="h-3.5 w-3.5" />
              ) : (
                <CloudOff className="h-3.5 w-3.5" />
              )}
              <span className="hidden md:inline font-medium">
                {isOnline ? 'Awan' : 'Offline'}
              </span>
            </div>

            {/* Dark Mode Toggle */}
            <button
              id="btn-dark-toggle"
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-lg p-2 text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Settings Modal Toggle */}
            <button
              id="btn-settings-toggle"
              onClick={onOpenSettings}
              className="rounded-lg p-2 text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              aria-label="Pengaturan"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Minimalist Horizontal Tab Navigation */}
        <nav className="flex space-x-1.5 overflow-x-auto py-2 no-scrollbar border-t border-neutral-100 dark:border-neutral-800/60">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition relative ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-neutral-950 font-black text-[9px] rounded-full uppercase">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
