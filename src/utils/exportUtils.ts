import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { CityLocation } from '../types';
import { calculatePrayerTimes, formatDM } from './falakMath';
import { gregorianToHijri } from './hijriCalendar';

/**
 * Export 1-Month Prayer Schedule to Excel (.xlsx)
 */
export function exportPrayerScheduleToExcel(location: CityLocation, year: number, monthIndex: number) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthName = monthNames[monthIndex];

  const dataRows: Record<string, string | number>[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthIndex, d);
    const times = calculatePrayerTimes(date, location);
    const hijri = gregorianToHijri(date);

    dataRows.push({
      'No': d,
      'Tanggal Masehi': `${d} ${monthName} ${year}`,
      'Tanggal Hijriah': `${hijri.day} ${hijri.monthNameId} ${hijri.year} H`,
      'Imsak': times.imsak,
      'Subuh': times.subuh,
      'Terbit': times.terbit,
      'Israq': times.israq,
      'Dhuha': times.duhaSugra,
      'Zohor': times.zohor,
      'Asar (Awwal)': times.asarAwwal,
      'Asar (Tsani)': times.asarTsani,
      'Magrib': times.magrib,
      'Isya (Awwal)': times.isyaAwwal,
      'Isya (Tsani)': times.isyaTsani,
      'Buruj': times.falakParams.buruj,
      'Mail Syamsi': `${times.falakParams.mailAwwal}°`
    });
  }

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(dataRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Jadwal_${monthName}_${year}`);

  // Save workbook
  const fileName = `Jadwal_Salat_${location.name.replace(/[^a-zA-Z0-9]/g, '_')}_${monthName}_${year}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Export 1-Month Prayer Schedule to clean formatted PDF
 */
export function exportPrayerScheduleToPDF(location: CityLocation, year: number, monthIndex: number) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthName = monthNames[monthIndex];

  // Title & Header
  doc.setFontSize(16);
  doc.setTextColor(20, 83, 45); // Emerald-900
  doc.text(`JADWAL SALAT FALAK KITAB TAQRIBUL MAQSHOD`, 148, 14, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(
    `Lokasi: ${location.name} (${formatDM(Math.abs(location.latitude))} ${location.latDir}, ${formatDM(Math.abs(location.longitude))} ${location.lonDir}) | Zona: ${location.timezoneName} (UTC+${location.timezone})`,
    148,
    20,
    { align: 'center' }
  );

  doc.setFontSize(10);
  doc.text(`Bulan: ${monthName} ${year} | Hisab: Matan Taqribul Maqshad fil-Amali bir-Rubu'il Mujayyab`, 148, 25, { align: 'center' });

  // Table setup
  const startY = 32;
  const colWidths = [10, 24, 28, 16, 16, 16, 16, 16, 16, 18, 16, 18, 22];
  const headers = ['Tgl', 'Masehi', 'Hijriah', 'Imsak', 'Subuh', 'Terbit', 'Israq', 'Dhuha', 'Zohor', 'Asar', 'Magrib', 'Isya', 'Buruj'];

  let currentX = 14;
  let currentY = startY;

  // Draw Header Background
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(currentX, currentY, 268, 7, 'F');

  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  headers.forEach((h, idx) => {
    doc.text(h, currentX + 2, currentY + 5);
    currentX += colWidths[idx];
  });

  // Draw rows
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  currentY += 8;

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthIndex, d);
    const times = calculatePrayerTimes(date, location);
    const hijri = gregorianToHijri(date);

    // Alternate row shading
    if (d % 2 === 0) {
      doc.setFillColor(245, 247, 250);
      doc.rect(14, currentY - 3.5, 268, 4.8, 'F');
    }

    currentX = 14;
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(7.5);

    const rowData = [
      String(d),
      `${d} ${monthName.slice(0, 3)}`,
      `${hijri.day} ${hijri.monthNameId.slice(0, 4)}`,
      times.imsak,
      times.subuh,
      times.terbit,
      times.israq,
      times.duhaSugra,
      times.zohor,
      times.asarAwwal,
      times.magrib,
      times.isyaAwwal,
      `${times.falakParams.buruj} (${times.falakParams.mailAwwal}°)`
    ];

    rowData.forEach((val, idx) => {
      doc.text(val, currentX + 2, currentY);
      currentX += colWidths[idx];
    });

    currentY += 5;

    // Check if new page needed
    if (currentY > 192 && d < daysInMonth) {
      doc.addPage();
      currentY = 20;
    }
  }

  // Footer note
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(`Dicetak otomatis dari Aplikasi Falak Taqribul Maqshad • Metode Rubu' Mujayyab Syekh Mukhtar bin Atrad Al-Bogori`, 148, currentY + 6, { align: 'center' });

  const fileName = `Jadwal_Salat_${location.name.replace(/[^a-zA-Z0-9]/g, '_')}_${monthName}_${year}.pdf`;
  doc.save(fileName);
}
