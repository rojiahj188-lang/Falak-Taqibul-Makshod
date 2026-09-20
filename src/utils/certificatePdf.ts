import { jsPDF } from 'jspdf';
import { QiblaCertificateData } from '../types';

/**
 * Load image as base64 data URL for jsPDF embedding
 */
export async function getBase64FromUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 300;
        canvas.height = img.naturalHeight || img.height || 300;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

/**
 * Generate official Qibla Calibration Certificate PDF (Format A4 Portrait)
 * Designed specifically for KUA Kecamatan Gerung, Kementerian Agama RI,
 * highly optimized for mobile saving/printing on Android & iOS.
 */
export async function generateCertificatePDF(
  data: QiblaCertificateData,
  mode: 'download' | 'print' | 'view' = 'download'
): Promise<{ doc: jsPDF; blobUrl: string }> {
  // A4 Portrait: 210 x 297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;

  // 1. Decorative Borders (Islamic Gold & Emerald Guilloche-Style Framing)
  // Outer border
  doc.setDrawColor(6, 95, 70); // Deep Emerald #065f46
  doc.setLineWidth(1.8);
  doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

  // Inner Gold Accent border
  doc.setDrawColor(217, 119, 6); // Amber Gold #d97706
  doc.setLineWidth(0.6);
  doc.rect(margin + 2.5, margin + 2.5, pageWidth - (margin + 2.5) * 2, pageHeight - (margin + 2.5) * 2);

  // Corner Ornaments (decorative L-shapes)
  const cSize = 10;
  const corners = [
    { x: margin + 3.5, y: margin + 3.5 },
    { x: pageWidth - margin - 3.5 - cSize, y: margin + 3.5 },
    { x: margin + 3.5, y: pageHeight - margin - 3.5 - cSize },
    { x: pageWidth - margin - 3.5 - cSize, y: pageHeight - margin - 3.5 - cSize }
  ];
  doc.setFillColor(217, 119, 6);
  corners.forEach((c) => {
    doc.rect(c.x, c.y, 2.5, 2.5, 'F');
  });

  // 2. KOP SURAT RESMI (KEMENTERIAN AGAMA RI & KUA GERUNG LOBAR)
  // Try to load Kemenag logo or draw vector emblem
  let logoLoaded = false;
  try {
    const logoDataUrl = await getBase64FromUrl('/logo-kemenag-custom.png');
    doc.addImage(logoDataUrl, 'PNG', margin + 6, margin + 5, 24, 24);
    logoLoaded = true;
  } catch (e) {
    try {
      const fallbackUrl = await getBase64FromUrl(
        'https://cdn.phototourl.com/free/2026-09-20-1721e240-afc9-4575-9b9b-13a55b4ba848.png'
      );
      doc.addImage(fallbackUrl, 'PNG', margin + 6, margin + 5, 24, 24);
      logoLoaded = true;
    } catch {
      // Vector fallback badge
      doc.setFillColor(11, 99, 48);
      doc.circle(margin + 17, margin + 16, 11, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('KEMENAG', margin + 17, margin + 17, { align: 'center' });
    }
  }

  // Kop Text Header
  const kopCenterX = 118;
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 30, 25);
  doc.text('KEMENTERIAN AGAMA REPUBLIK INDONESIA', kopCenterX, margin + 8, { align: 'center' });

  doc.setFontSize(10);
  doc.text('KANTOR KEMENTERIAN AGAMA KABUPATEN LOMBOK BARAT', kopCenterX, margin + 13, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(6, 95, 70); // Emerald 800
  doc.text('KANTOR URUSAN AGAMA (KUA) KECAMATAN GERUNG', kopCenterX, margin + 19, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text(
    'Alamat: Jl. Gatot Subroto, Gerung Utara, Kec. Gerung, Kab. Lombok Barat, NTB. Kode Pos: 83363',
    kopCenterX,
    margin + 24,
    { align: 'center' }
  );
  doc.text(
    'Telepon / WhatsApp: 081915949627 | Email: kuagerunglobar@kemenag.go.id',
    kopCenterX,
    margin + 28,
    { align: 'center' }
  );

  // Kop Separator Lines
  const lineY = margin + 32;
  doc.setDrawColor(6, 95, 70);
  doc.setLineWidth(1.2);
  doc.line(margin + 5, lineY, pageWidth - margin - 5, lineY);
  doc.setLineWidth(0.4);
  doc.line(margin + 5, lineY + 1.2, pageWidth - margin - 5, lineY + 1.2);

  // 3. TITLE OF CERTIFICATE
  let currY = lineY + 9;
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(6, 95, 70);
  doc.text('SERTIFIKAT KALIBRASI ARAH KIBLAT', pageWidth / 2, currY, { align: 'center' });

  currY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9); // Amber
  doc.text('PIAGAM VERIFIKASI AKURASI HISAB DAN RUKYAT ARAH KIBLAT', pageWidth / 2, currY, { align: 'center' });

  currY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text(`Nomor: ${data.nomorSurat}`, pageWidth / 2, currY, { align: 'center' });

  // 4. PREAMBLE / KONSIDERANS
  currY += 7;
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  const preamble =
    `Berdasarkan permohonan pengukuran dan penetapan arah kiblat serta hasil hisab falak falakiah dan kalibrasi geodesi lapangan yang dilaksanakan oleh Tim Falakiyah KUA Kecamatan Gerung, menerangkan dengan sebenarnya bahwa:`;
  const splitPreamble = doc.splitTextToSize(preamble, pageWidth - margin * 2 - 14);
  doc.text(splitPreamble, margin + 7, currY);

  currY += splitPreamble.length * 4.5 + 2;

  // 5. DATA TEMPAT IBADAH (BOX IDENTITAS)
  doc.setFillColor(248, 250, 252); // soft neutral #f8fafc
  doc.setDrawColor(203, 213, 225); // #cbd5e1
  doc.setLineWidth(0.4);
  doc.roundedRect(margin + 7, currY, pageWidth - margin * 2 - 14, 25, 2, 2, 'FD');

  const idLeft = margin + 11;
  const colValX = margin + 58;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  // Row 1
  doc.text('Nama Tempat Ibadah', idLeft, currY + 5.5);
  doc.text(':', colValX - 3, currY + 5.5);
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(6, 95, 70);
  doc.text(data.namaTempatIbadah.toUpperCase(), colValX, currY + 5.5);

  // Row 2
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('Jenis / Peruntukan', idLeft, currY + 11.5);
  doc.text(':', colValX - 3, currY + 11.5);
  doc.setTextColor(20, 20, 20);
  doc.text(data.jenisTempatIbadah, colValX, currY + 11.5);

  // Row 3
  doc.setTextColor(60, 60, 60);
  doc.text('Alamat Lokasi', idLeft, currY + 17);
  doc.text(':', colValX - 3, currY + 17);
  doc.setTextColor(20, 20, 20);
  doc.text(
    `${data.alamatLengkap}, ${data.kelurahanDesa}, Kec. ${data.kecamatan}, ${data.kabupaten}`,
    colValX,
    currY + 17
  );

  // Row 4
  doc.setTextColor(60, 60, 60);
  doc.text('Pengurus / Takmir', idLeft, currY + 22);
  doc.text(':', colValX - 3, currY + 22);
  doc.setTextColor(20, 20, 20);
  doc.text(
    `${data.namaTakmir} (${data.jabatanTakmir}) - Kontak: ${data.teleponTakmir || '-'}`,
    colValX,
    currY + 22
  );

  currY += 31;

  // 6. HASIL PENGUKURAN & KALIBRASI ASTRONOMI FALAK (BOX HASIL HIJAU EMAS)
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(6, 95, 70);
  doc.text('HASIL PENGUKURAN ASTRONOMIS DAN KALIBRASI GEODESI:', margin + 7, currY);

  currY += 3.5;
  // Background container
  doc.setFillColor(240, 253, 244); // light emerald #f0fdf4
  doc.setDrawColor(16, 185, 129); // #10b981
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + 7, currY, pageWidth - margin * 2 - 14, 52, 2, 2, 'FD');

  const col1X = margin + 11;
  const val1X = margin + 55;
  const col2X = margin + 102;
  const val2X = margin + 148;

  // Header mini
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 83, 45);

  // Section: Koordinat
  doc.text('1. Koordinat Geografis', col1X, currY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text('Lintang Tempat ( φ )', col1X + 4, currY + 10.5);
  doc.text(`: ${data.latDMS} (${data.latitude.toFixed(5)}°)`, val1X, currY + 10.5);
  doc.text('Bujur Tempat ( λ )', col1X + 4, currY + 15.5);
  doc.text(`: ${data.lonDMS} (${data.longitude.toFixed(5)}°)`, val1X, currY + 15.5);

  // Section: Arah Kiblat 3 Format
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 83, 45);
  doc.text('2. Arah Kiblat Terhadap Ufuk', col1X, currY + 22.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text('Dari Titik Barat (B - U)', col1X + 4, currY + 27.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${formatAngleDMS(data.angleFromWest)} (Serong Barat ke Utara)`, val1X, currY + 27.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text('Dari Titik Utara (U - B)', col1X + 4, currY + 32.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${formatAngleDMS(data.angleNorthToWest)} (Utara ke Barat)`, val1X, currY + 32.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text('Azimut Sejati (UTSB)', col1X + 4, currY + 38);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28); // Dark red for True Azimuth
  doc.text(`: ${formatAngleDMS(data.trueAzimuth)} (${data.trueAzimuth.toFixed(2)}°)`, val1X, currY + 38);

  // Section: Kolom Kanan (Jarak, Rashdul Qiblah, Metode)
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 83, 45);
  doc.text('3. Jarak & Bayangan Kiblat', col2X, currY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text('Jarak ke Ka\'bah Makkah', col2X + 4, currY + 10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ± ${data.jarakKm.toFixed(2).replace('.', ',')} km`, val2X, currY + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text('Rashdul Qiblah Yaumi', col2X + 4, currY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text(`: Pukul ${data.rashdulQiblah} WITA`, val2X, currY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 83, 45);
  doc.text('4. Metode & Peralatan', col2X, currY + 23);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text('Instrumen Falak', col2X + 4, currY + 28);
  doc.text(`: ${data.peralatan}`, val2X, currY + 28);

  doc.text('Metode Hisab', col2X + 4, currY + 34);
  const splitMetode = doc.splitTextToSize(`: ${data.metodePengukuran}`, 48);
  doc.text(splitMetode, val2X, currY + 34);

  // Status Kalibrasi Bar
  doc.setFillColor(6, 95, 70);
  doc.rect(margin + 7, currY + 44, pageWidth - margin * 2 - 14, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(
    'STATUS: TELAH TERKALIBRASI AKURAT SESUAI STANDAR FALAKIYAH KEMENAG RI',
    pageWidth / 2,
    currY + 49.5,
    { align: 'center' }
  );

  currY += 58;

  // 7. PERNYATAAN PENGESAHAN (LEGALISASI)
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  const closing =
    `Demikian Sertifikat / Berita Acara Kalibrasi Arah Kiblat ini diterbitkan untuk dipergunakan sebagai dasar hukum dan acuan teknis penetapan shaf salat menghadap Ka'bah Baitullah di Masjidil Haram Makkah Al-Mukarramah. Semoga Allah Subhanahu wa Ta'ala meridhai ibadah kita semua.`;
  const splitClosing = doc.splitTextToSize(closing, pageWidth - margin * 2 - 14);
  doc.text(splitClosing, margin + 7, currY);

  currY += splitClosing.length * 4.2 + 6;

  // 8. SIGNATURE BLOCK (TANDA TANGAN & STEMPEL RESMI)
  const sigCol1X = margin + 18;
  const sigCol2X = pageWidth - margin - 65;

  // Tanggal & Tempat
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 20);

  doc.text('Mengetahui,', sigCol1X, currY);
  doc.text(`Gerung, ${data.tanggalMasehi}`, sigCol2X, currY);
  doc.text(`Bertepatan: ${data.tanggalHijriah}`, sigCol2X, currY + 4.5);

  currY += 5;
  doc.setFont('times', 'bold');
  doc.text('Kepala KUA Kecamatan Gerung', sigCol1X, currY + 3);
  doc.text('Tim Pengukur / Falakiyah,', sigCol2X, currY + 3);

  // Digital Stamp Mockup (KUA Kec. Gerung & IPARI)
  const stampY = currY + 8;
  doc.setDrawColor(185, 28, 28); // Red-ink official stamp look #b91c1c
  doc.setLineWidth(0.5);
  doc.circle(sigCol1X + 22, stampY + 9, 11);
  doc.setFontSize(5);
  doc.setTextColor(185, 28, 28);
  doc.text('KEMENTERIAN AGAMA RI', sigCol1X + 22, stampY + 5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('KUA KEC. GERUNG', sigCol1X + 22, stampY + 9.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('LOMBOK BARAT', sigCol1X + 22, stampY + 13, { align: 'center' });

  // Tanda Tangan Husni S.Kom.I on Right Column
  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('Husni', sigCol2X + 10, stampY + 10);

  // Pejabat Nama & NIP
  const nameY = currY + 28;
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);

  // Left Signer: Kepala KUA
  doc.text(`( ${data.namaKepalaKUA} )`, sigCol1X, nameY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`NIP. ${data.nipKepalaKUA}`, sigCol1X, nameY + 4.5);
  doc.text(data.jabatanKepalaKUA, sigCol1X, nameY + 8.5);

  // Right Signer: Husni, S. Kom. I
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${data.namaPengukur} )`, sigCol2X, nameY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text(data.jabatanPengukur, sigCol2X, nameY + 4.5);
  doc.text('Pengurus IPARI Kemenag Kab. Lombok Barat', sigCol2X, nameY + 8.5);

  // 9. QR Code & Digital Verification Watermark at bottom center
  const qrY = pageHeight - margin - 15;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(pageWidth / 2 - 42, qrY, 84, 10, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(6, 95, 70);
  doc.text('VERIFIKASI DIGITAL KUA KECAMATAN GERUNG', pageWidth / 2, qrY + 4, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Dokumen resmi Kementerian Agama Kab. Lombok Barat • No: ${data.nomorSurat}`,
    pageWidth / 2,
    qrY + 7.5,
    { align: 'center' }
  );

  // Generate output
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  const cleanName = data.namaTempatIbadah.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Sertifikat_Kalibrasi_Kiblat_${cleanName}_KUA_Gerung.pdf`;

  if (mode === 'download') {
    // Highly resilient mobile download pattern for Android and iOS:
    try {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
      }, 1500);
    } catch {
      doc.save(filename);
    }
  } else if (mode === 'print') {
    // Print window for iOS AirPrint & Android native Print to PDF
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  }

  return { doc, blobUrl };
}

function formatAngleDMS(deg: number): string {
  const d = Math.floor(deg);
  const mFloat = (deg - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  return `${d}° ${m}' ${s}''`;
}
