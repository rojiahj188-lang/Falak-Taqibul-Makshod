import React, { useState, useEffect } from 'react';
import {
  Clock,
  Volume2,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Bell,
  BellOff
} from 'lucide-react';
import { CityLocation, AppSettings } from '../types';
import { calculatePrayerTimes, formatDM } from '../utils/falakMath';
import { gregorianToHijri } from '../utils/hijriCalendar';
import { soundSynth } from '../utils/audioSynth';
import { exportPrayerScheduleToPDF, exportPrayerScheduleToExcel } from '../utils/exportUtils';

interface PrayerScheduleViewProps {
  selectedCity: CityLocation;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const PrayerScheduleView: React.FC<PrayerScheduleViewProps> = ({
  selectedCity,
  settings,
  onUpdateSettings
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [activeViewMode, setActiveViewMode] = useState<'harian' | 'bulanan'>('harian');

  // Real-time clock update
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const prayerResult = calculatePrayerTimes(currentDate, selectedCity, {
    tamkinMinutes: settings.tamkinMinutes,
    useAsarTsani: settings.useAsarTsani,
    useIsyaTsani: settings.useIsyaTsani,
    subuhAngle: settings.subuhAngle
  });

  const hijri = gregorianToHijri(currentDate);

  // Determine current prayer and next prayer
  const currentTimeDecimal = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

  const prayerOrder = [
    { key: 'imsak', name: 'Imsak', time: prayerResult.imsak, raw: prayerResult.raw.imsak },
    { key: 'subuh', name: 'Subuh', time: prayerResult.subuh, raw: prayerResult.raw.subuh },
    { key: 'terbit', name: 'Terbit', time: prayerResult.terbit, raw: prayerResult.raw.terbit },
    { key: 'israq', name: 'Isyraq', time: prayerResult.israq, raw: prayerResult.raw.israq },
    { key: 'duhaSugra', name: 'Dhuha', time: prayerResult.duhaSugra, raw: prayerResult.raw.duhaSugra },
    { key: 'zohor', name: 'Zohor', time: prayerResult.zohor, raw: prayerResult.raw.zohor },
    {
      key: 'asar',
      name: settings.useAsarTsani ? 'Asar (Hanafi)' : 'Asar',
      time: settings.useAsarTsani ? prayerResult.asarTsani : prayerResult.asarAwwal,
      raw: settings.useAsarTsani ? prayerResult.raw.asarTsani : prayerResult.raw.asarAwwal
    },
    { key: 'magrib', name: 'Magrib', time: prayerResult.magrib, raw: prayerResult.raw.magrib },
    {
      key: 'isya',
      name: settings.useIsyaTsani ? 'Isya (19°)' : 'Isya (17°)',
      time: settings.useIsyaTsani ? prayerResult.isyaTsani : prayerResult.isyaAwwal,
      raw: settings.useIsyaTsani ? prayerResult.raw.isyaTsani : prayerResult.raw.isyaAwwal
    }
  ];

  // Find next prayer
  let nextPrayer = prayerOrder.find((p) => p.raw > currentTimeDecimal);
  if (!nextPrayer) {
    // Wrap to next day's imsak
    nextPrayer = { ...prayerOrder[0], raw: prayerOrder[0].raw + 24 };
  }

  // Calculate countdown to next prayer
  const diffHours = nextPrayer.raw - currentTimeDecimal;
  const diffSecTotal = Math.max(0, Math.floor(diffHours * 3600));
  const cdH = Math.floor(diffSecTotal / 3600);
  const cdM = Math.floor((diffSecTotal % 3600) / 60);
  const cdS = diffSecTotal % 60;

  // Month navigation
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const toggleNotification = (key: string) => {
    const current = settings.notifications[key];
    if (!current) return;
    const updated = {
      ...settings.notifications,
      [key]: {
        ...current,
        enabled: !current.enabled
      }
    };
    onUpdateSettings({ ...settings, notifications: updated });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Location, Date & Next Prayer Countdown */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-800 via-emerald-900 to-neutral-900 p-6 text-white shadow-sm dark:border-emerald-900/30">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-200 ring-1 ring-emerald-400/30">
                {selectedCity.name}
              </span>
              <span className="text-xs text-neutral-300">
                {formatDM(Math.abs(selectedCity.latitude))} {selectedCity.latDir},{' '}
                {formatDM(Math.abs(selectedCity.longitude))} {selectedCity.lonDir}
              </span>
              <span className="text-xs text-emerald-300/80">({selectedCity.timezoneName})</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {hijri.formatted}
              </h2>
              <span className="font-serif text-lg text-emerald-200/90 sm:text-xl">
                {hijri.formattedAr}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-sm text-neutral-200">
                {currentDate.toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              {hijri.isSunnahFasting && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-200 ring-1 ring-amber-400/30">
                  <Sparkles className="h-3 w-3" />
                  {hijri.fastingNote}
                </span>
              )}
            </div>
          </div>

          {/* Next Prayer Countdown Card */}
          <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm sm:min-w-[220px]">
            <div className="flex items-center justify-between text-xs text-emerald-200">
              <span>Menuju {nextPrayer?.name}</span>
              <Clock className="h-3.5 w-3.5" />
            </div>
            <div className="mt-1 text-3xl font-extrabold tracking-tight text-white font-mono">
              {String(cdH).padStart(2, '0')}:{String(cdM).padStart(2, '0')}:
              {String(cdS).padStart(2, '0')}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-neutral-300">
              <span>Waktu: {nextPrayer?.time}</span>
              <button
                id="btn-test-adzan"
                onClick={() => soundSynth.play('adzan')}
                className="flex items-center gap-1 text-emerald-300 transition hover:text-white"
                title="Uji Suara Panggilan Azan"
              >
                <Volume2 className="h-3 w-3" />
                <span>Tes Nada</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Date Controls & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            id="btn-prev-day"
            onClick={handlePrevDay}
            className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
            title="Hari Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            id="btn-today"
            onClick={handleToday}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
          >
            Hari Ini
          </button>
          <button
            id="btn-next-day"
            onClick={handleNextDay}
            className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
            title="Hari Selanjutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* View Toggle and Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-0.5 dark:border-neutral-800 dark:bg-neutral-900">
            <button
              id="btn-view-harian"
              onClick={() => setActiveViewMode('harian')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                activeViewMode === 'harian'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
              }`}
            >
              Harian
            </button>
            <button
              id="btn-view-bulanan"
              onClick={() => setActiveViewMode('bulanan')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                activeViewMode === 'bulanan'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
              }`}
            >
              Tabel 1 Bulan
            </button>
          </div>

          <button
            id="btn-export-pdf"
            onClick={() => exportPrayerScheduleToPDF(selectedCity, selectedYear, selectedMonth)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
            title="Unduh format PDF"
          >
            <Download className="h-3.5 w-3.5 text-rose-600" />
            <span>PDF</span>
          </button>

          <button
            id="btn-export-excel"
            onClick={() => exportPrayerScheduleToExcel(selectedCity, selectedYear, selectedMonth)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
            title="Unduh format Excel (.xlsx)"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {activeViewMode === 'harian' ? (
        <>
          {/* Main Prayer Cards Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { key: 'imsak', label: 'Imsak', time: prayerResult.imsak, note: '10 mnt sblm Subuh' },
              { key: 'subuh', label: 'Subuh', time: prayerResult.subuh, note: 'Jaib 19 / Fajar Shadiq' },
              { key: 'terbit', label: 'Terbit', time: prayerResult.terbit, note: 'Syuruq (-1° Ufuq)' },
              { key: 'israq', label: 'Isyraq', time: prayerResult.israq, note: 'Irtifa 4° 30\'' },
              { key: 'duhaSugra', label: 'Dhuha', time: prayerResult.duhaSugra, note: 'Irtifa 9° 30\'' },
              { key: 'zohor', label: 'Zohor', time: prayerResult.zohor, note: 'Zawal (Terkulai)' }
            ].map((item) => {
              const isCurrentNext = nextPrayer?.key === item.key;
              const notif = settings.notifications[item.key];
              return (
                <div
                  key={item.key}
                  className={`group relative rounded-xl border p-4 transition ${
                    isCurrentNext
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500 dark:bg-emerald-950/20'
                      : 'border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      {item.label}
                    </span>
                    {notif && (
                      <button
                        onClick={() => toggleNotification(item.key)}
                        className={`text-neutral-400 transition hover:text-emerald-600 ${
                          notif.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-40'
                        }`}
                        title={notif.enabled ? 'Alarm aktif' : 'Alarm dinonaktifkan'}
                      >
                        {notif.enabled ? (
                          <Bell className="h-3.5 w-3.5" />
                        ) : (
                          <BellOff className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 font-mono dark:text-white">
                    {item.time}
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                    {item.note}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
            {[
              {
                key: 'asarAwwal',
                label: 'Asar (Awwal)',
                time: prayerResult.asarAwwal,
                note: 'Madzhab Syafi\'i (1 Bayangan + Zawal)',
                highlight: !settings.useAsarTsani
              },
              {
                key: 'asarTsani',
                label: 'Asar (Tsani)',
                time: prayerResult.asarTsani,
                note: 'Madzhab Hanafi (2 Bayangan + Zawal)',
                highlight: settings.useAsarTsani
              },
              {
                key: 'magrib',
                label: 'Magrib',
                time: prayerResult.magrib,
                note: 'Ghurub (Terbenam Sempurna)',
                highlight: true
              },
              {
                key: 'isyaAwwal',
                label: 'Isya (Jaib 17)',
                time: prayerResult.isyaAwwal,
                note: 'Syafaq Ahmar (Merah Hilang)',
                highlight: !settings.useIsyaTsani
              }
            ].map((item) => {
              const isCurrentNext = nextPrayer?.name.toLowerCase().includes(item.label.toLowerCase());
              return (
                <div
                  key={item.key}
                  className={`rounded-xl border p-4 transition ${
                    isCurrentNext
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500 dark:bg-emerald-950/20'
                      : 'border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      {item.label}
                    </span>
                    {item.highlight && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                        Dipilih
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 font-mono dark:text-white">
                    {item.time}
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                    {item.note}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Mathematical Falak Parameters of Taqribul Maqshad */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Parameter Hisab Falak (Kitab Matan Taqribul Maqshad)
                </h3>
              </div>
              <span className="text-xs text-neutral-400 font-mono">
                Formula Rubu' Mujayyab (R=60)
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 text-xs">
              <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/60">
                <span className="text-neutral-400">Buruj & Tapaut</span>
                <p className="mt-1 font-semibold text-neutral-800 dark:text-neutral-100">
                  {prayerResult.falakParams.buruj} ({prayerResult.falakParams.burujArabic})
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  Jihat {prayerResult.falakParams.burujJihat}
                </p>
              </div>

              <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/60">
                <span className="text-neutral-400">Derajat Syamsi</span>
                <p className="mt-1 font-semibold text-neutral-800 dark:text-neutral-100">
                  {prayerResult.falakParams.darajatSyamsi}°
                </p>
                <p className="text-[11px] text-neutral-400">Hari + Tapaut</p>
              </div>

              <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/60">
                <span className="text-neutral-400">Mail Awwal (δ)</span>
                <p className="mt-1 font-semibold text-neutral-800 dark:text-neutral-100">
                  {prayerResult.falakParams.mailAwwal}°
                </p>
                <p className="text-[11px] text-neutral-400">
                  Deklinasi {prayerResult.falakParams.mailDir}
                </p>
              </div>

              <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/60">
                <span className="text-neutral-400">Ghayah Irtifa'</span>
                <p className="mt-1 font-semibold text-neutral-800 dark:text-neutral-100">
                  {prayerResult.falakParams.ghayah}°
                </p>
                <p className="text-[11px] text-neutral-400">
                  Tamam: {prayerResult.falakParams.tamamGhayah}°
                </p>
              </div>

              <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/60">
                <span className="text-neutral-400">Bu'du Qutri (BQ)</span>
                <p className="mt-1 font-semibold text-neutral-800 dark:text-neutral-100">
                  {prayerResult.falakParams.buduQutri}°
                </p>
                <p className="text-[11px] text-neutral-400">Sin φ × Sin δ × 60</p>
              </div>

              <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/60">
                <span className="text-neutral-400">Ashal Muthlaq (AM)</span>
                <p className="mt-1 font-semibold text-neutral-800 dark:text-neutral-100">
                  {prayerResult.falakParams.ashalMuthlaq}°
                </p>
                <p className="text-[11px] text-neutral-400">Cos φ × Cos δ × 60</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3 text-[11px] text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              <span>
                Nisfu Fadhlah: <strong className="text-neutral-700 dark:text-neutral-200">{prayerResult.falakParams.nisfuFadhlah}°</strong>
              </span>
              <span>
                Busur Siang (Qaus Nahar): <strong className="text-neutral-700 dark:text-neutral-200">{(prayerResult.falakParams.nisfuQausNahar * 2).toFixed(1)}°</strong>
              </span>
              <span>
                Busur Malam (Qaus Lail): <strong className="text-neutral-700 dark:text-neutral-200">{(prayerResult.falakParams.nisfuQausLail * 2).toFixed(1)}°</strong>
              </span>
              <span>
                Ihtiyath (Tamkin): <strong className="text-neutral-700 dark:text-neutral-200">+{prayerResult.falakParams.tamkin} Menit</strong>
              </span>
            </div>
          </div>
        </>
      ) : (
        /* Monthly Table View */
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <div className="flex items-center gap-2">
              <select
                id="select-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              >
                {monthNames.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                id="input-year"
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-20 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              />
            </div>

            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Tabel Hisab Kitab Taqribul Maqshad • {selectedCity.name}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800/80 dark:text-neutral-200">
                <tr>
                  <th className="px-2.5 py-2">Tgl</th>
                  <th className="px-2.5 py-2">Hijriah</th>
                  <th className="px-2.5 py-2">Imsak</th>
                  <th className="px-2.5 py-2">Subuh</th>
                  <th className="px-2.5 py-2">Terbit</th>
                  <th className="px-2.5 py-2">Isyraq</th>
                  <th className="px-2.5 py-2">Dhuha</th>
                  <th className="px-2.5 py-2">Zohor</th>
                  <th className="px-2.5 py-2">Asar</th>
                  <th className="px-2.5 py-2">Magrib</th>
                  <th className="px-2.5 py-2">Isya</th>
                  <th className="px-2.5 py-2">Buruj</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {Array.from(
                  { length: new Date(selectedYear, selectedMonth + 1, 0).getDate() },
                  (_, i) => i + 1
                ).map((d) => {
                  const dayDate = new Date(selectedYear, selectedMonth, d);
                  const isToday =
                    dayDate.toDateString() === new Date().toDateString();
                  const t = calculatePrayerTimes(dayDate, selectedCity, {
                    tamkinMinutes: settings.tamkinMinutes,
                    useAsarTsani: settings.useAsarTsani,
                    useIsyaTsani: settings.useIsyaTsani,
                    subuhAngle: settings.subuhAngle
                  });
                  const h = gregorianToHijri(dayDate);
                  return (
                    <tr
                      key={d}
                      className={
                        isToday
                          ? 'bg-emerald-50/80 font-semibold text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200'
                          : 'hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40'
                      }
                    >
                      <td className="px-2.5 py-2 font-mono">{d}</td>
                      <td className="px-2.5 py-2">
                        {h.day} {h.monthNameId.slice(0, 4)}
                      </td>
                      <td className="px-2.5 py-2 font-mono">{t.imsak}</td>
                      <td className="px-2.5 py-2 font-mono">{t.subuh}</td>
                      <td className="px-2.5 py-2 font-mono">{t.terbit}</td>
                      <td className="px-2.5 py-2 font-mono">{t.israq}</td>
                      <td className="px-2.5 py-2 font-mono">{t.duhaSugra}</td>
                      <td className="px-2.5 py-2 font-mono">{t.zohor}</td>
                      <td className="px-2.5 py-2 font-mono">
                        {settings.useAsarTsani ? t.asarTsani : t.asarAwwal}
                      </td>
                      <td className="px-2.5 py-2 font-mono">{t.magrib}</td>
                      <td className="px-2.5 py-2 font-mono">
                        {settings.useIsyaTsani ? t.isyaTsani : t.isyaAwwal}
                      </td>
                      <td className="px-2.5 py-2 text-[11px] text-neutral-400">
                        {t.falakParams.buruj}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
