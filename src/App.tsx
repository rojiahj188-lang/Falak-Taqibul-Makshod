import React, { useState, useEffect, useRef } from 'react';
import {
  loadStoredSettings,
  saveStoredSettings,
  listenOfflineOnline
} from './utils/storageEngine';
import { AppSettings, CityLocation, FavoriteLocation, NavTab } from './types';
import { Navbar } from './components/Navbar';
import { PrayerScheduleView } from './components/PrayerScheduleView';
import { QiblaCompassView } from './components/QiblaCompassView';
import { KalkulatorArahKiblat102 } from './components/KalkulatorArahKiblat102';
import { SertifikatKalibrasiView } from './components/SertifikatKalibrasiView';
import { MapLocationPicker } from './components/MapLocationPicker';
import { RubuSimulator } from './components/RubuSimulator';
import { HijriConverterView } from './components/HijriConverterView';
import { FalakCalculatorView } from './components/FalakCalculatorView';
import { CalculationGuideView } from './components/CalculationGuideView';
import { SettingsModal } from './components/SettingsModal';
import { calculatePrayerTimes } from './utils/falakMath';
import { soundSynth, showSystemNotification } from './utils/audioSynth';
import { KemenagLogo } from './components/KemenagLogo';
import { WifiOff, Phone, MessageCircle, MapPin } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadStoredSettings());
  const [activeTab, setActiveTab] = useState<NavTab>('jadwal');
  const [darkMode, setDarkMode] = useState<boolean>(() => settings.darkMode);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Keep track of which prayer alert was played today so we don't repeat
  const triggeredAlarmsRef = useRef<Set<string>>(new Set());

  // Dark Mode side effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    const updated = { ...settings, darkMode };
    setSettings(updated);
    saveStoredSettings(updated);
  }, [darkMode]);

  // Online / Offline listener
  useEffect(() => {
    const cleanup = listenOfflineOnline(
      () => setIsOnline(true),
      () => setIsOnline(false)
    );
    return cleanup;
  }, []);

  // Sync settings helper
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  const handleSelectCity = (newCity: CityLocation) => {
    const next = { ...settings, selectedCity: newCity };
    handleUpdateSettings(next);
  };

  const handleSaveFavoriteLocation = (fav: FavoriteLocation) => {
    const currentFavs = settings.favoriteLocations || [];
    const filtered = currentFavs.filter((f) => f.id !== fav.id && f.name !== fav.name);
    const next: AppSettings = {
      ...settings,
      favoriteLocations: [fav, ...filtered]
    };
    handleUpdateSettings(next);
  };

  // Background prayer check for Adzan / Notifications
  useEffect(() => {
    const checkPrayerAlarms = () => {
      const now = new Date();
      const times = calculatePrayerTimes(now, settings.selectedCity, {
        tamkinMinutes: settings.tamkinMinutes,
        useAsarTsani: settings.useAsarTsani,
        subuhAngle: settings.subuhAngle,
        useIsyaTsani: settings.useIsyaTsani
      });

      const currentTimeString = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      const todayDateKey = now.toDateString();

      // Check each prayer
      const prayerList = [
        { key: 'imsak', timeStr: times.imsak, name: 'Imsak' },
        { key: 'subuh', timeStr: times.subuh, name: 'Subuh' },
        { key: 'terbit', timeStr: times.terbit, name: 'Terbit Matahari' },
        { key: 'duhaSugra', timeStr: times.duhaSugra, name: 'Dhuha' },
        { key: 'zohor', timeStr: times.zohor, name: 'Zohor' },
        { key: 'asarAwwal', timeStr: times.asarAwwal, name: 'Asar' },
        { key: 'magrib', timeStr: times.magrib, name: 'Magrib' },
        { key: 'isyaAwwal', timeStr: times.isyaAwwal, name: 'Isya' }
      ];

      for (const p of prayerList) {
        const pref = settings.notifications[p.key];
        if (!pref || !pref.enabled) continue;

        // Calculate offset-adjusted target time
        const [h, m] = p.timeStr.split(':').map(Number);
        const targetDate = new Date(now);
        targetDate.setHours(h, m + (pref.offsetMinutes || 0), 0, 0);

        const targetTimeString = `${String(targetDate.getHours()).padStart(2, '0')}:${String(
          targetDate.getMinutes()
        ).padStart(2, '0')}`;

        const alarmKey = `${todayDateKey}_${p.key}_${targetTimeString}`;

        if (currentTimeString === targetTimeString && !triggeredAlarmsRef.current.has(alarmKey)) {
          triggeredAlarmsRef.current.add(alarmKey);

          // Play Audio Synthesizer
          soundSynth.play(pref.sound);

          // Trigger System Notification
          showSystemNotification(
            `Waktu ${p.name} Telah Tiba`,
            `Saatnya menunaikan ibadah untuk wilayah ${settings.selectedCity.name} (${p.timeStr})`
          );
        }
      }
    };

    const interval = setInterval(checkPrayerAlarms, 15000); // check every 15s
    checkPrayerAlarms(); // initial check

    return () => clearInterval(interval);
  }, [settings]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 transition-colors duration-200 dark:bg-neutral-950 dark:text-neutral-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab: string) => setActiveTab(tab as NavTab)}
        selectedCity={settings.selectedCity}
        darkMode={darkMode}
        setDarkMode={(val: boolean) => setDarkMode(val)}
        isOnline={isOnline}
        cloudSyncStatus={settings.cloudSyncStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLocationModal={() => setActiveTab('peta')}
      />

      {/* Connectivity & Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-center text-xs font-medium text-amber-800 dark:text-amber-200 flex items-center justify-center gap-1.5">
          <WifiOff className="h-3.5 w-3.5" />
          <span>
            Mode Offline Aktif — Seluruh hisab falak, peta cache, dan audio azan berfungsi penuh tanpa internet.
          </span>
        </div>
      )}

      {/* Main App Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'jadwal' && (
          <PrayerScheduleView
            selectedCity={settings.selectedCity}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {activeTab === 'kalkulatorkiblat' && (
          <KalkulatorArahKiblat102
            initialCity={settings.selectedCity}
            onOpenMap={() => setActiveTab('peta')}
            onOpenCertificate={() => setActiveTab('sertifikat')}
          />
        )}

        {activeTab === 'sertifikat' && (
          <SertifikatKalibrasiView
            initialCity={settings.selectedCity}
            onOpenKalkulator={() => setActiveTab('kalkulatorkiblat')}
          />
        )}

        {activeTab === 'kiblat' && (
          <QiblaCompassView
            selectedCity={settings.selectedCity}
            onOpenMap={() => setActiveTab('peta')}
            onOpenKalkulatorKiblat={() => setActiveTab('kalkulatorkiblat')}
          />
        )}

        {activeTab === 'peta' && (
          <MapLocationPicker
            currentCity={settings.selectedCity}
            onSelectCity={handleSelectCity}
            favoriteLocations={settings.favoriteLocations || []}
            onSaveFavorite={handleSaveFavoriteLocation}
          />
        )}

        {activeTab === 'rubu' && (
          <RubuSimulator selectedCity={settings.selectedCity} />
        )}

        {activeTab === 'kalender' && <HijriConverterView />}

        {activeTab === 'kalkulator' && (
          <FalakCalculatorView selectedCity={settings.selectedCity} />
        )}

        {activeTab === 'panduan' && <CalculationGuideView />}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleUpdateSettings}
        onSelectCity={handleSelectCity}
      />

      {/* Institutional Footer with Developer Credentials & Kemenag RI */}
      <footer className="mt-auto border-t border-neutral-200/80 bg-white py-8 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/90 dark:text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-b border-neutral-200 dark:border-neutral-800 pb-6 mb-4">
            {/* Logo Kemenag RI & Identitas KUA */}
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 shrink-0">
                <KemenagLogo size={48} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  KUA Kecamatan Gerung
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Kantor Urusan Agama Kecamatan Gerung, Kab. Lombok Barat, NTB
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                  Kementerian Agama Republik Indonesia
                </p>
              </div>
            </div>

            {/* Profil Pengembang Aplikasi */}
            <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">
                  Pengembang Aplikasi:
                </span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-sm">
                  Husni, S. Kom. I
                </span>
              </div>
              <p className="text-neutral-700 dark:text-neutral-300 font-medium">
                Penyuluh Agama Islam KUA Kec. Gerung &bull; Pengurus IPARI Kemenag Lobar
              </p>
              <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-[11px]">
                <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                <span>Jl. Gatot Subroto, Gerung Utara, Lombok Barat, NTB</span>
              </div>
            </div>

            {/* Kontak Resmi & WhatsApp */}
            <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-center gap-2">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Layanan Hisab Rukyat & Konsultasi Falak:
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="tel:081915949627"
                  className="inline-flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 transition"
                >
                  <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>081915949627</span>
                </a>
                <a
                  href="https://wa.me/6281915949627?text=Assalamu%27alaikum%20Pak%20Husni,%20saya%20ingin%20konsultasi%20Aplikasi%20Falak%20Taqribul%20Maqshad"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                Falak Taqribul Maqshad v1.02
              </span>
              <span>&bull;</span>
              <span className="font-serif">تقريب المقصد في العمل بالربع المجيب</span>
            </div>
            <div className="text-[11px]">
              Karya Syaikh Muhammad Mukhtar Al-Bogori &bull; Rumus Falak & Hisab Arah Kiblat Presisi
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
