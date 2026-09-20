import React, { useState } from 'react';
import {
  Calculator,
  Compass,
  TreePine,
  Waves,
  Ruler,
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { CityLocation } from '../types';
import {
  calculateObjectMeasurement,
  formatDM,
  toRad,
  BURUJ_DATA
} from '../utils/falakMath';
import { KalkulatorArahKiblat102 } from './KalkulatorArahKiblat102';

interface FalakCalculatorViewProps {
  selectedCity: CityLocation;
}

export const FalakCalculatorView: React.FC<FalakCalculatorViewProps> = ({ selectedCity }) => {
  const [activeSubTab, setActiveSubTab] = useState<'kiblat102' | 'objek' | 'trig' | 'derajat_jam'>('kiblat102');

  // Object measurement inputs (Bab XIV Kitab)
  const [objectType, setObjectType] = useState<'tree' | 'well' | 'river'>('tree');
  const [treeMethod, setTreeMethod] = useState<'fixed_45' | 'angle_distance' | 'shadow'>('fixed_45');
  const [userHeightCm, setUserHeightCm] = useState<number>(165);
  const [distanceToTreeCm, setDistanceToTreeCm] = useState<number>(1500); // 15 meters
  const [treeAngleDeg, setTreeAngleDeg] = useState<number>(45);

  // Well inputs
  const [wellDiameterCm, setWellDiameterCm] = useState<number>(80);
  const [wellAngleDeg, setWellAngleDeg] = useState<number>(60);

  // River inputs
  const [riverStrideCm, setRiverStrideCm] = useState<number>(310);
  const [riverAngleDeg, setRiverAngleDeg] = useState<number>(45);

  // Angle to Time Converter (Muqaddimah Hal. 16)
  const [inputDeg, setInputDeg] = useState<number>(40.25);
  const [inputHours, setInputHours] = useState<number>(2.5);

  // Trig Rubu values
  const [customPhi, setCustomPhi] = useState<number>(selectedCity.latitude);
  const [customDelta, setCustomDelta] = useState<number>(-18); // e.g. 18° S

  // Calculate object result
  const objectResult = calculateObjectMeasurement({
    type: objectType,
    method: treeMethod,
    userHeightCm,
    distanceToTreeCm,
    firstAngleDeg: treeAngleDeg,
    wellDiameterCm,
    wellAngleDeg,
    riverAngleDeg,
    strideDistanceCm: riverStrideCm
  });

  // Convert Degrees to Hours (15° = 1 hour, 1° = 4 min, 1' = 4 sec)
  const hoursFromDeg = inputDeg / 15;
  const hFloor = Math.floor(hoursFromDeg);
  const remMinutes = (hoursFromDeg - hFloor) * 60;
  const mFloor = Math.floor(remMinutes);
  const sFloor = Math.round((remMinutes - mFloor) * 60);

  // Convert Hours to Degrees
  const degFromHours = inputHours * 15;

  // Trig calculation
  const phiRad = toRad(customPhi);
  const deltaRad = toRad(customDelta);
  const bQutriCalc = Math.abs(Math.sin(phiRad) * Math.sin(deltaRad) * 60);
  const aMutlaqCalc = Math.abs(Math.cos(phiRad) * Math.cos(deltaRad) * 60);
  const tamamGhayahCalc = Math.abs(customPhi - customDelta);
  const ghayahCalc = 90 - tamamGhayahCalc;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Kalkulator Falak Kitab Taqribul Maqshad
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Kalkulator hisab parameter astronomi klasik, konversi sudut-waktu, dan teknik pengukuran objek bab XIV.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="inline-flex rounded-xl border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-800 text-xs flex-wrap gap-1">
          <button
            onClick={() => setActiveSubTab('kiblat102')}
            className={`rounded-lg px-3 py-1.5 font-bold transition flex items-center gap-1 ${
              activeSubTab === 'kiblat102'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-neutral-700 hover:text-neutral-900 dark:text-neutral-300'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Kalkulator Kiblat 1.02</span>
          </button>
          <button
            onClick={() => setActiveSubTab('objek')}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              activeSubTab === 'objek'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300'
            }`}
          >
            Pengukuran Lapangan
          </button>
          <button
            onClick={() => setActiveSubTab('trig')}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              activeSubTab === 'trig'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300'
            }`}
          >
            Hisab Parameter Falak
          </button>
          <button
            onClick={() => setActiveSubTab('derajat_jam')}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              activeSubTab === 'derajat_jam'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300'
            }`}
          >
            Derajat ⇄ Jam
          </button>
        </div>
      </div>

      {activeSubTab === 'kiblat102' && (
        <KalkulatorArahKiblat102 initialCity={selectedCity} />
      )}

      {activeSubTab === 'objek' && (
        <div className="space-y-6">
          {/* Object Selector */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'tree', label: 'Tinggi Pohon / Gedung', icon: TreePine, desc: 'Metode Bab XIV Hal. 217-221' },
              { id: 'well', label: 'Kedalaman Sumur Air', icon: Waves, desc: 'Metode Bab XIV Hal. 222-224' },
              { id: 'river', label: 'Lebar Sungai', icon: Ruler, desc: 'Metode Bab XIV Hal. 225-227' }
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = objectType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setObjectType(t.id as 'tree' | 'well' | 'river')}
                  className={`flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500 dark:bg-emerald-950/20'
                      : 'border-neutral-200/80 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'}`} />
                  <span className="mt-2 text-sm font-semibold text-neutral-900 dark:text-white">
                    {t.label}
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Form & Calculation Results */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Input Form */}
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm lg:col-span-6 dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white pb-2 border-b border-neutral-100 dark:border-neutral-800">
                Parameter Pengukuran Lapangan
              </h3>

              {objectType === 'tree' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      Metode Pengukuran:
                    </label>
                    <select
                      value={treeMethod}
                      onChange={(e) => setTreeMethod(e.target.value as 'fixed_45' | 'angle_distance' | 'shadow')}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                    >
                      <option value="fixed_45">Metode 45 Derajat (Cara II Kitab Hal. 219)</option>
                      <option value="angle_distance">Metode Bidik Bebas & Jarak (Cara I Hal. 217)</option>
                      <option value="shadow">Metode Bayangan Matahari (Bab VIII)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        Tinggi Pengamat (cm):
                      </label>
                      <input
                        type="number"
                        value={userHeightCm}
                        onChange={(e) => setUserHeightCm(Number(e.target.value))}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        Jarak ke Pohon (cm):
                      </label>
                      <input
                        type="number"
                        value={distanceToTreeCm}
                        onChange={(e) => setDistanceToTreeCm(Number(e.target.value))}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                      />
                    </div>
                  </div>

                  {treeMethod === 'angle_distance' && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        Sudut Bidik Rubu' (Derajat):
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="89"
                        value={treeAngleDeg}
                        onChange={(e) => setTreeAngleDeg(Number(e.target.value))}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                      />
                    </div>
                  )}
                </>
              )}

              {objectType === 'well' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      Diameter Mulut Sumur (cm):
                    </label>
                    <input
                      type="number"
                      value={wellDiameterCm}
                      onChange={(e) => setWellDiameterCm(Number(e.target.value))}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                    />
                    <p className="text-[11px] text-neutral-400">
                      Bisa diukur dari keliling sumur dibagi 3.14 (Hal. 223 Kitab).
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      Sudut Inkhifadh ke Permukaan Air (°):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="85"
                      value={wellAngleDeg}
                      onChange={(e) => setWellAngleDeg(Number(e.target.value))}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                    />
                    <p className="text-[11px] text-neutral-400">
                      Dibidik dari tepi mulut sumur menggunakan Rubu' Mujayyab.
                    </p>
                  </div>
                </>
              )}

              {objectType === 'river' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      Jarak Langkah Pengamatan di Tepi Rata (cm):
                    </label>
                    <input
                      type="number"
                      value={riverStrideCm}
                      onChange={(e) => setRiverStrideCm(Number(e.target.value))}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      Sudut Bidik Rubu' (°):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="85"
                      value={riverAngleDeg}
                      onChange={(e) => setRiverAngleDeg(Number(e.target.value))}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Results Display */}
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm lg:col-span-6 dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Hasil Perhitungan
              </span>

              <div className="rounded-xl bg-emerald-50/70 p-4 dark:bg-emerald-950/30">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {objectType === 'tree'
                    ? 'Tinggi Objek / Pohon:'
                    : objectType === 'well'
                    ? 'Kedalaman Air Sumur:'
                    : 'Lebar Sungai:'}
                </span>
                <div className="mt-1 text-3xl font-extrabold text-emerald-900 font-mono dark:text-emerald-200">
                  {objectType === 'tree'
                    ? `${objectResult.heightMeters} meter`
                    : objectType === 'well'
                    ? `${objectResult.depthMeters} meter`
                    : `${objectResult.widthMeters} meter`}
                </div>
                <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                  ({objectType === 'tree'
                    ? `${objectResult.heightCm} cm`
                    : objectType === 'well'
                    ? `${objectResult.depthCm} cm`
                    : `${objectResult.widthCm} cm`})
                </div>
              </div>

              <div className="rounded-xl bg-neutral-50 p-3.5 text-xs text-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-300 space-y-1 font-mono">
                <span className="font-semibold text-neutral-500">Rumus Matan:</span>
                <div>{objectResult.formula}</div>
              </div>

              <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 p-3.5 text-xs text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200">
                <div className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>Kaidah Kitab Falak:</span>
                </div>
                <p className="mt-1 leading-relaxed text-[11px]">
                  {objectResult.explanation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'trig' && (
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Lintang Tempat (Ardul Balad φ):
              </label>
              <input
                type="number"
                step="0.01"
                value={customPhi}
                onChange={(e) => setCustomPhi(Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 font-mono"
              />
              <span className="text-[10px] text-neutral-400">
                {formatDM(Math.abs(customPhi))} {customPhi >= 0 ? 'LU' : 'LS'}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Deklinasi Matahari (Mail Awwal δ):
              </label>
              <input
                type="number"
                step="0.01"
                value={customDelta}
                onChange={(e) => setCustomDelta(Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 font-mono"
              />
              <span className="text-[10px] text-neutral-400">
                {formatDM(Math.abs(customDelta))} {customDelta >= 0 ? 'Utara' : 'Selatan'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-neutral-50 p-3.5 dark:bg-neutral-800/60 font-mono text-xs">
              <span className="text-neutral-400">Ghayah Irtifa'</span>
              <div className="mt-1 text-xl font-bold text-neutral-900 dark:text-white">
                {ghayahCalc.toFixed(2)}°
              </div>
              <span className="text-[10px] text-neutral-400">90° - |φ ± δ|</span>
            </div>

            <div className="rounded-xl bg-neutral-50 p-3.5 dark:bg-neutral-800/60 font-mono text-xs">
              <span className="text-neutral-400">Bu'du Qutri (BQ)</span>
              <div className="mt-1 text-xl font-bold text-neutral-900 dark:text-white">
                {bQutriCalc.toFixed(2)}
              </div>
              <span className="text-[10px] text-neutral-400">Sin φ × Sin δ × 60</span>
            </div>

            <div className="rounded-xl bg-neutral-50 p-3.5 dark:bg-neutral-800/60 font-mono text-xs">
              <span className="text-neutral-400">Ashal Muthlaq (AM)</span>
              <div className="mt-1 text-xl font-bold text-neutral-900 dark:text-white">
                {aMutlaqCalc.toFixed(2)}
              </div>
              <span className="text-[10px] text-neutral-400">Cos φ × Cos δ × 60</span>
            </div>

            <div className="rounded-xl bg-neutral-50 p-3.5 dark:bg-neutral-800/60 font-mono text-xs">
              <span className="text-neutral-400">Status Arah</span>
              <div className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
                {customPhi * customDelta >= 0 ? 'Ittifaq (Searah)' : 'Ikhtilaf (Beda Arah)'}
              </div>
              <span className="text-[10px] text-neutral-400">
                {customPhi * customDelta >= 0 ? 'Siang > 12 jam' : 'Siang < 12 jam'}
              </span>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'derajat_jam' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Degree to Time */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Derajat Busur ke Waktu Jam
            </span>
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Masukkan Nilai Derajat (°):
              </label>
              <input
                type="number"
                step="0.01"
                value={inputDeg}
                onChange={(e) => setInputDeg(Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-sm text-neutral-800 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 font-mono"
              />
            </div>

            <div className="rounded-xl bg-emerald-50/70 p-4 dark:bg-emerald-950/30">
              <span className="text-xs text-neutral-400">Hasil Waktu Jam:</span>
              <div className="mt-1 text-2xl font-black text-emerald-900 font-mono dark:text-emerald-200">
                {hFloor} Jam {mFloor} Menit {sFloor} Detik
              </div>
              <span className="text-xs text-neutral-500 font-mono">
                = {hoursFromDeg.toFixed(4)} Jam
              </span>
            </div>

            <div className="text-[11px] text-neutral-400 space-y-0.5">
              <div>• 15° = 1 Jam</div>
              <div>• 1° = 4 Menit Waktu</div>
              <div>• 1' (Menit Derajat) = 4 Detik Waktu</div>
            </div>
          </div>

          {/* Time to Degree */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Waktu Jam ke Derajat Busur
            </span>
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Masukkan Nilai Jam (Desimal):
              </label>
              <input
                type="number"
                step="0.01"
                value={inputHours}
                onChange={(e) => setInputHours(Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-sm text-neutral-800 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 font-mono"
              />
            </div>

            <div className="rounded-xl bg-emerald-50/70 p-4 dark:bg-emerald-950/30">
              <span className="text-xs text-neutral-400">Hasil Derajat Busur:</span>
              <div className="mt-1 text-2xl font-black text-emerald-900 font-mono dark:text-emerald-200">
                {degFromHours.toFixed(2)}°
              </div>
              <span className="text-xs text-neutral-500 font-mono">
                {formatDM(degFromHours)}
              </span>
            </div>

            <div className="text-[11px] text-neutral-400 space-y-0.5">
              <div>• 1 Jam = 15°</div>
              <div>• 1 Menit Waktu = 15' (Menit Derajat)</div>
              <div>• 4 Detik Waktu = 1' (Menit Derajat)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
