import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const MobileInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone / installed mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    // Check if user dismissed prompt recently
    const dismissed = localStorage.getItem('taqribul_install_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed, 10) < 86400000 * 7) {
      // Dismissed within 7 days
      return;
    }

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Show prompt on iOS after 3 seconds
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Android / Chromium beforeinstallprompt handler
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('taqribul_install_dismissed', Date.now().toString());
  };

  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <>
      {/* Floating Pill Prompt for Android & iOS */}
      <aside
        aria-label="Pemberitahuan Pasang Aplikasi"
        className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-40 sm:max-w-md rounded-2xl border border-emerald-600/30 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-emerald-500/30 dark:bg-neutral-900/95"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                Pasang di Android / iOS
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight">
                Gunakan aplikasi Falak secara offline & cepat di layar utama HP.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isIOS ? 'Petunjuk' : 'Pasang'}</span>
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
              title="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Modal Petunjuk Khusus iOS Safari */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-900 space-y-4 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  Cara Pasang di iPhone / iPad
                </h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Apple iOS mendukung aplikasi web progresif melalui Safari tanpa perlu unduh di App Store:
            </p>

            <ol className="space-y-3 text-xs text-neutral-700 dark:text-neutral-300">
              <li className="flex items-start gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold dark:bg-emerald-950 dark:text-emerald-300">
                  1
                </div>
                <p>
                  Buka website ini di browser <strong>Safari</strong> pada iPhone/iPad Anda.
                </p>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold dark:bg-emerald-950 dark:text-emerald-300">
                  2
                </div>
                <p className="flex items-center gap-1.5 flex-wrap">
                  Ketuk tombol <strong>Bagikan (Share)</strong>
                  <Share className="h-3.5 w-3.5 text-blue-500 inline" />
                  di bilah navigasi Safari.
                </p>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold dark:bg-emerald-950 dark:text-emerald-300">
                  3
                </div>
                <p className="flex items-center gap-1.5 flex-wrap">
                  Gulir ke bawah dan pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>
                  <PlusSquare className="h-3.5 w-3.5 text-emerald-600 inline" />.
                </p>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
            >
              Mengerti & Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};
