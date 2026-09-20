import React, { useState, useRef } from 'react';
import {
  Award,
  Download,
  Printer,
  Share2,
  Copy,
  Check,
  Building,
  MapPin,
  Calendar,
  Compass,
  UserCheck,
  FileText,
  Sparkles,
  RefreshCw,
  QrCode,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { CityLocation, QiblaCertificateData } from '../types';
import { calculateQibla, formatDMS } from '../utils/falakMath';
import { gregorianToHijri } from '../utils/hijriCalendar';
import { generateCertificatePDF } from '../utils/certificatePdf';
import { KemenagLogo } from './KemenagLogo';

interface SertifikatKalibrasiViewProps {
  initialCity: CityLocation;
  onOpenKalkulator?: () => void;
}

export const SertifikatKalibrasiView: React.FC<SertifikatKalibrasiViewProps> = ({
  initialCity,
  onOpenKalkulator
}) => {
  const qibla = calculateQibla(initialCity);
  const now = new Date();
  const hijri = gregorianToHijri(now);

  // Calculate angles
  const trueAzimuth = qibla.azimuth; // UTSB
  const angleFromWest = (360 - trueAzimuth + 270) % 360; // B-U
  const angleNorthToWest = 360 - trueAzimuth; // U-B

  // Rashdul qiblah calculation
  const rashdulQiblahTime = qibla.rashdulQiblahToday || '16:15:49'; // Standar harian (Istiwa A'zam)

  // Format DMS
  const latDirStr = initialCity.latitude < 0 ? 'LS' : 'LU';
  const lonDirStr = initialCity.longitude >= 0 ? 'BT' : 'BB';
  const latDMSStr = `${formatDMS(Math.abs(initialCity.latitude))} ${latDirStr}`;
  const lonDMSStr = `${formatDMS(Math.abs(initialCity.longitude))} ${lonDirStr}`;

  // State for form
  const [formData, setFormData] = useState<QiblaCertificateData>({
    nomorSurat: `B-${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}/Kua.19.01/BA.01.1/${now.getFullYear()}`,
    namaTempatIbadah: `Masjid Jami' Baiturrahman`,
    jenisTempatIbadah: 'Masjid',
    alamatLengkap: 'Jl. Gatot Subroto No. 12, Lingkungan Karang Anyar',
    kelurahanDesa: 'Gerung Utara',
    kecamatan: 'Gerung',
    kabupaten: 'Kabupaten Lombok Barat',
    provinsi: 'Nusa Tenggara Barat',
    namaTakmir: 'H. Ahmad Fauzi, S. Pd. I',
    jabatanTakmir: 'Ketua Pengurus Takmir',
    teleponTakmir: '081915949627',
    tanggalMasehi: `${now.getDate()} ${getMonthNameId(now.getMonth())} ${now.getFullYear()}`,
    tanggalHijriah: `${hijri.day} ${hijri.monthNameId} ${hijri.year} H`,
    latitude: initialCity.latitude,
    longitude: initialCity.longitude,
    latDMS: latDMSStr,
    lonDMS: lonDMSStr,
    angleFromWest: angleFromWest,
    angleNorthToWest: angleNorthToWest,
    trueAzimuth: trueAzimuth,
    jarakKm: qibla.distanceKm,
    rashdulQiblah: rashdulQiblahTime,
    metodePengukuran: 'Hisab Segitiga Bola (Spherical Trigonometry) & Rashdul Qiblah',
    peralatan: 'Theodolite Falak Digital, Kompas Presisi & GPS Geodesi',
    namaPengukur: 'Husni, S. Kom. I',
    nipPengukur: '198204152011011008',
    jabatanPengukur: 'Penyuluh Agama Islam KUA Kec. Gerung',
    namaKepalaKUA: 'H. Ahmad Subki, S. Ag',
    nipKepalaKUA: '197405122002121003',
    jabatanKepalaKUA: 'Kepala KUA Kecamatan Gerung',
    catatan: 'Arah kiblat dan shaf salat telah diuji serta dikalibrasi presisi menghadap Ka\'bah Al-Musyarrafah.'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTabMobile, setActiveTabMobile] = useState<'form' | 'preview'>('preview');
  const printRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof QiblaCertificateData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Generate & Download PDF
  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      await generateCertificatePDF(formData, 'download');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Terjadi kendala saat menyusun PDF. Anda juga dapat menggunakan tombol Cetak / Print.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Print (AirPrint on iOS, Android Print to PDF, or Desktop Printer)
  const handlePrint = () => {
    window.print();
  };

  // Copy text summary
  const handleCopySummary = () => {
    const text = `BERITA ACARA & SERTIFIKAT KALIBRASI ARAH KIBLAT
KEMENTERIAN AGAMA REPUBLIK INDONESIA
KUA KECAMATAN GERUNG - KABUPATEN LOMBOK BARAT
Nomor: ${formData.nomorSurat}

Nama Tempat Ibadah: ${formData.namaTempatIbadah} (${formData.jenisTempatIbadah})
Lokasi: ${formData.alamatLengkap}, ${formData.kelurahanDesa}, Kec. ${formData.kecamatan}, ${formData.kabupaten}
Takmir / Pemohon: ${formData.namaTakmir}

HASIL KALIBRASI HISAB FALAK:
- Koordinat Lintang: ${formData.latDMS} (${formData.latitude.toFixed(5)}°)
- Koordinat Bujur: ${formData.lonDMS} (${formData.longitude.toFixed(5)}°)
- Arah Kiblat dari Barat (B - U): ${formatAngleDMS(formData.angleFromWest)}
- Arah Kiblat dari Utara (U - B): ${formatAngleDMS(formData.angleNorthToWest)}
- Azimut Sejati UTSB (360°): ${formatAngleDMS(formData.trueAzimuth)} (${formData.trueAzimuth.toFixed(2)}°)
- Jarak ke Ka'bah: ± ${formData.jarakKm.toFixed(2).replace('.', ',')} km
- Rashdul Qiblah Harian: Pukul ${formData.rashdulQiblah} WITA
- Metode: ${formData.metodePengukuran}
- Instrumen: ${formData.peralatan}

Petugas Pengukur:
${formData.namaPengukur} (${formData.jabatanPengukur})
Pengurus IPARI Kemenag Kabupaten Lombok Barat

Mengetahui:
${formData.namaKepalaKUA} (${formData.jabatanKepalaKUA})
KUA Kec. Gerung, Lombok Barat - Kontak: 081915949627`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Share to WhatsApp Takmir
  const handleShareWhatsApp = () => {
    const text = `Assalamu'alaikum Wr. Wb. Bapak ${formData.namaTakmir},\nBerikut kami sampaikan ringkasan Berita Acara & Sertifikat Kalibrasi Arah Kiblat untuk *${formData.namaTempatIbadah}* oleh KUA Kecamatan Gerung Lombok Barat:\n\n` +
      `📍 *Nomor Sertifikat:* ${formData.nomorSurat}\n` +
      `🧭 *Azimut Sejati Kiblat:* ${formatAngleDMS(formData.trueAzimuth)} (${formData.trueAzimuth.toFixed(2)}°)\n` +
      `📐 *Dari Titik Barat (B-U):* ${formatAngleDMS(formData.angleFromWest)}\n` +
      `🕋 *Jarak ke Ka'bah Makkah:* ${formData.jarakKm.toFixed(2).replace('.', ',')} km\n` +
      `☀️ *Jam Bayangan Kiblat:* ${formData.rashdulQiblah} WITA\n\n` +
      `Sertifikat PDF resmi diterbitkan oleh:\n*${formData.namaPengukur}*\nPenyuluh Agama Islam KUA Kec. Gerung / Pengurus IPARI Kemenag Lobar (081915949627).`;

    const encoded = encodeURIComponent(text);
    const phone = formData.teleponTakmir ? formData.teleponTakmir.replace(/[^0-9]/g, '') : '';
    const cleanPhone = phone.startsWith('0') ? '62' + phone.substring(1) : phone;
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 p-5 sm:p-7 text-white shadow-xl border border-emerald-700/50 print:hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white p-2.5 shadow-md shrink-0 border-2 border-amber-400">
              <KemenagLogo size={52} />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-0.5 text-xs font-bold text-amber-300 border border-amber-400/30">
                <Award className="h-3.5 w-3.5 text-amber-300" />
                <span>Pelayanan Resmi Kemenag RI &bull; KUA Kecamatan Gerung</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Sertifikat & Berita Acara Kalibrasi Arah Kiblat
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
                Penerbitan piagam resmi verifikasi akurasi arah kiblat untuk masjid, musholla, dan sarana ibadah di wilayah Kecamatan Gerung & sekitarnya. Responsif untuk Android, iOS, dan cetak A4.
              </p>
            </div>
          </div>

          {/* Quick Actions for Mobile / Desktop */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 px-4 py-2.5 font-bold text-xs sm:text-sm shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin text-neutral-950" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{isGenerating ? 'Menyusun PDF...' : 'Simpan PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 font-bold text-xs sm:text-sm border border-white/20 shadow-md transition active:scale-95 cursor-pointer"
            >
              <Printer className="h-4 w-4 text-emerald-300" />
              <span>Cetak / Print</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 font-bold text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Mobile Switcher Tab (Form vs Preview) */}
        <div className="mt-5 flex lg:hidden border-t border-emerald-700/60 pt-4 gap-2">
          <button
            onClick={() => setActiveTabMobile('preview')}
            className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition ${
              activeTabMobile === 'preview'
                ? 'bg-amber-400 text-neutral-950 shadow'
                : 'bg-emerald-950/60 text-emerald-200 border border-emerald-700/50'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>Pratinjau Sertifikat</span>
          </button>
          <button
            onClick={() => setActiveTabMobile('form')}
            className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition ${
              activeTabMobile === 'form'
                ? 'bg-amber-400 text-neutral-950 shadow'
                : 'bg-emerald-950/60 text-emerald-200 border border-emerald-700/50'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Edit Data Masjid</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Inputs (Left) & Live Certificate Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: FORM DATA MASJID (Hidden on mobile if user selects Preview) */}
        <div
          className={`lg:col-span-5 space-y-4 print:hidden ${
            activeTabMobile === 'preview' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="rounded-2xl bg-white dark:bg-neutral-900 p-5 shadow-sm border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                  Formulir Data Kalibrasi
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                Otomatis Terkoneksi
              </span>
            </div>

            {/* Nomor Sertifikat & Jenis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                  Nomor Sertifikat / B.A:
                </label>
                <input
                  type="text"
                  value={formData.nomorSurat}
                  onChange={(e) => handleInputChange('nomorSurat', e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1.5 text-xs font-mono font-medium text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                  Peruntukan / Jenis:
                </label>
                <select
                  value={formData.jenisTempatIbadah}
                  onChange={(e) => handleInputChange('jenisTempatIbadah', e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1.5 text-xs font-medium text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Masjid">Masjid</option>
                  <option value="Musholla">Musholla</option>
                  <option value="Langgar">Langgar</option>
                  <option value="Tanah Wakaf / Makam">Tanah Wakaf / Makam</option>
                  <option value="Gedung Pertemuan / Kantor">Gedung Pertemuan / Kantor</option>
                </select>
              </div>
            </div>

            {/* Nama Tempat Ibadah */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                Nama Tempat Ibadah:
              </label>
              <input
                type="text"
                value={formData.namaTempatIbadah}
                onChange={(e) => handleInputChange('namaTempatIbadah', e.target.value)}
                placeholder="Contoh: Masjid Jami' Baiturrahman"
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm font-bold text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Alamat Lengkap & Desa/Kelurahan */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                Alamat / Jalan / Dusun:
              </label>
              <input
                type="text"
                value={formData.alamatLengkap}
                onChange={(e) => handleInputChange('alamatLengkap', e.target.value)}
                placeholder="Jl. Gatot Subroto No. 12, Karang Anyar"
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                  Desa / Kelurahan:
                </label>
                <input
                  type="text"
                  value={formData.kelurahanDesa}
                  onChange={(e) => handleInputChange('kelurahanDesa', e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                  Kecamatan:
                </label>
                <input
                  type="text"
                  value={formData.kecamatan}
                  onChange={(e) => handleInputChange('kecamatan', e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Takmir / Pemohon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                  Nama Ketua Takmir:
                </label>
                <input
                  type="text"
                  value={formData.namaTakmir}
                  onChange={(e) => handleInputChange('namaTakmir', e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                  No. Telepon / WA:
                </label>
                <input
                  type="text"
                  value={formData.teleponTakmir}
                  onChange={(e) => handleInputChange('teleponTakmir', e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Tanggal Masehi & Hijriah */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                  Tanggal Masehi:
                </label>
                <input
                  type="text"
                  value={formData.tanggalMasehi}
                  onChange={(e) => handleInputChange('tanggalMasehi', e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                  Tanggal Hijriah:
                </label>
                <input
                  type="text"
                  value={formData.tanggalHijriah}
                  onChange={(e) => handleInputChange('tanggalHijriah', e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Data Hasil Hisab (Read-Only Quick Review) */}
            <div className="rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
              <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                <span>Data Hisab Geodesi Terpilih:</span>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  {initialCity.name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-neutral-500">Lintang:</span>{' '}
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {formData.latDMS}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Bujur:</span>{' '}
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {formData.lonDMS}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Azimut Kiblat:</span>{' '}
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                    {formatAngleDMS(formData.trueAzimuth)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Jarak Ka'bah:</span>{' '}
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {formData.jarakKm.toFixed(2)} km
                  </span>
                </div>
              </div>
            </div>

            {/* Petugas Pengukur & Kepala KUA */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                  Petugas Pengukur (Falak):
                </label>
                <input
                  type="text"
                  value={formData.namaPengukur}
                  onChange={(e) => handleInputChange('namaPengukur', e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-neutral-400">
                  Penyuluh Agama Islam KUA Kec. Gerung &bull; Pengurus IPARI Kemenag Lobar
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                  Kepala KUA Kecamatan Gerung:
                </label>
                <input
                  type="text"
                  value={formData.namaKepalaKUA}
                  onChange={(e) => handleInputChange('namaKepalaKUA', e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1.5 text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={handleCopySummary}
                className="w-full sm:w-1/2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Teks Tersalin' : 'Salin Teks Berita Acara'}</span>
              </button>

              <button
                onClick={() => setActiveTabMobile('preview')}
                className="w-full sm:w-1/2 lg:hidden rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Award className="h-4 w-4" />
                <span>Lihat Piagam Visual</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE CERTIFICATE PREVIEW (Visual Piagam Resmi) */}
        <div
          className={`lg:col-span-7 space-y-3 ${
            activeTabMobile === 'form' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Action Ribbon Above Preview */}
          <div className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-800/80 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 print:hidden">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-200">
              <Award className="h-4 w-4 text-amber-500" />
              <span>Pratinjau Piagam Kalibrasi A4</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 font-bold text-xs flex items-center gap-1.5 shadow transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="rounded-lg bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 px-3 py-1.5 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak / Print</span>
              </button>
            </div>
          </div>

          {/* THE CERTIFICATE SHEET (Responsive A4 Ratio Sheet) */}
          <div className="overflow-x-auto pb-4">
            <div
              ref={printRef}
              id="printable-certificate"
              className="mx-auto bg-white text-neutral-900 shadow-2xl rounded-sm p-6 sm:p-10 border-[6px] border-[#065f46] relative min-w-[340px] max-w-[700px] select-text"
              style={{
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                fontFamily: 'serif'
              }}
            >
              {/* Inner Gold Border */}
              <div className="border border-amber-600 p-4 sm:p-7 relative">
                {/* 4 Corner Ornaments */}
                <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-amber-500" />
                <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-amber-500" />
                <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-amber-500" />
                <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-amber-500" />

                {/* KOP SURAT RESMI */}
                <div className="flex items-center gap-3 sm:gap-5 border-b-2 border-[#065f46] pb-3 mb-4">
                  <div className="shrink-0">
                    <KemenagLogo size={64} />
                  </div>
                  <div className="text-center flex-1 space-y-0.5">
                    <div className="font-bold text-[10px] sm:text-xs tracking-wider text-neutral-800 uppercase">
                      Kementerian Agama Republik Indonesia
                    </div>
                    <div className="font-bold text-[10px] sm:text-xs tracking-wide text-neutral-700 uppercase">
                      Kantor Kementerian Agama Kabupaten Lombok Barat
                    </div>
                    <h3 className="font-bold text-sm sm:text-base text-emerald-800 uppercase tracking-tight">
                      Kantor Urusan Agama (KUA) Kecamatan Gerung
                    </h3>
                    <p className="text-[8.5px] sm:text-[9.5px] text-neutral-600 font-sans">
                      Alamat: Jl. Gatot Subroto, Gerung Utara, Kec. Gerung, Kab. Lombok Barat, NTB 83363
                    </p>
                    <p className="text-[8px] sm:text-[9px] text-neutral-500 font-sans">
                      Kontak Telp/WhatsApp: 081915949627 &bull; Email: kuagerunglobar@kemenag.go.id
                    </p>
                  </div>
                </div>

                {/* TITLE */}
                <div className="text-center my-3 space-y-1">
                  <h2 className="text-base sm:text-xl font-black text-emerald-900 tracking-wide uppercase font-serif">
                    Sertifikat Kalibrasi Arah Kiblat
                  </h2>
                  <div className="text-[10px] sm:text-xs font-bold text-amber-700 tracking-wider font-sans uppercase">
                    Piagam Verifikasi Akurasi Hisab & Kalibrasi Arah Kiblat
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-neutral-600 font-sans">
                    Nomor: <span className="font-semibold">{formData.nomorSurat}</span>
                  </div>
                </div>

                {/* PREAMBLE */}
                <p className="text-[10px] sm:text-[11px] text-neutral-700 leading-relaxed text-justify mb-3">
                  Berdasarkan permohonan pengukuran dan penetapan arah kiblat serta hasil hisab falakiah dan kalibrasi geodesi lapangan yang dilaksanakan oleh Tim Falakiyah KUA Kecamatan Gerung, menerangkan dengan sebenarnya bahwa:
                </p>

                {/* TEMPAT IBADAH BOX */}
                <div className="bg-neutral-50 border border-neutral-300 rounded p-2.5 sm:p-3 text-[10.5px] sm:text-xs mb-3 space-y-1 font-sans">
                  <div className="flex">
                    <span className="w-36 font-semibold text-neutral-600 shrink-0">Nama Tempat Ibadah</span>
                    <span className="font-black text-emerald-900 font-serif text-sm">
                      : {formData.namaTempatIbadah.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-36 font-semibold text-neutral-600 shrink-0">Jenis / Peruntukan</span>
                    <span className="text-neutral-800">: {formData.jenisTempatIbadah}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 font-semibold text-neutral-600 shrink-0">Alamat Lokasi</span>
                    <span className="text-neutral-800">
                      : {formData.alamatLengkap}, {formData.kelurahanDesa}, Kec. {formData.kecamatan}, {formData.kabupaten}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-36 font-semibold text-neutral-600 shrink-0">Pengurus / Takmir</span>
                    <span className="text-neutral-800">
                      : {formData.namaTakmir} ({formData.jabatanTakmir})
                    </span>
                  </div>
                </div>

                {/* HASIL HISAB FALAK & GEODESI */}
                <div className="border border-emerald-600 rounded bg-emerald-50/40 p-2.5 sm:p-3 mb-3 text-[10.5px] sm:text-xs font-sans">
                  <div className="font-bold text-emerald-900 border-b border-emerald-200 pb-1 mb-2 font-serif text-xs sm:text-sm">
                    HASIL PENGUKURAN ASTRONOMIS DAN HISAB FALAK:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Left details */}
                    <div className="space-y-1">
                      <div className="font-bold text-emerald-800 text-[11px]">1. Koordinat Geografis:</div>
                      <div className="pl-2 space-y-0.5 text-neutral-700">
                        <div>Lintang: <strong className="font-mono text-neutral-900">{formData.latDMS}</strong></div>
                        <div>Bujur: <strong className="font-mono text-neutral-900">{formData.lonDMS}</strong></div>
                      </div>

                      <div className="font-bold text-emerald-800 text-[11px] pt-1">2. Sudut Arah Kiblat:</div>
                      <div className="pl-2 space-y-0.5 text-neutral-800">
                        <div>Dari Titik Barat (B-U): <strong>{formatAngleDMS(formData.angleFromWest)}</strong></div>
                        <div>Dari Titik Utara (U-B): <strong>{formatAngleDMS(formData.angleNorthToWest)}</strong></div>
                        <div className="text-red-900">
                          Azimut Sejati (UTSB): <strong className="font-mono">{formatAngleDMS(formData.trueAzimuth)} ({formData.trueAzimuth.toFixed(2)}°)</strong>
                        </div>
                      </div>
                    </div>

                    {/* Right details */}
                    <div className="space-y-1">
                      <div className="font-bold text-emerald-800 text-[11px]">3. Jarak & Bayangan Kiblat:</div>
                      <div className="pl-2 space-y-0.5 text-neutral-700">
                        <div>Jarak ke Ka'bah: <strong className="font-mono text-neutral-900">± {formData.jarakKm.toFixed(2).replace('.', ',')} km</strong></div>
                        <div>Rashdul Qiblah: <strong className="text-amber-800 font-mono">Pukul {formData.rashdulQiblah} WITA</strong></div>
                      </div>

                      <div className="font-bold text-emerald-800 text-[11px] pt-1">4. Instrumen & Metode:</div>
                      <div className="pl-2 space-y-0.5 text-neutral-700 text-[10px]">
                        <div>Metode: {formData.metodePengukuran}</div>
                        <div>Instrumen: {formData.peralatan}</div>
                      </div>
                    </div>
                  </div>

                  {/* Kalibrasi Status Stamp */}
                  <div className="mt-2.5 bg-emerald-700 text-white text-center py-1 rounded font-bold text-[10px] tracking-wider uppercase font-sans">
                    STATUS: TELAH TERKALIBRASI AKURAT SESUAI STANDAR FALAKIYAH KEMENAG RI
                  </div>
                </div>

                {/* CLOSING */}
                <p className="text-[9.5px] sm:text-[10.5px] text-neutral-700 leading-relaxed text-justify mb-4">
                  Demikian Sertifikat / Berita Acara Kalibrasi Arah Kiblat ini diterbitkan untuk dipergunakan sebagai dasar hukum dan pedoman penetapan shaf salat menghadap Ka'bah Baitullah di Masjidil Haram Makkah Al-Mukarramah.
                </p>

                {/* SIGNATURE SECTION */}
                <div className="grid grid-cols-2 gap-4 text-[10px] sm:text-xs font-serif mt-2">
                  {/* Left: Kepala KUA */}
                  <div className="text-left space-y-1">
                    <div>Mengetahui,</div>
                    <div className="font-bold text-neutral-900">Kepala KUA Kecamatan Gerung</div>

                    {/* Stamp overlay mockup */}
                    <div className="h-16 relative flex items-center">
                      <div className="w-16 h-16 rounded-full border-2 border-red-700/80 text-red-700 flex flex-col items-center justify-center p-1 text-[6px] font-sans font-bold leading-tight rotate-[-8deg] opacity-85">
                        <span>KEMENAG RI</span>
                        <span className="text-[7px]">KUA GERUNG</span>
                        <span>LOMBOK BARAT</span>
                      </div>
                    </div>

                    <div className="font-bold underline text-neutral-900">
                      ( {formData.namaKepalaKUA} )
                    </div>
                    <div className="text-[9px] text-neutral-600 font-sans">
                      NIP. {formData.nipKepalaKUA}
                    </div>
                  </div>

                  {/* Right: Pengukur Husni, S. Kom. I */}
                  <div className="text-right space-y-1">
                    <div>Gerung, {formData.tanggalMasehi}</div>
                    <div className="text-[9px] text-neutral-500 font-sans">Bertepatan: {formData.tanggalHijriah}</div>
                    <div className="font-bold text-neutral-900">Tim Pengukur / Falakiyah,</div>

                    <div className="h-16 flex items-center justify-end">
                      <span className="font-serif italic font-bold text-lg text-emerald-950 pr-4">
                        Husni
                      </span>
                    </div>

                    <div className="font-bold underline text-neutral-900">
                      ( {formData.namaPengukur} )
                    </div>
                    <div className="text-[9px] text-neutral-600 font-sans">
                      {formData.jabatanPengukur}
                    </div>
                    <div className="text-[9px] text-emerald-700 font-sans font-semibold">
                      Pengurus IPARI Kemenag Lombok Barat
                    </div>
                  </div>
                </div>

                {/* BOTTOM QR / WATERMARK */}
                <div className="mt-4 pt-2 border-t border-neutral-200 flex items-center justify-between text-[8px] text-neutral-400 font-sans">
                  <div className="flex items-center gap-1">
                    <QrCode className="h-3.5 w-3.5 text-neutral-500" />
                    <span>Verifikasi Digital KUA Kec. Gerung Lobar</span>
                  </div>
                  <span>Dokumen Resmi &bull; No: {formData.nomorSurat}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function formatAngleDMS(deg: number): string {
  const d = Math.floor(deg);
  const mFloat = (deg - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  return `${d}° ${m}' ${s}''`;
}

function getMonthNameId(idx: number): string {
  const names = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return names[idx] || '';
}
