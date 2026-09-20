import { HijriDate } from '../types';

export const HIJRI_MONTHS_AR = [
  'المحرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة'
];

export const HIJRI_MONTHS_ID = [
  'Muharram',
  'Safar',
  'Rabiul Awal',
  'Rabiul Akhir',
  'Jumadil Awal',
  'Jumadil Akhir',
  'Rajab',
  'Sya\'ban',
  'Ramadhan',
  'Syawwal',
  'Dzulqa\'dah',
  'Dzulhijjah'
];

export const DAYS_NAME_ID = [
  'Ahad',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu'
];

export const DAYS_NAME_AR = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت'
];

/**
 * Kuwajir / Hisab Urfi & Astronomical Hijri converter
 * Based on Ummul Qura & Standard Hisab Urfi with leap years cycle of 30 years
 */
export function gregorianToHijri(date: Date, dayAdjustment: number = 0): HijriDate {
  // Adjusted date
  const adjustedDate = new Date(date);
  if (dayAdjustment !== 0) {
    adjustedDate.setDate(adjustedDate.getDate() + dayAdjustment);
  }

  const y = adjustedDate.getFullYear();
  const m = adjustedDate.getMonth();
  const d = adjustedDate.getDate();
  const dayOfWeek = adjustedDate.getDay();

  // Julian Day
  let a = Math.floor((14 - (m + 1)) / 12);
  let yj = y + 4800 - a;
  let mj = (m + 1) + 12 * a - 3;
  let jd = d + Math.floor((153 * mj + 2) / 5) + 365 * yj + Math.floor(yj / 4) - Math.floor(yj / 100) + Math.floor(yj / 400) - 32045;

  // Convert JD to Hijri
  let l = jd - 1948440 + 10632;
  let n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
  l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
  let hMonth = Math.floor((24 * l) / 709);
  let hDay = l - Math.floor((709 * hMonth) / 24);
  let hYear = 30 * n + j - 30;

  // Month indexing 1 to 12
  hMonth = hMonth;
  if (hMonth > 12) {
    hMonth = 12;
  }
  if (hMonth < 1) {
    hMonth = 1;
  }

  // Identify Sunnah Fasting
  let isSunnahFasting = false;
  let fastingNote = '';

  // Monday & Thursday fasting
  if (dayOfWeek === 1) {
    isSunnahFasting = true;
    fastingNote = 'Puasa Sunnah Senin';
  } else if (dayOfWeek === 4) {
    isSunnahFasting = true;
    fastingNote = 'Puasa Sunnah Kamis';
  }

  // Ayyamul Bidh (13, 14, 15 Hijri)
  if (hDay === 13 || hDay === 14 || hDay === 15) {
    isSunnahFasting = true;
    fastingNote = fastingNote ? `${fastingNote} & Ayyamul Bidh` : 'Puasa Ayyamul Bidh';
  }

  // Special Hijri Fasting / Days
  if (hMonth === 9) {
    // Ramadan
    isSunnahFasting = true;
    fastingNote = 'Puasa Wajib Ramadhan';
  } else if (hMonth === 1 && (hDay === 9 || hDay === 10)) {
    isSunnahFasting = true;
    fastingNote = hDay === 9 ? 'Puasa Sunnah Tasu\'a (9 Muharram)' : 'Puasa Sunnah \'Asyura (10 Muharram)';
  } else if (hMonth === 12 && hDay === 9) {
    isSunnahFasting = true;
    fastingNote = 'Puasa Sunnah Arafah (9 Dzulhijjah)';
  } else if (hMonth === 12 && (hDay === 10 || hDay === 11 || hDay === 12 || hDay === 13)) {
    isSunnahFasting = false;
    fastingNote = hDay === 10 ? 'Hari Raya Idul Adha (Haram Puasa)' : 'Hari Tasyrik (Haram Puasa)';
  } else if (hMonth === 10 && hDay === 1) {
    isSunnahFasting = false;
    fastingNote = 'Hari Raya Idul Fitri (Haram Puasa)';
  }

  const monthNameId = HIJRI_MONTHS_ID[hMonth - 1] || '';
  const monthNameAr = HIJRI_MONTHS_AR[hMonth - 1] || '';
  const dayNameId = DAYS_NAME_ID[dayOfWeek];
  const dayNameAr = DAYS_NAME_AR[dayOfWeek];

  return {
    year: hYear,
    month: hMonth,
    day: hDay,
    monthNameAr,
    monthNameId,
    dayNameAr,
    dayNameId,
    formatted: `${dayNameId}, ${hDay} ${monthNameId} ${hYear} H`,
    formattedAr: `${dayNameAr}، ${hDay} ${monthNameAr} ${hYear} هـ`,
    isSunnahFasting,
    fastingNote
  };
}

/**
 * Convert Hijri date to Gregorian Date
 */
export function hijriToGregorian(hYear: number, hMonth: number, hDay: number): Date {
  // Approximate JD from Hijri
  const jd = Math.floor((11 * hYear + 3) / 30) + 354 * hYear + 30 * hMonth - Math.floor((hMonth - 1) / 2) + hDay + 1948440 - 385;

  // Convert JD to Gregorian
  let l = jd + 68569;
  let n = Math.floor((4 * l) / 146097);
  l = l - Math.floor((146097 * n + 3) / 4);
  let i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  let j = Math.floor((80 * l) / 2447);
  let day = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  let month = j + 2 - 12 * l;
  let year = 100 * (n - 49) + i + l;

  return new Date(year, month - 1, day);
}

// Generate an entire Gregorian month with its Hijri equivalents
export function getMonthHijriCalendar(year: number, monthIndex: number) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const gDate = new Date(year, monthIndex, d);
    const hDate = gregorianToHijri(gDate);
    days.push({
      gregorian: gDate,
      day: d,
      hijri: hDate
    });
  }

  return days;
}
