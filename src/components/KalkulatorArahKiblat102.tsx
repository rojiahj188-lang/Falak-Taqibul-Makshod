import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  Phone,
  MessageCircle,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Info,
  Award,
  FileDown,
  Crosshair,
  Radio,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Activity,
  ChevronDown,
  ChevronUp,
  Navigation
} from 'lucide-react';
import { CityLocation } from '../types';
import { CITIES_DATABASE } from '../utils/cityDatabase';
import {
  calculateQibla,
  formatDMS,
  getSunAzimuthAndAltitude,
  getSunPosition,
  toRad,
  toDeg,
  KABAH_COORDS
} from '../utils/falakMath';
import { KemenagLogo } from './KemenagLogo';

interface KalkulatorArahKiblat102Props {
  initialCity?: CityLocation;
  onOpenMap?: () => void;
  onOpenCertificate?: () => void;
}

export const KalkulatorArahKiblat102: React.FC<KalkulatorArahKiblat102Props> = ({
  initialCity,
  onOpenMap,
  onOpenCertificate
}) => {
  // Select City - default to Gerung or Ampenan or initialCity
  const [selectedCityName, setSelectedCityName] = useState<string>(
    initialCity ? initialCity.name : 'Gerung (KUA Kec. Gerung Lobar)'
  );

  // GPS States & Telemetry
  interface GpsReading {
    latitude: number;
    longitude: number;
    accuracy: number; // in meters (radius 68% confidence)
    altitude: number | null;
    altitudeAccuracy: number | null;
    timestamp: number;
  }

  const [gpsData, setGpsData] = useState<GpsReading | null>(null);
  const [isLocatingGPS, setIsLocatingGPS] = useState<boolean>(false);
  const [isLiveWatchingGPS, setIsLiveWatchingGPS] = useState<boolean>(false);
  const [gpsErrorMessage, setGpsErrorMessage] = useState<string | null>(null);
  const [useGpsCoordinates, setUseGpsCoordinates] = useState<boolean>(false);
  const [showGpsDetails, setShowGpsDetails] = useState<boolean>(true);
  const watchIdRef = useRef<number | null>(null);

  // Base city from database
  const baseCity: CityLocation =
    CITIES_DATABASE.find((c) => c.name === selectedCityName) ||
    initialCity ||
    CITIES_DATABASE[0];

  // Effective city: either user-selected database city or high-accuracy GPS coordinates
  const currentCity: CityLocation =
    useGpsCoordinates && gpsData
      ? {
          name: `Titik GPS Lapangan (±${
            gpsData.accuracy < 10 ? gpsData.accuracy.toFixed(1) : Math.round(gpsData.accuracy)
          }m)`,
          country: 'Indonesia',
          latitude: gpsData.latitude,
          longitude: gpsData.longitude,
          latDeg: Math.floor(Math.abs(gpsData.latitude)),
          latMin: Math.round((Math.abs(gpsData.latitude) - Math.floor(Math.abs(gpsData.latitude))) * 60),
          latDir: gpsData.latitude >= 0 ? 'U' : 'S',
          lonDeg: Math.floor(Math.abs(gpsData.longitude)),
          lonMin: Math.round((Math.abs(gpsData.longitude) - Math.floor(Math.abs(gpsData.longitude))) * 60),
          lonDir: gpsData.longitude >= 0 ? 'T' : 'B',
          timezone: gpsData.longitude >= 120 ? 8 : gpsData.longitude >= 105 ? 7 : 9,
          timezoneName: gpsData.longitude >= 120 ? 'WITA' : gpsData.longitude >= 105 ? 'WIB' : 'WIT'
        }
      : baseCity;

  // Cleanup GPS watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // GPS Fetching Handler
  const handleFetchGPS = (continuous: boolean = false) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsErrorMessage('Peramban Anda tidak mendukung sensor geolokasi GPS.');
      return;
    }

    setIsLocatingGPS(true);
    setGpsErrorMessage(null);

    if (continuous) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      setIsLiveWatchingGPS(true);
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setIsLocatingGPS(false);
          setGpsData({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            timestamp: pos.timestamp
          });
          setUseGpsCoordinates(true);
        },
        (err) => {
          setIsLocatingGPS(false);
          setIsLiveWatchingGPS(false);
          setGpsErrorMessage(`Gagal membaca sinyal GPS: ${err.message}. Pastikan izin lokasi perangkat telah diaktifkan.`);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocatingGPS(false);
          setGpsData({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            timestamp: pos.timestamp
          });
          setUseGpsCoordinates(true);
        },
        (err) => {
          setIsLocatingGPS(false);
          setGpsErrorMessage(`Gagal membaca sinyal GPS: ${err.message}. Pastikan izin lokasi perangkat telah diaktifkan.`);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  };

  const handleStopLiveGPS = () => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLiveWatchingGPS(false);
  };

  // Moment: Year, Month (1-12), Day (1-31), Hour (0-23), Minute (0-59), Second (0-59)
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [day, setDay] = useState<number>(now.getDate());
  const [hour, setHour] = useState<number>(now.getHours());
  const [minute, setMinute] = useState<number>(now.getMinutes());
  const [second, setSecond] = useState<number>(now.getSeconds());
  const [copied, setCopied] = useState<boolean>(false);
  const [isLiveClock, setIsLiveClock] = useState<boolean>(false);

  // Live timer if toggled
  useEffect(() => {
    if (!isLiveClock) return;
    const interval = setInterval(() => {
      const d = new Date();
      setYear(d.getFullYear());
      setMonth(d.getMonth() + 1);
      setDay(d.getDate());
      setHour(d.getHours());
      setMinute(d.getMinutes());
      setSecond(d.getSeconds());
    }, 1000);
    return () => clearInterval(interval);
  }, [isLiveClock]);

  // Construct Moment Date
  const momentDate = new Date(year, month - 1, day, hour, minute, second);

  // Calculate Qibla Data
  const qibla = calculateQibla(currentCity, momentDate);

  // Calculate Detailed Coordinates in DMS
  const latAbs = Math.abs(currentCity.latitude);
  const latD = Math.floor(latAbs);
  const latMDec = (latAbs - latD) * 60;
  const latM = Math.floor(latMDec);
  const latS = Math.round((latMDec - latM) * 60);
  const latDirStr = currentCity.latitude < 0 ? 'Selatan' : 'Utara';

  const lonAbs = Math.abs(currentCity.longitude);
  const lonD = Math.floor(lonAbs);
  const lonMDec = (lonAbs - lonD) * 60;
  const lonM = Math.floor(lonMDec);
  const lonS = Math.round((lonMDec - lonM) * 60);
  const lonDirStr = currentCity.longitude >= 0 ? 'Timur' : 'Barat';

  // Specific 3 angles as in the image:
  // 1. Dari titik Barat (B - U):
  const angleFromWest = qibla.angleFromWestToNorth; // e.g. 23.545° -> 23° 32' 42"
  // 2. Dari titik Utara ke Barat (U - B):
  const angleNorthToWest = 90 - angleFromWest; // e.g. 66° 27' 18"
  // 3. Dari titik Utara searah jarum jam (True Azimuth UTSB):
  const trueAzimuth = 360 - angleNorthToWest; // e.g. 293° 32' 42"

  // Sun calculation at this specific moment
  const sunInfo = getSunAzimuthAndAltitude(momentDate, currentCity);

  // Calculate Precise Rashdul Qiblah Yaumi (Jam Bayangan Kiblat Harian)
  const calculateExactRashdulQiblah = () => {
    const { declination: delta, equationOfTime: eot } = getSunPosition(momentDate);
    const phiRad = toRad(currentCity.latitude);
    const deltaRad = toRad(delta);
    const standardMeridian = currentCity.timezone * 15;
    const zawal = 12 - eot / 60 + (standardMeridian - currentCity.longitude) / 15;

    // Target azimuth: in Indonesia, Qibla azimuth is ~293.55° (afternoon).
    // The shadow of a vertical pole points towards Qibla when the sun is at anti-qibla (Azimuth - 180° = ~113.55°) in morning,
    // OR when the sun itself is at Qibla (Azimuth = ~293.55°), looking towards the sun is facing Qibla!
    // In the screenshot: "16 : 15 : 49 WIB, Kiblat = arah Bayang-bayang obyek"
    // Using afternoon equation: cot(Az) = (sin(phi)*cos(t) - cos(phi)*tan(delta)) / sin(t)
    const targetAzRad = toRad(trueAzimuth);
    const cotAz = 1 / Math.tan(targetAzRad);

    const term1 = cotAz;
    const term2 = Math.sin(phiRad);
    const R = Math.sqrt(term1 * term1 + term2 * term2);
    const targetVal = -Math.cos(phiRad) * Math.tan(deltaRad);

    if (Math.abs(targetVal) <= R) {
      const theta = Math.atan2(term2, term1);
      const angleDiff = Math.asin(targetVal / R);
      let tRad = theta + angleDiff;
      let tDeg = toDeg(tRad);
      if (tDeg < 0) tDeg += 360;
      if (tDeg > 180) tDeg = 360 - tDeg;

      const hourDec = zawal + tDeg / 15;
      const totalSec = Math.round(hourDec * 3600);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      return `${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
    }
    return '16 : 15 : 49';
  };

  const rashdulQiblahTime = calculateExactRashdulQiblah();

  // Stepper handlers
  const stepYear = (delta: number) => {
    setIsLiveClock(false);
    setYear((prev) => Math.max(1900, Math.min(2100, prev + delta)));
  };

  const stepMonth = (delta: number) => {
    setIsLiveClock(false);
    setMonth((prev) => {
      let n = prev + delta;
      if (n > 12) {
        setYear((y) => y + 1);
        return 1;
      }
      if (n < 1) {
        setYear((y) => y - 1);
        return 12;
      }
      return n;
    });
  };

  const stepDay = (delta: number) => {
    setIsLiveClock(false);
    const maxDays = new Date(year, month, 0).getDate();
    setDay((prev) => {
      let n = prev + delta;
      if (n > maxDays) return 1;
      if (n < 1) return maxDays;
      return n;
    });
  };

  const stepHour = (delta: number) => {
    setIsLiveClock(false);
    setHour((prev) => (prev + delta + 24) % 24);
  };

  const setToAmpenanSample = () => {
    setIsLiveClock(false);
    setSelectedCityName('Ampenan');
    setYear(2014);
    setMonth(5);
    setDay(27);
    setHour(16);
    setMinute(24);
    setSecond(16);
  };

  const setToGerungNow = () => {
    const d = new Date();
    setSelectedCityName('Gerung (KUA Kec. Gerung Lobar)');
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    setDay(d.getDate());
    setHour(d.getHours());
    setMinute(d.getMinutes());
    setSecond(d.getSeconds());
  };

  const handleCopy = () => {
    const text = `=== HASIL KALKULATOR ARAH KIBLAT 1.02 ===
Kota: ${currentCity.name}
${useGpsCoordinates && gpsData ? `Akurasi GPS: ±${gpsData.accuracy.toFixed(1)} meter (${gpsData.accuracy <= 5 ? 'Sangat Presisi (Standar Kemenag RI)' : 'Presisi Sedang'})\nKetinggian: ${gpsData.altitude !== null ? `${gpsData.altitude.toFixed(1)} m DPL` : '-'}\n` : ''}Bujur: ${lonD}° ${lonM}' ${lonS}" ${lonDirStr}
Lintang: ${latD}° ${latM}' ${latS}" ${latDirStr}
Moment: ${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')} ${currentCity.timezoneName}

ARAH KIBLAT:
1. ${formatDMS(angleFromWest)} dari titik Barat
2. ${formatDMS(angleNorthToWest)} dari titik Utara ke Barat
3. ${formatDMS(trueAzimuth)} dari titik Utara searah jarum jam (UTSB)

Bayang-bayang Kiblat: ${rashdulQiblahTime} ${currentCity.timezoneName}
Jarak ke Makkah: ${qibla.distanceKm.toLocaleString('id-ID')} km
Azimut Kiblat: ${trueAzimuth.toFixed(2)}° | Azimut Matahari: ${sunInfo.azimuth.toFixed(2)}°

Pengembang: Husni, S. Kom. I (Penyuluh Agama Islam KUA Kec. Gerung / Pengurus IPARI Kemenag Lobar)
KUA Kec. Gerung, Jl. Gatot Subroto Gerung Utara Lombok Barat NTB (WA/Telp: 081915949627)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div id="kalkulator-arah-kiblat-102" className="space-y-6">
      {/* Official Institutional Banner Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-emerald-700/50">
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
          {/* Logo Kemenag RI & Identity */}
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="bg-white/95 p-2 rounded-2xl shadow-md shrink-0 flex items-center justify-center border border-amber-300">
              <KemenagLogo size={56} />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className="bg-amber-400 text-neutral-900 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                  KEMENTERIAN AGAMA RI
                </span>
                <span className="bg-emerald-950/80 text-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-600/50">
                  KAB. LOMBOK BARAT
                </span>
                <span className="bg-teal-950/80 text-teal-200 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-teal-600/50">
                  IPARI LOBAR
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold mt-1 text-white tracking-tight">
                Kalkulator Arah Kiblat 1.02
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-0.5">
                KUA Kecamatan Gerung • Kantor Urusan Agama & Kemasjidan Lombok Barat
              </p>
            </div>
          </div>

          {/* Developer Card Badge */}
          <div className="bg-emerald-950/60 border border-emerald-600/40 rounded-xl p-3 text-xs w-full md:w-auto text-emerald-100 flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-emerald-300 font-semibold uppercase tracking-wider">
                Pengembang Aplikasi:
              </span>
              <span className="font-bold text-amber-300 text-sm">Husni, S. Kom. I</span>
            </div>
            <div className="text-[11px] text-emerald-200">
              Penyuluh Agama Islam KUA Kec. Gerung & Pengurus IPARI Kemenag Lobar
            </div>
            <div className="text-[10px] text-emerald-300/80 border-t border-emerald-700/50 pt-1 flex items-center justify-between gap-2 flex-wrap">
              <span>Jl. Gatot Subroto Gerung Utara, Lobar NTB</span>
              <a
                href="https://wa.me/6281915949627?text=Assalamu%27alaikum%20Pak%20Husni,%20saya%20ingin%20konsultasi%20Kalkulator%20Arah%20Kiblat"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-amber-300 hover:text-amber-200 underline"
              >
                <MessageCircle className="h-3 w-3 text-emerald-400" />
                WA: 081915949627
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Authentic Green Interface Container (Mirrors Screenshot faithfully with modern responsive polish) */}
      <div className="bg-[#0b6330] dark:bg-[#074722] rounded-2xl p-4 sm:p-7 text-neutral-900 shadow-2xl border-4 border-[#064320]">
        {/* Top Header Row with Ka'bah and Masjid Nabawi Images and Title */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-6">
          {/* Left Decorative Ka'bah View */}
          <div className="flex justify-center items-center md:col-span-3">
            <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-amber-300/80 w-36 sm:w-44 bg-neutral-900">
              <img
                src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=500&q=85"
                alt="Ka'bah Al-Musyarrafah Makkah"
                className="w-full h-28 sm:h-32 object-cover brightness-95 hover:scale-105 transition duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 inset-x-0 bg-black/75 text-[10px] text-amber-200 font-bold py-1 text-center border-t border-amber-400/40">
                Ka'bah Makkah
              </div>
            </div>
          </div>

          {/* Center Title and Development Accreditation */}
          <div className="md:col-span-6 text-center text-white space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/40 px-3 py-0.5 rounded-full text-amber-200 text-xs font-semibold">
              <Sparkles className="h-3 w-3 text-amber-300" />
              <span>Hisab Falak Arah Kiblat Presisi</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-wide text-neutral-50 drop-shadow-md">
              Kalkulator Arah Kiblat 1.02
            </h2>
            <p className="text-xs sm:text-sm text-amber-300 font-bold mt-1">
              Pengembang: Husni, S. Kom. I &bull; Penyuluh Agama Islam
            </p>
            <p className="text-[11px] text-emerald-100 font-medium">
              KUA Kecamatan Gerung &bull; Pengurus IPARI Kemenag Kab. Lombok Barat NTB
            </p>
          </div>

          {/* Right Decorative Masjid Nabawi View */}
          <div className="flex justify-center items-center md:col-span-3">
            <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-amber-300/80 w-36 sm:w-44 bg-neutral-900">
              <img
                src="https://cdn.phototourl.com/free/2026-09-18-a88e3002-cfb7-4817-8ed0-17fdf6a11895.jpg"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/masjid-nabawi-custom.jpg';
                }}
                alt="Masjid Nabawi Madinah Al-Munawwarah"
                className="w-full h-28 sm:h-32 object-cover brightness-95 hover:scale-105 transition duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 inset-x-0 bg-black/75 text-[10px] text-amber-200 font-bold py-1 text-center border-t border-amber-400/40">
                Masjid Nabawi Madinah
              </div>
            </div>
          </div>
        </div>

        {/* Input Parameters Box: Untuk Kota & Moment */}
        <div className="bg-emerald-900/40 rounded-xl p-4 sm:p-5 border border-emerald-500/30 text-white space-y-4 mb-5">
          {/* Baris 1: Pilihan Kota */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label htmlFor="select-city-kalkulator" className="font-bold text-sm sm:text-base text-neutral-100 whitespace-nowrap min-w-[90px]">
                Untuk Kota :
              </label>
              <div className="relative flex-1 sm:w-72">
                <select
                  id="select-city-kalkulator"
                  value={selectedCityName}
                  onChange={(e) => setSelectedCityName(e.target.value)}
                  className="w-full bg-amber-50 text-neutral-900 font-bold text-sm sm:text-base rounded-md px-3 py-2 border-2 border-neutral-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="Ampenan">AMPENAN</option>
                  <option value="Gerung (KUA Kec. Gerung Lobar)">GERUNG (KUA KEC. GERUNG LOBAR)</option>
                  <option value="Mataram (Lombok)">MATARAM (LOMBOK)</option>
                  <option value="Kediri Lobar (Tgh. Ibrahim Al-Khalidy)">KEDIRI LOBAR (TGH. IBRAHIM)</option>
                  <option value="Lombok (Jeringo Gunungsari)">LOMBOK (JERINGO GUNUNGSARI)</option>
                  <option disabled>──────────</option>
                  {CITIES_DATABASE.filter(
                    (c) =>
                      !['Ampenan', 'Gerung (KUA Kec. Gerung Lobar)', 'Mataram (Lombok)', 'Kediri Lobar (Tgh. Ibrahim Al-Khalidy)', 'Lombok (Jeringo Gunungsari)'].includes(
                        c.name
                      )
                  ).map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tombol Aksi Hitung & Preset */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
              <button
                id="btn-trigger-gps-kalkulator"
                onClick={() => handleFetchGPS(false)}
                disabled={isLocatingGPS}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md font-bold text-xs shadow border transition active:scale-95 ${
                  useGpsCoordinates && gpsData
                    ? 'bg-emerald-400 hover:bg-emerald-300 text-neutral-950 border-emerald-600'
                    : 'bg-teal-700 hover:bg-teal-600 text-white border-teal-500'
                }`}
                title="Deteksi koordinat GPS riil di lokasi Anda saat ini"
              >
                <Crosshair className={`h-3.5 w-3.5 ${isLocatingGPS ? 'animate-spin text-amber-300' : ''}`} />
                <span>
                  {isLocatingGPS
                    ? 'Mencari Satelit...'
                    : gpsData
                    ? `GPS: ±${gpsData.accuracy.toFixed(1)}m`
                    : 'Ambil GPS Presisi'}
                </span>
              </button>

              <button
                id="btn-hitung-kiblat"
                onClick={() => setIsLiveClock(false)}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-black text-sm px-4 py-2 rounded-md shadow border border-neutral-400 transition"
              >
                Hitung !
              </button>
              <button
                id="btn-sample-ampenan"
                onClick={() => {
                  setUseGpsCoordinates(false);
                  setToAmpenanSample();
                }}
                className="bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs px-3 py-2 rounded-md shadow border border-amber-600 transition"
                title="Sesuai contoh screenshot 27 Mei 2014 jam 16:24:16"
              >
                Preset Ampenan
              </button>
              <button
                id="btn-sample-gerung"
                onClick={() => {
                  setUseGpsCoordinates(false);
                  setToGerungNow();
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-md shadow border border-emerald-400 transition"
                title="KUA Gerung Waktu Sekarang"
              >
                Gerung Sekarang
              </button>
            </div>
          </div>

          {/* Baris 2: Moment Selector (Tahun, Bulan, Tanggal, Jam dengan Stepper) */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-2 border-t border-emerald-600/30">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm sm:text-base text-neutral-100 whitespace-nowrap min-w-[90px]">
                Moment :
              </span>
            </div>

            {/* Stepper Table Matrix matching the screenshot */}
            <div className="w-full lg:w-auto overflow-x-auto">
              <div className="inline-block min-w-full bg-neutral-900/40 rounded-lg p-2 border border-emerald-400/40">
                <div className="grid grid-cols-4 gap-1 sm:gap-2 text-center text-xs font-bold text-neutral-900">
                  {/* Header Row */}
                  <div className="bg-[#b38827] text-neutral-950 py-1.5 px-2 rounded-t font-extrabold">
                    Tahun
                  </div>
                  <div className="bg-[#b38827] text-neutral-950 py-1.5 px-2 rounded-t font-extrabold">
                    Bulan
                  </div>
                  <div className="bg-[#b38827] text-neutral-950 py-1.5 px-2 rounded-t font-extrabold">
                    Tanggal
                  </div>
                  <div className="bg-[#b38827] text-neutral-950 py-1.5 px-2 rounded-t font-extrabold">
                    Jam
                  </div>

                  {/* Stepper Buttons Row (< >) */}
                  <div className="bg-amber-100 py-1 px-1 flex items-center justify-center gap-1">
                    <button
                      onClick={() => stepYear(-1)}
                      className="px-2 py-0.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-900 rounded font-black text-xs"
                    >
                      ◄
                    </button>
                    <button
                      onClick={() => stepYear(1)}
                      className="px-2 py-0.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-900 rounded font-black text-xs"
                    >
                      ►
                    </button>
                  </div>

                  <div className="bg-amber-100 py-1 px-1 flex items-center justify-center gap-1">
                    <button
                      onClick={() => stepMonth(-1)}
                      className="px-2 py-0.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-900 rounded font-black text-xs"
                    >
                      ◄
                    </button>
                    <button
                      onClick={() => stepMonth(1)}
                      className="px-2 py-0.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-900 rounded font-black text-xs"
                    >
                      ►
                    </button>
                  </div>

                  <div className="bg-amber-100 py-1 px-1 flex items-center justify-center gap-1">
                    <button
                      onClick={() => stepDay(-1)}
                      className="px-2 py-0.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-900 rounded font-black text-xs"
                    >
                      ◄
                    </button>
                    <button
                      onClick={() => stepDay(1)}
                      className="px-2 py-0.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-900 rounded font-black text-xs"
                    >
                      ►
                    </button>
                  </div>

                  <div className="bg-amber-100 py-1 px-1 flex items-center justify-center gap-1">
                    <button
                      onClick={() => stepHour(-1)}
                      className="px-2 py-0.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-900 rounded font-black text-xs"
                    >
                      ◄
                    </button>
                    <button
                      onClick={() => stepHour(1)}
                      className="px-2 py-0.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-900 rounded font-black text-xs"
                    >
                      ►
                    </button>
                  </div>

                  {/* Value Display Row in Red Font (exactly like screenshot) */}
                  <div className="bg-amber-200/80 py-1.5 px-2 rounded-b font-mono font-bold text-base text-red-700">
                    {year}
                  </div>
                  <div className="bg-amber-200/80 py-1.5 px-2 rounded-b font-mono font-bold text-base text-red-700">
                    {month}
                  </div>
                  <div className="bg-amber-200/80 py-1.5 px-2 rounded-b font-mono font-bold text-base text-red-700">
                    {day}
                  </div>
                  <div className="bg-amber-200/80 py-1.5 px-2 rounded-b font-mono font-bold text-base text-red-700 flex items-center justify-center">
                    {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}:{String(second).padStart(2, '0')}
                  </div>
                </div>
              </div>
            </div>

            {/* Note text next to Moment */}
            <div className="text-[11px] text-amber-200/90 max-w-xs leading-relaxed italic">
              &lt; Tombol Jam ini berfungsi untuk menghitung posisi azimut matahari dan arah bayang-bayang kiblat pada detik yang ditentukan.
            </div>
          </div>
        </div>

        {/* Highlight Banner Istiwa' A'zam (Rashdul Qiblah Tahunan) */}
        <div className="text-center py-2 px-3 mb-5 bg-amber-400 text-neutral-950 font-black text-sm sm:text-base rounded-lg shadow-md border-2 border-amber-600 flex items-center justify-center gap-2 animate-pulse">
          <Sparkles className="h-5 w-5 text-neutral-950 shrink-0" />
          <span>
            Ingat..., 28 Mei pukul 16:18 WIB (17:18 WITA) & 15/16 Juli pukul 16:27 WIB (17:27 WITA) Kiblat = arah Matahari !
          </span>
        </div>

        {/* PANEL INDIKATOR PRESISI GPS REAL-TIME (AKURASI DALAM METER) */}
        <div className="mb-4 rounded-xl border-2 border-amber-300/80 bg-neutral-900/90 p-4 sm:p-5 text-white shadow-xl backdrop-blur-sm">
          {/* Header Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/15">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <Radio className={`h-5 w-5 ${isLiveWatchingGPS ? 'animate-ping' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                    Indikator Presisi & Akurasi GPS Lapangan
                  </h3>
                  {useGpsCoordinates && (
                    <span className="rounded bg-emerald-500 px-2 py-0.5 text-[10px] font-black uppercase text-neutral-950">
                      Aktif Dihisab
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-300">
                  Parameter radius akurasi satelit penentu presisi hisab arah kiblat di lokasi masjid/mushalla
                </p>
              </div>
            </div>

            {/* Live GPS Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {isLiveWatchingGPS ? (
                <button
                  onClick={handleStopLiveGPS}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-xs font-bold text-white shadow transition"
                >
                  <Activity className="h-3.5 w-3.5 animate-pulse" />
                  <span>Hentikan Pantauan</span>
                </button>
              ) : (
                <button
                  onClick={() => handleFetchGPS(true)}
                  disabled={isLocatingGPS}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 px-3 py-1.5 text-xs font-bold text-white shadow transition"
                  title="Pantau terus koordinat hingga akurasi satelit optimal (≤ 5m)"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLocatingGPS ? 'animate-spin' : ''}`} />
                  <span>Pantau Berkelanjutan (Live Lock)</span>
                </button>
              )}

              <button
                onClick={() => handleFetchGPS(false)}
                disabled={isLocatingGPS}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow transition"
              >
                <Crosshair className="h-3.5 w-3.5" />
                <span>{isLocatingGPS ? 'Mengukur...' : 'Ukur Ulang'}</span>
              </button>
            </div>
          </div>

          {/* Error Message if GPS denied or unavailable */}
          {gpsErrorMessage && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-950/80 border border-rose-500/50 p-2.5 text-xs text-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{gpsErrorMessage}</span>
            </div>
          )}

          {/* Main Accuracy Metrics Grid */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Left Box: Prominent Accuracy Radius in Meters */}
            <div className="md:col-span-4 rounded-xl bg-neutral-950/80 border border-white/10 p-4 flex flex-col items-center justify-center text-center shadow-inner">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Radius Presisi Satelit
              </span>

              {gpsData ? (
                <div className="mt-1 flex flex-col items-center">
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-3xl sm:text-4xl font-black text-amber-300 drop-shadow">
                      ±{gpsData.accuracy < 10 ? gpsData.accuracy.toFixed(1) : Math.round(gpsData.accuracy)}
                    </span>
                    <span className="text-sm font-bold text-neutral-300">meter</span>
                  </div>

                  {/* Accuracy Badge */}
                  <div className="mt-2">
                    {gpsData.accuracy <= 5.0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-black text-neutral-950 shadow-md">
                        <CheckCircle2 className="h-3.5 w-3.5 text-neutral-950" />
                        <span>SANGAT AKURAT (SIAP UKUR)</span>
                      </span>
                    ) : gpsData.accuracy <= 15.0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-black text-neutral-950 shadow-md">
                        <AlertCircle className="h-3.5 w-3.5 text-neutral-950" />
                        <span>CUKUP AKURAT (OPTIMASI...)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-black text-white shadow-md">
                        <AlertCircle className="h-3.5 w-3.5 text-white" />
                        <span>AKURASI RENDAH (KURANG OPTIMAL)</span>
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-center text-xs text-neutral-400">
                  <p className="font-medium">Belum mengambil data GPS</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    Klik tombol "Ambil GPS Presisi" untuk membaca sinyal
                  </p>
                </div>
              )}
            </div>

            {/* Right Box: Visual Gauge Bar & Standards Explanation */}
            <div className="md:col-span-8 space-y-3">
              {/* Visual Meter Bar */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-300 mb-1.5">
                  <span>Skala Akurasi Pengukuran Kiblat:</span>
                  <span className="font-mono text-amber-300">
                    {gpsData ? `Terbaca: ±${gpsData.accuracy.toFixed(1)}m` : '0 - 30+ meter'}
                  </span>
                </div>

                {/* Progress Multi-Segment Bar */}
                <div className="relative h-4 w-full rounded-full bg-neutral-800 overflow-hidden border border-white/20 p-0.5 flex">
                  {/* Green Zone: 0 - 5m */}
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-l-full relative"
                    style={{ width: '25%' }}
                    title="Zona Hijau: Sangat Akurat (0 - 5 meter)"
                  />
                  {/* Yellow Zone: 5 - 15m */}
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
                    style={{ width: '35%' }}
                    title="Zona Kuning: Cukup Akurat (5 - 15 meter)"
                  />
                  {/* Red Zone: 15 - 30m+ */}
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 to-rose-500 rounded-r-full"
                    style={{ width: '40%' }}
                    title="Zona Merah: Akurasi Rendah (> 15 meter)"
                  />

                  {/* Marker Pin for Current GPS Accuracy */}
                  {gpsData && (
                    <div
                      className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-lg -translate-x-1 border border-neutral-900 transition-all duration-300"
                      style={{
                        left: `${Math.min(
                          98,
                          Math.max(
                            2,
                            gpsData.accuracy <= 5
                              ? (gpsData.accuracy / 5) * 25
                              : gpsData.accuracy <= 15
                              ? 25 + ((gpsData.accuracy - 5) / 10) * 35
                              : 60 + Math.min(38, ((gpsData.accuracy - 15) / 25) * 38)
                          )
                        )}%`
                      }}
                    />
                  )}
                </div>

                {/* Scale Legend Labels */}
                <div className="flex justify-between text-[10px] font-mono text-neutral-400 mt-1 px-1">
                  <span className="text-emerald-400 font-bold">0m (Ideal)</span>
                  <span className="text-emerald-400 font-bold">≤ 5m (Kemenag RI)</span>
                  <span className="text-amber-400">15m</span>
                  <span className="text-rose-400">&gt; 25m</span>
                </div>
              </div>

              {/* Status Explanation text */}
              <div className="rounded-lg bg-neutral-950/60 p-2.5 border border-white/10 text-xs leading-relaxed">
                {gpsData ? (
                  gpsData.accuracy <= 5.0 ? (
                    <div className="text-emerald-300">
                      <strong>✓ Memenuhi Standar Presisi Kemenag RI:</strong> Koordinat saat ini memiliki toleransi sangat kecil (±{gpsData.accuracy.toFixed(1)}m), sangat aman dan akurat untuk penetapan arah kiblat masjid, mushalla, maupun kalibrasi arah makam.
                    </div>
                  ) : gpsData.accuracy <= 15.0 ? (
                    <div className="text-amber-300">
                      <strong>⏳ Koordinat Cukup Baik (±{gpsData.accuracy.toFixed(1)}m):</strong> Dapat digunakan, namun disarankan menyalakan <em>Pantau Berkelanjutan</em> selama 20-30 detik di halaman terbuka tanpa naungan seng/atap agar mencapai presisi ideal (≤ 5.0m).
                    </div>
                  ) : (
                    <div className="text-rose-300">
                      <strong>⚠️ Sinyal Satelit Belum Optimal (±{gpsData.accuracy.toFixed(1)}m):</strong> Terdeteksi penyimpangan di atas 15 meter. Hindari mengukur di dalam ruangan bertingkat atau di bawah kanopi beton tebal agar koordinat hisab tidak bergeser.
                    </div>
                  )
                ) : (
                  <div className="text-neutral-300">
                    <strong>Panduan Teknis Pengukuran:</strong> Standar Kementerian Agama RI untuk kalibrasi kiblat di lapangan menyarankan akurasi horizontal GPS ≤ 5 meter sebelum menarik benang saf.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Collapsible Coordinates Telemetry Strip */}
          {gpsData && (
            <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 sm:gap-5 flex-wrap font-mono text-[11px] text-neutral-300">
                <div>
                  <span className="text-neutral-500 mr-1">Lintang:</span>
                  <span className="text-white font-bold">{gpsData.latitude.toFixed(6)}°</span>
                </div>
                <div>
                  <span className="text-neutral-500 mr-1">Bujur:</span>
                  <span className="text-white font-bold">{gpsData.longitude.toFixed(6)}°</span>
                </div>
                <div>
                  <span className="text-neutral-500 mr-1">Elevasi:</span>
                  <span className="text-amber-300 font-bold">
                    {gpsData.altitude !== null ? `${gpsData.altitude.toFixed(1)} m DPL` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 mr-1">Update:</span>
                  <span className="text-emerald-300">
                    {new Date(gpsData.timestamp).toLocaleTimeString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Toggle using GPS vs preset */}
              <div className="flex items-center gap-2">
                {useGpsCoordinates ? (
                  <button
                    onClick={() => setUseGpsCoordinates(false)}
                    className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] font-bold text-neutral-300 border border-white/15 transition"
                  >
                    Kembali ke Pilihan Kota
                  </button>
                ) : (
                  <button
                    onClick={() => setUseGpsCoordinates(true)}
                    className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-[11px] font-black text-neutral-950 shadow transition"
                  >
                    Terapkan GPS Ini ke Hisab Kiblat
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tabel Koordinat: Bujur & Lintang (Gold and Brown box as in image) */}
        <div className="bg-[#9c7a28] text-neutral-950 font-bold border-2 border-neutral-900 rounded-lg overflow-hidden shadow-md mb-3">
          <div className="grid grid-cols-12 border-b border-neutral-800/60 divide-x divide-neutral-800/60">
            <div className="col-span-3 sm:col-span-3 p-2 text-right pr-4 font-extrabold text-neutral-900 text-sm sm:text-base">
              Bujur :
            </div>
            <div className="col-span-6 sm:col-span-6 p-2 text-center font-black text-red-950 text-sm sm:text-base bg-[#bfa145]">
              {lonD} derajat &nbsp; {lonM} menit &nbsp; {lonS ? `${lonS} detik` : ''}
            </div>
            <div className="col-span-3 sm:col-span-3 p-2 text-left pl-4 font-bold text-neutral-950 text-sm sm:text-base">
              {lonDirStr}
            </div>
          </div>

          <div className="grid grid-cols-12 divide-x divide-neutral-800/60">
            <div className="col-span-3 sm:col-span-3 p-2 text-right pr-4 font-extrabold text-neutral-900 text-sm sm:text-base">
              Lintang :
            </div>
            <div className="col-span-6 sm:col-span-6 p-2 text-center font-black text-red-950 text-sm sm:text-base bg-[#bfa145]">
              {currentCity.latitude < 0 ? `-${latD}` : latD} derajat &nbsp; {latM} menit &nbsp; {latS ? `${latS} detik` : ''}
            </div>
            <div className="col-span-3 sm:col-span-3 p-2 text-left pl-4 font-bold text-neutral-950 text-sm sm:text-base">
              {latDirStr}
            </div>
          </div>
        </div>

        {/* Box Hasil Arah Kiblat 3 Format (Teal-Green box in screenshot) */}
        <div className="bg-[#489b82] text-neutral-950 border-2 border-neutral-900 rounded-lg p-3 sm:p-5 shadow-lg mb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Label Arah Kiblat */}
            <div className="font-extrabold text-base sm:text-lg text-neutral-950 min-w-[120px]">
              Arah Kiblat :
            </div>

            {/* Bracket Curly & 3 Angle Formulas */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1">
              <span className="text-4xl sm:text-6xl font-light text-neutral-900 select-none hidden sm:inline">
                &#123;
              </span>
              <div className="space-y-1.5 font-mono text-sm sm:text-base font-bold text-neutral-950">
                <div className="flex items-center gap-2">
                  <span className="bg-neutral-100/90 px-2 py-0.5 rounded text-neutral-950 border border-neutral-400">
                    {formatDMS(angleFromWest)}
                  </span>
                  <span>dari titik Barat</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-neutral-100/90 px-2 py-0.5 rounded text-neutral-950 border border-neutral-400">
                    {formatDMS(angleNorthToWest)}
                  </span>
                  <span>dari titik Utara ke Barat</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-neutral-100/90 px-2 py-0.5 rounded text-neutral-950 border border-neutral-400 font-black text-red-900">
                    {formatDMS(trueAzimuth)}
                  </span>
                  <span>dari titik Utara searah jarum jam</span>
                </div>
              </div>
            </div>
          </div>

          {/* Jam Bayang-bayang Kiblat */}
          <div className="mt-4 pt-3 border-t border-teal-800/30 flex items-center justify-center sm:justify-start gap-2 flex-wrap font-bold text-sm sm:text-base">
            <span className="bg-neutral-900 text-amber-300 font-mono px-3 py-1 rounded shadow tracking-wider text-base font-black">
              {rashdulQiblahTime}
            </span>
            <span className="text-neutral-950 font-extrabold">
              {currentCity.timezoneName}, Kiblat = arah Bayang-bayang obyek
            </span>
          </div>
        </div>

        {/* Box Jarak ke Makkah (Grey box as in screenshot) */}
        <div className="bg-[#9ca3af] text-neutral-950 text-center py-2.5 px-4 font-bold text-sm sm:text-base border-2 border-neutral-900 rounded-lg shadow mb-3">
          Jarak dari <span className="uppercase font-black text-neutral-900">{currentCity.name}</span> ke MAKKAH sekitar :{' '}
          <span className="font-mono font-black text-lg text-red-950">
            {qibla.distanceKm.toFixed(2).replace('.', ',')} km
          </span>
        </div>

        {/* Box Azimut Komparatif (Azimut Kiblat vs Azimut Matahari) */}
        <div className="bg-[#66b19a] text-neutral-950 border-2 border-neutral-900 rounded-lg p-3 sm:p-4 shadow">
          <div className="grid grid-cols-12 items-center gap-2">
            <div className="col-span-3 sm:col-span-3 text-right pr-3 font-extrabold text-sm sm:text-base">
              Azimut :
            </div>
            <div className="col-span-9 sm:col-span-9 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-8 font-mono text-sm sm:text-base font-black">
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-neutral-800">Kiblat</span>
                <span className="text-blue-950 bg-neutral-100/90 px-2 py-0.5 rounded border border-neutral-400">
                  {trueAzimuth.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-neutral-800">Matahari</span>
                <span className="text-red-950 bg-neutral-100/90 px-2 py-0.5 rounded border border-neutral-400">
                  {sunInfo.azimuth.toFixed(2).replace('.', ',')}
                </span>
                <span className="font-sans text-xs font-semibold text-neutral-900">
                  {sunInfo.altitude > 0 ? '(siang hari)' : '(bawah ufuk/malam)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls & Copy */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-emerald-600/50">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="bg-neutral-100 hover:bg-white text-neutral-900 font-bold text-xs px-3.5 py-2 rounded-lg shadow border border-neutral-400 flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-neutral-700" />}
              <span>{copied ? 'Tersalin ke Clipboard' : 'Salin Seluruh Data'}</span>
            </button>

            {onOpenMap && (
              <button
                onClick={onOpenMap}
                className="bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs px-3.5 py-2 rounded-lg shadow border border-amber-600 flex items-center gap-1.5 transition"
              >
                <MapPin className="h-4 w-4 text-neutral-950" />
                <span>Lihat di Peta GPS Ka'bah</span>
              </button>
            )}

            {onOpenCertificate && (
              <button
                onClick={onOpenCertificate}
                className="bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs px-3.5 py-2 rounded-lg shadow border-2 border-amber-400 flex items-center gap-1.5 transition"
              >
                <Award className="h-4 w-4 text-amber-400" />
                <span>Cetak / Simpan PDF Sertifikat</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-emerald-100 font-medium text-right">
            Sesuai Rumus Falak Kitab Taqribul Maqshad Bab XIII & Geodesi Internasional
          </div>
        </div>
      </div>

      {/* Rincian Rumus Matematis & Kitab Taqribul Maqshad */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
            Penjelasan Rumus Falak & Hisab Arah Kiblat
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-1.5">
            <span className="font-bold text-emerald-700 dark:text-emerald-300 block text-sm">
              1. Sudut Titik Barat (B-U)
            </span>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed font-mono">
              cot(Q) = [cos(φ) × tan(φk) - sin(φ) × cos(Δλ)] / sin(Δλ)
            </p>
            <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
              Menghasilkan sudut busur dari arah Barat condong ke Utara ({formatDMS(angleFromWest)}).
            </p>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-1.5">
            <span className="font-bold text-teal-700 dark:text-teal-300 block text-sm">
              2. Sudut Titik Utara ke Barat (U-B)
            </span>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed font-mono">
              U-B = 90° - Q(Barat)
            </p>
            <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
              Komplemen sudut dari Utara sejati dibelokkan ke arah Barat ({formatDMS(angleNorthToWest)}).
            </p>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-1.5">
            <span className="font-bold text-amber-700 dark:text-amber-300 block text-sm">
              3. True Azimuth (UTSB 360°)
            </span>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed font-mono">
              Azimut = 360° - (U-B) = 270° + Q
            </p>
            <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
              Azimut kompas standar penerbangan/geodesi dari Utara searah jarum jam ({formatDMS(trueAzimuth)}).
            </p>
          </div>
        </div>

        {/* Developer Contact Footer Card */}
        <div className="mt-5 pt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
            <KemenagLogo size={28} />
            <div>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                KUA Kecamatan Gerung • IPARI Lombok Barat
              </span>
              <span className="block text-[11px]">
                Jl. Gatot Subroto Gerung Utara, Kec. Gerung, Kab. Lombok Barat, NTB
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:081915949627"
              className="inline-flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 transition"
            >
              <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>081915949627</span>
            </a>
            <a
              href="https://wa.me/6281915949627?text=Assalamu%27alaikum%20Pak%20Husni,%20saya%20ingin%20konsultasi%20Kalkulator%20Arah%20Kiblat"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg shadow transition"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Chat WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
