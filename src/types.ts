export type NavTab =
  | 'jadwal'
  | 'kiblat'
  | 'kalkulatorkiblat'
  | 'sertifikat'
  | 'peta'
  | 'rubu'
  | 'kalender'
  | 'kalkulator'
  | 'panduan'
  | 'modebaca';

export interface CityLocation {
  name: string;
  country: string;
  latitude: number; // Decimal degrees
  longitude: number; // Decimal degrees
  latDeg: number;
  latMin: number;
  latSec?: number;
  latDir: 'U' | 'S';
  lonDeg: number;
  lonMin: number;
  lonSec?: number;
  lonDir: 'T' | 'B';
  timezone: number; // UTC offset, e.g., 7 for WIB, 8 for WITA, 9 for WIT
  timezoneName: string;
}

export interface PrayerTimesResult {
  imsak: string;
  subuh: string;
  terbit: string;
  israq: string;
  duhaSugra: string;
  duhaKubra: string;
  zohor: string;
  asarAwwal: string;
  asarTsani: string;
  magrib: string;
  isyaAwwal: string;
  isyaTsani: string;
  // Raw decimal hours
  raw: {
    imsak: number;
    subuh: number;
    terbit: number;
    israq: number;
    duhaSugra: number;
    duhaKubra: number;
    zohor: number;
    asarAwwal: number;
    asarTsani: number;
    magrib: number;
    isyaAwwal: number;
    isyaTsani: number;
  };
  // Falak parameters from Taqribul Maqshad
  falakParams: {
    buruj: string;
    burujArabic: string;
    burujJihat: 'Utara' | 'Selatan';
    darajatSyamsi: number;
    mailAwwal: number; // Deklinasi
    mailDir: 'Utara' | 'Selatan';
    ghayah: number; // Tinggi kulminasi
    tamamGhayah: number;
    buduQutri: number;
    ashalMuthlaq: number;
    nisfuFadhlah: number;
    nisfuQausNahar: number;
    nisfuQausLail: number;
    equationOfTime: number; // Ta'dilul waqt in minutes
    tamkin: number; // Ihtiyath minutes
  };
}

export interface QiblaResult {
  azimuth: number; // 0 - 360 clockwise from True North
  angleFromWestToNorth: number; // Sudut dari Titik Barat ke Utara (e.g. ~23° 11' for Lombok)
  distanceKm: number;
  directionLabel: string;
  rashdulQiblahToday?: string; // Time today when sun shadow points to Qibla
  steps: {
    fadlutTulain: number; // Selisih bujur
    fadhluArdaen: number; // Selisih / gabungan lintang
    aMutlaq: number;
    bQutur: number;
    aMuadal: number;
    jt: number;
    irtifaSimti: number;
    hissotuSimti: number;
    tadilSimti: number;
  };
}

export interface HijriDate {
  year: number;
  month: number;
  day: number;
  monthNameAr: string;
  monthNameId: string;
  dayNameAr: string;
  dayNameId: string;
  formatted: string;
  formattedAr: string;
  isSunnahFasting?: boolean;
  fastingNote?: string;
}

export interface NotificationSetting {
  prayerKey: string;
  name: string;
  enabled: boolean;
  offsetMinutes: number; // -10 to +10 min
  sound: 'adzan' | 'beep' | 'gentle' | 'silent';
}

export interface FavoriteLocation {
  id: string;
  name: string;
  category: 'masjid' | 'mushalla' | 'rumah' | 'kantor' | 'lapangan' | 'lainnya';
  latitude: number;
  longitude: number;
  altitude?: number;
  city: CityLocation;
  notes?: string;
  addedAt: string; // ISO date string
}

export interface AppBackupPayload {
  version: string;
  format: 'falak_taqribul_maqshad_backup';
  exportedAt: string;
  app: {
    name: string;
    author: string;
    source: string;
  };
  stats: {
    favoriteLocationsCount: number;
    notificationsConfigured: number;
  };
  data: {
    settings: AppSettings;
    favoriteLocations: FavoriteLocation[];
  };
}

export interface AppSettings {
  selectedCity: CityLocation;
  customLocation?: CityLocation;
  favoriteLocations: FavoriteLocation[];
  useGPS: boolean;
  tamkinMinutes: number; // Default 2-5 min
  useAsarTsani: boolean; // false = Syafi'i, true = Hanafi
  useIsyaTsani: boolean; // false = 17 deg, true = 19 deg
  subuhAngle: number; // 19 or 20 deg
  notifications: Record<string, NotificationSetting>;
  darkMode: boolean;
  cloudSyncEnabled: boolean;
  lastCloudSync?: string;
  cloudSyncStatus: 'synced' | 'pending' | 'offline';
}

export interface QiblaCertificateData {
  nomorSurat: string;
  namaTempatIbadah: string;
  jenisTempatIbadah: string;
  alamatLengkap: string;
  kelurahanDesa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  namaTakmir: string;
  jabatanTakmir: string;
  teleponTakmir: string;
  tanggalMasehi: string;
  tanggalHijriah: string;
  // Geodesi & Astronomi
  latitude: number;
  longitude: number;
  latDMS: string;
  lonDMS: string;
  angleFromWest: number; // B-U
  angleNorthToWest: number; // U-B
  trueAzimuth: number; // UTSB
  jarakKm: number;
  rashdulQiblah: string;
  metodePengukuran: string;
  peralatan: string;
  // Penandatangan
  namaPengukur: string;
  nipPengukur: string;
  jabatanPengukur: string;
  namaKepalaKUA: string;
  nipKepalaKUA: string;
  jabatanKepalaKUA: string;
  catatan: string;
}
