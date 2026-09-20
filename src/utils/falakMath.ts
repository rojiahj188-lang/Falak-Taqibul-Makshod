import { CityLocation, PrayerTimesResult, QiblaResult } from '../types';

// Constants for Ka'bah (Makkah Al-Mukarramah) from Kitab & Modern GPS (Page 191/201)
export const KABAH_COORDS = {
  latitude: 21 + 25 / 60 + 21 / 3600, // 21° 25' 21" LU = 21.4225°
  longitude: 39 + 49 / 60 + 34 / 3600, // 39° 49' 34" BT = 39.8261°
  name: "Ka'bah, Masjidil Haram",
  city: "Makkah",
  country: "Arab Saudi"
};

// Buruj Table according to Kitab Taqribul Maqshad Bab III (Page 30 / PDF Page 43)
export interface BurujInfo {
  name: string;
  nameArabic: string;
  latinSign: string;
  direction: 'Utara' | 'Selatan';
  tapaut: number;
  monthIndex: number; // 0 = Jan, 11 = Des
}

export const BURUJ_DATA: BurujInfo[] = [
  { name: 'Jadyu', nameArabic: 'الجدي', latinSign: 'Capricorn', direction: 'Selatan', tapaut: 9, monthIndex: 0 },
  { name: 'Dalwu', nameArabic: 'الدلو', latinSign: 'Aquarius', direction: 'Selatan', tapaut: 10, monthIndex: 1 },
  { name: 'Hut', nameArabic: 'الحوت', latinSign: 'Pisces', direction: 'Selatan', tapaut: 9, monthIndex: 2 },
  { name: 'Hamal', nameArabic: 'الحمل', latinSign: 'Aries', direction: 'Utara', tapaut: 10, monthIndex: 3 },
  { name: 'Tsaur', nameArabic: 'الثور', latinSign: 'Taurus', direction: 'Utara', tapaut: 9, monthIndex: 4 },
  { name: 'Jauza', nameArabic: 'الجوزاء', latinSign: 'Gemini', direction: 'Utara', tapaut: 9, monthIndex: 5 },
  { name: 'Sartan', nameArabic: 'السرطان', latinSign: 'Cancer', direction: 'Utara', tapaut: 7, monthIndex: 6 },
  { name: 'Asad', nameArabic: 'الأسد', latinSign: 'Leo', direction: 'Utara', tapaut: 7, monthIndex: 7 },
  { name: 'Sumbulah', nameArabic: 'السنبلة', latinSign: 'Virgo', direction: 'Utara', tapaut: 7, monthIndex: 8 },
  { name: 'Mizan', nameArabic: 'الميزان', latinSign: 'Libra', direction: 'Selatan', tapaut: 6, monthIndex: 9 },
  { name: 'Aqrab', nameArabic: 'العقرب', latinSign: 'Scorpio', direction: 'Selatan', tapaut: 7, monthIndex: 10 },
  { name: 'Qaus', nameArabic: 'القوس', latinSign: 'Sagittarius', direction: 'Selatan', tapaut: 7, monthIndex: 11 }
];

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

// Convert decimal degrees to Degrees, Minutes, Seconds string
export function formatDMS(decDeg: number): string {
  const abs = Math.abs(decDeg);
  const d = Math.floor(abs);
  const mDec = (abs - d) * 60;
  const m = Math.floor(mDec);
  const s = Math.round((mDec - m) * 60);
  return `${d}° ${m}' ${s}"`;
}

// Convert decimal degrees to Degrees & Minutes (as used in Falak Kitab)
export function formatDM(decDeg: number): string {
  const abs = Math.abs(decDeg);
  const d = Math.floor(abs);
  const m = Math.round((abs - d) * 60);
  return `${d}° ${m.toString().padStart(2, '0')}'`;
}

// Convert decimal hours to HH:MM or HH:MM:SS
export function formatTime(decimalHours: number, withSeconds = false): string {
  if (isNaN(decimalHours)) return '--:--';
  let totalSeconds = Math.round(decimalHours * 3600);
  // Normalise to 24-hour cycle
  totalSeconds = ((totalSeconds % 86400) + 86400) % 86400;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const hh = h.toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');

  return withSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
}

// Julian Day Number for astronomical precision
export function getJulianDay(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate() + (date.getHours() + (date.getMinutes() + date.getSeconds() / 60) / 60) / 24;

  let y = year;
  let m = month;
  if (month <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
}

// Calculate Sun position: Declination (Mail Awwal) & Equation of Time (Ta'dilul Waqt)
export function getSunPosition(date: Date) {
  const jd = getJulianDay(date);
  const d = jd - 2451545.0; // days since J2000.0

  // Mean anomaly of the Sun
  const g = 357.529 + 0.98560028 * d;
  const gRad = toRad(g);

  // Mean longitude of the Sun
  const q = 280.459 + 0.98564736 * d;

  // Geocentric apparent ecliptic longitude of the Sun
  const L = q + 1.915 * Math.sin(gRad) + 0.020 * Math.sin(2 * gRad);
  const LRad = toRad(L);

  // Mean obliquity of the ecliptic
  const e = 23.439 - 0.00000036 * d;
  const eRad = toRad(e);

  // Sun declination (Mail Awwal δ)
  const sinDelta = Math.sin(eRad) * Math.sin(LRad);
  const delta = toDeg(Math.asin(sinDelta));

  // Right Ascension
  const alpha = toDeg(Math.atan2(Math.cos(eRad) * Math.sin(LRad), Math.cos(LRad)));

  // Equation of Time (Ta'dilul Waqt in minutes)
  let eot = (q - alpha) * 4;
  while (eot > 20) eot -= 1440 / 60;
  while (eot < -20) eot += 1440 / 60;

  return {
    declination: delta, // degrees (+ Utara, - Selatan)
    equationOfTime: eot // minutes
  };
}

// Calculate Sun Azimuth & Altitude for exact moment and location
export function getSunAzimuthAndAltitude(date: Date, location: CityLocation) {
  const { declination: delta, equationOfTime: eot } = getSunPosition(date);
  const phiRad = toRad(location.latitude);
  const deltaRad = toRad(delta);

  // Local solar time / hour angle
  const standardMeridian = location.timezone * 15;
  const currentHour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  const zawal = 12 - eot / 60 + (standardMeridian - location.longitude) / 15;
  const tHour = currentHour - zawal;
  const tDeg = tHour * 15;
  const tRad = toRad(tDeg);

  // Altitude h: sin(h) = sin(phi)*sin(delta) + cos(phi)*cos(delta)*cos(t)
  const sinH = Math.sin(phiRad) * Math.sin(deltaRad) + Math.cos(phiRad) * Math.cos(deltaRad) * Math.cos(tRad);
  const hRad = Math.asin(Math.max(-1, Math.min(1, sinH)));
  const hDeg = toDeg(hRad);

  // Azimuth from North (0° to 360° clockwise):
  // tan(Az) = sin(t) / (cos(t)*sin(phi) - tan(delta)*cos(phi))
  const y = Math.sin(tRad);
  const x = Math.cos(tRad) * Math.sin(phiRad) - Math.tan(deltaRad) * Math.cos(phiRad);
  let az = toDeg(Math.atan2(y, x)) + 180;
  while (az < 0) az += 360;
  while (az >= 360) az -= 360;

  return {
    altitude: hDeg,
    azimuth: az,
    declination: delta,
    equationOfTime: eot,
    zawal,
    hourAngle: tDeg
  };
}

// Determine Buruj and Darajat Syamsi according to Taqribul Maqshad Bab III
export function getBurujFromKitab(date: Date) {
  const month = date.getMonth(); // 0-11
  const day = date.getDate();
  const info = BURUJ_DATA[month];

  const rawDegrees = day + info.tapaut;
  let darajatSyamsi = rawDegrees;
  let activeBuruj = info;

  if (rawDegrees > 30) {
    darajatSyamsi = rawDegrees - 30;
    const nextMonthIndex = (month + 1) % 12;
    activeBuruj = BURUJ_DATA[nextMonthIndex];
  }

  return {
    buruj: activeBuruj.name,
    burujArabic: activeBuruj.nameArabic,
    burujJihat: activeBuruj.direction,
    latinSign: activeBuruj.latinSign,
    darajatSyamsi
  };
}

/**
 * Core prayer times hisab based on Kitab Falak Matan Taqribul Maqshad
 */
export function calculatePrayerTimes(
  date: Date,
  location: CityLocation,
  options: {
    tamkinMinutes?: number;
    useAsarTsani?: boolean;
    useIsyaTsani?: boolean;
    subuhAngle?: number;
  } = {}
): PrayerTimesResult {
  const tamkin = options.tamkinMinutes ?? 2;
  const useAsarTsani = options.useAsarTsani ?? false;
  const useIsyaTsani = options.useIsyaTsani ?? false;
  const subuhAngle = options.subuhAngle ?? 20; // 20° Depag / 19° Kitab Matan

  const phi = location.latitude; // Lintang tempat
  const lambda = location.longitude; // Bujur tempat
  const phiRad = toRad(phi);

  const { declination: delta, equationOfTime: eot } = getSunPosition(date);
  const deltaRad = toRad(delta);

  const burujInfo = getBurujFromKitab(date);

  // 1. Bab III: Ghayah Irtifa' (Tinggi Kulminasi)
  // Tamamul Ghayah = |phi - delta|
  const tamamGhayah = Math.abs(phi - delta);
  const ghayah = 90 - tamamGhayah; // Irtifa' saat zawal

  // 2. Bab IV: Bu'du Qutri & Ashal Muthlaq (dengan radius Rubu' Mujayyab R=60)
  const bQutri = Math.abs(Math.sin(phiRad) * Math.sin(deltaRad) * 60);
  const ashalMuthlaq = Math.abs(Math.cos(phiRad) * Math.cos(deltaRad) * 60);

  // 3. Bab V: Nisfu Fadhlah
  // sin(Nisfu Fadhlah) = tan(phi) * tan(delta)
  const sinNisfuFadhlah = Math.tan(phiRad) * Math.tan(deltaRad);
  let nisfuFadhlah = 0;
  if (Math.abs(sinNisfuFadhlah) <= 1) {
    nisfuFadhlah = toDeg(Math.asin(sinNisfuFadhlah));
  }
  const nisfuQausNahar = 90 + nisfuFadhlah;
  const nisfuQausLail = 180 - nisfuQausNahar;

  // 4. Standard Meridian for the city's timezone (e.g. WIB = 105°, WITA = 120°, WIT = 135°)
  const standardMeridian = location.timezone * 15;

  // Local Solar Noon (Zawal) in Local Standard Time
  // Zawal = 12:00 - Eot/60 + (StandardMeridian - CityLongitude) / 15
  const zawal = 12 - eot / 60 + (standardMeridian - lambda) / 15;

  // Helper to compute hour angle t (in decimal hours) for given sun altitude h
  function getHourAngle(h: number): number {
    const hRad = toRad(h);
    const cosT = (Math.sin(hRad) - Math.sin(phiRad) * Math.sin(deltaRad)) /
                 (Math.cos(phiRad) * Math.cos(deltaRad));
    if (cosT > 1) return 0; // Sun never reaches this altitude
    if (cosT < -1) return 12; // Sun always above this altitude
    return toDeg(Math.acos(cosT)) / 15;
  }

  // A. WAKTU ZOHOR
  // Kitab Bab X: Zawal + Tamkin (ihtiyath)
  const rawZohor = zawal + tamkin / 60;

  // B. WAKTU ASAR
  // Kitab Bab VIII & X:
  // Jarak zenit saat zawal: zd = 90° - ghayah
  const zd = 90 - ghayah;
  const tanZd = Math.tan(toRad(zd));
  // Asar Awwal (Imam Syafi'i): bayangan = 1 + tan(zd)
  const hAsarAwwal = toDeg(Math.atan(1 / (1 + tanZd)));
  // Asar Tsani (Imam Abu Hanifah): bayangan = 2 + tan(zd)
  const hAsarTsani = toDeg(Math.atan(1 / (2 + tanZd)));

  const tAsarAwwal = getHourAngle(hAsarAwwal);
  const tAsarTsani = getHourAngle(hAsarTsani);

  const rawAsarAwwal = zawal + tAsarAwwal + tamkin / 60;
  const rawAsarTsani = zawal + tAsarTsani + tamkin / 60;

  // C. WAKTU MAGRIB & TERBIT (SYURUQ)
  // Matahari terbenam: h = -1° (koreksi semidiameter matahari 16' + refraksi 34' = 50' ~ 1°)
  const hSunset = -1.0;
  const tSunset = getHourAngle(hSunset);
  const rawMagrib = zawal + tSunset + tamkin / 60;
  const rawTerbit = zawal - tSunset - tamkin / 60;

  // D. WAKTU ISYA
  // Kitab Bab X:
  // Isya Awwal = Jaib 17 (h = -17°)
  // Isya Tsani = Jaib 19 (h = -19°)
  const tIsyaAwwal = getHourAngle(-17);
  const tIsyaTsani = getHourAngle(-19);
  const rawIsyaAwwal = zawal + tIsyaAwwal + tamkin / 60;
  const rawIsyaTsani = zawal + tIsyaTsani + tamkin / 60;

  // E. WAKTU SUBUH (FAJAR SHADIQ)
  // Kitab Bab X: Jaib 19 (h = -19° atau -20°)
  const tSubuh = getHourAngle(-subuhAngle);
  const rawSubuh = zawal - tSubuh + tamkin / 60;

  // F. WAKTU IMSAK
  // Kitab Bab IX & X: Waktu Subuh dikurangi Da'fu Tamkin (2x tamkin atau 10 menit)
  const rawImsak = rawSubuh - 10 / 60;

  // G. WAKTU ISROQ (ISYRAQ) & DUHA
  // Kitab Bab IX: Isroq = h 4° 30' (4.5°)
  const tIsraq = getHourAngle(4.5);
  const rawIsraq = zawal - tIsraq + tamkin / 60;

  // Duha Sughra = h 9° 30' (9.5°)
  const tDuhaSugra = getHourAngle(9.5);
  const rawDuhaSugra = zawal - tDuhaSugra + tamkin / 60;

  // Duha Kubra = Pertengahan waktu antara Isroq dan Zawal
  const rawDuhaKubra = (rawIsraq + rawZohor) / 2;

  return {
    imsak: formatTime(rawImsak),
    subuh: formatTime(rawSubuh),
    terbit: formatTime(rawTerbit),
    israq: formatTime(rawIsraq),
    duhaSugra: formatTime(rawDuhaSugra),
    duhaKubra: formatTime(rawDuhaKubra),
    zohor: formatTime(rawZohor),
    asarAwwal: formatTime(rawAsarAwwal),
    asarTsani: formatTime(rawAsarTsani),
    magrib: formatTime(rawMagrib),
    isyaAwwal: formatTime(rawIsyaAwwal),
    isyaTsani: formatTime(rawIsyaTsani),
    raw: {
      imsak: rawImsak,
      subuh: rawSubuh,
      terbit: rawTerbit,
      israq: rawIsraq,
      duhaSugra: rawDuhaSugra,
      duhaKubra: rawDuhaKubra,
      zohor: rawZohor,
      asarAwwal: rawAsarAwwal,
      asarTsani: rawAsarTsani,
      magrib: rawMagrib,
      isyaAwwal: rawIsyaAwwal,
      isyaTsani: rawIsyaTsani
    },
    falakParams: {
      buruj: burujInfo.buruj,
      burujArabic: burujInfo.burujArabic,
      burujJihat: burujInfo.burujJihat,
      darajatSyamsi: Math.round(burujInfo.darajatSyamsi * 100) / 100,
      mailAwwal: Math.round(delta * 100) / 100,
      mailDir: delta >= 0 ? 'Utara' : 'Selatan',
      ghayah: Math.round(ghayah * 100) / 100,
      tamamGhayah: Math.round(tamamGhayah * 100) / 100,
      buduQutri: Math.round(bQutri * 100) / 100,
      ashalMuthlaq: Math.round(ashalMuthlaq * 100) / 100,
      nisfuFadhlah: Math.round(nisfuFadhlah * 100) / 100,
      nisfuQausNahar: Math.round(nisfuQausNahar * 100) / 100,
      nisfuQausLail: Math.round(nisfuQausLail * 100) / 100,
      equationOfTime: Math.round(eot * 100) / 100,
      tamkin
    }
  };
}

/**
 * Calculation of Qibla Direction & Rashdul Qiblah based on Kitab Bab XIII (Pages 179-187 & 201-203)
 */
export function calculateQibla(location: CityLocation, date: Date = new Date()): QiblaResult {
  const phi1 = toRad(location.latitude); // Lintang tempat
  const lambda1 = location.longitude; // Bujur tempat

  const phi2 = toRad(KABAH_COORDS.latitude); // Lintang Ka'bah (21° 25' 21" N)
  const lambda2 = KABAH_COORDS.longitude; // Bujur Ka'bah (39° 49' 34" E)

  const dLambda = toRad(lambda2 - lambda1);
  const fadlutTulain = Math.abs(lambda1 - lambda2);

  // Great-circle calculation for Qibla Azimuth
  const y = Math.sin(dLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(dLambda);
  let qiblaRad = Math.atan2(y, x);
  let qiblaAzimuth = (toDeg(qiblaRad) + 360) % 360;

  // Sudut dari Titik Barat ke Utara (B-U) as documented in Kitab Taqribul Maqshad page 186/203
  // Lombok = 23° 11' dari Barat ke Utara (Azimuth 293° 11')
  let angleFromWestToNorth = 0;
  if (qiblaAzimuth >= 270 && qiblaAzimuth <= 360) {
    angleFromWestToNorth = qiblaAzimuth - 270;
  } else if (qiblaAzimuth >= 180 && qiblaAzimuth < 270) {
    angleFromWestToNorth = 270 - qiblaAzimuth;
  } else if (qiblaAzimuth <= 90) {
    angleFromWestToNorth = 90 - qiblaAzimuth;
  } else {
    angleFromWestToNorth = qiblaAzimuth - 90;
  }

  // Distance in Km using Haversine formula
  const earthRadiusKm = 6371;
  const dLat = phi2 - phi1;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.round(earthRadiusKm * c * 100) / 100;

  // Taqribul Maqshad intermediate trigonometric steps (Page 201-203)
  const bQutur = Math.sin(phi1) * Math.sin(toRad(21.5)) * 60;
  const aMutlaq = Math.cos(phi1) * Math.cos(toRad(21.5)) * 60;
  const aMuadal = Math.cos(toRad(fadlutTulain)) * aMutlaq;
  const jt = Math.sin(toRad(90 - Math.abs(toDeg(Math.asin((aMuadal - bQutur) / 60))))) * 60;
  const irtifaSimti = toDeg(Math.asin((aMuadal - bQutur) / 60));
  const hissotuSimti = (Math.sin(toRad(irtifaSimti)) * 60) / Math.tan(toRad(90 - location.latitude));
  const tadilSimti = (21.5 / Math.cos(phi1)) + hissotuSimti;

  // Rashdul Qiblah Harian (Daily Solar Qibla Alignment)
  // Time today when the sun's azimuth equals the Qibla azimuth or anti-qibla azimuth
  const rashdulQiblah = calculateDailyRashdulQiblah(location, date, qiblaAzimuth);

  return {
    azimuth: Math.round(qiblaAzimuth * 100) / 100,
    angleFromWestToNorth: Math.round(angleFromWestToNorth * 100) / 100,
    distanceKm,
    directionLabel: `${formatDM(angleFromWestToNorth)} dari Barat condong ke Utara (Azimut ${formatDM(qiblaAzimuth)})`,
    rashdulQiblahToday: rashdulQiblah,
    steps: {
      fadlutTulain: Math.round(fadlutTulain * 100) / 100,
      fadhluArdaen: Math.round(Math.abs(location.latitude - KABAH_COORDS.latitude) * 100) / 100,
      aMutlaq: Math.round(aMutlaq * 100) / 100,
      bQutur: Math.round(bQutur * 100) / 100,
      aMuadal: Math.round(aMuadal * 100) / 100,
      jt: Math.round(jt * 100) / 100,
      irtifaSimti: Math.round(irtifaSimti * 100) / 100,
      hissotuSimti: Math.round(hissotuSimti * 100) / 100,
      tadilSimti: Math.round(tadilSimti * 100) / 100
    }
  };
}

/**
 * Calculate Daily Rashdul Qiblah (Sun azimuth = Qibla azimuth or Qibla + 180°)
 */
function calculateDailyRashdulQiblah(location: CityLocation, date: Date, targetAzimuth: number): string | undefined {
  const { declination: delta, equationOfTime: eot } = getSunPosition(date);
  const phiRad = toRad(location.latitude);
  const deltaRad = toRad(delta);
  const standardMeridian = location.timezone * 15;
  const zawal = 12 - eot / 60 + (standardMeridian - location.longitude) / 15;

  // We search for t where cot(Az) = (sin(phi)*cos(t) - cos(phi)*tan(delta)) / sin(t)
  // Let A = targetAzimuth. In Indonesia, targetAzimuth ~ 293°, sun is in the afternoon
  const azRad = toRad(targetAzimuth);
  const cotAz = 1 / Math.tan(azRad);

  // cot(Az)*sin(t) - sin(phi)*cos(t) = -cos(phi)*tan(delta)
  // Let R*sin(t - theta) = -cos(phi)*tan(delta)
  // R = sqrt(cot(Az)^2 + sin(phi)^2)
  const term1 = cotAz;
  const term2 = Math.sin(phiRad);
  const R = Math.sqrt(term1 * term1 + term2 * term2);
  const target = -Math.cos(phiRad) * Math.tan(deltaRad);

  if (Math.abs(target) > R) {
    return undefined; // No sun alignment today
  }

  const theta = Math.atan2(term2, term1);
  const angleDiff = Math.asin(target / R);
  let tRad = theta + angleDiff;
  let tDeg = toDeg(tRad);

  // Check afternoon solution
  if (tDeg < 0) tDeg += 360;
  if (tDeg > 180) tDeg = 360 - tDeg;

  const hours = zawal + tDeg / 15;
  if (hours >= 6 && hours <= 18.5) {
    return formatTime(hours, true);
  }
  return undefined;
}

/**
 * Bab XIV: Pengukuran Objek (Tinggi Pohon/Menara, Kedalaman Sumur, Lebar Sungai)
 */
export function calculateObjectMeasurement(params: {
  type: 'tree' | 'well' | 'river';
  userHeightCm?: number;
  // For Tree:
  firstAngleDeg?: number;
  secondAngleDeg?: number;
  walkingDistanceCm?: number;
  method?: 'angle_distance' | 'fixed_45' | 'shadow';
  distanceToTreeCm?: number;
  shadowLengthCm?: number;
  sunAltitudeDeg?: number;
  // For Well:
  wellCircumferenceCm?: number;
  wellDiameterCm?: number;
  wellAngleDeg?: number;
  // For River:
  riverAngleDeg?: number;
  strideDistanceCm?: number;
}) {
  const eyeHeight = (params.userHeightCm || 160) - 10; // Eye level approx 10cm below top of head

  if (params.type === 'tree') {
    if (params.method === 'fixed_45') {
      // At 45 degrees, tan(45°) = 1, so Height = Distance + EyeHeight
      const dist = params.distanceToTreeCm || 0;
      const height = dist + eyeHeight;
      return {
        heightCm: Math.round(height),
        heightMeters: (height / 100).toFixed(2),
        formula: `Tinggi = Jarak (${dist} cm) + Tinggi Pengamat (${eyeHeight} cm)`,
        explanation: 'Sesuai Kitab Bab XIV Hal. 219: Pada sudut 45°, panjang bayangan/jarak sama persis dengan tinggi objek di atas mata.'
      };
    } else if (params.method === 'shadow') {
      const s = params.shadowLengthCm || 0;
      const alt = params.sunAltitudeDeg || 45;
      const height = s * Math.tan(toRad(alt)) + (params.userHeightCm || 160);
      return {
        heightCm: Math.round(height),
        heightMeters: (height / 100).toFixed(2),
        formula: `Tinggi = Bayangan (${s} cm) × tan(${alt}°)`,
        explanation: 'Menggunakan rumus bayangan (Zill) dan tinggi matahari (Irtifa) dari Kitab Bab VIII.'
      };
    } else {
      // General angle and distance
      const a = params.firstAngleDeg || 45;
      const d = params.distanceToTreeCm || 1000;
      const height = d * Math.tan(toRad(a)) + eyeHeight;
      return {
        heightCm: Math.round(height),
        heightMeters: (height / 100).toFixed(2),
        formula: `Tinggi = ${d} cm × tan(${a}°) + ${eyeHeight} cm`,
        explanation: 'Kalkulasi trigonometri Rubu Mujayyab: Tinggi = Jarak ke Objek × Jaib Irtifa / Jaib Tamam + Tinggi Mata Pengamat.'
      };
    }
  } else if (params.type === 'well') {
    // Well depth from Kitab Bab XIV Hal. 222
    const diameter = params.wellDiameterCm || (params.wellCircumferenceCm ? params.wellCircumferenceCm / Math.PI : 80);
    const angle = params.wellAngleDeg || 60; // Sudut inkhifadh ke bibir air
    // kedalaman = diameter * tan(angle)
    const depth = diameter * Math.tan(toRad(angle));
    return {
      depthCm: Math.round(depth),
      depthMeters: (depth / 100).toFixed(2),
      diameterCm: Math.round(diameter),
      formula: `Kedalaman = Diameter (${Math.round(diameter)} cm) × tan(${angle}°)`,
      explanation: 'Sesuai Bab XIV Hal. 222: Mengukur diameter mulut sumur dan membidik sudut inkhifadh permukaan air menggunakan Rubu Mujayyab.'
    };
  } else {
    // River width from Kitab Bab XIV Hal. 225
    const angle = params.riverAngleDeg || 45;
    const walked = params.strideDistanceCm || 310;
    const width = walked * Math.tan(toRad(angle));
    return {
      widthCm: Math.round(width),
      widthMeters: (width / 100).toFixed(2),
      formula: `Lebar = Langkah Pengamatan (${walked} cm) × tan(${angle}°)`,
      explanation: 'Sesuai Bab XIV Hal. 225: Membidik tepi seberang sungai dengan Hadafah Rubu, lalu melangkah di tanah datar hingga sudut bertepatan.'
    };
  }
}
