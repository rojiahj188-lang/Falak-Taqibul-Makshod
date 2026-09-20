import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Compass,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Smartphone,
  Sliders,
  Volume2,
  VolumeX,
  Eye,
  Crosshair,
  Sparkles,
  MapPin,
  HelpCircle
} from 'lucide-react';
import { CityLocation } from '../types';
import { calculateQibla, formatDMS } from '../utils/falakMath';

interface ArQiblaCameraViewProps {
  selectedCity: CityLocation;
  onClose: () => void;
  onOpenMap?: () => void;
}

export const ArQiblaCameraView: React.FC<ArQiblaCameraViewProps> = ({
  selectedCity,
  onClose,
  onOpenMap
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // States
  const [cameraStatus, setCameraStatus] = useState<'requesting' | 'active' | 'denied' | 'unsupported'>('requesting');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasOrientationSupport, setHasOrientationSupport] = useState<boolean>(false);
  const [orientationPermissionNeeded, setOrientationPermissionNeeded] = useState<boolean>(false);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [devicePitch, setDevicePitch] = useState<number>(90); // 90° = vertical upright
  const [deviceRoll, setDeviceRoll] = useState<number>(0);
  const [manualHeading, setManualHeading] = useState<number>(0);
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [hapticSoundEnabled, setHapticSoundEnabled] = useState<boolean>(true);
  const [isAligned, setIsAligned] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const qibla = calculateQibla(selectedCity);
  const targetAzimuth = qibla.azimuth; // e.g. 294.5°

  // Sound chime oscillator helper
  const playLockChime = () => {
    if (!hapticSoundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15); // A6
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  // 1. Initialize Camera Stream
  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      setCameraStatus('requesting');
      setErrorMessage('');

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (isMounted) {
          setCameraStatus('unsupported');
          setErrorMessage('Kamera tidak didukung oleh browser Anda.');
        }
        return;
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraStatus('active');
      } catch (err: unknown) {
        if (!isMounted) return;
        const errObj = err as Error;
        console.warn('Camera error:', errObj);
        setCameraStatus('denied');
        setErrorMessage(
          errObj.name === 'NotAllowedError' || errObj.name === 'PermissionDeniedError'
            ? 'Izin kamera ditolak. Silakan izinkan akses kamera pada pengaturan browser untuk melihat Augmented Reality.'
            : `Tidak dapat mengakses kamera (${errObj.message || 'Error hardware'}). Mode simulasi AR aktif.`
        );
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode]);

  // 2. Device Orientation Sensor Listener (Android & iOS)
  useEffect(() => {
    // Check if iOS 13+ permission is required
    const DeviceOrientationEventAny = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof DeviceOrientationEventAny?.requestPermission === 'function') {
      setOrientationPermissionNeeded(true);
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // 1. Heading (Azimuth)
      const webkitHeading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
      let calculatedHeading = 0;

      if (typeof webkitHeading === 'number' && !isNaN(webkitHeading)) {
        // iOS: webkitCompassHeading directly gives true heading 0 - 360
        calculatedHeading = webkitHeading;
        setHasOrientationSupport(true);
      } else if (e.alpha !== null && typeof e.alpha === 'number') {
        // Android standard: alpha is counter-clockwise 0 - 360
        calculatedHeading = (360 - e.alpha) % 360;
        setHasOrientationSupport(true);
      }

      setDeviceHeading(calculatedHeading);

      // 2. Pitch (beta) & Roll (gamma)
      if (typeof e.beta === 'number') setDevicePitch(e.beta);
      if (typeof e.gamma === 'number') setDeviceRoll(e.gamma);
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, []);

  // Request iOS Sensor Permission
  const requestSensorPermission = async () => {
    try {
      const DeviceOrientationEventAny = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };
      if (typeof DeviceOrientationEventAny?.requestPermission === 'function') {
        const response = await DeviceOrientationEventAny.requestPermission();
        if (response === 'granted') {
          setOrientationPermissionNeeded(false);
          setHasOrientationSupport(true);
        } else {
          alert('Izin sensor gerak kompas ditolak. Anda dapat menggunakan slider kompas manual.');
        }
      }
    } catch (err) {
      console.error('Sensor permission error:', err);
    }
  };

  // Active heading: sensor or manual
  const effectiveHeading = isManualMode || !hasOrientationSupport ? manualHeading : deviceHeading;

  // Calculate angular delta to Qibla: -180° to +180°
  // Negative = turn left, Positive = turn right
  const angleDiff = ((targetAzimuth - effectiveHeading + 540) % 360) - 180;
  const absDiff = Math.abs(angleDiff);

  // Field of View (FOV) of smartphone camera is roughly 60°
  const FOV = 60;
  const inView = absDiff <= FOV / 2;

  // Target aligned condition (within 2.5 degrees)
  const currentlyAligned = absDiff <= 2.5;

  useEffect(() => {
    if (currentlyAligned && !isAligned) {
      setIsAligned(true);
      if (navigator.vibrate) {
        try {
          navigator.vibrate([100, 50, 150]);
        } catch {}
      }
      playLockChime();
    } else if (!currentlyAligned && isAligned) {
      setIsAligned(false);
    }
  }, [currentlyAligned, isAligned]);

  // Horizontal screen projection percentage: 50% is center of camera
  // angleDiff = 0 -> 50%
  // angleDiff = -FOV/2 (-30°) -> 10%
  // angleDiff = +FOV/2 (+30°) -> 90%
  const screenXPercent = 50 + (angleDiff / (FOV / 2)) * 40;

  // Vertical position based on device pitch (standing phone is pitch ~ 90°)
  // pitch 90° -> 50%
  const pitchOffset = Math.max(-30, Math.min(30, (devicePitch - 80) * 0.8));
  const screenYPercent = 50 - pitchOffset;

  return (
    <div className="relative w-full h-[88vh] min-h-[550px] max-h-[900px] rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-2xl flex flex-col select-none">
      {/* 1. Camera Video Feed / Fallback Simulated Canvas */}
      <div className="absolute inset-0 overflow-hidden bg-neutral-900">
        {cameraStatus === 'active' ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          /* Simulated AR Environment Background when camera is unavailable */
          <div className="relative w-full h-full bg-radial from-neutral-800 via-neutral-900 to-black flex items-center justify-center">
            {/* Grid Horizon in VR */}
            <div className="absolute inset-0 opacity-25 [background:radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="absolute w-full h-0.5 bg-emerald-500/40 top-1/2" />
            <div className="text-center px-4 max-w-sm z-10">
              <Camera className="h-10 w-10 text-emerald-400 mx-auto mb-2 opacity-80" />
              <h4 className="text-white font-bold text-sm">Mode AR Simulasi Visual</h4>
              <p className="text-xs text-neutral-400 mt-1">
                {errorMessage || 'Arahkan perangkat atau gunakan slider manual di bawah untuk mencari arah Ka\'bah.'}
              </p>
              {cameraStatus === 'denied' && (
                <button
                  onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/80 text-white text-xs font-medium hover:bg-emerald-600 transition"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Coba Deteksi Ulang Kamera</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Ambient Darkening Gradient Top & Bottom for legible HUD */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />
      </div>

      {/* 2. Top HUD: Controls, Navigation, and Compass Ribbon Tape */}
      <div className="relative z-20 px-4 pt-4 pb-2 flex flex-col gap-2">
        <div className="flex items-center justify-between text-white">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-xs font-semibold hover:bg-black/80 transition"
          >
            <Compass className="h-4 w-4 text-emerald-400" />
            <span>Kembali ke Kompas 2D</span>
          </button>

          <div className="flex items-center gap-2">
            {orientationPermissionNeeded && (
              <button
                onClick={requestSensorPermission}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold shadow-lg animate-pulse"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Aktifkan Sensor iOS</span>
              </button>
            )}

            <button
              onClick={() => setHapticSoundEnabled((v) => !v)}
              className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 transition"
              title="Suara Kunci Arah"
            >
              {hapticSoundEnabled ? (
                <Volume2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-neutral-400" />
              )}
            </button>

            <button
              onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
              className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 transition"
              title="Ganti Kamera Depan/Belakang"
            >
              <RefreshCw className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Panoramic Compass Tape Ribbon (HUD top banner) */}
        <div className="relative w-full h-9 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 overflow-hidden flex items-center justify-center">
          {/* Center alignment line */}
          <div className="absolute top-0 bottom-0 left-1/2 -ml-0.5 w-1 bg-emerald-400 z-30 shadow-[0_0_8px_#10b981]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-x-4 border-x-transparent border-t-6 border-t-emerald-400 z-30" />

          {/* Scrolling degree markings */}
          <div
            className="absolute h-full flex items-center transition-transform duration-100 ease-out"
            style={{
              transform: `translateX(${-effectiveHeading * 4}px)`,
              left: '50%'
            }}
          >
            {/* Generate ticks for 3 full cycles (-360 to +720) so tape never truncates */}
            {[-1, 0, 1].map((cycle) => (
              <React.Fragment key={cycle}>
                {Array.from({ length: 72 }).map((_, i) => {
                  const deg = i * 5;
                  const absDeg = deg;
                  const totalOffsetPx = (cycle * 360 + deg) * 4;
                  const isMajor = deg % 45 === 0;
                  const isQiblaPoint = Math.abs(deg - Math.round(targetAzimuth / 5) * 5) <= 2.5;

                  let cardinal = '';
                  if (absDeg === 0) cardinal = 'U';
                  else if (absDeg === 90) cardinal = 'T';
                  else if (absDeg === 180) cardinal = 'S';
                  else if (absDeg === 270) cardinal = 'B';

                  return (
                    <div
                      key={`${cycle}-${deg}`}
                      className="absolute flex flex-col items-center select-none pointer-events-none"
                      style={{ left: `${totalOffsetPx}px` }}
                    >
                      <div
                        className={`w-0.5 ${
                          cardinal === 'U'
                            ? 'h-4 bg-rose-500 font-bold'
                            : isMajor
                            ? 'h-3 bg-white'
                            : 'h-1.5 bg-neutral-400'
                        }`}
                      />
                      {cardinal ? (
                        <span
                          className={`text-[10px] font-black leading-none mt-0.5 ${
                            cardinal === 'U' ? 'text-rose-400' : 'text-white'
                          }`}
                        >
                          {cardinal}
                        </span>
                      ) : isMajor ? (
                        <span className="text-[9px] text-neutral-400 leading-none mt-0.5 font-mono">
                          {absDeg}°
                        </span>
                      ) : null}

                      {/* Qibla Marker Pin on the tape */}
                      {cycle === 0 && Math.abs(deg - targetAzimuth) < 2.5 && (
                        <div className="absolute -top-1 flex flex-col items-center">
                          <span className="text-[10px]">🕋</span>
                          <span className="text-[8px] font-bold text-amber-300 font-mono">
                            {targetAzimuth.toFixed(0)}°
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* 3. AR 3D Spatial Canvas (Middle Plane) */}
      <div className="relative flex-1 w-full overflow-hidden pointer-events-none">
        {/* Virtual Horizon Line & Artificial Level */}
        <div
          className="absolute inset-x-0 h-0.5 border-t border-dashed border-white/25 transition-transform duration-100 ease-out"
          style={{
            top: `${screenYPercent}%`,
            transform: `rotate(${deviceRoll}deg)`
          }}
        >
          <div className="absolute left-6 text-[10px] text-white/50 tracking-wider font-mono">
            UFUK {devicePitch.toFixed(0)}°
          </div>
        </div>

        {/* Center Target Crosshairs of the Phone Camera */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`relative flex items-center justify-center transition-all duration-300 ${
              currentlyAligned
                ? 'scale-125 ring-4 ring-emerald-400/80 rounded-full shadow-[0_0_35px_#10b981]'
                : 'opacity-70'
            }`}
          >
            <div className="w-16 h-16 rounded-full border border-white/40 flex items-center justify-center">
              <div
                className={`w-2 h-2 rounded-full ${
                  currentlyAligned ? 'bg-emerald-400 animate-ping' : 'bg-white/60'
                }`}
              />
            </div>
            {/* Crosshair ticks */}
            <div className="absolute -top-3 w-0.5 h-2.5 bg-white/60" />
            <div className="absolute -bottom-3 w-0.5 h-2.5 bg-white/60" />
            <div className="absolute -left-3 w-2.5 h-0.5 bg-white/60" />
            <div className="absolute -right-3 w-2.5 h-0.5 bg-white/60" />
          </div>
        </div>

        {/* 3D AR Ka'bah Beacon Marker in World Space */}
        {inView && (
          <div
            className="absolute flex flex-col items-center justify-center transition-all duration-100 ease-out pointer-events-auto"
            style={{
              left: `${screenXPercent}%`,
              top: `${screenYPercent}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Ka'bah Beacon Box with 3D Aura */}
            <div
              className={`relative flex flex-col items-center transition-all duration-300 ${
                currentlyAligned ? 'scale-115' : 'scale-100'
              }`}
            >
              {/* Pulsing Target Rings when aligned */}
              {currentlyAligned && (
                <div className="absolute -inset-4 rounded-full border-2 border-emerald-400 animate-ping opacity-75 pointer-events-none" />
              )}

              {/* Ka'bah Icon Card */}
              <div
                className={`relative px-4 py-3 rounded-2xl flex flex-col items-center gap-1 border shadow-2xl backdrop-blur-md transition ${
                  currentlyAligned
                    ? 'bg-emerald-950/85 border-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.7)]'
                    : 'bg-black/75 border-amber-400/70 text-amber-300'
                }`}
              >
                <div className="text-3xl drop-shadow">🕋</div>
                <div className="text-center font-bold text-xs tracking-wide">
                  KA'BAH AL-MUKARRAMAH
                </div>
                <div className="font-mono text-[11px] text-amber-200">
                  {targetAzimuth.toFixed(2)}° UTSB
                </div>
                <div className="text-[10px] text-emerald-300 font-medium">
                  {qibla.distanceKm.toLocaleString('id-ID')} km dari Anda
                </div>
              </div>

              {/* Laser Line anchoring down to horizon */}
              <div
                className={`w-0.5 h-16 ${
                  currentlyAligned
                    ? 'bg-gradient-to-b from-emerald-400 to-transparent shadow-[0_0_10px_#10b981]'
                    : 'bg-gradient-to-b from-amber-400 to-transparent'
                }`}
              />
            </div>
          </div>
        )}

        {/* Dynamic Navigation Guidance Arrow Overlay */}
        <div className="absolute inset-x-0 bottom-6 flex flex-col items-center justify-center px-4">
          {currentlyAligned ? (
            <div className="px-5 py-3 rounded-2xl bg-emerald-600/90 backdrop-blur-md border-2 border-emerald-300 text-white shadow-2xl flex items-center gap-3 animate-bounce">
              <CheckCircle2 className="h-6 w-6 text-white shrink-0" />
              <div>
                <div className="font-extrabold text-sm tracking-wide">
                  ALHAMDULILLAH! TEPAT MENGHADAP KIBLAT
                </div>
                <div className="text-[11px] text-emerald-100 font-mono">
                  Arah sejajar lurus ke Ka'bah ({targetAzimuth.toFixed(1)}°)
                </div>
              </div>
            </div>
          ) : angleDiff < 0 ? (
            <div className="px-5 py-2.5 rounded-2xl bg-black/80 backdrop-blur-md border border-amber-400/80 text-white shadow-2xl flex items-center gap-3">
              <ArrowLeft className="h-6 w-6 text-amber-400 animate-pulse shrink-0" />
              <div>
                <div className="font-bold text-xs text-amber-300">
                  PUTAR PERANGKAT KE KIRI
                </div>
                <div className="text-[11px] text-neutral-300 font-mono">
                  Kurang {absDiff.toFixed(1)}° lagi menuju Kiblat
                </div>
              </div>
            </div>
          ) : (
            <div className="px-5 py-2.5 rounded-2xl bg-black/80 backdrop-blur-md border border-amber-400/80 text-white shadow-2xl flex items-center gap-3">
              <div>
                <div className="font-bold text-xs text-amber-300 text-right">
                  PUTAR PERANGKAT KE KANAN
                </div>
                <div className="text-[11px] text-neutral-300 font-mono text-right">
                  Kurang {absDiff.toFixed(1)}° lagi menuju Kiblat
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-amber-400 animate-pulse shrink-0" />
            </div>
          )}
        </div>
      </div>

      {/* 4. Bottom HUD: Real-Time Telemetry & Manual Calibration Slider */}
      <div className="relative z-20 px-4 pb-4 pt-2 bg-gradient-to-t from-black via-black/95 to-black/70 border-t border-white/10 text-white">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-white/5 p-2 border border-white/10">
            <div className="text-[10px] text-neutral-400">Azimut Kiblat</div>
            <div className="font-mono font-bold text-amber-400 text-sm">
              {targetAzimuth.toFixed(1)}°
            </div>
            <div className="text-[9px] text-neutral-400 font-mono">
              {qibla.angleFromWestToNorth}° B-U
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-2 border border-white/10">
            <div className="text-[10px] text-neutral-400">Heading Kamera</div>
            <div className="font-mono font-bold text-white text-sm">
              {effectiveHeading.toFixed(1)}°
            </div>
            <div className="text-[9px] text-emerald-400">
              {hasOrientationSupport && !isManualMode ? '● Sensor Aktif' : 'Manual'}
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-2 border border-white/10">
            <div className="text-[10px] text-neutral-400">Lokasi / Jarak</div>
            <div className="font-bold text-white text-xs truncate">
              {selectedCity.name}
            </div>
            <div className="text-[9px] text-neutral-400 font-mono">
              {qibla.distanceKm.toLocaleString('id-ID')} km
            </div>
          </div>
        </div>

        {/* Manual Calibration Slider for PC / devices with magnet interference */}
        <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-white/10">
          <button
            onClick={() => setIsManualMode((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition shrink-0 ${
              isManualMode
                ? 'bg-amber-500 text-black'
                : 'bg-white/10 text-neutral-300 hover:bg-white/20'
            }`}
          >
            <Sliders className="h-3 w-3 inline mr-1" />
            <span>{isManualMode ? 'Mode Manual' : 'Kalibrasi Manual'}</span>
          </button>

          {isManualMode ? (
            <div className="flex-1 flex items-center gap-2">
              <span className="text-[10px] font-mono text-neutral-400">0°</span>
              <input
                id="range-ar-manual-heading"
                type="range"
                min="0"
                max="359"
                value={manualHeading}
                onChange={(e) => setManualHeading(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-700 accent-emerald-500 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] font-mono text-neutral-400">360°</span>
            </div>
          ) : (
            <div className="flex-1 text-[11px] text-neutral-400 truncate text-right">
              {hasOrientationSupport
                ? 'Pegang perangkat tegak lurus mengarah ke depan.'
                : 'Gunakan tombol kalibrasi manual jika sensor tidak tersedia.'}
            </div>
          )}

          {onOpenMap && (
            <button
              onClick={onOpenMap}
              className="px-2.5 py-1 rounded-lg bg-emerald-800/60 hover:bg-emerald-700 text-emerald-200 text-[10px] font-medium transition shrink-0"
            >
              <MapPin className="h-3 w-3 inline mr-1" />
              <span>Peta</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
