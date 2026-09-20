import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Compass,
  Clock,
  CircleDot,
  FileText,
  Search
} from 'lucide-react';

interface Chapter {
  id: string;
  number: string;
  title: string;
  titleAr: string;
  summary: string;
  matanArabic: string;
  translation: string;
  explanation: string[];
  keyFormula?: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 'intro',
    number: 'Muqaddimah',
    title: 'Mengenal Rubu\' Mujayyab & 14 Istilah Rukunnya',
    titleAr: 'مقدمة : في الرسوم التي يتوقف عليها العمل غالبا وتسميتها',
    summary: 'Pengenalan alat seperempat lingkaran (Rubu\' Mujayyab) dan 14 komponen fungsionalnya.',
    matanArabic: 'الرسوم التي يتوقف عليها العمل غالبا وتسميتها وهي أربعة عشر : الأول المركز... والثاني قوس الارتفاع... والثالث جيب التمام... والرابع الستيني...',
    translation: 'Tanda-tanda yang dipergunakan dalam mengerjakan amal Rubu\' biasanya dan penamaannya ada 14 istilah: 1. Markaz, 2. Qaus al-Irtifa\', 3. Jaibu al-Tamam, 4. As-Sittini, 5. Dua Dairah Tajyib, 6. Juyub Mabsuthah, 7. Juyub Ma\'kusah, 8. Dairah Mail, 9. Dua Qaus \'Asar, 10. Dua Qaimah Zill, 11. Dua Hadafah, 12. Khait (benang), 13. Muri, 14. Syaqul (pemberat).',
    explanation: [
      'Rubu\' Mujayyab terdiri dari kurva 1/4 lingkaran dengan radius 60 bagian (Sittini) dan busur 90 derajat.',
      'Sumbu horizontal disebut Jaibu al-Tamam (fungsi Cosinus) dan sumbu vertikal disebut As-Sittini (fungsi Sinus).',
      'Setiap 15 derajat busur bernilai 1 jam waktu, 1 derajat busur bernilai 4 menit waktu, dan 1 menit busur bernilai 4 detik waktu.'
    ],
    keyFormula: '15° = 1 Jam | 1° = 4 Menit | 1\' = 4 Detik'
  },
  {
    id: 'bab1_2',
    number: 'Bab I & II',
    title: 'Irtifa\' Matahari & Nilai Jaib (Sinus R=60)',
    titleAr: 'الباب الأول والثاني : في معرفة ارتفاع الشمس والجيب وعكسه',
    summary: 'Membidik tinggi matahari dengan lubang bidik hadafah dan membaca garis sinus.',
    matanArabic: 'خذ الربع بيديك واجعل الهدفة العالية إلى جهة الشمس وعلق شاقولا بخيطه... فما بين الخيط وطرف القوس الخالي عن الهدفة هو الارتفاع.',
    translation: 'Ambillah Rubu\' dengan kedua tanganmu dan jadikan hadafah yang atas menghadap ke matahari dan gantungkan syaqul dengan benangnya. Gerakkan hingga bayang hadafah atas menutupi hadafah bawah, maka busur antara benang dan tepi qaus adalah Irtifa\' (ketinggian matahari).',
    explanation: [
      'Untuk mencari Jaib dari Irtifa\': hitung sudut dari awal Qaus, telusuri garis Juyub Mabsuthah tegak lurus ke garis Sittini.',
      'Nilai Jaib = 60 × Sin(Irtifa\').',
      'Untuk sudut di bawah 30°, nilai Jaib lebih besar dari sudutnya; di atas 30°, nilai Jaib lebih kecil dari sudutnya.'
    ],
    keyFormula: 'Jaib = 60 × Sin(h) | Jaib Tamam = 60 × Cos(h)'
  },
  {
    id: 'bab3',
    number: 'Bab III',
    title: 'Mail Syamsi (Deklinasi) & Ghayah Irtifa\' (Zawal)',
    titleAr: 'الباب الثالث : في معرفة الميل والغاية',
    summary: 'Menentukan posisi kemiringan matahari dari khatulistiwa dan ketinggian kulminasi puncak siang.',
    matanArabic: 'ضع الخيط على درجة الشمس وانزل من محل تقاطعه مع دائرة الميل في الجيوب المبسوطة إلى القوس فما بين منتهى المنزول إليه وأول القوس هو الميل.',
    translation: 'Letakkan benang pada derajat matahari dan turunkan dari titik potongnya dengan Dairah Mail pada garis Juyub Mabsuthah ke busur Qaus, maka itulah Mail (deklinasi matahari).',
    explanation: [
      'Derajat Syamsi dihitung dari tanggal Masehi ditambah Tapaut buruj bulan bersangkutan.',
      'Bila tanggal + tapaut > 30, kurangi 30 dan buruj berpindah ke buruj berikutnya.',
      'Ghayah Irtifa\' (tinggi matahari saat tengah hari): 90° dikurangi selisih antara Lintang Tempat dan Mail (Tamamul Ghayah).'
    ],
    keyFormula: 'Ghayah = 90° - |φ - δ| (Ittifaq) atau 90° - (|φ| + |δ|) (Ikhtilaf)'
  },
  {
    id: 'bab4_5',
    number: 'Bab IV & V',
    title: 'Bu\'du Qutri, Ashal Muthlaq & Busur Siang/Malam',
    titleAr: 'الباب الرابع والخامس : في بعد القطر والأصل المطلق ونصف الفضلة',
    summary: 'Menghitung parameter bola langit untuk menentukan panjang siang dan malam di setiap belahan bumi.',
    matanArabic: 'ضع الخيط على عرض البلد وعلم بالمرِيين على دائرتي التجييب ثم انقله إلى الميل... فما بين الخيط وأول القوس هو نصف الفضلة.',
    translation: 'Letakkan benang pada lintang tempat dan tandai dengan dua muri pada busur tajyib, lalu pindahkan benang ke ukuran Mail. Jarak antara benang dan awal Qaus adalah Nisfu Fadhlah.',
    explanation: [
      'Bu\'du Qutri (BQ) = Sin(φ) × Sin(δ) × 60. Ashal Muthlaq (AM) = Cos(φ) × Cos(δ) × 60.',
      'Nisfu Fadhlah (c): Sin(c) = BQ / AM = Tan(φ) × Tan(δ).',
      'Nisfu Qaus An-Nahar (setengah busur siang) = 90° ± Nisfu Fadhlah.',
      'Total waktu siang = (2 × Nisfu Qaus An-Nahar) / 15 jam.'
    ],
    keyFormula: 'Panjang Siang = (90° ± Nisfu Fadhlah) × 2 / 15 Jam'
  },
  {
    id: 'bab9_10',
    number: 'Bab IX & X',
    title: 'Hisab Waktu Salat Lima Waktu & Imsak',
    titleAr: 'الباب التاسع والعاشر : في معرفة أوقات الصلوات الخمس والإمساك على حساب الساعة الزوالية',
    summary: 'Penetapan awal waktu salat Zohor, Asar (Awwal & Tsani), Magrib, Isya (17° & 19°), Subuh, Imsak, dan Dhuha.',
    matanArabic: 'أما الظهر : فهو ١٢ دائما... وأما العصر : فزد على ظلها قامة للعصر الأول أو قامتين للعصر الثاني... وأما المغرب : فهو نصف قوس النهار على ١٢.',
    translation: 'Waktu Zohor: saat zawal (matahari tergelincir dari meridian). Waktu Asar: saat bayangan benda sama dengan panjang bendanya ditambah bayangan zawal (Asar 1 - Syafi\'i) atau dua kali bendanya (Asar 2 - Hanafi). Magrib: saat terbenam piringan matahari. Isya: saat hilangnya syafaq merah (Jaib 17) atau putih (Jaib 19). Subuh: terbit fajar shadiq (Jaib 19). Imsak: Subuh dikurangi da\'fu tamkin (10 menit).',
    explanation: [
      'Waktu Zohor = Zawal + Ihtiyath (Tamkin).',
      'Waktu Asar dihitung dari tinggi matahari saat bayangan bertambah 1 qamah (atau 2 qamah).',
      'Waktu Magrib = Zawal + Nisfu Qaus Nahar / 15 + Tamkin.',
      'Waktu Isya Awwal (Jaib 17 / -17°) dan Isya Tsani (Jaib 19 / -19°).',
      'Waktu Subuh (Fajar Shadiq) = Zawal - t(-20°) + Tamkin.',
      'Waktu Imsak = Waktu Subuh - 10 menit (sebagai ihtiyath).'
    ],
    keyFormula: 'Imsak = Subuh - 10 mnt | Dhuha = Zawal - t(9.5°) | Asar: tan(zd)+1'
  },
  {
    id: 'bab13',
    number: 'Bab XIII',
    title: 'Penentuan Arah Kiblat (Simmat Makkah)',
    titleAr: 'الباب الثالث عشر : في معرفة سمت مكة وجهتها من أي بلدة شئت',
    summary: 'Hisab arah Ka\'bah dari bujur dan lintang tempat relatif terhadap Makkah Al-Mukarramah.',
    matanArabic: 'اعرف فضل طوليهما مطلقا وفضل عرضيهما إن اتفقا وإلا فاجمعهما ثم عد فضل الطولين في مستوى جيب التمام... فما بين الخيط وأول القوس حينئذ فهو سمتها.',
    translation: 'Ketahui selisih bujur (Fadlut-Tulain) dan selisih/gabungan lintang (Fadl/Majmu\' Ardaen). Hitung pada sumbu Jaib Tamam dan Sittini, pertemuannya menunjukkan sudut arah Ka\'bah Makkah.',
    explanation: [
      'Koordinat Ka\'bah: Lintang 21° 25\' 21" LU, Bujur 39° 49\' 34" BT.',
      'Di Indonesia (termasuk Lombok NTB), Ka\'bah berada di barat laut. Sudut diukur dari titik Barat condong ke Utara (B-U).',
      'Untuk Lombok: Fadlut Tulain = 116°07\' - 40°20\' = 75°47\', arah kiblat didapat 23° 11\' dari Barat ke Utara (Azimut 293° 11\').',
      'Peristiwa Istiwa\' A\'zam terjadi pada 27/28 Mei pk 16:18 WIB dan 15/16 Juli pk 16:27 WIB, saat matahari berada tepat di atas Ka\'bah.'
    ],
    keyFormula: 'cot(Q) = (cos(φ) × tan(φ_k) - sin(φ) × cos(f)) / sin(f)'
  },
  {
    id: 'bab14',
    number: 'Bab XIV',
    title: 'Arah Mata Angin & Pengukuran Lapangan',
    titleAr: 'الباب الرابع عشر : في معرفة الجهات الأربع وخاتمة في بعض الهندسات',
    summary: 'Menentukan titik utara sejati dengan bayangan tongkat, mengukur tinggi pohon, kedalaman sumur, dan lebar sungai.',
    matanArabic: 'تسوي الأرض غاية التسوية بالميزان وترسم عليها دائرة... وتنصب على مركزها مقياسا مخروطا... وتنصف القوس الواقع بينهما وتخرج خطا مستقيما فهو خط الشمال والجنوب.',
    translation: 'Ratakan tanah dengan waterpass dan buat lingkaran. Tancapkan tongkat di tengahnya, tandai titik masuk bayangan pagi dan titik keluar bayangan sore. Garis tengahnya adalah arah Utara-Selatan sejati.',
    explanation: [
      'Metode Lingkaran Hindi: Menentukan 4 mata angin murni bebas dari deklinasi magnetik kompas.',
      'Mengukur Tinggi Pohon (Hal. 219): Dengan membidik sudut 45°, jarak pengamat ke pohon ditambah tinggi mata pengamat sama dengan tinggi pohon!',
      'Mengukur Kedalaman Sumur (Hal. 222): Diameter mulut sumur dikalikan tangen sudut inkhifadh dari bibir sumur ke permukaan air.',
      'Mengukur Lebar Sungai (Hal. 225): Membidik tepi seberang sungai dengan hadafah Rubu\', lalu melangkah menyusuri tepian rata hingga benang mencapai sudut bidikan awal.'
    ],
    keyFormula: 'Tinggi Pohon (45°) = Jarak + Tinggi Mata | Kedalaman Sumur = Diameter × tan(θ)'
  }
];

export const CalculationGuideView: React.FC = () => {
  const [expandedChapter, setExpandedChapter] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredChapters = CHAPTERS.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.translation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Kajian Ilmiah Kitab Falak
            </span>
            <span className="font-serif text-xs text-neutral-400">
              ترجمة ودراسة متن تقريب المقصد
            </span>
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Panduan Lengkap Hisab Falak Taqribul Maqshad
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Karya Syaikh Muhammad Mukhtar bin Atrad Al-Jawi Al-Bogori • Terjemahan & Kajian UIN Mataram Press.
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <input
            id="input-search-guide"
            type="text"
            placeholder="Cari materi bab..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-1.5 pl-8 pr-3 text-xs text-neutral-800 focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
          />
        </div>
      </div>

      {/* Chapters Accordion */}
      <div className="space-y-3">
        {filteredChapters.map((chap) => {
          const isExpanded = expandedChapter === chap.id;
          return (
            <div
              key={chap.id}
              className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs transition dark:border-neutral-800 dark:bg-neutral-900"
            >
              <button
                id={`btn-guide-${chap.id}`}
                onClick={() => setExpandedChapter(isExpanded ? '' : chap.id)}
                className="flex w-full items-center justify-between p-5 text-left transition hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {chap.number}
                    </span>
                    <span className="font-serif text-xs text-neutral-400">
                      {chap.titleAr}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    {chap.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {chap.summary}
                  </p>
                </div>

                <div className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-neutral-100 p-5 space-y-4 dark:border-neutral-800 text-xs">
                  {/* Arabic Matan Excerpt */}
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/15">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                      Ibarat Matan Asli (Arab):
                    </span>
                    <p className="mt-1 font-serif text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 text-right dir-rtl">
                      {chap.matanArabic}
                    </p>
                  </div>

                  {/* Indonesian Translation */}
                  <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800/50">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Terjemahan Makna:
                    </span>
                    <p className="mt-1 text-neutral-600 leading-relaxed dark:text-neutral-300">
                      {chap.translation}
                    </p>
                  </div>

                  {/* Detailed Explanation & Rules */}
                  <div className="space-y-2">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Kajian & Kaidah Perhitungan:
                    </span>
                    <ul className="list-disc list-inside space-y-1.5 text-neutral-600 dark:text-neutral-400">
                      {chap.explanation.map((item, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Formula Tag */}
                  {chap.keyFormula && (
                    <div className="flex items-center justify-between rounded-xl bg-neutral-900 px-4 py-2.5 text-white font-mono text-xs dark:bg-emerald-950/60 dark:text-emerald-200">
                      <span>Rumus Kunci:</span>
                      <span className="font-bold">{chap.keyFormula}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
