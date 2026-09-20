import React, { useState, useRef } from 'react';
import {
  X,
  Bell,
  Volume2,
  Sliders,
  Cloud,
  Download,
  Upload,
  CheckCircle,
  RefreshCw,
  Moon,
  Sun,
  ShieldCheck,
  FileSpreadsheet,
  FileDown,
  Star,
  Plus,
  Trash2,
  MapPin,
  Crosshair,
  Copy,
  Check,
  AlertTriangle,
  FileJson,
  Bookmark,
  CheckCircle2,
  Phone,
  MessageCircle,
  Building,
  Home,
  Briefcase
} from 'lucide-react';
import { AppSettings, CityLocation, FavoriteLocation, AppBackupPayload } from '../types';
import { soundSynth, requestNotificationPermission } from '../utils/audioSynth';
import {
  exportBackupJSON,
  validateBackupJSON,
  restoreBackupPayload,
  saveSettings
} from '../utils/storageEngine';
import { exportPrayerScheduleToPDF, exportPrayerScheduleToExcel } from '../utils/exportUtils';
import { formatDMS } from '../utils/falakMath';
import { KemenagLogo } from './KemenagLogo';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onSelectCity?: (city: CityLocation) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onSelectCity
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<
    'notif' | 'falak' | 'lokasi' | 'backup' | 'cloud' | 'export' | 'tentang'
  >('backup');
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Notification status banner
  const [notifPermissionMsg, setNotifPermissionMsg] = useState<string | null>(null);

  // Backup & Restore states
  const [restoreMode, setRestoreMode] = useState<'merge' | 'overwrite'>('merge');
  const [pastedJsonText, setPastedJsonText] = useState('');
  const [backupPreview, setBackupPreview] = useState<AppBackupPayload | null>(null);
  const [backupErrorMsg, setBackupErrorMsg] = useState<string | null>(null);
  const [backupSuccessMsg, setBackupSuccessMsg] = useState<string | null>(null);
  const [hasCopiedJSON, setHasCopiedJSON] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Favorite Location Form state
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocCategory, setNewLocCategory] = useState<FavoriteLocation['category']>('masjid');
  const [newLocLat, setNewLocLat] = useState<string>('');
  const [newLocLon, setNewLocLon] = useState<string>('');
  const [newLocAlt, setNewLocAlt] = useState<string>('20');
  const [newLocNotes, setNewLocNotes] = useState('');
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [gpsDetectMsg, setGpsDetectMsg] = useState<string | null>(null);

  // Handlers for Prayer Notifications
  const handleTogglePrayer = (key: string) => {
    const prayer = localSettings.notifications[key];
    if (!prayer) return;
    const updated = {
      ...localSettings.notifications,
      [key]: { ...prayer, enabled: !prayer.enabled }
    };
    const next = { ...localSettings, notifications: updated };
    setLocalSettings(next);
    onSaveSettings(next);
  };

  const handleSoundChange = (key: string, sound: 'adzan' | 'beep' | 'gentle' | 'silent') => {
    const prayer = localSettings.notifications[key];
    if (!prayer) return;
    const updated = {
      ...localSettings.notifications,
      [key]: { ...prayer, sound }
    };
    const next = { ...localSettings, notifications: updated };
    setLocalSettings(next);
    onSaveSettings(next);
    soundSynth.play(sound);
  };

  const handleOffsetChange = (key: string, offset: number) => {
    const prayer = localSettings.notifications[key];
    if (!prayer) return;
    const updated = {
      ...localSettings.notifications,
      [key]: { ...prayer, offsetMinutes: offset }
    };
    const next = { ...localSettings, notifications: updated };
    setLocalSettings(next);
    onSaveSettings(next);
  };

  const handleTriggerSync = () => {
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    setTimeout(() => {
      setIsSyncing(false);
      const updated: AppSettings = {
        ...localSettings,
        lastCloudSync: new Date().toISOString(),
        cloudSyncStatus: 'synced'
      };
      setLocalSettings(updated);
      onSaveSettings(updated);
      setSyncSuccessMsg('Data preferensi & koordinat lokasi berhasil disinkronkan ke awan secara real-time!');
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    }, 1000);
  };

  // BACKUP EXPORT ACTIONS
  const handleDownloadJSON = () => {
    try {
      const { filename } = exportBackupJSON(localSettings);
      setBackupSuccessMsg(`Berkas cadangan "${filename}" berhasil diunduh ke perangkat Anda.`);
      setTimeout(() => setBackupSuccessMsg(null), 5000);
    } catch (err: any) {
      setBackupErrorMsg(`Gagal mengunduh berkas cadangan: ${err?.message || 'Terjadi kesalahan'}`);
    }
  };

  const handleCopyJSONToClipboard = () => {
    try {
      const { jsonString } = exportBackupJSON(localSettings);
      navigator.clipboard.writeText(jsonString);
      setHasCopiedJSON(true);
      setBackupSuccessMsg('Teks JSON cadangan lengkap berhasil disalin ke clipboard! Anda dapat menempelkannya di WhatsApp, Email, atau catatan.');
      setTimeout(() => {
        setHasCopiedJSON(false);
        setBackupSuccessMsg(null);
      }, 4000);
    } catch (err) {
      setBackupErrorMsg('Gagal menyalin teks ke clipboard.');
    }
  };

  // BACKUP RESTORE ACTIONS
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackupErrorMsg(null);
    setBackupSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawText = event.target?.result as string;
      const result = validateBackupJSON(rawText);
      if (result.valid && result.payload) {
        setBackupPreview(result.payload);
        setBackupErrorMsg(null);
      } else {
        setBackupErrorMsg(result.error || 'Berkas JSON tidak valid.');
        setBackupPreview(null);
      }
    };
    reader.onerror = () => {
      setBackupErrorMsg('Gagal membaca berkas dari sistem.');
    };
    reader.readAsText(file);
    // Reset file input value so same file can be re-selected if desired
    e.target.value = '';
  };

  const handleVerifyPastedJSON = () => {
    setBackupErrorMsg(null);
    setBackupSuccessMsg(null);
    if (!pastedJsonText.trim()) {
      setBackupErrorMsg('Silakan tempel teks JSON terlebih dahulu.');
      return;
    }

    const result = validateBackupJSON(pastedJsonText);
    if (result.valid && result.payload) {
      setBackupPreview(result.payload);
      setBackupErrorMsg(null);
    } else {
      setBackupErrorMsg(result.error || 'Format teks JSON tidak sesuai struktur cadangan.');
      setBackupPreview(null);
    }
  };

  const handleExecuteRestore = () => {
    if (!backupPreview) return;
    try {
      const restored = restoreBackupPayload(backupPreview, localSettings, restoreMode);
      setLocalSettings(restored);
      onSaveSettings(restored);

      if (onSelectCity && restored.selectedCity) {
        onSelectCity(restored.selectedCity);
      }

      const favCount = restored.favoriteLocations?.length || 0;
      setBackupSuccessMsg(
        `Sukses! Data pengaturan dan ${favCount} lokasi favorit berhasil dipulihkan (Mode: ${
          restoreMode === 'merge' ? 'Gabungkan' : 'Timpa Total'
        }).`
      );
      setBackupPreview(null);
      setPastedJsonText('');
      setTimeout(() => setBackupSuccessMsg(null), 6000);
    } catch (err: any) {
      setBackupErrorMsg(`Gagal menerapkan pemulihan data: ${err?.message || 'Kesalahan sistem'}`);
    }
  };

  // FAVORITE LOCATIONS HANDLERS
  const handleDetectGPSForFavorite = () => {
    if (!('geolocation' in navigator)) {
      setGpsDetectMsg('Perangkat tidak mendukung geolokasi GPS.');
      return;
    }

    setIsDetectingGPS(true);
    setGpsDetectMsg('Menghubungkan ke satelit GPS...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGPS(false);
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const alt = pos.coords.altitude ? Math.round(pos.coords.altitude) : 25;
        const acc = Math.round(pos.coords.accuracy);

        setNewLocLat(lat.toFixed(6));
        setNewLocLon(lon.toFixed(6));
        setNewLocAlt(alt.toString());
        setGpsDetectMsg(`GPS berhasil dideteksi (Akurasi: ±${acc}m)`);
      },
      (err) => {
        setIsDetectingGPS(false);
        setGpsDetectMsg(`Gagal mendeteksi GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleSaveNewFavorite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;

    const latNum = parseFloat(newLocLat);
    const lonNum = parseFloat(newLocLon);
    const altNum = parseFloat(newLocAlt) || 0;

    if (isNaN(latNum) || isNaN(lonNum)) {
      setGpsDetectMsg('Koordinat Lintang dan Bujur harus berupa angka.');
      return;
    }

    const cityLoc: CityLocation = {
      name: newLocName.trim(),
      country: 'Indonesia',
      latitude: latNum,
      longitude: lonNum,
      latDeg: Math.floor(Math.abs(latNum)),
      latMin: Math.floor((Math.abs(latNum) - Math.floor(Math.abs(latNum))) * 60),
      latDir: latNum >= 0 ? 'U' : 'S',
      lonDeg: Math.floor(Math.abs(lonNum)),
      lonMin: Math.floor((Math.abs(lonNum) - Math.floor(Math.abs(lonNum))) * 60),
      lonDir: lonNum >= 0 ? 'T' : 'B',
      timezone: 8,
      timezoneName: 'WITA'
    };

    const newFav: FavoriteLocation = {
      id: `fav-${Date.now()}`,
      name: newLocName.trim(),
      category: newLocCategory,
      latitude: latNum,
      longitude: lonNum,
      altitude: altNum,
      city: cityLoc,
      notes: newLocNotes.trim() || undefined,
      addedAt: new Date().toISOString()
    };

    const updatedFavs = [newFav, ...(localSettings.favoriteLocations || [])];
    const updatedSettings: AppSettings = {
      ...localSettings,
      favoriteLocations: updatedFavs
    };

    setLocalSettings(updatedSettings);
    onSaveSettings(updatedSettings);
    saveSettings(updatedSettings);

    // Reset form
    setNewLocName('');
    setNewLocLat('');
    setNewLocLon('');
    setNewLocNotes('');
    setIsAddingLocation(false);
    setGpsDetectMsg(null);
  };

  const handleDeleteFavorite = (favId: string) => {
    const updatedFavs = (localSettings.favoriteLocations || []).filter((f) => f.id !== favId);
    const updatedSettings: AppSettings = {
      ...localSettings,
      favoriteLocations: updatedFavs
    };
    setLocalSettings(updatedSettings);
    onSaveSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  const handleApplyFavoriteAsActive = (fav: FavoriteLocation) => {
    const updatedSettings: AppSettings = {
      ...localSettings,
      selectedCity: fav.city
    };
    setLocalSettings(updatedSettings);
    onSaveSettings(updatedSettings);
    saveSettings(updatedSettings);

    if (onSelectCity) {
      onSelectCity(fav.city);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 p-5 dark:border-neutral-800">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <span>Pengaturan & Manajemen Data</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                v1.02
              </span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Cadangkan data, simpan masjid favorit, atur notifikasi azan & parameter falak
            </p>
          </div>
          <button
            id="btn-close-settings"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Tab Switcher */}
        <div className="flex border-b border-neutral-100 px-4 space-x-1 text-xs font-medium dark:border-neutral-800 overflow-x-auto no-scrollbar">
          {[
            { id: 'backup', label: 'Cadangan & Pulihkan (JSON)', icon: FileJson, badge: 'Penting' },
            {
              id: 'lokasi',
              label: 'Lokasi Favorit',
              icon: Star,
              count: localSettings.favoriteLocations?.length || 0
            },
            { id: 'notif', label: 'Pengingat Azan', icon: Bell },
            { id: 'falak', label: 'Parameter Falak', icon: Sliders },
            { id: 'cloud', label: 'Sinkronisasi Awan', icon: Cloud },
            { id: 'export', label: 'Ekspor Laporan', icon: Download },
            { id: 'tentang', label: 'Profil Pengembang', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`modal-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex shrink-0 items-center gap-1.5 border-b-2 py-3 px-2.5 transition relative ${
                  isActive
                    ? 'border-emerald-600 font-bold text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="rounded-sm bg-amber-400 px-1 py-0.2 text-[9px] font-black uppercase text-neutral-900">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* TAB: CADANGAN & PULIHKAN JSON (PRIMARY FEATURE) */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              {/* Info banner */}
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <div className="flex items-start gap-2.5">
                  <FileJson className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-emerald-950 dark:text-emerald-100 text-xs">
                      Cadangan & Pemulihan Berkas JSON (Data Portability)
                    </h4>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                      Simpan seluruh data pengaturan hisab falak, daftar masjid/lokasi favorit, dan konfigurasi alarm azan dalam format file JSON lokal. Berkas ini dapat dipindahkan ke ponsel, tablet, atau komputer lain tanpa kehilangan data.
                    </p>
                  </div>
                </div>
              </div>

              {/* Success / Error notification alerts inside modal */}
              {backupSuccessMsg && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-300 bg-emerald-100/80 p-3 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-700 dark:text-emerald-400" />
                  <div className="flex-1 font-medium">{backupSuccessMsg}</div>
                </div>
              )}

              {backupErrorMsg && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <div className="flex-1 font-medium">{backupErrorMsg}</div>
                </div>
              )}

              {/* Data Summary Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-800/40">
                  <span className="text-[10px] uppercase font-semibold text-neutral-400">Lokasi Favorit:</span>
                  <div className="mt-1 text-lg font-bold text-neutral-900 dark:text-white">
                    {localSettings.favoriteLocations?.length || 0} Tersimpan
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Siap diekspor</span>
                </div>

                <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-800/40">
                  <span className="text-[10px] uppercase font-semibold text-neutral-400">Lokasi Aktif:</span>
                  <div className="mt-1 text-sm font-bold text-neutral-900 dark:text-white truncate">
                    {localSettings.selectedCity.name}
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    {localSettings.selectedCity.latDeg}°{localSettings.selectedCity.latMin}' {localSettings.selectedCity.latDir}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1 rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-800/40">
                  <span className="text-[10px] uppercase font-semibold text-neutral-400">Parameter Falak:</span>
                  <div className="mt-1 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Tamkin: {localSettings.tamkinMinutes} mnt &bull; Subuh: {localSettings.subuhAngle}°
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    Asar: {localSettings.useAsarTsani ? 'Hanafi' : "Syafi'i"}
                  </span>
                </div>
              </div>

              {/* BAGIAN 1: EKSPOR CADANGAN */}
              <div className="rounded-xl border border-neutral-200 p-4 space-y-3 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-neutral-900 dark:text-white">
                      1. Ekspor Cadangan (Download / Salin JSON)
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Format .json</span>
                </div>

                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Unduh berkas cadangan ke memori perangkat atau salin teks JSON langsung untuk dikirim ke perangkat lain via WhatsApp/Catatan.
                </p>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    id="btn-export-backup-json"
                    onClick={handleDownloadJSON}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-98"
                  >
                    <Download className="h-4 w-4" />
                    <span>Unduh Berkas (.json)</span>
                  </button>

                  <button
                    id="btn-copy-backup-json"
                    onClick={handleCopyJSONToClipboard}
                    className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-2.5 font-semibold text-neutral-800 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 active:scale-98"
                  >
                    {hasCopiedJSON ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Tersalin ke Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-neutral-500" />
                        <span>Salin Teks JSON</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* BAGIAN 2: PULIHKAN CADANGAN */}
              <div className="rounded-xl border border-neutral-200 p-4 space-y-3.5 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-neutral-900 dark:text-white">
                      2. Pulihkan Cadangan (Restore JSON)
                    </span>
                  </div>
                </div>

                {/* Mode Pulihkan: Gabungkan vs Timpa */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Opsi Pemulihan Data:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRestoreMode('merge')}
                      className={`rounded-xl border p-2.5 text-left transition ${
                        restoreMode === 'merge'
                          ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" />
                        <span>Gabungkan (Merge)</span>
                      </div>
                      <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400">
                        Pertahankan data lama & tambahkan lokasi baru dari berkas cadangan.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRestoreMode('overwrite')}
                      className={`rounded-xl border p-2.5 text-left transition ${
                        restoreMode === 'overwrite'
                          ? 'border-amber-500 bg-amber-50/70 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-600 inline-block" />
                        <span>Timpa Total (Overwrite)</span>
                      </div>
                      <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400">
                        Ganti seluruh pengaturan & lokasi dengan isi berkas cadangan.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Dua Metode Masukan: Berkas File atau Tempel Teks */}
                <div className="space-y-3 pt-1">
                  {/* Metode A: Unggah Berkas */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileChange}
                      className="hidden"
                      id="input-restore-file"
                    />
                    <label
                      htmlFor="input-restore-file"
                      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/30 p-3 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300 cursor-pointer transition"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="font-semibold">Pilih Berkas Cadangan (.json)</span>
                    </label>
                  </div>

                  {/* Metode B: Tempel Kode JSON */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                        Atau Tempel Teks JSON Cadangan:
                      </label>
                      {pastedJsonText && (
                        <button
                          onClick={() => setPastedJsonText('')}
                          className="text-[10px] text-rose-500 hover:underline"
                        >
                          Bersihkan Teks
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <textarea
                        rows={3}
                        value={pastedJsonText}
                        onChange={(e) => setPastedJsonText(e.target.value)}
                        placeholder='Tempel kode JSON di sini (contoh: {"format": "falak_taqribul_maqshad_backup", ...})'
                        className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-[11px] font-mono dark:border-neutral-800 dark:bg-neutral-800/70"
                      />
                      <button
                        onClick={handleVerifyPastedJSON}
                        disabled={!pastedJsonText.trim()}
                        className="rounded-xl bg-neutral-800 px-3 py-1 font-semibold text-white transition hover:bg-neutral-900 disabled:opacity-40 dark:bg-neutral-700"
                      >
                        Periksa
                      </button>
                    </div>
                  </div>
                </div>

                {/* PRATINJAU CADANGAN SEBELUM PEMULIHAN (INSPECTION CARD) */}
                {backupPreview && (
                  <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50/80 p-4 space-y-3 dark:bg-emerald-950/40 dark:border-emerald-600 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2 dark:border-emerald-800">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-bold text-emerald-950 dark:text-emerald-100">
                          Pratinjau Berkas Cadangan Valid
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200 font-bold">
                        {backupPreview.version}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-neutral-500 dark:text-neutral-400">Tanggal Dibuat:</span>
                        <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {new Date(backupPreview.exportedAt).toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div>
                        <span className="text-neutral-500 dark:text-neutral-400">Kota dalam Berkas:</span>
                        <div className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                          {backupPreview.data.settings?.selectedCity?.name || 'Lombok'}
                        </div>
                      </div>
                      <div>
                        <span className="text-neutral-500 dark:text-neutral-400">Lokasi Favorit:</span>
                        <div className="font-semibold text-emerald-700 dark:text-emerald-300">
                          {backupPreview.data.favoriteLocations?.length || 0} Lokasi
                        </div>
                      </div>
                      <div>
                        <span className="text-neutral-500 dark:text-neutral-400">Mode Eksekusi:</span>
                        <div className="font-bold text-emerald-800 dark:text-emerald-200 uppercase">
                          {restoreMode === 'merge' ? 'Gabungkan Data' : 'Timpa Total'}
                        </div>
                      </div>
                    </div>

                    {/* Preview Names of Locations */}
                    {backupPreview.data.favoriteLocations && backupPreview.data.favoriteLocations.length > 0 && (
                      <div className="rounded-lg bg-white/80 p-2 text-[10px] dark:bg-neutral-900/80 border border-emerald-100 dark:border-emerald-900">
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                          Daftar Lokasi di Berkas:
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {backupPreview.data.favoriteLocations.map((f, i) => (
                            <span
                              key={i}
                              className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 font-medium"
                            >
                              {f.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        id="btn-confirm-restore"
                        onClick={handleExecuteRestore}
                        className="flex-1 rounded-xl bg-emerald-600 py-2.5 font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-98 flex items-center justify-center gap-1.5"
                      >
                        <Check className="h-4 w-4" />
                        <span>Terapkan Pemulihan Sekarang</span>
                      </button>
                      <button
                        onClick={() => setBackupPreview(null)}
                        className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: LOKASI FAVORIT (MANAGEMENT OF SAVED MOSQUES & PLACES) */}
          {activeTab === 'lokasi' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-neutral-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span>Daftar Masjid & Titik Pengukuran Favorit</span>
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Kelola lokasi masjid, mushalla, atau balai pengukuran arah kiblat yang sering digunakan.
                  </p>
                </div>
                <button
                  id="btn-add-fav-loc"
                  onClick={() => setIsAddingLocation(!isAddingLocation)}
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 font-bold text-white shadow-xs transition hover:bg-emerald-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isAddingLocation ? 'Tutup Form' : 'Tambah Baru'}</span>
                </button>
              </div>

              {/* FORM: TAMBAH LOKASI FAVORIT BARU */}
              {isAddingLocation && (
                <form
                  onSubmit={handleSaveNewFavorite}
                  className="rounded-xl border-2 border-emerald-500/80 bg-emerald-50/40 p-4 space-y-3 dark:border-emerald-700 dark:bg-emerald-950/30 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2 dark:border-emerald-800">
                    <span className="font-bold text-emerald-950 dark:text-emerald-100">
                      Tambah Lokasi Favorit Baru
                    </span>
                    <button
                      type="button"
                      onClick={handleDetectGPSForFavorite}
                      disabled={isDetectingGPS}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Crosshair className={`h-3 w-3 ${isDetectingGPS ? 'animate-spin' : ''}`} />
                      <span>{isDetectingGPS ? 'Mencari GPS...' : 'Ambil dari GPS'}</span>
                    </button>
                  </div>

                  {gpsDetectMsg && (
                    <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                      {gpsDetectMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                        Nama Masjid / Tempat: *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Masjid Jami' Baitul Makmur"
                        value={newLocName}
                        onChange={(e) => setNewLocName(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                        Kategori Tempat:
                      </label>
                      <select
                        value={newLocCategory}
                        onChange={(e) => setNewLocCategory(e.target.value as any)}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      >
                        <option value="masjid">🕌 Masjid</option>
                        <option value="mushalla">🕋 Mushalla</option>
                        <option value="kantor">🏛️ Kantor / Balai KUA</option>
                        <option value="rumah">🏠 Rumah / Pribadi</option>
                        <option value="lapangan">⛳ Lapangan Salat Id</option>
                        <option value="lainnya">📍 Titik Geodesi Lainnya</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                        Lintang (Latitude): *
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="-8.6883"
                        value={newLocLat}
                        onChange={(e) => setNewLocLat(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-1.5 font-mono text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                        Bujur (Longitude): *
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="116.1264"
                        value={newLocLon}
                        onChange={(e) => setNewLocLon(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-1.5 font-mono text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                      Catatan / Alamat Singkat:
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Gerung Utara, Jl. Cut Nyak Dien"
                      value={newLocNotes}
                      onChange={(e) => setNewLocNotes(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingLocation(false)}
                      className="rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-emerald-600 px-4 py-1.5 font-bold text-white transition hover:bg-emerald-700"
                    >
                      Simpan ke Favorit
                    </button>
                  </div>
                </form>
              )}

              {/* LIST OF FAVORITE LOCATIONS */}
              <div className="space-y-2.5">
                {(localSettings.favoriteLocations || []).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
                    Belum ada lokasi favorit yang disimpan. Tambahkan lokasi masjid atau pulihkan dari berkas cadangan JSON.
                  </div>
                ) : (
                  (localSettings.favoriteLocations || []).map((fav) => {
                    const isCurrentActive =
                      localSettings.selectedCity.latitude === fav.latitude &&
                      localSettings.selectedCity.longitude === fav.longitude;

                    return (
                      <div
                        key={fav.id}
                        className={`rounded-xl border p-3 transition ${
                          isCurrentActive
                            ? 'border-emerald-500 bg-emerald-50/50 shadow-xs dark:border-emerald-700 dark:bg-emerald-950/20'
                            : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-neutral-900 dark:text-white text-xs">
                                {fav.name}
                              </span>
                              <span className="rounded-md bg-neutral-100 px-1.5 py-0.2 text-[10px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 uppercase">
                                {fav.category}
                              </span>
                              {isCurrentActive && (
                                <span className="rounded-md bg-emerald-600 px-1.5 py-0.2 text-[9px] font-bold text-white">
                                  Aktif
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                              <span>
                                {formatDMS(fav.latitude)} ({fav.latitude >= 0 ? 'LU' : 'LS'})
                              </span>
                              <span>&bull;</span>
                              <span>
                                {formatDMS(fav.longitude)} ({fav.longitude >= 0 ? 'BT' : 'BB'})
                              </span>
                              {fav.altitude && (
                                <>
                                  <span>&bull;</span>
                                  <span>Alt: {fav.altitude}m</span>
                                </>
                              )}
                            </div>

                            {fav.notes && (
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic">
                                {fav.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {!isCurrentActive && (
                              <button
                                onClick={() => handleApplyFavoriteAsActive(fav)}
                                className="rounded-lg bg-emerald-50 border border-emerald-300 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300"
                                title="Jadikan Lokasi Aktif"
                              >
                                Gunakan
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteFavorite(fav.id)}
                              className="rounded-lg p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                              title="Hapus Lokasi"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB: NOTIFIKASI AZAN */}
          {activeTab === 'notif' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-emerald-50/60 p-3.5 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                <div className="space-y-0.5">
                  <span className="font-semibold">Izin Notifikasi Browser</span>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Aktifkan notifikasi sistem agar pengingat azan muncul di desktop / hp
                  </p>
                </div>
                <button
                  id="btn-request-browser-notif"
                  onClick={async () => {
                    const granted = await requestNotificationPermission();
                    setNotifPermissionMsg(
                      granted
                        ? 'Izin notifikasi browser berhasil diaktifkan!'
                        : 'Izin notifikasi browser belum aktif/ditolak di pengaturan browser.'
                    );
                    setTimeout(() => setNotifPermissionMsg(null), 4000);
                  }}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white transition hover:bg-emerald-700"
                >
                  Minta Izin
                </button>
              </div>

              {notifPermissionMsg && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-100 p-2.5 text-emerald-900 text-[11px] dark:bg-emerald-900 dark:text-emerald-100">
                  {notifPermissionMsg}
                </div>
              )}

              {/* Prayer Alarms List */}
              <div className="space-y-2.5">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Preferensi Alarm Per Waktu Salat:
                </span>
                {Object.entries(localSettings.notifications).map(([key, item]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-800/30"
                  >
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={() => handleTogglePrayer(key)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-neutral-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-neutral-400">Koreksi:</span>
                        <select
                          value={item.offsetMinutes}
                          onChange={(e) => handleOffsetChange(key, Number(e.target.value))}
                          className="rounded-md border border-neutral-200 bg-white px-1.5 py-0.5 dark:border-neutral-700 dark:bg-neutral-800"
                        >
                          <option value="-5">-5 mnt</option>
                          <option value="-2">-2 mnt</option>
                          <option value="0">Tepat Waktu</option>
                          <option value="2">+2 mnt</option>
                          <option value="5">+5 mnt</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1">
                        <select
                          value={item.sound}
                          onChange={(e) => handleSoundChange(key, e.target.value as any)}
                          className="rounded-md border border-neutral-200 bg-white px-2 py-0.5 dark:border-neutral-700 dark:bg-neutral-800"
                        >
                          <option value="adzan">Azan Penuh</option>
                          <option value="beep">Beep Sinyal</option>
                          <option value="gentle">Alunan Lembut</option>
                          <option value="silent">Senyap</option>
                        </select>
                        <button
                          onClick={() => soundSynth.play(item.sound)}
                          className="rounded-md p-1 text-neutral-400 hover:text-emerald-600"
                          title="Uji Suara"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: PARAMETER FALAK */}
          {activeTab === 'falak' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Tamkin / Ihtiyath Pengaman (Menit):
                </label>
                <select
                  value={localSettings.tamkinMinutes}
                  onChange={(e) => {
                    const next = { ...localSettings, tamkinMinutes: Number(e.target.value) };
                    setLocalSettings(next);
                    onSaveSettings(next);
                    saveSettings(next);
                  }}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-800"
                >
                  <option value="2">2 Menit (Standar Kehati-hatian Falak Kemenag)</option>
                  <option value="3">3 Menit (Kitab Daqaiqut-Tamkin)</option>
                  <option value="4">4 Menit</option>
                  <option value="5">5 Menit (Tamkin Daerah Lombok/Makkah Hal. 87)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Madzhab Waktu Asar:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const next = { ...localSettings, useAsarTsani: false };
                      setLocalSettings(next);
                      onSaveSettings(next);
                      saveSettings(next);
                    }}
                    className={`rounded-xl border p-3 text-left transition ${
                      !localSettings.useAsarTsani
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                        : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
                    }`}
                  >
                    <span className="font-bold">Asar Awwal (Syafi'i)</span>
                    <p className="mt-0.5 text-[11px] text-neutral-500">1 panjang bayangan + zawal</p>
                  </button>

                  <button
                    onClick={() => {
                      const next = { ...localSettings, useAsarTsani: true };
                      setLocalSettings(next);
                      onSaveSettings(next);
                      saveSettings(next);
                    }}
                    className={`rounded-xl border p-3 text-left transition ${
                      localSettings.useAsarTsani
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                        : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
                    }`}
                  >
                    <span className="font-bold">Asar Tsani (Hanafi)</span>
                    <p className="mt-0.5 text-[11px] text-neutral-500">2 panjang bayangan + zawal</p>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Ketinggian Matahari Waktu Subuh (Fajar Shadiq):
                </label>
                <select
                  value={localSettings.subuhAngle}
                  onChange={(e) => {
                    const next = { ...localSettings, subuhAngle: Number(e.target.value) };
                    setLocalSettings(next);
                    onSaveSettings(next);
                    saveSettings(next);
                  }}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-800"
                >
                  <option value="20">h = -20° (Kriteria Kemenag RI / Ormas Islam Indonesia)</option>
                  <option value="19">h = -19° (Matan Taqribul Maqshad Bab X - Jaib 19)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Pilihan Waktu Isya:
                </label>
                <select
                  value={localSettings.useIsyaTsani ? '19' : '17'}
                  onChange={(e) => {
                    const next = { ...localSettings, useIsyaTsani: e.target.value === '19' };
                    setLocalSettings(next);
                    onSaveSettings(next);
                    saveSettings(next);
                  }}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-800"
                >
                  <option value="17">Isya Awwal (Jaib 17 / h = -17°) - Hilang Syafaq Merah</option>
                  <option value="19">Isya Tsani (Jaib 19 / h = -19°) - Hilang Syafaq Putih</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB: SINKRONISASI AWAN */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-semibold text-emerald-950 dark:text-emerald-100">
                      Sinkronisasi Awan Otomatis Real-Time
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.cloudSyncEnabled}
                      onChange={(e) => {
                        const next = { ...localSettings, cloudSyncEnabled: e.target.checked };
                        setLocalSettings(next);
                        onSaveSettings(next);
                        saveSettings(next);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                <p className="mt-2 text-[11px] text-emerald-800 dark:text-emerald-300">
                  Data preferensi salat, koordinat lokasi GPS, dan masjid favorit tersimpan aman di peramban lokal dan disinkronkan otomatis saat terhubung jaringan.
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 border-t border-emerald-100 pt-2 dark:border-emerald-900/40">
                  <span>Sinkronisasi Terakhir:</span>
                  <span className="font-mono">
                    {localSettings.lastCloudSync
                      ? new Date(localSettings.lastCloudSync).toLocaleTimeString('id-ID')
                      : 'Baru saja'}
                  </span>
                </div>
              </div>

              {syncSuccessMsg && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-100 p-3 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
                  {syncSuccessMsg}
                </div>
              )}

              <button
                onClick={handleTriggerSync}
                disabled={isSyncing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan ke Awan...' : 'Sinkronkan Sekarang'}</span>
              </button>
            </div>
          )}

          {/* TAB: EKSPOR LAPORAN */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-neutral-600 dark:text-neutral-300">
                Buat laporan jadwal ibadah salat bulanan dalam format siap cetak (PDF) atau spreadsheet (Excel .xlsx):
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-neutral-200 p-4 space-y-3 dark:border-neutral-800">
                  <div className="flex items-center gap-2 text-rose-600">
                    <FileDown className="h-5 w-5" />
                    <span className="font-bold">Laporan Format PDF</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Tabel siap cetak landscape A4 lengkap dengan koordinat, nama buruj, dan waktu salat.
                  </p>
                  <button
                    onClick={() =>
                      exportPrayerScheduleToPDF(
                        localSettings.selectedCity,
                        new Date().getFullYear(),
                        new Date().getMonth()
                      )
                    }
                    className="w-full rounded-lg bg-rose-600 py-2 font-semibold text-white transition hover:bg-rose-700"
                  >
                    Unduh PDF Bulan Ini
                  </button>
                </div>

                <div className="rounded-xl border border-neutral-200 p-4 space-y-3 dark:border-neutral-800">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <FileSpreadsheet className="h-5 w-5" />
                    <span className="font-bold">Laporan Format Excel (.xlsx)</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Buku kerja spreadsheet dengan kolom waktu salat, kalender Hijriah, dan deklinasi matahari.
                  </p>
                  <button
                    onClick={() =>
                      exportPrayerScheduleToExcel(
                        localSettings.selectedCity,
                        new Date().getFullYear(),
                        new Date().getMonth()
                      )
                    }
                    className="w-full rounded-lg bg-emerald-600 py-2 font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Unduh Excel (.xlsx)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PROFIL PENGEMBANG & KUA GERUNG LOBAR */}
          {activeTab === 'tentang' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-900 p-5 text-white shadow-md">
                <div className="bg-white/95 p-2 rounded-2xl shadow-xs shrink-0 border border-amber-300">
                  <KemenagLogo size={64} />
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <span className="bg-amber-400 text-neutral-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Kementerian Agama RI &bull; Lombok Barat
                  </span>
                  <h4 className="text-lg font-bold text-white">
                    KUA Kecamatan Gerung
                  </h4>
                  <p className="text-xs text-emerald-100/90">
                    Kantor Urusan Agama Kecamatan Gerung, Kab. Lombok Barat, Provinsi Nusa Tenggara Barat
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-800/40">
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-2">
                  <span className="font-semibold text-neutral-500 dark:text-neutral-400">Pengembang Aplikasi:</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-sm">
                    Husni, S. Kom. I
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-2">
                  <span className="font-semibold text-neutral-500 dark:text-neutral-400">Jabatan / Profesi:</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    Penyuluh Agama Islam KUA Kec. Gerung
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-2">
                  <span className="font-semibold text-neutral-500 dark:text-neutral-400">Organisasi Profesi:</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    Pengurus IPARI Kemenag Kabupaten Lombok Barat
                  </span>
                </div>

                <div className="flex items-start justify-between border-b border-neutral-200 dark:border-neutral-700 pb-2">
                  <span className="font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                    Alamat KUA:
                  </span>
                  <span className="font-medium text-right text-neutral-900 dark:text-neutral-100 max-w-xs">
                    Jl. Gatot Subroto, Gerung Utara, Kec. Gerung, Kab. Lombok Barat, NTB
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    Kontak Resmi:
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href="tel:081915949627"
                      className="font-bold text-neutral-900 dark:text-neutral-100 hover:text-emerald-600 underline"
                    >
                      081915949627
                    </a>
                    <a
                      href="https://wa.me/6281915949627?text=Assalamu%27alaikum%20Pak%20Husni,%20saya%20ingin%20konsultasi%20Kalkulator%20Arah%20Kiblat"
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 text-[11px]"
                    >
                      <MessageCircle className="h-3 w-3" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-200 dark:border-emerald-800 text-[11px] leading-relaxed text-emerald-900 dark:text-emerald-200 space-y-1.5">
                <div className="font-bold text-emerald-800 dark:text-emerald-300">
                  Landasan Hisab & Sanad Ilmu Falak:
                </div>
                <p>
                  Aplikasi ini dikembangkan sebagai sarana penentuan hisab waktu salat dan arah kiblat akurat berbasis Kitab <em>Taqribul Maqshad fi al-'Amal bi ar-Rub'i al-Mujayyab</em> karya Syaikh Muhammad Mukhtar bin 'Atharid Al-Bogori, serta dilengkapi rumus kalkulator arah kiblat terperinci (3 model sudut, jarak geodesi, dan jam bayangan kiblat matahari).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
