import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  Compass,
  Navigation,
  Sun,
  MapPin,
  ExternalLink,
  Info,
  Maximize2,
  Minimize2,
  Sparkles,
  Volume2,
  VolumeX,
  RefreshCw,
  Smartphone,
  Zap,
  ZapOff,
  Eye,
  Crosshair,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { CityLocation } from '../types';
import { calculateQibla, formatDM, formatDMS, KABAH_COORDS } from '../utils/falakMath';

interface QiblaCompassViewProps {
  selectedCity: CityLocation;
  onOpenMap: () => void;
  onOpenKalkulatorKiblat?: () => void;
}

export const QiblaCompassView: React.FC<QiblaCompassViewProps> = ({
  selectedCity,
  onOpenMap,
  onOpenKalkulatorKiblat
}) => {
  // Primary mode: 'camera' (AR Viewfinder) or 'compass' (Precision 2D/3D Dial)
  const [activeMode, setActiveMode] = useState<'camera' | 'compass'>('camera');

  // Camera states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'unsupported'>('idle');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchAvailable, setTorchAvailable] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string>('');

  // Orientation & Sensors (Android & iOS)
  const [hasCompassSupport, setHasCompassSupport] = useState<boolean>(false);
  const [orientationPermissionNeeded, setOrientationPermissionNeeded] = useState<boolean>(false);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [devicePitch, setDevicePitch] = useState<number>(90); // 90° = vertical upright
  const [deviceRoll, setDeviceRoll] = useState<number>(0);
  const [manualHeading, setManualHeading] = useState<number>(0);
  const [isManualSim, setIsManualSim] = useState<boolean>(false);

  // Audio, Haptic & Alignment
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showCalibrationGuide, setShowCalibrationGuide] = useState<boolean>(false);
  const lastAlignedRef = useRef<boolean>(false);

  const qibla = calculateQibla(selectedCity);
  const targetAzimuth = qibla.azimuth;

  // Effective Heading
  const currentHeading = hasCompassSupport && !isManualSim ? deviceHeading : manualHeading;

  // Angular difference between current heading and Qibla (-180 to +180)
  let diff = (targetAzimuth - currentHeading) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  const absDiff = Math.abs(diff);
  const isAligned = absDiff <= 2.5;

  // 2D Dial rotations
  const dialRotation = -currentHeading;
  const pointerRotation = qibla.azimuth - currentHeading;

  // Audio tone helper when lock achieved
  const playLockTone = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;
        // Two-tone harmonic chime
        [880, 1318.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.001, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.3);
        });
      }
    } catch {
      // Audio context restricted or muted
    }
  }, [soundEnabled]);

  // Haptic feedback & audio on alignment transition
  useEffect(() => {
    if (isAligned && !lastAlignedRef.current) {
      playLockTone();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 50, 40]);
      }
    }
    lastAlignedRef.current = isAligned;
  }, [isAligned, playLockTone]);

  // 1. Device Orientation Listener (Android & iOS)
  useEffect(() => {
    const DeviceOrientationEventAny = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    // Check if iOS 13+ permission is required
    if (typeof DeviceOrientationEventAny?.requestPermission === 'function') {
      setOrientationPermissionNeeded(true);
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // iOS: webkitCompassHeading is already 0-360 clockwise from magnetic/true north
      const webkitHeading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
      let calculatedHeading = 0;

      if (typeof webkitHeading === 'number' && !isNaN(webkitHeading)) {
        calculatedHeading = webkitHeading;
        setHasCompassSupport(true);
        setOrientationPermissionNeeded(false);
      } else if (e.alpha !== null && typeof e.alpha === 'number') {
        // Android Chrome: alpha is counter-clockwise (0 to 360)
        let rawHeading = 360 - e.alpha;

        // Screen orientation compensation (portrait vs landscape)
        const screenAngle =
          typeof window.screen !== 'undefined' && window.screen.orientation
            ? window.screen.orientation.angle
            : typeof window.orientation === 'number'
            ? window.orientation
            : 0;

        rawHeading = (rawHeading + screenAngle) % 360;
        if (rawHeading < 0) rawHeading += 360;

        calculatedHeading = rawHeading;
        setHasCompassSupport(true);
      }

      setDeviceHeading((prev) => {
        // Smooth interpolation for small changes, instant for large jumps
        const delta = ((calculatedHeading - prev + 540) % 360) - 180;
        return (prev + delta * 0.6 + 360) % 360;
      });

      if (e.beta !== null) setDevicePitch(e.beta);
      if (e.gamma !== null) setDeviceRoll(e.gamma);
    };

    const w = window as any;
    if (typeof window !== 'undefined' && 'ondeviceorientationabsolute' in w) {
      window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
    } else if (typeof window !== 'undefined' && w.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      if (typeof window !== 'undefined' && 'ondeviceorientationabsolute' in w) {
        window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      } else if (typeof window !== 'undefined' && w.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, []);

  // Request iOS Sensor Permission
  const requestIosSensorPermission = async () => {
    const DeviceOrientationEventAny = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof DeviceOrientationEventAny?.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEventAny.requestPermission();
        if (response === 'granted') {
          setOrientationPermissionNeeded(false);
          setHasCompassSupport(true);
        } else {
          alert('Izin sensor gerak ditolak. Buka Pengaturan Safari untuk mengizinkan sensor orientasi.');
        }
      } catch (err) {
        console.warn('Sensor permission error:', err);
      }
    }
  };

  // 2. Camera Stream Manager (Android & iOS)
  const startCameraStream = useCallback(async () => {
    if (activeMode !== 'camera') return;

    setCameraStatus('requesting');
    setCameraErrorMessage('');

    // Stop existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('unsupported');
      setCameraErrorMessage('Kamera tidak didukung oleh peramban ini.');
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
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.play().catch(() => {});
      }

      // Check torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
        const capabilities = videoTrack.getCapabilities() as { torch?: boolean };
        setTorchAvailable(Boolean(capabilities.torch));
      } else {
        setTorchAvailable(false);
      }

      setCameraStatus('active');
    } catch (err: unknown) {
      const errObj = err as Error;
      console.warn('Camera stream error:', errObj);
      setCameraStatus('denied');
      setCameraErrorMessage(
        errObj.name === 'NotAllowedError' || errObj.name === 'PermissionDeniedError'
          ? 'Izin kamera belum diberikan. Izinkan akses kamera pada peramban untuk melihat pemandangan AR Kiblat nyata.'
          : `Gagal mengakses kamera (${errObj.message || 'Perangkat sedang digunakan aplikasi lain'}). Mode simulasi aktif.`
      );
    }
  }, [activeMode, facingMode]);

  // Start / stop camera depending on activeMode
  useEffect(() => {
    if (activeMode === 'camera') {
      startCameraStream();
    } else {
      // Release camera when on 2D/3D compass mode to save battery
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraStatus('idle');
      setTorchOn(false);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [activeMode, startCameraStream]);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !torchOn;
      // @ts-expect-error Torch constraint typing
      await track.applyConstraints({ advanced: [{ torch: nextState }] });
      setTorchOn(nextState);
    } catch (e) {
      console.warn('Failed to toggle torch:', e);
    }
  };

  // Flip Camera Front / Back
  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Calculate Ribbon Strip Items for 360° Panorama
  const ribbonItems = [-90, -60, -45, -30, -15, 0, 15, 30, 45, 60, 90];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Bab XIII Kitab Taqribul Maqshad
            </span>
            <span className="text-xs text-neutral-400 font-serif">سمت القبلة بالكاميرا والبوصلة</span>
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Kompas & Kamera AR Arah Kiblat
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Mendukung sensor giroskop Android & iOS dengan panduan kamera langsung ke Ka'bah Baitullah di {selectedCity.name}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenKalkulatorKiblat && (
            <button
              id="btn-open-kalkulator-kiblat-102"
              onClick={onOpenKalkulatorKiblat}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-3.5 py-2 text-xs font-bold text-neutral-950 shadow-sm transition active:scale-95"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Kalkulator Kiblat 1.02</span>
            </button>
          )}

          <button
            id="btn-open-map-picker"
            onClick={onOpenMap}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
          >
            <MapPin className="h-4 w-4" />
            <span>Peta & GPS</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs: Camera AR vs 2D/3D Precision Dial */}
      <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700">
        <div className="grid grid-cols-2 gap-1.5 w-full sm:w-auto">
          <button
            id="btn-switch-mode-camera"
            onClick={() => setActiveMode('camera')}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'camera'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Mode Kamera AR (Android / iOS)</span>
            <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[9px] font-black text-black">
              LIVE
            </span>
          </button>

          <button
            id="btn-switch-mode-compass"
            onClick={() => setActiveMode('compass')}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'compass'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Mode Kompas Presisi 2D / 3D</span>
          </button>
        </div>

        {/* Action icons (Sound, Calibration Guide) */}
        <div className="hidden sm:flex items-center gap-2 pr-2">
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            className={`p-2 rounded-xl border text-xs font-medium transition ${
              soundEnabled
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400'
            }`}
            title={soundEnabled ? 'Suara Kunci Kiblat Aktif' : 'Suara Dimatikan'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setShowCalibrationGuide((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 transition"
            title="Panduan Kalibrasi Sensor"
          >
            <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
            <span>Kalibrasi</span>
          </button>
        </div>
      </div>

      {/* iOS Safari Motion Sensor Permission Notice */}
      {orientationPermissionNeeded && (
        <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/40 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-emerald-900 dark:text-emerald-200 text-xs">
            <Smartphone className="h-6 w-6 text-emerald-600 shrink-0" />
            <div>
              <strong className="block text-sm font-bold">Perangkat iOS (iPhone / iPad) Terdeteksi</strong>
              Apple Safari memerlukan persetujuan izin sekali ketuk untuk membaca sensor kompas giroskop.
            </div>
          </div>
          <button
            id="btn-grant-ios-sensor"
            onClick={requestIosSensorPermission}
            className="shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition active:scale-95"
          >
            Aktifkan Sensor Kompas iOS
          </button>
        </div>
      )}

      {/* Sensor Calibration Guide Modal / Collapsible */}
      {showCalibrationGuide && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 dark:border-amber-900/50 dark:bg-amber-950/30 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
              <RefreshCw className="h-4 w-4 text-amber-600 animate-spin" />
              <span>Panduan Kalibrasi Kompas (Gerakan Angka 8)</span>
            </div>
            <button
              onClick={() => setShowCalibrationGuide(false)}
              className="text-xs text-amber-800 dark:text-amber-300 hover:underline font-medium"
            >
              Tutup
            </button>
          </div>
          <div className="mt-2 text-xs text-amber-900/80 dark:text-amber-300/90 space-y-1">
            <p>
              Jika arah kompas tampak goyah atau tidak akurat, pegang ponsel Anda dan ayunkan membentuk gerakan angka delapan (∞) di udara sebanyak 3-5 kali.
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              Jauhkan perangkat dari benda logam tebal, speaker magnetik, atau kabel bertegangan tinggi untuk mencegah gangguan medan magnet lokal (*interferensi*).
            </p>
          </div>
        </div>
      )}

      {/* MAIN VIEW AREA: CAMERA AR MODE OR 2D/3D COMPASS DIAL */}
      {activeMode === 'camera' ? (
        /* CAMERA AR VIEW */
        <div className="space-y-4">
          <div
            className={`relative overflow-hidden rounded-3xl border-2 transition-all ${
              isAligned
                ? 'border-emerald-400 shadow-xl shadow-emerald-500/20'
                : 'border-neutral-200 dark:border-neutral-800'
            } bg-black text-white ${
              isFullScreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'h-[520px] sm:h-[580px] w-full'
            }`}
          >
            {/* Live Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Fallback Simulation Background if Camera is Denied or Desktop */}
            {cameraStatus !== 'active' && (
              <div className="absolute inset-0 bg-radial from-neutral-900 via-neutral-950 to-black flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 border-2 border-emerald-500/30">
                  <Camera className="h-10 w-10 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white">Mode Kamera AR</h3>
                <p className="mt-1 max-w-sm text-xs text-neutral-400">
                  {cameraErrorMessage ||
                    'Mengaktifkan kamera untuk menampilkan Ka\'bah Baitullah di ruang dunia nyata...'}
                </p>

                {cameraStatus === 'denied' && (
                  <button
                    onClick={startCameraStream}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Coba Akses Kamera Lagi</span>
                  </button>
                )}

                <p className="mt-4 text-[11px] text-amber-300">
                  💡 Tips: Di ponsel Android / iPhone, Anda dapat melihat Ka'bah langsung di kamera melalui browser Chrome atau Safari.
                </p>
              </div>
            )}

            {/* Dark Vignette Gradient Overlays */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80" />

            {/* TOP BAR OVERLAY: Panoramic Compass Ribbon & Quick Controls */}
            <div className="absolute top-0 inset-x-0 p-4 space-y-3 pointer-events-auto">
              <div className="flex items-center justify-between">
                {/* Status Badges */}
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-bold border border-white/10 text-white">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    AR KAMERA
                  </span>
                  <span className="rounded-full bg-emerald-500/20 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-300 border border-emerald-500/30">
                    Kiblat: {qibla.azimuth}° ({qibla.angleFromWestToNorth}° B-U)
                  </span>
                </div>

                {/* Camera Action Buttons */}
                <div className="flex items-center gap-1.5">
                  {torchAvailable && (
                    <button
                      onClick={toggleTorch}
                      className={`p-2 rounded-full backdrop-blur-md border transition ${
                        torchOn
                          ? 'bg-amber-400 text-black border-amber-300'
                          : 'bg-black/60 text-white border-white/20 hover:bg-white/20'
                      }`}
                      title="Nyalakan Lampu Kilat / Senter"
                    >
                      {torchOn ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
                    </button>
                  )}

                  <button
                    onClick={switchCamera}
                    className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition"
                    title="Ganti Kamera Belakang / Depan"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setIsFullScreen((v) => !v)}
                    className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition"
                    title={isFullScreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                  >
                    {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Panoramic Ribbon Compass Strip */}
              <div className="relative mx-auto max-w-md h-11 rounded-2xl bg-black/65 backdrop-blur-md border border-white/15 overflow-hidden flex items-center justify-center shadow-lg">
                {/* Center marker hairline */}
                <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-rose-500 -translate-x-1/2 z-20" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-0 w-0 border-x-4 border-x-transparent border-t-6 border-t-rose-500 z-20" />

                {/* Moving ribbon */}
                <div
                  className="flex items-center justify-center gap-7 transition-transform duration-100 ease-out"
                  style={{ transform: `translateX(${-diff * 3.6}px)` }}
                >
                  {ribbonItems.map((offset) => {
                    const angle = (Math.round(targetAzimuth + offset) + 360) % 360;
                    const isKaabah = offset === 0;
                    let label = `${angle}°`;
                    if (angle === 0) label = 'U';
                    if (angle === 90) label = 'T';
                    if (angle === 180) label = 'S';
                    if (angle === 270) label = 'B';

                    return (
                      <div
                        key={offset}
                        className={`flex flex-col items-center justify-center shrink-0 ${
                          isKaabah ? 'text-amber-300 font-extrabold scale-110' : 'text-neutral-400 font-mono text-[10px]'
                        }`}
                      >
                        {isKaabah ? (
                          <div className="flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 border border-amber-400 text-[10px] font-black text-amber-300">
                            <span>🕋 KIBLAT</span>
                          </div>
                        ) : (
                          <>
                            <span>{label}</span>
                            <div className="h-2 w-[1px] bg-white/30 mt-0.5" />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CENTER AR VIEWPORT: 3D KA'BAH BEACON & RETICLE */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Pitch Leveler / Artificial Horizon Lines */}
              <div
                className="absolute w-72 h-[1px] bg-white/25 flex items-center justify-between px-2"
                style={{
                  transform: `rotate(${-deviceRoll}deg) translateY(${(devicePitch - 90) * 2}px)`
                }}
              >
                <span className="text-[9px] text-white/50 font-mono">-10°</span>
                <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                </div>
                <span className="text-[9px] text-white/50 font-mono">+10°</span>
              </div>

              {/* Dynamic 3D Ka'bah Beacon anchored in AR space */}
              {/* Visible within -70° to +70° camera field-of-view */}
              {Math.abs(diff) < 70 ? (
                <div
                  className="absolute flex flex-col items-center transition-transform duration-100 ease-out"
                  style={{
                    transform: `translateX(${diff * 8}px) translateY(${(devicePitch - 85) * 3}px)`
                  }}
                >
                  {/* Laser Guideline to Horizon */}
                  <div className="h-28 w-[1.5px] bg-gradient-to-b from-transparent via-amber-400 to-emerald-400 animate-pulse" />

                  {/* 3D Ka'bah Pin Hologram */}
                  <div className="relative group flex flex-col items-center">
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 transition-all ${
                        isAligned
                          ? 'border-amber-300 bg-amber-400/30 shadow-2xl shadow-amber-400/60 scale-110'
                          : 'border-emerald-400 bg-black/70 backdrop-blur-md shadow-lg shadow-emerald-500/30'
                      }`}
                    >
                      <span className="text-2xl drop-shadow-md">🕋</span>
                    </div>

                    {/* Ka'bah Name Tag */}
                    <div className="mt-1.5 rounded-lg bg-black/80 backdrop-blur-md px-2.5 py-1 text-center border border-white/20 shadow-md">
                      <div className="text-[11px] font-black text-amber-300">
                        KA'BAH AL-MUKARRAMAH
                      </div>
                      <div className="text-[9px] text-neutral-300 font-mono">
                        {qibla.distanceKm.toLocaleString('id-ID')} km dari Anda
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Center Crosshair Target Ring */}
              <div
                className={`relative flex h-24 w-24 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isAligned
                    ? 'border-amber-400 bg-amber-400/20 scale-125 shadow-2xl shadow-amber-400/80 animate-pulse'
                    : 'border-white/35 bg-black/20'
                }`}
              >
                <Crosshair
                  className={`h-8 w-8 transition-colors ${
                    isAligned ? 'text-amber-300 stroke-[2.5]' : 'text-white/60 stroke-[1.5]'
                  }`}
                />

                {/* Target Locked Rings */}
                {isAligned && (
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-60" />
                )}
              </div>
            </div>

            {/* BOTTOM HUD CONTROLS: Alignment Instruction & Precision Guidance */}
            <div className="absolute bottom-0 inset-x-0 p-4 space-y-3 pointer-events-auto">
              {/* Dynamic Guidance Banner */}
              <div className="flex justify-center">
                {isAligned ? (
                  <div className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 px-6 py-3 text-white shadow-2xl shadow-emerald-500/50 border border-amber-300 animate-bounce">
                    <CheckCircle2 className="h-5 w-5 text-amber-300" />
                    <div>
                      <div className="text-xs font-black tracking-wider uppercase text-amber-200">
                        Arah Kiblat Tepat! 🕋
                      </div>
                      <div className="text-[11px] text-white/90">
                        Anda telah menghadap lurus ke Ka'bah Baitullah
                      </div>
                    </div>
                  </div>
                ) : diff < 0 ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-black/80 backdrop-blur-md px-5 py-2.5 text-white border border-white/20 shadow-lg">
                    <ArrowLeft className="h-5 w-5 text-amber-400 animate-pulse" />
                    <div>
                      <div className="text-xs font-bold text-amber-300">
                        Putar Perangkat ke Kiri {Math.round(absDiff)}°
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        Arahkan kamera ke kiri hingga tanda Ka'bah berada di tengah
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-2xl bg-black/80 backdrop-blur-md px-5 py-2.5 text-white border border-white/20 shadow-lg">
                    <div>
                      <div className="text-xs font-bold text-amber-300 text-right">
                        Putar Perangkat ke Kanan {Math.round(absDiff)}°
                      </div>
                      <div className="text-[10px] text-neutral-400 text-right">
                        Arahkan kamera ke kanan hingga tanda Ka'bah berada di tengah
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-amber-400 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Bottom Quick Bar: Sensor Angle Readout & Manual Slider */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 rounded-2xl bg-black/75 backdrop-blur-md p-3 border border-white/10 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Kompas Ponsel</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {Math.round(currentHeading)}°
                    </span>
                  </div>
                  <div className="h-6 w-[1px] bg-white/20" />
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Azimut Ka'bah</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {qibla.azimuth}°
                    </span>
                  </div>
                  <div className="h-6 w-[1px] bg-white/20" />
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Selisih Sudut</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        isAligned ? 'text-amber-300' : 'text-white'
                      }`}
                    >
                      {Math.abs(Math.round(diff))}°
                    </span>
                  </div>
                </div>

                {/* Manual Simulation for Laptop/Desktop without Magnetometer */}
                {!hasCompassSupport && (
                  <div className="flex items-center gap-2 w-full sm:w-60">
                    <span className="text-[10px] text-neutral-400 shrink-0">Simulasi:</span>
                    <input
                      type="range"
                      min="0"
                      max="359"
                      value={manualHeading}
                      onChange={(e) => {
                        setManualHeading(Number(e.target.value));
                        setIsManualSim(true);
                      }}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-neutral-700 accent-emerald-500"
                    />
                    <span className="font-mono text-[10px] text-emerald-300 shrink-0">
                      {manualHeading}°
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 2D / 3D PRECISION COMPASS DIAL MODE */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Digital Dial Visualizer */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm lg:col-span-6 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="relative flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80 select-none">
              {/* Outer Decorative Compass Bezel */}
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 bg-gradient-to-b from-neutral-50 to-neutral-100 shadow-inner dark:from-neutral-900 dark:to-neutral-950 dark:border-emerald-500/30" />

              {/* Rotating Compass Dial */}
              <div
                className="absolute inset-2 rounded-full border border-neutral-200 bg-white shadow-md transition-transform duration-150 dark:border-neutral-800 dark:bg-neutral-900"
                style={{ transform: `rotate(${dialRotation}deg)` }}
              >
                {/* Cardinal Points */}
                <span className="absolute top-3 left-1/2 -translate-x-1/2 font-black text-rose-600 text-sm">
                  U (Utara)
                </span>
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 font-bold text-neutral-500 text-sm">
                  S (Selatan)
                </span>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-neutral-500 text-sm">
                  T (Timur)
                </span>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-emerald-600 text-sm">
                  B (Barat)
                </span>

                {/* 360° Degree Tick Marks */}
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={`absolute left-1/2 top-0 -ml-[0.5px] origin-bottom ${
                      i % 3 === 0 ? 'h-3 w-[1.5px] bg-neutral-400' : 'h-1.5 w-[1px] bg-neutral-300'
                    }`}
                    style={{
                      height: i % 9 === 0 ? '14px' : i % 3 === 0 ? '8px' : '4px',
                      transform: `rotate(${i * 10}deg)`,
                      transformOrigin: '50% 148px'
                    }}
                  />
                ))}

                {/* Sun Position marker on dial */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ transform: `rotate(${todaySunPosition(selectedCity)}deg)` }}
                >
                  <div className="absolute top-9 flex flex-col items-center">
                    <Sun className="h-4 w-4 text-amber-500 animate-spin" style={{ animationDuration: '10s' }} />
                  </div>
                </div>
              </div>

              {/* Qibla Direction Needle pointing to Ka'bah */}
              <div
                className="absolute inset-0 flex items-center justify-center transition-transform duration-200 pointer-events-none z-10"
                style={{ transform: `rotate(${pointerRotation}deg)` }}
              >
                {/* Ka'bah Icon Badge at Needle Tip */}
                <div className="absolute top-5 flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-950 text-amber-300 shadow-lg ring-2 transition-transform ${
                      isAligned ? 'ring-amber-400 scale-110' : 'ring-emerald-500'
                    }`}
                  >
                    <span className="text-sm font-black">🕋</span>
                  </div>
                  <div className="h-0 w-0 border-x-6 border-x-transparent border-t-8 border-t-emerald-600" />
                </div>

                {/* Needle Ray */}
                <div className="h-52 w-1.5 bg-gradient-to-t from-transparent via-emerald-500 to-emerald-600 rounded-full shadow-sm" />
              </div>

              {/* True North Indicator (Red needle) */}
              <div
                className="absolute inset-0 flex items-center justify-center transition-transform duration-150 pointer-events-none"
                style={{ transform: `rotate(${dialRotation}deg)` }}
              >
                <div className="absolute top-12 h-6 w-1 bg-rose-600 rounded-full" />
              </div>

              {/* Center Waterpass Spirit Level Bubble */}
              <div className="relative z-20 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 border-2 border-white/40 shadow-inner">
                {/* Crosshairs */}
                <div className="absolute h-full w-[1px] bg-white/20" />
                <div className="absolute w-full h-[1px] bg-white/20" />
                {/* Moving Bubble */}
                <div
                  className={`h-4 w-4 rounded-full transition-all duration-100 ${
                    Math.hypot(deviceRoll, devicePitch - 90) < 15
                      ? 'bg-emerald-400 shadow-md shadow-emerald-400/50'
                      : 'bg-amber-400'
                  }`}
                  style={{
                    transform: `translate(${Math.max(-16, Math.min(16, deviceRoll * 0.8))}px, ${Math.max(
                      -16,
                      Math.min(16, (devicePitch - 90) * 0.8)
                    )}px)`
                  }}
                />
              </div>
            </div>

            {/* Compass Heading & Alignment Status */}
            <div className="mt-4 w-full space-y-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  Arah Kompas Perangkat:
                </span>
                <span className="font-mono text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  {Math.round(currentHeading)}°
                </span>
                {hasCompassSupport ? (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Sensor Giroskop Aktif
                  </span>
                ) : (
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    Mode Manual
                  </span>
                )}
              </div>

              {/* Dynamic Status message */}
              <div className="text-xs">
                {isAligned ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
                    ✓ Tepat Menghadap Ka'bah (Kiblat)!
                  </span>
                ) : (
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Putar ponsel {Math.abs(Math.round(diff))}° ke {diff < 0 ? 'kiri' : 'kanan'}
                  </span>
                )}
              </div>

              {/* Slider for Desktop or Manual Calibration */}
              {!hasCompassSupport && (
                <div className="flex items-center gap-3 px-6 pt-2">
                  <span className="text-[11px] text-neutral-400">0°</span>
                  <input
                    id="range-compass-heading-2"
                    type="range"
                    min="0"
                    max="359"
                    value={manualHeading}
                    onChange={(e) => {
                      setManualHeading(Number(e.target.value));
                      setIsManualSim(true);
                    }}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-emerald-600 dark:bg-neutral-700"
                  />
                  <span className="text-[11px] text-neutral-400">360°</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Hisab Summary side-cards */}
          <div className="space-y-4 lg:col-span-6">
            {/* Azimuth Card */}
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Hasil Arah Kiblat Presisi
                </span>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Hisab Taqribul Maqshad
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-neutral-50 p-3.5 dark:bg-neutral-800/60">
                  <span className="text-xs text-neutral-400">Azimut dari Utara (UTSB)</span>
                  <div className="mt-1 text-2xl font-black text-neutral-900 font-mono dark:text-white">
                    {qibla.azimuth}°
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                    {formatDMS(qibla.azimuth)}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50/60 p-3.5 ring-1 ring-emerald-500/20 dark:bg-emerald-950/20">
                  <span className="text-xs text-emerald-700 dark:text-emerald-300">
                    Sudut dari Barat ke Utara (B-U)
                  </span>
                  <div className="mt-1 text-2xl font-black text-emerald-800 font-mono dark:text-emerald-200">
                    {qibla.angleFromWestToNorth}°
                  </div>
                  <p className="mt-0.5 text-xs text-emerald-600/80 dark:text-emerald-400 font-mono">
                    {formatDMS(qibla.angleFromWestToNorth)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-2.5 text-xs dark:bg-neutral-800/60">
                <span className="text-neutral-500 dark:text-neutral-400">Jarak ke Ka'bah (Makkah):</span>
                <span className="font-mono font-bold text-neutral-800 dark:text-neutral-100">
                  {qibla.distanceKm.toLocaleString('id-ID')} km
                </span>
              </div>
            </div>

            {/* Rashdul Qiblah Card */}
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 shadow-sm dark:border-amber-900/30 dark:bg-amber-950/10">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <Sun className="h-4 w-4" />
                <h3 className="text-sm font-semibold">Bayang-Bayang Kiblat (Rashdul Qiblah)</h3>
              </div>
              <div className="mt-3 space-y-2 text-xs text-amber-900/90 dark:text-amber-200/80">
                <p>
                  <strong>Rashdul Qiblah Harian:</strong> Pada jam berikut, bayangan setiap benda tegak lurus mengarah tepat ke arah kiblat:
                </p>
                <div className="rounded-lg bg-white/80 p-2.5 text-center font-mono text-base font-bold text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-white">
                  {qibla.rashdulQiblahToday
                    ? `${qibla.rashdulQiblahToday} ${selectedCity.timezoneName}`
                    : 'Tidak terjadi perlintasan bayangan hari ini'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Classical Derivation Breakdown from Bab XIII Kitab */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">
              Rincian Rumus Hisab Falak Bab XIII Kitab Taqribul Maqshad
            </h4>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">
            Lintang: {selectedCity.latitude}° | Bujur: {selectedCity.longitude}°
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px] text-neutral-600 dark:text-neutral-400 font-mono">
          <div className="rounded-md bg-neutral-50 p-2 dark:bg-neutral-800/50">
            <span>Fadlut Tulain (f):</span>
            <div className="font-bold text-neutral-800 dark:text-neutral-200">{qibla.steps.fadlutTulain}°</div>
          </div>
          <div className="rounded-md bg-neutral-50 p-2 dark:bg-neutral-800/50">
            <span>Fadl Ardaen:</span>
            <div className="font-bold text-neutral-800 dark:text-neutral-200">{qibla.steps.fadhluArdaen}°</div>
          </div>
          <div className="rounded-md bg-neutral-50 p-2 dark:bg-neutral-800/50">
            <span>A. Mutlaq:</span>
            <div className="font-bold text-neutral-800 dark:text-neutral-200">{qibla.steps.aMutlaq}</div>
          </div>
          <div className="rounded-md bg-neutral-50 p-2 dark:bg-neutral-800/50">
            <span>B. Qutur:</span>
            <div className="font-bold text-neutral-800 dark:text-neutral-200">{qibla.steps.bQutur}</div>
          </div>
          <div className="rounded-md bg-neutral-50 p-2 dark:bg-neutral-800/50">
            <span>A. Muaddal:</span>
            <div className="font-bold text-neutral-800 dark:text-neutral-200">{qibla.steps.aMuadal}</div>
          </div>
          <div className="rounded-md bg-neutral-50 p-2 dark:bg-neutral-800/50">
            <span>Jaib Sa'ah (Jt):</span>
            <div className="font-bold text-neutral-800 dark:text-neutral-200">{qibla.steps.jt}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper for approximate sun azimuth on dial
function todaySunPosition(city: CityLocation): number {
  const now = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;
  // approximate: 6:00 is East (90°), 12:00 is North/South (0/180°), 18:00 is West (270°)
  const sunAzimuth = (hours - 6) * 15;
  return (sunAzimuth + 360) % 360;
}
