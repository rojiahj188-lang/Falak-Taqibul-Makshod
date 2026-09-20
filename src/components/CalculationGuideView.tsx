import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Compass,
  Clock,
  CircleDot,
  FileText,
  Search,
  Bookmark,
  BookmarkCheck,
  Type,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Feather,
  Glasses,
  BookMarked,
  ArrowLeft,
  ArrowRight,
  Share2
} from 'lucide-react';

export interface Chapter {
  id: string;
  number: string;
  title: string;
  titleAr: string;
  summary: string;
  matanArabic: string;
  translation: string;
  explanation: string[];
  keyFormula?: string;
  practicalTip?: string;
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'intro',
    number: 'Muqaddimah',
    title: 'Mengenal Rubu\' Mujayyab & 14 Istilah Rukunnya',
    titleAr: 'مقدمة : في الرسوم التي يتوقف عليها العمل غالبا وتسميتها',
    summary: 'Pengenalan alat seperempat lingkaran (Rubu\' Mujayyab) dan 14 komponen fungsionalnya.',
    matanArabic: 'الرسوم التي يتوقف عليها العمل غالبا وتسميتها وهي أربعة عشر : الأول المركز... والثاني قوس الارتفاع... والثالث جيب التمام... والرابع الستيني... والخامس دائرتا التجييب... والسادس الجيوب المبسوطة... والسابع الجيوب المعكوسة... والثامن دائرة الميل... والتاسع قوسي العصر... والعاشر قائمتا الظل... والحادي عشر الهدفتان... والثاني عشر الخيط... والثالث عشر المري... والرابع عشر الشاقول.',
    translation: 'Tanda-tanda gambar yang dipergunakan dalam mengerjakan hisab Rubu\' biasanya dan penamaannya ada 14 istilah: 1. Markaz (pusat lingkaran), 2. Qaus al-Irtifa\' (busur 90 derajat), 3. Jaibu al-Tamam (sumbu datar/kosinus), 4. As-Sittini (sumbu tegak sinus 60 bagian), 5. Dua Dairah Tajyib, 6. Juyub Mabsuthah (garis datar sinus), 7. Juyub Ma\'kusah (garis tegak), 8. Dairah Mail (busur deklinasi 23°27\'), 9. Dua Qaus \'Asar, 10. Dua Qaimah Zill (skala bayangan 7 & 12 jari), 11. Dua Hadafah (lubang bidik intip), 12. Khait (benang sutra), 13. Muri (penanda geser pada benang), 14. Syaqul (pemberat timah pendulum).',
    explanation: [
      'Rubu\' Mujayyab terdiri dari kurva 1/4 lingkaran dengan jari-jari dibagi 60 satuan sama (Sittini) dan busur 90 derajat busur.',
      'Sumbu horizontal disebut Jaibu al-Tamam (fungsi Cosinus) dan sumbu vertikal disebut As-Sittini (fungsi Sinus R=60).',
      'Setiap 15 derajat busur bernilai 1 jam waktu surya, 1 derajat busur bernilai 4 menit waktu, dan 1 menit busur bernilai 4 detik waktu.'
    ],
    keyFormula: '15° = 1 Jam | 1° = 4 Menit | 1\' = 4 Detik | R = 60 Bagian',
    practicalTip: 'Pegang Rubu\' dengan benang menggantung bebas. Pastikan syaqul tidak menempel pada permukaan kayu saat pembacaan derajat.'
  },
  {
    id: 'bab1_2',
    number: 'Bab I & II',
    title: 'Irtifa\' Matahari & Nilai Jaib (Sinus R=60)',
    titleAr: 'الباب الأول والثاني : في معرفة ارتفاع الشمس والجيب وعكسه',
    summary: 'Membidik tinggi matahari dengan lubang bidik hadafah dan membaca garis sinus.',
    matanArabic: 'خذ الربع بيديك واجعل الهدفة العالية إلى جهة الشمس وعلق شاقولا بخيطه... فما بين الخيط وطرف القوس الخالي عن الهدفة هو الارتفاع... وللجيب : عد الارتفاع في القوس وانزل في المبسوطة إلى الستيني.',
    translation: 'Ambillah Rubu\' dengan kedua tanganmu dan jadikan hadafah yang atas menghadap ke matahari dan gantungkan syaqul dengan benangnya. Gerakkan hingga berkas sinar dari hadafah atas tepat jatuh menembus hadafah bawah, maka busur antara benang dan tepi qaus adalah Irtifa\' (ketinggian sudut matahari di atas ufuk).',
    explanation: [
      'Untuk mencari Jaib dari Irtifa\': hitung sudut dari awal Qaus, telusuri garis Juyub Mabsuthah tegak lurus ke garis Sittini.',
      'Nilai Jaib = 60 × Sin(Irtifa\'). Jaib Tamam = 60 × Cos(Irtifa\').',
      'Untuk sudut di bawah 30°, nilai Jaib lebih besar dari sudutnya; di atas 30°, nilai Jaib lebih kecil dari sudutnya.'
    ],
    keyFormula: 'Jaib(h) = 60 × Sin(h) | Jaib Tamam(h) = 60 × Cos(h)',
    practicalTip: 'Jangan menatap matahari langsung dengan mata telanjang. Cukup perhatikan jatuhnya titik cahaya pada keping lubang hadafah bawah.'
  },
  {
    id: 'bab3',
    number: 'Bab III',
    title: 'Mail Syamsi (Deklinasi) & Ghayah Irtifa\' (Zawal)',
    titleAr: 'الباب الثالث : في معرفة الميل والغاية',
    summary: 'Menentukan posisi kemiringan matahari dari khatulistiwa dan ketinggian kulminasi puncak siang.',
    matanArabic: 'ضع الخيط على درجة الشمس وانزل من محل تقاطعه مع دائرة الميل في الجيوب المبسوطة إلى القوس فما بين منتهى المنزول إليه وأول القوس هو الميل... والغاية : تمام عرض بلدك إن لم يكن ميل، وإلا فزد عليه الميل إن اتفقا أو انقصه إن اختلفا.',
    translation: 'Letakkan benang pada derajat matahari dan turunkan dari titik potongnya dengan Dairah Mail pada garis Juyub Mabsuthah ke busur Qaus, maka itulah Mail (deklinasi matahari). Ghayah Irtifa\' (puncak kulminasi tengah hari): bila lintang dan deklinasi searah (sama-sama Selatan atau sama-sama Utara) maka dijumlahkan, jika berlawanan maka diselisihkan.',
    explanation: [
      'Derajat Syamsi dihitung dari tanggal Masehi ditambah tafawut buruj bulan bersangkutan.',
      'Bila tanggal + tafawut > 30, kurangi 30 dan buruj berpindah ke buruj berikutnya.',
      'Ghayah Irtifa\' (tinggi matahari saat tengah hari): 90° dikurangi selisih antara Lintang Tempat dan Mail (Tamamul Ghayah).'
    ],
    keyFormula: 'Ghayah = 90° - |φ - δ| (Ittifaq) atau 90° - (|φ| + |δ|) (Ikhtilaf)',
    practicalTip: 'Saat Ghayah Irtifa\' mencapai 90°, bayangan zawal menjadi tepat nol (disebut Istiwa\' A\'zam atau Shifr az-Zill).'
  },
  {
    id: 'bab4_5',
    number: 'Bab IV & V',
    title: 'Bu\'du Qutri, Ashal Muthlaq & Busur Siang/Malam',
    titleAr: 'الباب الرابع والخامس : في بعد القطر والأصل المطلق ونصف الفضلة',
    summary: 'Menghitung parameter bola langit untuk menentukan panjang siang dan malam di setiap belahan bumi.',
    matanArabic: 'ضع الخيط على عرض البلد وعلم بالمرِيين على دائرتي التجييب ثم انقله إلى الميل... فما بين الخيط وأول القوس هو نصف الفضلة... ونصف قوس النهار : تسعون وزد عليه نصف الفضلة إن كان الميل موافقا لعرض بلدك وإلا فانقصه.',
    translation: 'Letakkan benang pada lintang tempat dan tandai dengan dua muri pada busur tajyib, lalu pindahkan benang ke ukuran Mail. Jarak antara benang dan awal Qaus adalah Nisfu Fadhlah. Setengah Busur Siang (Nisfu Qaus An-Nahar) adalah 90° ditambah Nisfu Fadhlah jika lintang dan deklinasi sepihak, atau dikurangi jika berlawanan pihak.',
    explanation: [
      'Bu\'du Qutri (BQ) = Sin(φ) × Sin(δ) × 60. Ashal Muthlaq (AM) = Cos(φ) × Cos(δ) × 60.',
      'Nisfu Fadhlah (c): Sin(c) = BQ / AM = Tan(φ) × Tan(δ).',
      'Nisfu Qaus An-Nahar (setengah busur siang) = 90° ± Nisfu Fadhlah.',
      'Total waktu siang = (2 × Nisfu Qaus An-Nahar) / 15 jam.'
    ],
    keyFormula: 'Panjang Siang = (90° ± Nisfu Fadhlah) × 2 / 15 Jam',
    practicalTip: 'Di daerah khatulistiwa (Lintang 0° seperti Pontianak atau dekat khatulistiwa seperti Lombok -8°), variasi panjang siang dan malam sangat kecil (hanya selisih beberapa menit).'
  },
  {
    id: 'bab6_7_8',
    number: 'Bab VI, VII & VIII',
    title: 'Kaedah Zill (Bayangan Tongkat) & As-Sa\'ah al-Mu\'addalah',
    titleAr: 'الباب السادس والسابع والثامن : في الظل المنبسط والمنكوس والساعات المعدلة والزمانية',
    summary: 'Konversi antara tinggi matahari dan panjang bayangan tegak (Asabi\' 12 & Aqdam 7) serta pembagian jam istiwa\'.',
    matanArabic: 'إذا أردت الظل المنبسط من الارتفاع : فضع الخيط على الارتفاع وانظر ما قطعه على قائمته... والساعات الزمانية : تقسم نصف قوس النهار على ستة، فما خرج فهو مقدار الساعة الزمانية نهارا.',
    translation: 'Jika engkau ingin mengetahui panjang bayangan mendatar (Zill Mabsuth) dari ketinggian sudut matahari: letakkan benang pada nilai Irtifa\' dan perhatikan angka potongnya pada garis Qaimatuz-Zill. Jam Zamaniyah diperoleh dengan membagi Nisfu Qaus Nahar menjadi 6 bagian yang sama.',
    explanation: [
      'Zill Mabsuth (skala 12 jari): Z = 12 / Tan(h). Zill Aqdam (skala 7 kaki): Z = 7 / Tan(h).',
      'Terdapat dua sistem jam tradisional: Jam Mu\'addalah (jam rata 60 menit dengan 24 jam sehari) dan Jam Zamaniyah (jam musiman yang membagi siang jadi 12 bagian dan malam jadi 12 bagian).',
      'Kitab Taqribul Maqshad menggunakan Sa\'ah Mu\'addalah Zawaliyah (dimulai pk 12:00 saat matahari berkulminasi di zawal).'
    ],
    keyFormula: 'Zill Mabsuth = 12 × cot(h) | Zill Aqdam = 7 × cot(h)',
    practicalTip: 'Tongkat istiwa\' (mikyas) harus ditancapkan tegak lurus sempurna 90 derajat menggunakan lot timah (waterpass/syaqul).'
  },
  {
    id: 'bab9_10',
    number: 'Bab IX & X',
    title: 'Hisab Waktu Salat Lima Waktu & Imsak',
    titleAr: 'الباب التاسع والعاشر : في معرفة أوقات الصلوات الخمس والإمساك على حساب الساعة الزوالية',
    summary: 'Penetapan awal waktu salat Zohor, Asar (Awwal & Tsani), Magrib, Isya (17° & 19°), Subuh, Imsak, dan Dhuha.',
    matanArabic: 'أما الظهر : فهو ١٢ دائما... وأما العصر : فزد على ظلها قامة للعصر الأول أو قامتين للعصر الثاني... وأما المغرب : فهو نصف قوس النهار على ١٢... وأما العشاء : فبمغيب الشفق الأحمر أو الأبيض... وأما الفجر الثاني : فبطلوع الصبح الصادق.',
    translation: 'Waktu Zohor: saat zawal (matahari tergelincir dari meridian) yaitu pk 12:00 Zawaliyah. Waktu Asar: saat bayangan benda sama dengan panjang bendanya ditambah bayangan zawal (Asar 1 - Mazhab Syafi\'i) atau dua kali bendanya (Asar 2 - Mazhab Hanafi). Magrib: saat terbenam piringan matahari di ufuk barat. Isya: saat hilangnya syafaq merah (Jaib 17 / -17°) atau putih (Jaib 19 / -19°). Subuh: saat fajar shadiq terbit menyingsing di ufuk timur (Jaib 19 / -20°). Imsak: Subuh dikurangi da\'fu tamkin (10 menit pengaman).',
    explanation: [
      'Waktu Zohor = Zawal + Ihtiyath (Tamkin pengaman 2 menit).',
      'Waktu Asar dihitung dari tinggi matahari saat bayangan bertambah 1 qamah (Syafi\'i) atau 2 qamah (Hanafi).',
      'Waktu Magrib = Zawal + Nisfu Qaus Nahar / 15 + Tamkin.',
      'Waktu Isya Awwal (Jaib 17 / -17°) dan Isya Tsani (Jaib 19 / -19°).',
      'Waktu Subuh (Fajar Shadiq) = Zawal - t(-20°) + Tamkin.',
      'Waktu Imsak = Waktu Subuh - 10 menit (sebagai ihtiyath).'
    ],
    keyFormula: 'Imsak = Subuh - 10 mnt | Dhuha = Zawal - t(4.5° s/d 9.5°) | Asar: tan(zd)+1',
    practicalTip: 'Kementerian Agama RI menetapkan sudut Subuh -20° dan Isya -18° dengan tamkin standar 2 menit untuk kehati-hatian ibadah salat.'
  },
  {
    id: 'bab11_12',
    number: 'Bab XI & XII',
    title: 'Taqwimul Hilal & Rukyat Awal Bulan Qamariyah',
    titleAr: 'الباب الحادي عشر والثاني عشر : في معرفة مسير القمر ورؤية الهلال',
    summary: 'Menghitung posisi bulan, ketinggian hilal (irtifa\'), elongasi, dan kemungkinan rukyatul hilal awal Ramadan & Syawal.',
    matanArabic: 'إذا أردت معرفة رؤية الهلال فاعرف موضع الشمس والقمر وقت الغروب... فإن كان ارتفاعه أكثر من درجتين ونصف مع بعد كاف أمكنت الرؤية وإلا فلا.',
    translation: 'Bila engkau ingin mengetahui kemungkinan rukyatul hilal, hitunglah kedudukan matahari dan bulan saat matahari terbenam (Ghurub). Jika tinggi hilal dan jarak sudutnya (elongasi) melampaui batas imkanur rukyat, maka hilal dapat terlihat (visibilitas hilal).',
    explanation: [
      'Ijtima\' (konjungsi) terjadi ketika bujur matahari dan bujur bulan bernilai persis sama.',
      'Tinggi Hilal Hakiki dihitung dari ufuk toposentrik setelah dikoreksi paralaks bulan (Ikhtilaf al-Manzhar) dan refraksi.',
      'Kriteria MABIMS Baru (2022-sekarang) menetapkan tinggi minimal hilal 3° dan elongasi minimal 6.4°.'
    ],
    keyFormula: 'Irtifa\' Hilal > 3° & Elongasi > 6.4° (Kriteria MABIMS Baru)',
    practicalTip: 'Rukyatul hilal paling ideal dilakukan di tepi pantai barat atau bukit terbuka tanpa penghalang awan rendah dan polusi cahaya.'
  },
  {
    id: 'bab13',
    number: 'Bab XIII',
    title: 'Penentuan Arah Kiblat (Simmat Makkah)',
    titleAr: 'الباب الثالث عشر : في معرفة سمت مكة وجهتها من أي بلدة شئت',
    summary: 'Hisab arah Ka\'bah dari bujur dan lintang tempat relatif terhadap Makkah Al-Mukarramah.',
    matanArabic: 'اعرف فضل طوليهما مطلقا وفضل عرضيهما إن اتفقا وإلا فاجمعهما ثم عد فضل الطولين في مستوى جيب التمام... فما بين الخيط وأول القوس حينئذ فهو سمتها... وتعرف به القبلة.',
    translation: 'Ketahui selisih bujur (Fadlut-Tulain) dan selisih/gabungan lintang (Fadl/Majmu\' Ardaen). Hitung pada sumbu Jaib Tamam dan Sittini, pertemuannya menunjukkan sudut arah Ka\'bah Makkah. Itulah arah kiblat yang dituju dalam salat.',
    explanation: [
      'Koordinat Ka\'bah: Lintang 21° 25\' 21" LU (21.4225° N), Bujur 39° 49\' 34" BT (39.8262° E).',
      'Di seluruh kepulauan Indonesia (termasuk Gerung Lombok NTB), Ka\'bah berada di barat laut. Sudut diukur dari titik Barat condong ke Utara (B-U).',
      'Untuk Lombok Barat (Gerung): Fadlut Tulain = 116°07\' - 39°50\' = 76°17\', arah kiblat didapat 23° 11\' dari Barat ke Utara (Azimut 293° 11\').',
      'Peristiwa Istiwa\' A\'zam (Roshdul Qiblah) terjadi pada 27/28 Mei pk 16:18 WIB dan 15/16 Juli pk 16:27 WIB, saat matahari berada tepat di atas Ka\'bah.'
    ],
    keyFormula: 'cot(Q) = (cos(φ) × tan(φ_k) - sin(φ) × cos(f)) / sin(f)',
    practicalTip: 'Gunakan jam bayangan kiblat matahari (Istiwa\' / Roshdul Qiblat Harian) untuk mendapatkan akurasi penentuan kiblat paling presisi tanpa gangguan anomali magnetis logam kompas.'
  },
  {
    id: 'bab14',
    number: 'Bab XIV',
    title: 'Arah Mata Angin & Pengukuran Lapangan',
    titleAr: 'الباب الرابع عشر : في معرفة الجهات الأربع وخاتمة في بعض الهندسات',
    summary: 'Menentukan titik utara sejati dengan bayangan tongkat, mengukur tinggi pohon, kedalaman sumur, dan lebar sungai.',
    matanArabic: 'تسوي الأرض غاية التسوية بالميزان وترسم عليها دائرة... وتنصب على مركزها مقياسا مخروطا... وتنصف القوس الواقع بينهما وتخرج خطا مستقيما فهو خط الشمال والجنوب... وفي الهندسة : تقيس الارتفاع ٤٥ درجة فيكون بعدك عن أصل الشجرة مع قامة قامتك هو علوها.',
    translation: 'Ratakan tanah dengan waterpass dan buat lingkaran datar. Tancapkan tongkat di tengahnya, tandai titik masuk bayangan pagi pada lingkaran dan titik keluar bayangan sore. Garis tengah pembagi dua busur tersebut adalah garis Utara-Selatan sejati (Metode Lingkaran Hindi).',
    explanation: [
      'Metode Dairah Hindiyah: Menentukan 4 mata angin murni berbasis bayangan matahari, bebas dari deklinasi magnetik kompas.',
      'Mengukur Tinggi Pohon/Menara Masjid (Hal. 219): Dengan membidik sudut 45°, jarak mendatar pengamat ke dasar menara ditambah tinggi mata pengamat sama persis dengan tinggi menara tersebut!',
      'Mengukur Kedalaman Sumur (Hal. 222): Diameter mulut sumur dikalikan tangen sudut inkhifadh dari bibir sumur ke permukaan air.',
      'Mengukur Lebar Sungai (Hal. 225): Membidik tepi seberang sungai dengan hadafah Rubu\', lalu melangkah menyusuri tepian rata hingga benang mencapai sudut bidikan awal.'
    ],
    keyFormula: 'Tinggi Pohon (45°) = Jarak Datar + Tinggi Mata | Kedalaman Sumur = Diameter × tan(θ)',
    practicalTip: 'Metode ini sangat praktis bagi petugas hisab rukyat KUA dan pengurus takmir masjid dalam mengukur ketinggian kubah menara tanpa perlu memanjat.'
  }
];

interface CalculationGuideViewProps {
  initialModeBaca?: boolean;
}

export const CalculationGuideView: React.FC<CalculationGuideViewProps> = ({
  initialModeBaca = false
}) => {
  // Mode Baca status: default active if initialModeBaca is true
  const [isReadingMode, setIsReadingMode] = useState<boolean>(() => {
    if (initialModeBaca) return true;
    const saved = localStorage.getItem('taqribul_reading_mode');
    return saved === 'true';
  });

  const [expandedChapter, setExpandedChapter] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reader Mode preferences
  const [readerTheme, setReaderTheme] = useState<'kertas' | 'sepia' | 'malam'>(() => {
    return (localStorage.getItem('taqribul_reader_theme') as any) || 'sepia';
  });

  const [fontSizeLevel, setFontSizeLevel] = useState<number>(() => {
    const saved = localStorage.getItem('taqribul_reader_font_size');
    return saved ? parseInt(saved, 10) : 2; // 1: small, 2: medium, 3: large, 4: extra large
  });

  const [showMatan, setShowMatan] = useState<boolean>(true);
  const [showTranslation, setShowTranslation] = useState<boolean>(true);
  const [showExplanation, setShowExplanation] = useState<boolean>(true);
  const [showFormula, setShowFormula] = useState<boolean>(true);

  const [flowMode, setFlowMode] = useState<'single' | 'continuous'>('single');
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);

  // Bookmark
  const [bookmarkedId, setBookmarkedId] = useState<string>(() => {
    return localStorage.getItem('taqribul_bookmarked_chapter') || 'intro';
  });

  // TTS Speech
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechChapterId, setSpeechChapterId] = useState<string | null>(null);

  // Copy Feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('taqribul_reading_mode', isReadingMode ? 'true' : 'false');
  }, [isReadingMode]);

  useEffect(() => {
    localStorage.setItem('taqribul_reader_theme', readerTheme);
  }, [readerTheme]);

  useEffect(() => {
    localStorage.setItem('taqribul_reader_font_size', fontSizeLevel.toString());
  }, [fontSizeLevel]);

  // Handle Speech cleanup
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeech = (chap: Chapter) => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    if (isSpeaking && speechChapterId === chap.id) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeechChapterId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = `${chap.number}. ${chap.title}. Terjemahan Makna: ${chap.translation}. Kajian dan Kaidah Perhitungan: ${chap.explanation.join('. ')}. ${chap.practicalTip ? `Petunjuk Praktis Lapangan: ${chap.practicalTip}` : ''}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'id-ID';
    utterance.rate = 0.95;

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeechChapterId(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeechChapterId(null);
    };

    setIsSpeaking(true);
    setSpeechChapterId(chap.id);
    window.speechSynthesis.speak(utterance);
  };

  const handleBookmark = (id: string) => {
    setBookmarkedId(id);
    localStorage.setItem('taqribul_bookmarked_chapter', id);
  };

  const handleCopyChapter = (chap: Chapter) => {
    const content = `*${chap.number}: ${chap.title}*\n_${chap.titleAr}_\n\nMatan Asli:\n${chap.matanArabic}\n\nTerjemahan:\n${chap.translation}\n\nKajian Kaidah:\n${chap.explanation.map((e, i) => `${i + 1}. ${e}`).join('\n')}\n\nRumus Kunci: ${chap.keyFormula || '-'}\n\nSumber: Kitab Taqribul Maqshad - KUA Gerung Lombok Barat`;
    navigator.clipboard.writeText(content);
    setCopiedId(chap.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const filteredChapters = CHAPTERS.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.translation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Font size classes
  const getArabicFontSizeClass = () => {
    switch (fontSizeLevel) {
      case 1:
        return 'text-lg leading-loose';
      case 3:
        return 'text-2xl leading-loose';
      case 4:
        return 'text-3xl leading-loose';
      case 2:
      default:
        return 'text-xl leading-loose';
    }
  };

  const getBodyFontSizeClass = () => {
    switch (fontSizeLevel) {
      case 1:
        return 'text-xs leading-relaxed';
      case 3:
        return 'text-base leading-relaxed';
      case 4:
        return 'text-lg leading-relaxed';
      case 2:
      default:
        return 'text-sm leading-relaxed';
    }
  };

  // Theme styling for Reader Mode container
  const getReaderThemeStyles = () => {
    switch (readerTheme) {
      case 'sepia':
        return 'bg-[#fcf8ed] text-[#3d2b1f] border-[#e8ddc4] dark:bg-[#2d241c] dark:text-[#f4ede2] dark:border-[#42362b]';
      case 'malam':
        return 'bg-[#0f172a] text-[#f8fafc] border-[#1e293b] dark:bg-[#090d16] dark:text-[#f1f5f9] dark:border-[#1e293b]';
      case 'kertas':
      default:
        return 'bg-white text-neutral-900 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-800';
    }
  };

  const currentChapter = CHAPTERS[activeChapterIndex] || CHAPTERS[0];

  return (
    <div className="space-y-5">
      {/* Top Header & Mode Baca Switcher */}
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:bg-neutral-900">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Kajian Ilmiah Kitab Falak
            </span>
            <span className="font-serif text-xs text-neutral-400">
              ترجمة ودراسة متن تقريب المقصد
            </span>
            {isReadingMode && (
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-neutral-950 uppercase animate-pulse">
                Mode Baca Aktif
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
            <span>Panduan & Matan Kitab Taqribul Maqshad</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Karya Syaikh Muhammad Mukhtar Al-Bogori • Telaah Ilmu Falak Rubu' Mujayyab & Arah Kiblat KUA Kec. Gerung Lobar
          </p>
        </div>

        {/* Action Controls: Mode Baca Toggle & Search */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-toggle-reading-mode"
            onClick={() => setIsReadingMode(!isReadingMode)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
              isReadingMode
                ? 'bg-amber-500 text-neutral-950 hover:bg-amber-400 ring-2 ring-amber-400/40'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
            title="Beralih ke Mode Baca Nyaman"
          >
            <Glasses className="h-4 w-4" />
            <span>{isReadingMode ? 'Matikan Mode Baca' : 'Aktifkan Mode Baca'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE BACA AKTIF (FOCUSED READER EXPERIENCE)                               */}
      {/* ========================================================================= */}
      {isReadingMode ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Bilah Pengaturan Mode Baca (Floating Reader Controls) */}
          <div className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200/90 bg-white/95 p-3.5 shadow-md backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95 text-xs">
            {/* 1. Tema Kertas / Warna Latar */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-neutral-500 dark:text-neutral-400 hidden sm:inline">
                Kertas:
              </span>
              <div className="flex rounded-xl bg-neutral-100 p-0.5 dark:bg-neutral-800">
                <button
                  onClick={() => setReaderTheme('kertas')}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition ${
                    readerTheme === 'kertas'
                      ? 'bg-white shadow-xs text-neutral-900 font-bold dark:bg-neutral-700 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                  title="Tema Kertas Putih"
                >
                  <Sun className="h-3 w-3" />
                  <span>Kertas</span>
                </button>
                <button
                  onClick={() => setReaderTheme('sepia')}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition ${
                    readerTheme === 'sepia'
                      ? 'bg-[#f5ebd7] shadow-xs text-[#5c3e1e] font-bold'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                  title="Tema Sepia Klasik (Hangat untuk Mata)"
                >
                  <Feather className="h-3 w-3" />
                  <span>Sepia</span>
                </button>
                <button
                  onClick={() => setReaderTheme('malam')}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition ${
                    readerTheme === 'malam'
                      ? 'bg-neutral-900 shadow-xs text-emerald-400 font-bold'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                  title="Tema Malam Gelap (Hemat Baterai & Cahaya Redup)"
                >
                  <Moon className="h-3 w-3" />
                  <span>Malam</span>
                </button>
              </div>
            </div>

            {/* 2. Ukuran Huruf (Font Scaling) */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-neutral-500 dark:text-neutral-400 hidden sm:inline">
                Ukuran:
              </span>
              <div className="flex rounded-xl bg-neutral-100 p-0.5 dark:bg-neutral-800">
                <button
                  onClick={() => setFontSizeLevel(Math.max(1, fontSizeLevel - 1))}
                  disabled={fontSizeLevel <= 1}
                  className="rounded-lg px-2 py-1 font-bold text-neutral-700 hover:bg-neutral-200 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  title="Perkecil Tulisan"
                >
                  A-
                </button>
                <span className="px-2 py-1 font-mono text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                  {fontSizeLevel === 1 ? '75%' : fontSizeLevel === 2 ? '100%' : fontSizeLevel === 3 ? '125%' : '150%'}
                </span>
                <button
                  onClick={() => setFontSizeLevel(Math.min(4, fontSizeLevel + 1))}
                  disabled={fontSizeLevel >= 4}
                  className="rounded-lg px-2 py-1 font-bold text-neutral-700 hover:bg-neutral-200 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  title="Perbesar Tulisan"
                >
                  A+
                </button>
              </div>
            </div>

            {/* 3. Filter Tampilan Elemen */}
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setShowMatan(!showMatan)}
                className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition border ${
                  showMatan
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'border-neutral-200 text-neutral-400 dark:border-neutral-800'
                }`}
              >
                Matan Arab
              </button>
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition border ${
                  showTranslation
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'border-neutral-200 text-neutral-400 dark:border-neutral-800'
                }`}
              >
                Terjemahan
              </button>
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition border ${
                  showExplanation
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'border-neutral-200 text-neutral-400 dark:border-neutral-800'
                }`}
              >
                Kajian
              </button>
              <button
                onClick={() => setShowFormula(!showFormula)}
                className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition border ${
                  showFormula
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'border-neutral-200 text-neutral-400 dark:border-neutral-800'
                }`}
              >
                Rumus
              </button>
            </div>

            {/* 4. Alur Baca: Per Bab vs Kitab Mengalir */}
            <div className="flex rounded-xl bg-neutral-100 p-0.5 dark:bg-neutral-800">
              <button
                onClick={() => setFlowMode('single')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  flowMode === 'single'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Fokus Per Bab
              </button>
              <button
                onClick={() => setFlowMode('continuous')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  flowMode === 'continuous'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Kitab Utuh
              </button>
            </div>
          </div>

          {/* Bookmark Quick Access Banner */}
          {bookmarkedId && (
            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  Terakhir Ditandai:{' '}
                  <strong>
                    {CHAPTERS.find((c) => c.id === bookmarkedId)?.number} -{' '}
                    {CHAPTERS.find((c) => c.id === bookmarkedId)?.title}
                  </strong>
                </span>
              </div>
              <button
                onClick={() => {
                  const idx = CHAPTERS.findIndex((c) => c.id === bookmarkedId);
                  if (idx !== -1) {
                    setActiveChapterIndex(idx);
                    setFlowMode('single');
                  }
                }}
                className="font-bold underline hover:text-amber-700"
              >
                Lanjutkan Baca
              </button>
            </div>
          )}

          {/* READER CONTENT AREA */}
          {flowMode === 'single' ? (
            /* --- SUB-MODE: FOKUS SATU BAB DENGAN NAVIGASI PREV / NEXT --- */
            <div className={`rounded-2xl border p-6 sm:p-8 shadow-md space-y-6 transition-all ${getReaderThemeStyles()}`}>
              {/* Top Chapter Header & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/10 pb-4 dark:border-white/10 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {currentChapter.number}
                    </span>
                    <span className="font-serif text-sm opacity-60">
                      {currentChapter.titleAr}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                    {currentChapter.title}
                  </h3>
                  <p className="text-xs opacity-75">{currentChapter.summary}</p>
                </div>

                {/* Chapter Actions: Bookmark, TTS, Copy */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleBookmark(currentChapter.id)}
                    className={`rounded-xl border p-2 transition ${
                      bookmarkedId === currentChapter.id
                        ? 'border-amber-400 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                        : 'border-neutral-300 hover:bg-black/5 dark:border-neutral-700'
                    }`}
                    title="Tandai Bab Ini Sebagai Terakhir Dibaca"
                  >
                    <Bookmark className={`h-4 w-4 ${bookmarkedId === currentChapter.id ? 'fill-amber-500 text-amber-600' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleToggleSpeech(currentChapter)}
                    className={`rounded-xl border p-2 transition ${
                      isSpeaking && speechChapterId === currentChapter.id
                        ? 'border-emerald-500 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 animate-pulse'
                        : 'border-neutral-300 hover:bg-black/5 dark:border-neutral-700'
                    }`}
                    title="Dengarkan Pembacaan Suara (Audio Falak)"
                  >
                    {isSpeaking && speechChapterId === currentChapter.id ? (
                      <VolumeX className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleCopyChapter(currentChapter)}
                    className="rounded-xl border border-neutral-300 p-2 hover:bg-black/5 dark:border-neutral-700 transition"
                    title="Salin Isi Bab"
                  >
                    {copiedId === currentChapter.id ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Matan Arabic */}
              {showMatan && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <span>Ibarat Matan Asli (Bahasa Arab):</span>
                    <span className="font-serif">متن تقريب المقصد</span>
                  </div>
                  <p className={`font-serif text-right leading-loose tracking-wide ${getArabicFontSizeClass()}`} dir="rtl">
                    {currentChapter.matanArabic}
                  </p>
                </div>
              )}

              {/* Translation */}
              {showTranslation && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Terjemahan Makna:
                  </span>
                  <p className={`leading-relaxed opacity-90 ${getBodyFontSizeClass()}`}>
                    {currentChapter.translation}
                  </p>
                </div>
              )}

              {/* Explanation / Syarah */}
              {showExplanation && (
                <div className="space-y-2 border-t border-black/10 pt-4 dark:border-white/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Kajian & Kaidah Perhitungan Falak:
                  </span>
                  <ul className="list-disc list-inside space-y-2 opacity-90">
                    {currentChapter.explanation.map((item, idx) => (
                      <li key={idx} className={`leading-relaxed ${getBodyFontSizeClass()}`}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Formula */}
              {showFormula && currentChapter.keyFormula && (
                <div className="rounded-xl bg-neutral-900/90 p-4 text-white font-mono text-xs dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-700/30 flex items-center justify-between flex-wrap gap-2">
                  <span className="font-sans font-bold uppercase tracking-wider text-neutral-400 text-[10px]">
                    Rumus Kaidah:
                  </span>
                  <span className="font-bold text-sm text-emerald-300">{currentChapter.keyFormula}</span>
                </div>
              )}

              {/* Practical Tip */}
              {currentChapter.practicalTip && (
                <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 p-3.5 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Petunjuk Praktis Lapangan: </span>
                    <span>{currentChapter.practicalTip}</span>
                  </div>
                </div>
              )}

              {/* Bottom Chapter Navigation Bar */}
              <div className="flex items-center justify-between border-t border-black/10 pt-5 dark:border-white/10">
                <button
                  onClick={() => setActiveChapterIndex(Math.max(0, activeChapterIndex - 1))}
                  disabled={activeChapterIndex === 0}
                  className="flex items-center gap-1.5 rounded-xl border border-neutral-300 px-4 py-2 text-xs font-bold transition hover:bg-black/5 disabled:opacity-30 dark:border-neutral-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Bab Sebelumnya</span>
                </button>

                {/* Chapter Selector Dropdown */}
                <select
                  value={activeChapterIndex}
                  onChange={(e) => setActiveChapterIndex(Number(e.target.value))}
                  className="rounded-xl border border-neutral-300 bg-transparent px-3 py-2 text-xs font-semibold dark:border-neutral-700"
                >
                  {CHAPTERS.map((chap, idx) => (
                    <option key={chap.id} value={idx} className="text-neutral-900">
                      {chap.number} - {chap.title}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() =>
                    setActiveChapterIndex(Math.min(CHAPTERS.length - 1, activeChapterIndex + 1))
                  }
                  disabled={activeChapterIndex === CHAPTERS.length - 1}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-30"
                >
                  <span>Bab Selanjutnya</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            /* --- SUB-MODE: CONTINUOUS BOOK READING (KITAB LENGKAP MENGALIR) --- */
            <div className="space-y-6">
              {CHAPTERS.map((chap, index) => (
                <div
                  key={chap.id}
                  id={`chapter-${chap.id}`}
                  className={`rounded-2xl border p-6 sm:p-8 shadow-md space-y-5 transition-all ${getReaderThemeStyles()}`}
                >
                  <div className="flex items-center justify-between border-b border-black/10 pb-3 dark:border-white/10">
                    <div className="space-y-0.5">
                      <span className="font-mono text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">
                        {chap.number}
                      </span>
                      <h3 className="text-xl font-bold tracking-tight">{chap.title}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleBookmark(chap.id)}
                        className={`rounded-lg p-1.5 border ${
                          bookmarkedId === chap.id
                            ? 'border-amber-400 bg-amber-100 text-amber-900'
                            : 'border-neutral-200 dark:border-neutral-800'
                        }`}
                        title="Tandai Bab Ini"
                      >
                        <Bookmark className={`h-3.5 w-3.5 ${bookmarkedId === chap.id ? 'fill-amber-500 text-amber-600' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleCopyChapter(chap)}
                        className="rounded-lg p-1.5 border border-neutral-200 dark:border-neutral-800"
                        title="Salin Teks"
                      >
                        {copiedId === chap.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {showMatan && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <p className={`font-serif text-right leading-loose ${getArabicFontSizeClass()}`} dir="rtl">
                        {chap.matanArabic}
                      </p>
                    </div>
                  )}

                  {showTranslation && (
                    <p className={`leading-relaxed opacity-90 ${getBodyFontSizeClass()}`}>
                      {chap.translation}
                    </p>
                  )}

                  {showExplanation && (
                    <ul className="list-disc list-inside space-y-1.5 opacity-90 text-xs">
                      {chap.explanation.map((item, idx) => (
                        <li key={idx} className={getBodyFontSizeClass()}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {showFormula && chap.keyFormula && (
                    <div className="rounded-lg bg-neutral-900/90 px-3.5 py-2 text-white font-mono text-xs dark:bg-emerald-950/80">
                      <span className="text-emerald-300 font-bold">{chap.keyFormula}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE DAFTAR BAB BIASA (ACCORDION / EXPLORER VIEW)                         */
        /* ========================================================================= */
        <div className="space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
            <input
              id="input-search-guide"
              type="text"
              placeholder="Cari materi bab, rumus, atau istilah falak..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-xs text-neutral-800 focus:border-emerald-500 focus:outline-hidden dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 shadow-xs"
            />
          </div>

          {/* Chapters Accordion List */}
          <div className="space-y-3">
            {filteredChapters.map((chap, idx) => {
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
                      {/* Arabic Matan */}
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/15">
                        <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                          Ibarat Matan Asli (Arab):
                        </span>
                        <p className="mt-1 font-serif text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 text-right dir-rtl">
                          {chap.matanArabic}
                        </p>
                      </div>

                      {/* Translation */}
                      <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800/50">
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                          Terjemahan Makna:
                        </span>
                        <p className="mt-1 text-neutral-600 leading-relaxed dark:text-neutral-300">
                          {chap.translation}
                        </p>
                      </div>

                      {/* Explanation */}
                      <div className="space-y-2">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          Kajian & Kaidah Perhitungan:
                        </span>
                        <ul className="list-disc list-inside space-y-1.5 text-neutral-600 dark:text-neutral-400">
                          {chap.explanation.map((item, i) => (
                            <li key={i} className="leading-relaxed">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Key Formula */}
                      {chap.keyFormula && (
                        <div className="flex items-center justify-between rounded-xl bg-neutral-900 px-4 py-2.5 text-white font-mono text-xs dark:bg-emerald-950/60 dark:text-emerald-200">
                          <span>Rumus Kunci:</span>
                          <span className="font-bold">{chap.keyFormula}</span>
                        </div>
                      )}

                      {/* Button to open this chapter in Mode Baca */}
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => {
                            setActiveChapterIndex(idx);
                            setIsReadingMode(true);
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition"
                        >
                          <Glasses className="h-3.5 w-3.5" />
                          <span>Buka Bab Ini di Mode Baca Nyaman</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
