import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ArrowRightLeft,
  Sparkles,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Bookmark
} from 'lucide-react';
import {
  gregorianToHijri,
  hijriToGregorian,
  HIJRI_MONTHS_ID,
  HIJRI_MONTHS_AR,
  DAYS_NAME_ID
} from '../utils/hijriCalendar';

export const HijriConverterView: React.FC = () => {
  // Converter States
  const [convMode, setConvMode] = useState<'masehi_to_hijri' | 'hijri_to_masehi'>('masehi_to_hijri');
  const [gregDateInput, setGregDateInput] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dayAdjustment, setDayAdjustment] = useState<number>(0);

  // Hijri Inputs
  const [hYearInput, setHYearInput] = useState<number>(1448);
  const [hMonthInput, setHMonthInput] = useState<number>(3);
  const [hDayInput, setHDayInput] = useState<number>(15);

  // Calendar View Month/Year
  const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(new Date().getMonth());

  // Daily Worship Checklist (stored in localStorage)
  const todayKey = new Date().toISOString().slice(0, 10);
  const [worshipTasks, setWorshipTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`worship_tasks_${todayKey}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(`worship_tasks_${todayKey}`, JSON.stringify(worshipTasks));
  }, [worshipTasks, todayKey]);

  const toggleWorship = (taskKey: string) => {
    setWorshipTasks((prev) => ({
      ...prev,
      [taskKey]: !prev[taskKey]
    }));
  };

  // Convert Masehi to Hijri
  const convertedHijri = gregorianToHijri(new Date(gregDateInput), dayAdjustment);

  // Convert Hijri to Masehi
  const convertedGregorian = hijriToGregorian(hYearInput, hMonthInput, hDayInput);

  // Calendar Days calculation
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInViewMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const worshipItems = [
    { key: 'shubuh', title: 'Salat Subuh & Rawatib', category: 'Fardhu' },
    { key: 'dhuha', title: 'Salat Dhuha', category: 'Sunnah' },
    { key: 'zohor', title: 'Salat Zohor & Rawatib', category: 'Fardhu' },
    { key: 'asar', title: 'Salat Asar', category: 'Fardhu' },
    { key: 'magrib', title: 'Salat Magrib & Rawatib', category: 'Fardhu' },
    { key: 'isya', title: 'Salat Isya & Rawatib', category: 'Fardhu' },
    { key: 'tahajjud', title: 'Tahajjud & Witir', category: 'Sunnah Malam' },
    { key: 'tilawah', title: 'Tilawah 1 Ruku\' / Juz', category: 'Al-Qur\'an' },
    { key: 'dzikir', title: 'Dzikir Pagi & Petang', category: 'Wirid' }
  ];

  const completedCount = Object.values(worshipTasks).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / worshipItems.length) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Kalender Hijriah & Jadwal Ibadah Harian
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Konversi penanggalan Masehi-Hijriah akurat, jadwal puasa sunnah, dan tracker ibadah harian.
          </p>
        </div>

        {/* Rukyat Adjustment Pills */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-500 dark:text-neutral-400">Koreksi Hilal:</span>
          <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5 dark:border-neutral-800 dark:bg-neutral-800">
            {[-1, 0, 1].map((adj) => (
              <button
                key={adj}
                onClick={() => setDayAdjustment(adj)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  dayAdjustment === adj
                    ? 'bg-emerald-600 text-white'
                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300'
                }`}
              >
                {adj > 0 ? `+${adj}` : adj} Hari
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Date Converter Card */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Konversi Tanggal Mudah Digunakan
            </h3>
          </div>

          <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5 dark:border-neutral-800 dark:bg-neutral-800 text-xs">
            <button
              onClick={() => setConvMode('masehi_to_hijri')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                convMode === 'masehi_to_hijri'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300'
              }`}
            >
              Masehi ke Hijriah
            </button>
            <button
              onClick={() => setConvMode('hijri_to_masehi')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                convMode === 'hijri_to_masehi'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300'
              }`}
            >
              Hijriah ke Masehi
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {convMode === 'masehi_to_hijri' ? (
            <>
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Pilih Tanggal Masehi:
                </label>
                <input
                  id="input-conv-greg"
                  type="date"
                  value={gregDateInput}
                  onChange={(e) => setGregDateInput(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-sm text-neutral-800 focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                />
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  Hasil Tanggal Hijriah:
                </span>
                <div className="mt-1 text-xl font-bold text-neutral-900 dark:text-white">
                  {convertedHijri.formatted}
                </div>
                <div className="font-serif text-lg text-emerald-700 dark:text-emerald-400">
                  {convertedHijri.formattedAr}
                </div>
                {convertedHijri.isSunnahFasting && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span>{convertedHijri.fastingNote}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Masukkan Tanggal Hijriah:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={hDayInput}
                    onChange={(e) => setHDayInput(Number(e.target.value))}
                    placeholder="Hari"
                    className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                  />
                  <select
                    value={hMonthInput}
                    onChange={(e) => setHMonthInput(Number(e.target.value))}
                    className="rounded-xl border border-neutral-200 bg-neutral-50 px-2 py-2 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                  >
                    {HIJRI_MONTHS_ID.map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1300"
                    max="1550"
                    value={hYearInput}
                    onChange={(e) => setHYearInput(Number(e.target.value))}
                    placeholder="Tahun"
                    className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  Hasil Tanggal Masehi:
                </span>
                <div className="mt-1 text-xl font-bold text-neutral-900 dark:text-white">
                  {convertedGregorian.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Interactive Hijri Calendar Grid & Worship Checklist */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Full Month Calendar */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm lg:col-span-8 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="rounded-lg border border-neutral-200 p-1.5 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {monthNames[viewMonth]} {viewYear}
              </h3>
              <button
                onClick={handleNextMonth}
                className="rounded-lg border border-neutral-200 p-1.5 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <span className="text-xs text-neutral-400">
              Angka hijau: Tanggal Hijriah
            </span>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-neutral-400 pb-2">
            {DAYS_NAME_ID.map((d, idx) => (
              <div key={d} className={idx === 0 || idx === 5 ? 'text-emerald-600' : ''}>
                {d.slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty slots for start offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16 rounded-xl bg-neutral-50/40 dark:bg-neutral-800/20" />
            ))}

            {/* Days */}
            {Array.from({ length: daysInViewMonth }, (_, i) => i + 1).map((d) => {
              const cellDate = new Date(viewYear, viewMonth, d);
              const cellHijri = gregorianToHijri(cellDate, dayAdjustment);
              const isToday =
                cellDate.toDateString() === new Date().toDateString();

              return (
                <div
                  key={d}
                  className={`group relative flex h-16 flex-col justify-between rounded-xl border p-1.5 transition ${
                    isToday
                      ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500 dark:bg-emerald-950/30'
                      : cellHijri.isSunnahFasting
                      ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900/30 dark:bg-amber-950/10'
                      : 'border-neutral-100 bg-white hover:border-neutral-200 dark:border-neutral-800/60 dark:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      {d}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                      {cellHijri.day}
                    </span>
                  </div>

                  {cellHijri.isSunnahFasting && (
                    <div
                      className="truncate text-[9px] font-medium text-amber-700 dark:text-amber-300"
                      title={cellHijri.fastingNote}
                    >
                      {cellHijri.fastingNote}
                    </div>
                  )}

                  <div className="text-[9px] text-neutral-400">
                    {cellHijri.monthNameId.slice(0, 3)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Worship Schedule Checklist (Jadwal Ibadah Harian) */}
        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Jadwal Ibadah Harian
                </h3>
                <p className="text-[11px] text-neutral-400">Target ibadah hari ini</p>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {progressPercent}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Task Checklist */}
            <div className="mt-4 space-y-2">
              {worshipItems.map((item) => {
                const isChecked = !!worshipTasks[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleWorship(item.key)}
                    className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left text-xs transition ${
                      isChecked
                        ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200'
                        : 'border-neutral-200/80 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isChecked ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="h-4 w-4 text-neutral-300 dark:text-neutral-600" />
                      )}
                      <span className={isChecked ? 'line-through opacity-80' : 'font-medium'}>
                        {item.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 shrink-0">
                      {item.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
