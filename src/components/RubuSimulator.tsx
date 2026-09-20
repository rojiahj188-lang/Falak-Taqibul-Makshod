import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Sliders,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Info,
  Layers,
  Sparkles,
  BookOpen,
  Compass,
  Sun,
  Move
} from 'lucide-react';
import { CityLocation } from '../types';
import { calculatePrayerTimes, calculateQibla, formatDM, formatDMS } from '../utils/falakMath';

interface RubuSimulatorProps {
  selectedCity: CityLocation;
}

// Classical Calculation Scenarios from Kitab Taqribul Maqshad
interface CalculationScenario {
  id: string;
  title: string;
  arabicTitle: string;
  kitabRef: string;
  description: string;
  steps: {
    stepNum: number;
    stepTitle: string;
    description: string;
    kitabText: string;
    angleDeg: number;
    muriPos: number;
    highlight: 'khait' | 'jaib_mabsuth' | 'jaib_mankus' | 'qaus_asar' | 'dairah_mail' | 'zill';
    formula: string;
    resultLabel: string;
    resultValue: string;
  }[];
}

export const RubuSimulator: React.FC<RubuSimulatorProps> = ({ selectedCity }) => {
  const todayTimes = calculatePrayerTimes(new Date(), selectedCity);
  const qibla = calculateQibla(selectedCity);

  // Scenarios definition
  const scenarios: CalculationScenario[] = [
    {
      id: 'sin_cos',
      title: 'Hisab Sinus (Jaib) & Cosinus (Jaib Tamam)',
      arabicTitle: 'في استخراج الجيب وجيب التمام',
      kitabRef: 'Bab IV Taqribul Maqshad - Hal. 22',
      description: 'Menemukan nilai sinus dan cosinus suatu sudut busur derajat menggunakan skala Sittini (R = 60).',
      steps: [
        {
          stepNum: 1,
          stepTitle: 'Langkah 1: Letakkan Khait pada Busur Sudut (h)',
          description: 'Arahkan benang (Al-Khait) dari Markaz ke angka sudut yang dicari pada busur Qaus al-Irtifa\' (misal: 30°).',
          kitabText: 'تضع الخيط على القوس المعلوم من قسي الارتفاع',
          angleDeg: 30,
          muriPos: 60,
          highlight: 'khait',
          formula: 'Sudut h = 30° pada Qaus al-Irtifa\'',
          resultLabel: 'Sudut Busur (Qaus)',
          resultValue: '30° 00\''
        },
        {
          stepNum: 2,
          stepTitle: 'Langkah 2: Proyeksikan ke As-Sittini Datar (Jaib Mabsuth)',
          description: 'Tarik garis tegak lurus dari titik busur jatuh ke sumbu datar untuk membaca nilai Sinus (Al-Jaib al-Mabsuth).',
          kitabText: 'ثم تنظر ما يقابل طرف الخيط من الجيب المبسوط على الضلع الأفقي',
          angleDeg: 30,
          muriPos: 30,
          highlight: 'jaib_mabsuth',
          formula: 'Jaib Mabsuth = 60 × Sin(30°) = 60 × 0.5',
          resultLabel: 'Al-Jaib al-Mabsuth (Sin)',
          resultValue: '30.00 (Skala Sittini)'
        },
        {
          stepNum: 3,
          stepTitle: 'Langkah 3: Proyeksikan ke As-Sittini Tegak (Jaib Mankus / Tamam)',
          description: 'Lihat garis horisontal dari titik potong menuju sumbu tegak untuk membaca Cosinus (Jaib al-Tamam).',
          kitabText: 'وما يقابله من الضلع العمودي هو جيب التمام',
          angleDeg: 30,
          muriPos: 51.96,
          highlight: 'jaib_mankus',
          formula: 'Jaib Tamam = 60 × Cos(30°) = 60 × 0.8660',
          resultLabel: 'Jaib al-Tamam (Cos)',
          resultValue: '51.96 (Skala Sittini)'
        }
      ]
    },
    {
      id: 'ghayah_zuhur',
      title: 'Menentukan Tinggi Kulminasi Dzuhur (Ghayatul Irtifa\')',
      arabicTitle: 'معرفة غاية الارتفاع وقت الزوال',
      kitabRef: 'Bab VII Taqribul Maqshad - Hal. 45',
      description: 'Menghitung ketinggian matahari maksimum di meridian lokal untuk menentukan masuknya waktu shalat Dzuhur.',
      steps: [
        {
          stepNum: 1,
          stepTitle: 'Langkah 1: Deklinasi Matahari (Mail Awwal)',
          description: `Deklinasi matahari (mail) hari ini adalah ${todayTimes.falakParams.mailAwwal}°. Tempatkan benang pada busur mail.`,
          kitabText: 'تأخذ الميل الأول للشمس في ذلك اليوم',
          angleDeg: Math.abs(todayTimes.falakParams.mailAwwal) || 12,
          muriPos: 60,
          highlight: 'dairah_mail',
          formula: `Mail Awwal (δ) = ${todayTimes.falakParams.mailAwwal}°`,
          resultLabel: 'Deklinasi (δ)',
          resultValue: `${todayTimes.falakParams.mailAwwal}°`
        },
        {
          stepNum: 2,
          stepTitle: 'Langkah 2: Hitung Ketinggian Puncak Kulminasi (Ghayah)',
          description: `Dengan Lintang Tempat (φ = ${selectedCity.latitude}°), rumus Ghayah: h = 90° - |φ - δ|. Arahkan benang ke sudut hasil hisab.`,
          kitabText: 'تنقص الفضل بين العرض والميل من تسعين فالباقي هو غاية الارتفاع',
          angleDeg: todayTimes.falakParams.ghayah || 78.5,
          muriPos: 60,
          highlight: 'khait',
          formula: `Ghayah = 90° - |${selectedCity.latitude.toFixed(2)}° - (${todayTimes.falakParams.mailAwwal}°)|`,
          resultLabel: 'Ghayatul Irtifa\'',
          resultValue: `${todayTimes.falakParams.ghayah}°`
        },
        {
          stepNum: 3,
          stepTitle: 'Langkah 3: Tentukan Bayangan Istiwa\' (Zillul Istiwa\')',
          description: 'Pada sudut kulminasi ini, bayangan tongkat istiwa\' mencapai titik terpendek sebagai awal masuk waktu Dzuhur.',
          kitabText: 'فإذا مالت الشمس عن وسط السماء ودخل وقت الظهر زاد الظل عن ظل الاستواء',
          angleDeg: todayTimes.falakParams.ghayah || 78.5,
          muriPos: 45,
          highlight: 'zill',
          formula: 'Zill Istiwa\' = 12 / Tan(Ghayah)',
          resultLabel: 'Zillul Istiwa\' (Jari)',
          resultValue: `${(12 / Math.tan((todayTimes.falakParams.ghayah * Math.PI) / 180)).toFixed(2)} Asabi'`
        }
      ]
    },
    {
      id: 'qaus_ashar',
      title: 'Menentukan Waktu Masuk Shalat Ashar (Qausul \'Asri)',
      arabicTitle: 'معرفة وقت صلاة العصر بالقوسين',
      kitabRef: 'Bab VIII Taqribul Maqshad - Hal. 58',
      description: 'Menentukan sudut tinggi matahari waktu Ashar menggunakan kurva Qaus \'Asar 1 (12 jari) atau Qaus \'Asar 2 (7 kaki).',
      steps: [
        {
          stepNum: 1,
          stepTitle: 'Langkah 1: Bayangan Sama dengan Panjang Benda + Zill Istiwa\'',
          description: 'Waktu Ashar dimulai saat panjang bayangan sebuah benda sama dengan panjang aslinya ditambah bayangan waktu istiwa\'.',
          kitabText: 'إذا صار ظل كل شيء مثله سوى ظل الاستواء',
          angleDeg: todayTimes.falakParams.ghayah || 78,
          muriPos: 60,
          highlight: 'zill',
          formula: 'Syarat Ashar: Bayangan = 12 jari + Zill Istiwa\'',
          resultLabel: 'Panjang Bayangan Total',
          resultValue: `${(12 + 12 / Math.tan((todayTimes.falakParams.ghayah * Math.PI) / 180)).toFixed(2)} Jari`
        },
        {
          stepNum: 2,
          stepTitle: 'Langkah 2: Tempelkan Muri pada Busur Qausul \'Asri',
          description: 'Arahkan benang ke kurva Qaus Asar (42°20\' untuk skala jari atau 26°30\' untuk skala kaki) yang terukir di Rubu\'.',
          kitabText: 'تضع الخيط على قوس العصر وتنظر تقاطعه مع خطوط الظل',
          angleDeg: 42.33,
          muriPos: 40.5,
          highlight: 'qaus_asar',
          formula: 'Qausul \'Asri pada khatulistiwa ≈ 42° 20\'',
          resultLabel: 'Sudut Tinggi Ashar',
          resultValue: '42° 20\' (Irtifa\')'
        },
        {
          stepNum: 3,
          stepTitle: 'Langkah 3: Konversi Busur ke Waktu Lokal',
          description: `Dari sudut irtifa' Ashar diperoleh waktu masuk shalat Ashar untuk ${selectedCity.name} pada ${todayTimes.asarAwwal} ${selectedCity.timezoneName}.`,
          kitabText: 'فتحوله إلى الساعات والدرج لمعرفة الوقت',
          angleDeg: 42.33,
          muriPos: 40.5,
          highlight: 'khait',
          formula: `Jadwal Ashar = ${todayTimes.asarAwwal} ${selectedCity.timezoneName}`,
          resultLabel: 'Waktu Ashar Hari Ini',
          resultValue: `${todayTimes.asarAwwal} ${selectedCity.timezoneName}`
        }
      ]
    },
    {
      id: 'arah_kiblat',
      title: 'Menentukan Arah Kiblat (Inhiraf al-Qiblah)',
      arabicTitle: 'معرفة سمت القبلة بالربع المجيب',
      kitabRef: 'Bab XIII Taqribul Maqshad - Hal. 102',
      description: 'Mencari azimut Ka\'bah Baitullah dari koordinat daerah dengan hisab Rubu\' Mujayyab.',
      steps: [
        {
          stepNum: 1,
          stepTitle: 'Langkah 1: Hitung Fadhlut Tulain (Selisih Bujur)',
          description: `Selisih bujur antara Ka'bah (39°49' BT) dan ${selectedCity.name} (${selectedCity.longitude}° BT) = ${qibla.steps.fadlutTulain}°.`,
          kitabText: 'تأخذ فضل الطولين بين مكة المشرفة وبلدك',
          angleDeg: Math.min(85, qibla.steps.fadlutTulain || 76),
          muriPos: 60,
          highlight: 'khait',
          formula: `Fadhlut Tulain = ${selectedCity.longitude}° - 39.82° = ${qibla.steps.fadlutTulain}°`,
          resultLabel: 'Fadhlut Tulain (f)',
          resultValue: `${qibla.steps.fadlutTulain}°`
        },
        {
          stepNum: 2,
          stepTitle: 'Langkah 2: Ambil Jaib Selisih Lintang (Fadhlu Ardhain)',
          description: `Selisih lintang antara ${selectedCity.name} (${selectedCity.latitude}°) dan Ka'bah (21°25' LU) = ${qibla.steps.fadhluArdaen}°.`,
          kitabText: 'ثم تجيب فضل العرضين وتضعه على الخيط',
          angleDeg: Math.min(85, qibla.steps.fadlutTulain || 76),
          muriPos: 42,
          highlight: 'jaib_mankus',
          formula: `Fadhlu Ardhain = ${qibla.steps.fadhluArdaen}°`,
          resultLabel: 'Fadhlu Ardhain',
          resultValue: `${qibla.steps.fadhluArdaen}°`
        },
        {
          stepNum: 3,
          stepTitle: 'Langkah 3: Peroleh Sudut Inhiraf Kiblat',
          description: `Benang menunjuk ke sudut kiblat dari arah Barat ke Utara (B-U) = ${qibla.angleFromWestToNorth}°, atau Azimuth UTSB = ${qibla.azimuth}°.`,
          kitabText: 'فينتهي الخيط إلى سمت القبلة وهو زاوية الانحراف',
          angleDeg: qibla.angleFromWestToNorth,
          muriPos: 60,
          highlight: 'khait',
          formula: `Azimut = ${qibla.azimuth}° | Sudut B-U = ${qibla.angleFromWestToNorth}°`,
          resultLabel: 'Azimut Sejati Ka\'bah',
          resultValue: `${qibla.azimuth}° (${formatDMS(qibla.azimuth)})`
        }
      ]
    }
  ];

  // Active scenario & step
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Manual interactive angle & muri states (can be dragged or moved with sliders)
  const currentScenario = scenarios[selectedScenarioIndex];
  const activeStep = currentScenario.steps[currentStepIndex];

  const [angleDeg, setAngleDeg] = useState<number>(activeStep.angleDeg);
  const [muriPos, setMuriPos] = useState<number>(activeStep.muriPos);

  // Layer toggles
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showMailArc, setShowMailArc] = useState<boolean>(true);
  const [showAsarArcs, setShowAsarArcs] = useState<boolean>(true);
  const [showZillLines, setShowZillLines] = useState<boolean>(true);
  const [showTajyib, setShowTajyib] = useState<boolean>(true);
  const [showProjections, setShowProjections] = useState<boolean>(true);

  // When step changes, smoothly apply scenario values
  useEffect(() => {
    setAngleDeg(activeStep.angleDeg);
    setMuriPos(activeStep.muriPos);
  }, [activeStep]);

  // Auto-play steps animation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < currentScenario.steps.length - 1) {
          return prev + 1;
        } else {
          setIsPlaying(false);
          return prev;
        }
      });
    }, 2800);
    return () => clearInterval(interval);
  }, [isPlaying, currentScenario.steps.length]);

  // SVG Geometry Constants
  // Center (Markaz) is top-right: (430, 35)
  // Radius R = 360 px
  const cx = 430;
  const cy = 35;
  const r = 360;

  // Trigonometry (R=60)
  const angleRad = (angleDeg * Math.PI) / 180;
  const jaib = Math.sin(angleRad) * 60; // Sinus * 60
  const jaibTamam = Math.cos(angleRad) * 60; // Cosinus * 60
  const tanVal = Math.tan(angleRad);
  const zillAsabi = tanVal > 0 ? (12 / tanVal).toFixed(2) : '∞';
  const zillAqdam = tanVal > 0 ? (7 / tanVal).toFixed(2) : '∞';

  // Thread coordinates
  // 0° is bottom vertical (angle 90° in standard screen coords), 90° is horizontal left (angle 180°)
  const threadAngle = Math.PI / 2 + angleRad;
  const threadX = cx + r * Math.cos(threadAngle);
  const threadY = cy + r * Math.sin(threadAngle);

  // Muri coordinates
  const muriDistance = (muriPos / 60) * r;
  const muriX = cx + muriDistance * Math.cos(threadAngle);
  const muriY = cy + muriDistance * Math.sin(threadAngle);

  // Direct Drag Handler on SVG Canvas
  const svgRef = useRef<SVGSVGElement | null>(null);
  const isDraggingRef = useRef<'khait' | 'muri' | null>(null);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    // Convert client coordinates to SVG viewBox coords (480x430)
    const scaleX = 480 / rect.width;
    const scaleY = 430 / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Check if clicked close to muri
    const distToMuri = Math.hypot(clickX - muriX, clickY - muriY);
    if (distToMuri < 25) {
      isDraggingRef.current = 'muri';
      (e.target as Element).setPointerCapture?.(e.pointerId);
      return;
    }

    // Otherwise drag thread
    isDraggingRef.current = 'khait';
    (e.target as Element).setPointerCapture?.(e.pointerId);
    updateAngleFromCoord(clickX, clickY);
  };

  const updateAngleFromCoord = (x: number, y: number) => {
    const dx = x - cx;
    const dy = y - cy;
    let clickAngleRad = Math.atan2(dy, dx); // from -PI to PI
    // We want angleDeg where 90° (bottom) -> 0°, and 180° (left) -> 90°
    let deg = ((clickAngleRad - Math.PI / 2) * 180) / Math.PI;
    if (deg < 0) deg = 0;
    if (deg > 90) deg = 90;
    setAngleDeg(parseFloat(deg.toFixed(1)));
  };

  const updateMuriFromCoord = (x: number, y: number) => {
    const dist = Math.hypot(x - cx, y - cy);
    let pos = (dist / r) * 60;
    if (pos < 0) pos = 0;
    if (pos > 60) pos = 60;
    setMuriPos(parseFloat(pos.toFixed(1)));
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDraggingRef.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 480 / rect.width;
    const scaleY = 430 / rect.height;
    const curX = (e.clientX - rect.left) * scaleX;
    const curY = (e.clientY - rect.top) * scaleY;

    if (isDraggingRef.current === 'muri') {
      updateMuriFromCoord(curX, curY);
    } else {
      updateAngleFromCoord(curX, curY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    isDraggingRef.current = null;
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
              Instrumen Astronomi Tradisional
            </span>
            <span className="text-xs text-neutral-400 font-serif">الربع المجيب المتطور</span>
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Visualisasi Interaktif Rubu' Mujayyab
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Simulasi visual hisab segitiga bola & busur derajat analog karya Syekh Mukhtar Al-Bogori dengan slider langkah perhitungan interaktif.
          </p>
        </div>

        {/* Quick Reset button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAngleDeg(45);
              setMuriPos(45);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 transition"
            title="Reset Posisi Awal 45°"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset 45°</span>
          </button>
        </div>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-neutral-200 dark:border-neutral-800">
        {scenarios.map((sc, idx) => (
          <button
            key={sc.id}
            onClick={() => {
              setSelectedScenarioIndex(idx);
              setCurrentStepIndex(0);
              setIsPlaying(false);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedScenarioIndex === idx
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>{sc.title}</span>
          </button>
        ))}
      </div>

      {/* Interactive Step Slider HUD Bar */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-amber-50/40 p-4 shadow-sm dark:from-emerald-950/30 dark:via-neutral-900 dark:to-amber-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                Langkah {activeStep.stepNum} dari {currentScenario.steps.length}
              </span>
              <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                {activeStep.stepTitle}
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-700 dark:text-neutral-300">
              {activeStep.description}
            </p>
            <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400 font-serif italic mt-0.5">
              "{activeStep.kitabText}"
            </p>
          </div>

          {/* Stepper Playback Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentStepIndex === 0}
              className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 disabled:opacity-35 hover:bg-neutral-100 transition"
              title="Langkah Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition"
              title="Putar Otomatis Langkah Perhitungan"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>Jeda</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>Animasi Langkah</span>
                </>
              )}
            </button>

            <button
              onClick={() =>
                setCurrentStepIndex((prev) =>
                  Math.min(currentScenario.steps.length - 1, prev + 1)
                )
              }
              disabled={currentStepIndex === currentScenario.steps.length - 1}
              className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 disabled:opacity-35 hover:bg-neutral-100 transition"
              title="Langkah Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Interactive Slider for Steps */}
        <div className="mt-3.5 pt-3 border-t border-emerald-200/50 dark:border-emerald-800/40">
          <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
            <span className="flex items-center gap-1">
              <Sliders className="h-3 w-3 text-emerald-600" />
              <span>Geser Slider untuk Melihat Rangkaian Hisab:</span>
            </span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
              {activeStep.resultLabel}: {activeStep.resultValue}
            </span>
          </div>

          <input
            id="range-rubu-step-slider"
            type="range"
            min="0"
            max={currentScenario.steps.length - 1}
            step="1"
            value={currentStepIndex}
            onChange={(e) => {
              setCurrentStepIndex(Number(e.target.value));
              setIsPlaying(false);
            }}
            className="w-full h-2.5 bg-emerald-200/70 dark:bg-neutral-800 accent-emerald-600 rounded-lg cursor-pointer transition-all"
          />

          <div className="flex justify-between mt-1 text-[10px] text-neutral-500 font-medium">
            {currentScenario.steps.map((st, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentStepIndex(i);
                  setIsPlaying(false);
                }}
                className={`transition ${
                  currentStepIndex === i
                    ? 'font-bold text-emerald-700 dark:text-emerald-300 underline underline-offset-2'
                    : 'hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                Tahap {st.stepNum}: {st.stepTitle.split(':')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: SVG Canvas of Rubu' Mujayyab & Side Interactive Control Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* SVG Canvas with Direct Pointer Dragging */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm lg:col-span-8 dark:border-neutral-800 dark:bg-neutral-900">
          {/* Drag instruction badge */}
          <div className="w-full flex items-center justify-between pb-2 text-xs text-neutral-500 border-b border-neutral-100 dark:border-neutral-800">
            <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
              <Move className="h-3.5 w-3.5" />
              <span>Sentuh & Geser Benang / Muri langsung pada instrumen</span>
            </span>
            <span className="font-mono text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
              h = {angleDeg}° | Muri = {muriPos}/60
            </span>
          </div>

          <div className="w-full overflow-x-auto flex justify-center py-2">
            <svg
              ref={svgRef}
              viewBox="0 0 480 430"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="h-auto max-w-[480px] w-full select-none cursor-crosshair touch-none"
              style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.08))' }}
            >
              <defs>
                {/* Vintage Brass Material Gradient */}
                <radialGradient id="rubuBrassVintage" cx="88%" cy="10%" r="92%">
                  <stop offset="0%" stopColor="#fef08a" stopOpacity="0.4" />
                  <stop offset="60%" stopColor="#fde047" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.08" />
                </radialGradient>
                {/* Glow filter for active elements */}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 1. Quadrant Solid Brass Plate Body */}
              <path
                d={`M ${cx} ${cy} L ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx} ${cy + r} Z`}
                fill="url(#rubuBrassVintage)"
                className="stroke-amber-900/90 dark:stroke-amber-400/80 stroke-[2.5]"
              />

              {/* Angle Sector Filled Wedge (Highlights current angle arc) */}
              <path
                d={`M ${cx} ${cy} L ${cx} ${cy + r} A ${r} ${r} 0 0 1 ${threadX} ${threadY} Z`}
                className="fill-emerald-500/15"
              />

              {/* 2. Grid: Juyub Mabsuthah & Mankusah (60x60 Sittini Divisions) */}
              {showGrid && (
                <g className="opacity-25 dark:opacity-20 stroke-neutral-700 dark:stroke-neutral-300">
                  {Array.from({ length: 13 }).map((_, i) => {
                    const step = (r / 60) * (i * 5);
                    return (
                      <React.Fragment key={i}>
                        {/* Horizontal lines (Juyub Mankusah) */}
                        <line
                          x1={cx - Math.sqrt(Math.max(0, r * r - step * step))}
                          y1={cy + step}
                          x2={cx}
                          y2={cy + step}
                          strokeWidth={i % 2 === 0 ? 1.2 : 0.6}
                        />
                        {/* Vertical lines (Juyub Mabsuthah) */}
                        <line
                          x1={cx - step}
                          y1={cy}
                          x2={cx - step}
                          y2={cy + Math.sqrt(Math.max(0, r * r - step * step))}
                          strokeWidth={i % 2 === 0 ? 1.2 : 0.6}
                        />
                      </React.Fragment>
                    );
                  })}
                </g>
              )}

              {/* 3. Dairah Tajyib (Arcs from Markaz) */}
              {showTajyib && (
                <g className="stroke-emerald-600 dark:stroke-emerald-400 fill-none opacity-50">
                  <path
                    d={`M ${cx} ${cy} A ${r / 2} ${r / 2} 0 0 0 ${cx} ${cy + r}`}
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />
                  <path
                    d={`M ${cx} ${cy} A ${r / 2} ${r / 2} 0 0 1 ${cx - r} ${cy}`}
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />
                </g>
              )}

              {/* 4. Dairah Mail (24° Declination Arc) */}
              {showMailArc && (
                <path
                  d={`M ${cx - (r * 24) / 60} ${cy} A ${(r * 24) / 60} ${(r * 24) / 60} 0 0 0 ${cx} ${
                    cy + (r * 24) / 60
                  }`}
                  className={`fill-none stroke-[2] ${
                    activeStep.highlight === 'dairah_mail'
                      ? 'stroke-rose-600 stroke-[3]'
                      : 'stroke-rose-500/70'
                  }`}
                  strokeDasharray="4 3"
                />
              )}

              {/* 5. Dua Qaus 'Asar (42°20' & 26°30') */}
              {showAsarArcs && (
                <g className="fill-none">
                  {/* Qaus Asar 1 (42°20') */}
                  <path
                    d={`M ${cx} ${cy} Q ${cx - r * 0.45} ${cy + r * 0.45} ${
                      cx - r * Math.sin((42.33 * Math.PI) / 180)
                    } ${cy + r * Math.cos((42.33 * Math.PI) / 180)}`}
                    className={`${
                      activeStep.highlight === 'qaus_asar'
                        ? 'stroke-indigo-600 stroke-[3]'
                        : 'stroke-indigo-500/80 stroke-[1.8]'
                    }`}
                  />
                  {/* Qaus Asar 2 (26°30') */}
                  <path
                    d={`M ${cx} ${cy} Q ${cx - r * 0.3} ${cy + r * 0.6} ${
                      cx - r * Math.sin((26.5 * Math.PI) / 180)
                    } ${cy + r * Math.cos((26.5 * Math.PI) / 180)}`}
                    className="stroke-indigo-400/60 stroke-[1.5]"
                    strokeDasharray="4 2"
                  />
                </g>
              )}

              {/* 6. Qaimata az-Zill (Scale 7 and 12) */}
              {showZillLines && (
                <g className="stroke-amber-600 dark:stroke-amber-400 fill-none opacity-80">
                  <line
                    x1={cx - (r * 7) / 60}
                    y1={cy}
                    x2={cx - (r * 7) / 60}
                    y2={cy + Math.sqrt(Math.max(0, r * r - ((r * 7) / 60) ** 2))}
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                  />
                  <line
                    x1={cx - (r * 12) / 60}
                    y1={cy}
                    x2={cx - (r * 12) / 60}
                    y2={cy + Math.sqrt(Math.max(0, r * r - ((r * 12) / 60) ** 2))}
                    strokeWidth={activeStep.highlight === 'zill' ? 2.5 : 1.2}
                    className={activeStep.highlight === 'zill' ? 'stroke-amber-500' : ''}
                    strokeDasharray="2 2"
                  />
                </g>
              )}

              {/* 7. Dynamic Trigonometric Projections (Real-Time Sine/Cosine Rays) */}
              {showProjections && (
                <g>
                  {/* Vertical drop to base axis (Jaib Mabsuth / Sine ray) */}
                  <line
                    x1={threadX}
                    y1={threadY}
                    x2={threadX}
                    y2={cy}
                    stroke="#059669"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    className="animate-pulse"
                  />
                  {/* Point at Base Axis */}
                  <circle cx={threadX} cy={cy} r="4" fill="#059669" />
                  <text
                    x={threadX}
                    y={cy - 8}
                    fontSize="9"
                    textAnchor="middle"
                    fill="#059669"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    Sin: {jaib.toFixed(1)}
                  </text>

                  {/* Horizontal drop to vertical axis (Jaib Mankus / Cosine ray) */}
                  <line
                    x1={threadX}
                    y1={threadY}
                    x2={cx}
                    y2={threadY}
                    stroke="#7c3aed"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    className="animate-pulse"
                  />
                  {/* Point at Vertical Axis */}
                  <circle cx={cx} cy={threadY} r="4" fill="#7c3aed" />
                  <text
                    x={cx + 10}
                    y={threadY + 3}
                    fontSize="9"
                    fill="#7c3aed"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    Cos: {jaibTamam.toFixed(1)}
                  </text>
                </g>
              )}

              {/* 8. Degree tickmarks along the Qaus al-Irtifa' (0° to 90°) */}
              {Array.from({ length: 19 }).map((_, i) => {
                const deg = i * 5;
                const rad = (deg * Math.PI) / 180;
                const x1 = cx - r * Math.sin(rad);
                const y1 = cy + r * Math.cos(rad);
                const x2 = cx - (r - (i % 3 === 0 ? 12 : 6)) * Math.sin(rad);
                const y2 = cy + (r - (i % 3 === 0 ? 12 : 6)) * Math.cos(rad);
                const textX = cx - (r + 14) * Math.sin(rad);
                const textY = cy + (r + 14) * Math.cos(rad);

                return (
                  <React.Fragment key={i}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      className="stroke-amber-950 dark:stroke-amber-200"
                      strokeWidth={i % 3 === 0 ? 1.8 : 0.8}
                    />
                    {i % 3 === 0 && (
                      <text
                        x={textX}
                        y={textY}
                        fontSize="8"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        className="fill-neutral-700 dark:fill-neutral-300 font-mono font-semibold"
                      >
                        {deg}°
                      </text>
                    )}
                  </React.Fragment>
                );
              })}

              {/* 9. Sighting Vanes (Al-Hadafatani) on Left Edge */}
              <rect
                x={cx - r - 9}
                y={cy - 12}
                width="9"
                height="18"
                className="fill-amber-800 stroke-neutral-900"
                rx="2"
              />
              <circle cx={cx - r - 4.5} cy={cy - 3} r="2.5" fill="#fef08a" />
              <rect
                x={cx - r - 9}
                y={cy + r * 0.45}
                width="9"
                height="18"
                className="fill-amber-800 stroke-neutral-900"
                rx="2"
              />
              <circle cx={cx - r - 4.5} cy={cy + r * 0.45 + 9} r="2.5" fill="#fef08a" />

              {/* 10. The Red Thread (Al-Khait) from Markaz to Arc */}
              <line
                x1={cx}
                y1={cy}
                x2={threadX}
                y2={threadY}
                className="stroke-rose-600 stroke-[2.5]"
              />

              {/* Plumb Weight (Al-Syaqul / Pemberat Timah) */}
              <ellipse
                cx={threadX}
                cy={threadY + 14}
                rx="6"
                ry="11"
                className="fill-neutral-700 dark:fill-neutral-300 stroke-neutral-900 stroke-[1.5]"
              />
              <line
                x1={threadX}
                y1={threadY}
                x2={threadX}
                y2={threadY + 6}
                className="stroke-rose-600 stroke-[2]"
              />

              {/* 11. Draggable Bead Marker (Al-Muri / Al-Khurzah) on the Thread */}
              <circle
                cx={muriX}
                cy={muriY}
                r="7"
                className="fill-amber-400 stroke-amber-900 stroke-[2] cursor-grab active:cursor-grabbing filter drop-shadow"
              />
              <circle cx={muriX} cy={muriY} r="2.5" fill="#ffffff" />

              {/* 12. Center Pivot Hole (Al-Markaz) */}
              <circle cx={cx} cy={cy} r="6" className="fill-neutral-900 dark:fill-white" />
              <circle cx={cx} cy={cy} r="2.5" fill="#10b981" />
              <text
                x={cx + 10}
                y={cy - 4}
                fontSize="9"
                className="fill-amber-900 dark:fill-amber-300 font-bold"
              >
                المركز (Markaz)
              </text>
            </svg>
          </div>

          <div className="mt-1 flex items-center justify-between w-full px-2 text-[11px] text-neutral-400">
            <span>← Ufuq 90° (Tegak Lurus)</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Qaus al-Irtifa' ({angleDeg}°)
            </span>
            <span>Ufuq 0° (Datar) →</span>
          </div>
        </div>

        {/* Side Controls: Sliders, Readouts, and Layer Toggles */}
        <div className="space-y-4 lg:col-span-4">
          {/* Angle & Muri Fine-tuning Sliders */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Kontrol Benang & Muri
                </h3>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">Real-Time</span>
            </div>

            <div className="mt-4 space-y-4">
              {/* Angle Slider (0 to 90°) */}
              <div>
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    Sudut Irtifa' Benang (h):
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {angleDeg.toFixed(1)}°
                  </span>
                </div>
                <input
                  id="range-rubu-angle"
                  type="range"
                  min="0"
                  max="90"
                  step="0.5"
                  value={angleDeg}
                  onChange={(e) => setAngleDeg(Number(e.target.value))}
                  className="mt-1.5 h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-emerald-600 dark:bg-neutral-700"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5 font-mono">
                  <span>0° (Ufuq)</span>
                  <span>45°</span>
                  <span>90° (Samt)</span>
                </div>
              </div>

              {/* Muri Slider (0 to 60) */}
              <div>
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    Posisi Muri (Al-Sittini):
                  </span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {muriPos.toFixed(1)} / 60
                  </span>
                </div>
                <input
                  id="range-rubu-muri"
                  type="range"
                  min="0"
                  max="60"
                  step="0.5"
                  value={muriPos}
                  onChange={(e) => setMuriPos(Number(e.target.value))}
                  className="mt-1.5 h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-amber-500 dark:bg-neutral-700"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5 font-mono">
                  <span>0 (Markaz)</span>
                  <span>30</span>
                  <span>60 (Khat Sittini)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical Readouts */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Hasil Nilai Falak (R = 60)
            </h4>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="rounded-lg bg-emerald-50/70 p-2.5 dark:bg-emerald-950/30 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-sans">
                  Jaib (Sin h × 60):
                </span>
                <div className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                  {jaib.toFixed(2)}
                </div>
              </div>

              <div className="rounded-lg bg-purple-50/70 p-2.5 dark:bg-purple-950/30 border border-purple-500/20">
                <span className="text-[10px] text-purple-800 dark:text-purple-300 font-sans">
                  Jaib Tamam (Cos h × 60):
                </span>
                <div className="text-base font-bold text-purple-700 dark:text-purple-300">
                  {jaibTamam.toFixed(2)}
                </div>
              </div>

              <div className="rounded-lg bg-neutral-50 p-2.5 dark:bg-neutral-800/60">
                <span className="text-[10px] text-neutral-400 font-sans">Zill 12 Jari (Asabi'):</span>
                <div className="text-base font-bold text-neutral-900 dark:text-white">
                  {zillAsabi}
                </div>
              </div>

              <div className="rounded-lg bg-neutral-50 p-2.5 dark:bg-neutral-800/60">
                <span className="text-[10px] text-neutral-400 font-sans">Zill 7 Kaki (Aqdam):</span>
                <div className="text-base font-bold text-neutral-900 dark:text-white">
                  {zillAqdam}
                </div>
              </div>
            </div>

            {/* Step formula banner */}
            <div className="mt-3 rounded-lg bg-amber-50/80 p-2.5 text-xs text-amber-950 dark:bg-amber-950/30 dark:text-amber-200 border border-amber-200 dark:border-amber-900/50">
              <div className="font-semibold">{activeStep.resultLabel}:</div>
              <div className="mt-0.5 font-mono text-[11px] font-bold text-amber-900 dark:text-amber-300">
                {activeStep.formula}
              </div>
            </div>
          </div>

          {/* Layer Visibility Toggles */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 text-xs">
            <div className="flex items-center gap-2 pb-2 text-neutral-500 font-semibold border-b border-neutral-100 dark:border-neutral-800">
              <Layers className="h-3.5 w-3.5 text-emerald-600" />
              <span>Lapisan Garis Tradisional (Rasum)</span>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-neutral-700 dark:text-neutral-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Grid 60 Sittini</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showProjections}
                  onChange={(e) => setShowProjections(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Sinar Sin/Cos</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMailArc}
                  onChange={(e) => setShowMailArc(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Dairah Mail 24°</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAsarArcs}
                  onChange={(e) => setShowAsarArcs(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Qaus 'Asar 1 & 2</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showZillLines}
                  onChange={(e) => setShowZillLines(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Garis Bayangan</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTajyib}
                  onChange={(e) => setShowTajyib(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Dairah Tajyib</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
