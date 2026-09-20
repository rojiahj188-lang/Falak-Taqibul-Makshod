import { AppSettings, FavoriteLocation, AppBackupPayload } from '../types';
import { DEFAULT_CITY } from './cityDatabase';

const STORAGE_KEY = 'taqribul_maqshad_settings_v1';
const BACKUP_STORAGE_KEY = 'taqribul_maqshad_cloud_backup_v1';

export const DEFAULT_FAVORITE_LOCATIONS: FavoriteLocation[] = [
  {
    id: 'fav-kua-gerung',
    name: 'KUA Kecamatan Gerung',
    category: 'kantor',
    latitude: -(8 + 41 / 60),
    longitude: 116 + 7 / 60,
    altitude: 25,
    city: {
      name: 'Gerung (KUA Kec. Gerung Lobar)',
      country: 'Indonesia',
      latitude: -(8 + 41 / 60),
      longitude: 116 + 7 / 60,
      latDeg: 8,
      latMin: 41,
      latDir: 'S',
      lonDeg: 116,
      lonMin: 7,
      lonDir: 'T',
      timezone: 8,
      timezoneName: 'WITA'
    },
    notes: 'Pusat Layanan Falak & Hisab Rukyat KUA Kec. Gerung Lombok Barat (Pengembang: Husni, S. Kom. I)',
    addedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'fav-masjid-baiturrahim',
    name: 'Masjid Agung Baiturrahim Gerung',
    category: 'masjid',
    latitude: -8.6883,
    longitude: 116.1264,
    altitude: 30,
    city: {
      name: 'Masjid Agung Baiturrahim Gerung',
      country: 'Indonesia',
      latitude: -8.6883,
      longitude: 116.1264,
      latDeg: 8,
      latMin: 41,
      latDir: 'S',
      lonDeg: 116,
      lonMin: 7,
      lonDir: 'T',
      timezone: 8,
      timezoneName: 'WITA'
    },
    notes: 'Masjid Agung Kabupaten Lombok Barat, Gerung',
    addedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'fav-islamic-center-ntb',
    name: 'Masjid Hubbul Wathan Islamic Center NTB',
    category: 'masjid',
    latitude: -8.5833,
    longitude: 116.1167,
    altitude: 18,
    city: {
      name: 'Islamic Center NTB (Mataram)',
      country: 'Indonesia',
      latitude: -8.5833,
      longitude: 116.1167,
      latDeg: 8,
      latMin: 35,
      latDir: 'S',
      lonDeg: 116,
      lonMin: 7,
      lonDir: 'T',
      timezone: 8,
      timezoneName: 'WITA'
    },
    notes: 'Landmark Provinsi NTB, Jl. Udayana Kota Mataram',
    addedAt: '2026-01-01T00:00:00.000Z'
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  selectedCity: DEFAULT_CITY,
  favoriteLocations: DEFAULT_FAVORITE_LOCATIONS,
  useGPS: false,
  tamkinMinutes: 2,
  useAsarTsani: false,
  useIsyaTsani: false,
  subuhAngle: 20,
  darkMode: false,
  cloudSyncEnabled: true,
  lastCloudSync: new Date().toISOString(),
  cloudSyncStatus: 'synced',
  notifications: {
    imsak: { prayerKey: 'imsak', name: 'Imsak', enabled: true, offsetMinutes: 0, sound: 'beep' },
    subuh: { prayerKey: 'subuh', name: 'Subuh', enabled: true, offsetMinutes: 0, sound: 'adzan' },
    terbit: { prayerKey: 'terbit', name: 'Terbit / Syuruq', enabled: false, offsetMinutes: 0, sound: 'gentle' },
    duhaSugra: { prayerKey: 'duhaSugra', name: 'Dhuha', enabled: true, offsetMinutes: 0, sound: 'gentle' },
    zohor: { prayerKey: 'zohor', name: 'Zohor', enabled: true, offsetMinutes: 0, sound: 'adzan' },
    asarAwwal: { prayerKey: 'asarAwwal', name: 'Asar', enabled: true, offsetMinutes: 0, sound: 'adzan' },
    magrib: { prayerKey: 'magrib', name: 'Magrib', enabled: true, offsetMinutes: 0, sound: 'adzan' },
    isyaAwwal: { prayerKey: 'isyaAwwal', name: 'Isya', enabled: true, offsetMinutes: 0, sound: 'adzan' }
  }
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const favs = Array.isArray(parsed.favoriteLocations) && parsed.favoriteLocations.length > 0
        ? parsed.favoriteLocations
        : DEFAULT_FAVORITE_LOCATIONS;

      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        favoriteLocations: favs,
        notifications: {
          ...DEFAULT_SETTINGS.notifications,
          ...(parsed.notifications || {})
        }
      };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    if (settings.cloudSyncEnabled) {
      // Simulate real-time cloud sync backup to secondary cloud store
      localStorage.setItem(
        BACKUP_STORAGE_KEY,
        JSON.stringify({
          data: settings,
          timestamp: new Date().toISOString()
        })
      );
    }
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export const loadStoredSettings = loadSettings;
export const saveStoredSettings = saveSettings;

export function listenOfflineOnline(onOnline: () => void, onOffline: () => void): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Creates a structured JSON backup payload for export.
 */
export function createBackupPayload(settings: AppSettings): AppBackupPayload {
  const favoriteLocations = settings.favoriteLocations || [];
  return {
    version: '1.02',
    format: 'falak_taqribul_maqshad_backup',
    exportedAt: new Date().toISOString(),
    app: {
      name: 'Falak Taqribul Maqshad',
      author: 'Husni, S. Kom. I (Penyuluh Agama Islam KUA Kec. Gerung / Pengurus IPARI Lobar)',
      source: 'Kitab Taqribul Maqshad fi Amaliyyah Arba\'i Arkan karya Syekh Mukhtar Al-Bogori'
    },
    stats: {
      favoriteLocationsCount: favoriteLocations.length,
      notificationsConfigured: Object.keys(settings.notifications || {}).length
    },
    data: {
      settings: {
        ...settings,
        favoriteLocations
      },
      favoriteLocations
    }
  };
}

/**
 * Triggers a browser download of the backup JSON file and returns the string content & filename.
 */
export function exportBackupJSON(settings: AppSettings): { jsonString: string; filename: string } {
  const payload = createBackupPayload(settings);
  const jsonString = JSON.stringify(payload, null, 2);
  const filename = `Falak_Backup_Pengaturan_Lokasi_${new Date().toISOString().slice(0, 10)}.json`;

  if (typeof document !== 'undefined') {
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return { jsonString, filename };
}

/**
 * Validates whether an uploaded or pasted string is a valid Falak Taqribul Maqshad backup.
 */
export function validateBackupJSON(rawJson: string): {
  valid: boolean;
  payload?: AppBackupPayload;
  error?: string;
} {
  try {
    if (!rawJson || typeof rawJson !== 'string' || !rawJson.trim()) {
      return { valid: false, error: 'Teks JSON kosong. Silakan unggah berkas atau tempel kode JSON.' };
    }

    const parsed = JSON.parse(rawJson);

    // Format 1: Modern AppBackupPayload schema
    if (parsed.format === 'falak_taqribul_maqshad_backup' && parsed.data?.settings) {
      const favs = Array.isArray(parsed.data.favoriteLocations)
        ? parsed.data.favoriteLocations
        : Array.isArray(parsed.data.settings?.favoriteLocations)
        ? parsed.data.settings.favoriteLocations
        : [];

      return {
        valid: true,
        payload: {
          version: parsed.version || '1.02',
          format: 'falak_taqribul_maqshad_backup',
          exportedAt: parsed.exportedAt || new Date().toISOString(),
          app: parsed.app || {
            name: 'Falak Taqribul Maqshad',
            author: 'Husni, S. Kom. I',
            source: 'Kitab Taqribul Maqshad'
          },
          stats: {
            favoriteLocationsCount: favs.length,
            notificationsConfigured: Object.keys(parsed.data.settings?.notifications || {}).length
          },
          data: {
            settings: parsed.data.settings,
            favoriteLocations: favs
          }
        }
      };
    }

    // Format 2: Direct AppSettings structure (backward compatibility)
    if (parsed.selectedCity || parsed.tamkinMinutes !== undefined || parsed.notifications) {
      const favs = Array.isArray(parsed.favoriteLocations) ? parsed.favoriteLocations : [];
      return {
        valid: true,
        payload: {
          version: '1.00 (Arsip Sebelumnya)',
          format: 'falak_taqribul_maqshad_backup',
          exportedAt: parsed.lastCloudSync || new Date().toISOString(),
          app: {
            name: 'Falak Taqribul Maqshad',
            author: 'Husni, S. Kom. I',
            source: 'Kitab Taqribul Maqshad'
          },
          stats: {
            favoriteLocationsCount: favs.length,
            notificationsConfigured: Object.keys(parsed.notifications || {}).length
          },
          data: {
            settings: parsed,
            favoriteLocations: favs
          }
        }
      };
    }

    return {
      valid: false,
      error: 'Berkas JSON tidak dikenali sebagai format cadangan Falak Taqribul Maqshad.'
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Gagal membaca format JSON: ${err?.message || 'Sintaks tidak valid'}`
    };
  }
}

/**
 * Restores the backup payload into the application state with merge or overwrite support.
 */
export function restoreBackupPayload(
  payload: AppBackupPayload,
  currentSettings: AppSettings,
  mode: 'merge' | 'overwrite' = 'merge'
): AppSettings {
  const incomingSettings = payload.data.settings;
  const incomingFavs: FavoriteLocation[] =
    payload.data.favoriteLocations || incomingSettings.favoriteLocations || [];

  let finalFavs: FavoriteLocation[] = [];

  if (mode === 'overwrite') {
    finalFavs = incomingFavs;
  } else {
    // Merge: retain existing, append new ones by unique id and name
    const existingFavs = currentSettings.favoriteLocations || [];
    const existingIds = new Set(existingFavs.map((f) => f.id));
    const existingNames = new Set(existingFavs.map((f) => f.name.toLowerCase().trim()));

    const newToAdd = incomingFavs.filter(
      (f) => !existingIds.has(f.id) && !existingNames.has(f.name.toLowerCase().trim())
    );
    finalFavs = [...existingFavs, ...newToAdd];
  }

  const mergedSettings: AppSettings = {
    ...currentSettings,
    ...incomingSettings,
    favoriteLocations: finalFavs,
    notifications: {
      ...currentSettings.notifications,
      ...(incomingSettings.notifications || {})
    },
    cloudSyncStatus: 'synced',
    lastCloudSync: new Date().toISOString()
  };

  saveSettings(mergedSettings);
  return mergedSettings;
}
