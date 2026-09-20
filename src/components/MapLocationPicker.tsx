import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Crosshair,
  Search,
  Check,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Star,
  Bookmark
} from 'lucide-react';
import { CityLocation, FavoriteLocation } from '../types';
import { CITIES_DATABASE, DEFAULT_CITY } from '../utils/cityDatabase';
import { KABAH_COORDS, formatDM, formatDMS, calculateQibla } from '../utils/falakMath';

interface MapLocationPickerProps {
  currentCity: CityLocation;
  onSelectCity: (city: CityLocation) => void;
  onClose?: () => void;
  favoriteLocations?: FavoriteLocation[];
  onSaveFavorite?: (fav: FavoriteLocation) => void;
}

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  currentCity,
  onSelectCity,
  onClose,
  favoriteLocations = [],
  onSaveFavorite
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const qiblaLineRef = useRef<L.Polyline | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [tempLocation, setTempLocation] = useState<CityLocation>(currentCity);
  const [saveFavSuccess, setSaveFavSuccess] = useState(false);
  const [panelTab, setPanelTab] = useState<'preset' | 'favorit'>('preset');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentCity.latitude, currentCity.longitude],
      zoom: 6,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap kontributor',
      maxZoom: 18
    }).addTo(map);

    // Ka'bah Marker
    const kabahIcon = L.divIcon({
      className: 'custom-kabah-marker',
      html: `
        <div style="background-color: #111; color: #ffd700; border: 2px solid #10b981; border-radius: 8px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
          🕋
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    L.marker([KABAH_COORDS.latitude, KABAH_COORDS.longitude], {
      icon: kabahIcon,
      title: "Ka'bah, Makkah Al-Mukarramah"
    })
      .addTo(map)
      .bindPopup("<b>Ka'bah, Makkah</b><br>Kiblat Dunia Islam");

    // User Location Marker
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="background-color: #059669; color: white; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
          📍
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const userMarker = L.marker([currentCity.latitude, currentCity.longitude], {
      icon: userIcon,
      draggable: true
    }).addTo(map);

    userMarkerRef.current = userMarker;

    // Qibla Line connecting User to Ka'bah
    const qiblaLine = L.polyline(
      [
        [currentCity.latitude, currentCity.longitude],
        [KABAH_COORDS.latitude, KABAH_COORDS.longitude]
      ],
      {
        color: '#10b981',
        weight: 3,
        dashArray: '6, 8',
        opacity: 0.85
      }
    ).addTo(map);

    qiblaLineRef.current = qiblaLine;

    // Click handler on map to place marker
    map.on('click', (e: L.LeafletMouseEvent) => {
      handleLocationChange(e.latlng.lat, e.latlng.lng, 'Koordinat Peta Dipilih');
    });

    userMarker.on('dragend', () => {
      const pos = userMarker.getLatLng();
      handleLocationChange(pos.lat, pos.lng, 'Koordinat Kustom Geser');
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map when tempLocation changes
  const handleLocationChange = (lat: number, lng: number, labelName?: string) => {
    const latAbs = Math.abs(lat);
    const lonAbs = Math.abs(lng);

    // Approximate timezone based on Indonesian and world longitude
    let tz = 7;
    let tzName = 'WIB';
    if (lng >= 115 && lng < 125) {
      tz = 8;
      tzName = 'WITA';
    } else if (lng >= 125) {
      tz = 9;
      tzName = 'WIT';
    } else if (lng >= 30 && lng < 50) {
      tz = 3;
      tzName = 'AST';
    }

    const newCity: CityLocation = {
      name: labelName || `Lokasi (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      country: 'Kustom',
      latitude: lat,
      longitude: lng,
      latDeg: Math.floor(latAbs),
      latMin: Math.round((latAbs - Math.floor(latAbs)) * 60),
      latDir: lat >= 0 ? 'U' : 'S',
      lonDeg: Math.floor(lonAbs),
      lonMin: Math.round((lonAbs - Math.floor(lonAbs)) * 60),
      lonDir: lng >= 0 ? 'T' : 'B',
      timezone: tz,
      timezoneName: tzName
    };

    setTempLocation(newCity);

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
    }
    if (qiblaLineRef.current) {
      qiblaLineRef.current.setLatLngs([
        [lat, lng],
        [KABAH_COORDS.latitude, KABAH_COORDS.longitude]
      ]);
    }
  };

  // GPS Auto-detect
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung geolokasi GPS.');
      return;
    }

    setIsDetectingGPS(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGPS(false);
        const { latitude, longitude } = pos.coords;
        handleLocationChange(latitude, longitude, 'Posisi GPS Otomatis');

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 12, { duration: 1.5 });
        }
      },
      (err) => {
        setIsDetectingGPS(false);
        setGpsError(`Gagal mendapatkan sinyal GPS: ${err.message}. Pastikan izin lokasi aktif.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const filteredCities = CITIES_DATABASE.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectFromPreset = (city: CityLocation) => {
    setTempLocation(city);
    if (mapInstanceRef.current && userMarkerRef.current && qiblaLineRef.current) {
      mapInstanceRef.current.flyTo([city.latitude, city.longitude], 10, { duration: 1.2 });
      userMarkerRef.current.setLatLng([city.latitude, city.longitude]);
      qiblaLineRef.current.setLatLngs([
        [city.latitude, city.longitude],
        [KABAH_COORDS.latitude, KABAH_COORDS.longitude]
      ]);
    }
  };

  const handleApply = () => {
    onSelectCity(tempLocation);
    if (onClose) onClose();
  };

  const previewQibla = calculateQibla(tempLocation);

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Peta Lokasi & Koordinat Falak
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Pilih titik koordinat melalui GPS otomatis, klik pada peta, atau cari daftar kota kitab.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onSaveFavorite && (
            <button
              id="btn-save-to-favorites"
              type="button"
              onClick={() => {
                const fav: FavoriteLocation = {
                  id: `fav-${Date.now()}`,
                  name: tempLocation.name || 'Lokasi Peta',
                  category: 'masjid',
                  latitude: tempLocation.latitude,
                  longitude: tempLocation.longitude,
                  city: tempLocation,
                  notes: 'Disimpan dari Peta Interaktif',
                  addedAt: new Date().toISOString()
                };
                onSaveFavorite(fav);
                setSaveFavSuccess(true);
                setTimeout(() => setSaveFavSuccess(false), 3500);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 shadow-xs transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
              title="Simpan titik ini ke daftar Lokasi Favorit"
            >
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>{saveFavSuccess ? 'Tersimpan!' : 'Simpan Favorit'}</span>
            </button>
          )}

          <button
            id="btn-detect-gps"
            onClick={handleDetectGPS}
            disabled={isDetectingGPS}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <Crosshair className={`h-4 w-4 ${isDetectingGPS ? 'animate-spin' : ''}`} />
            <span>{isDetectingGPS ? 'Mencari GPS...' : 'GPS Otomatis'}</span>
          </button>

          <button
            id="btn-apply-location"
            onClick={handleApply}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-800 dark:bg-emerald-500 dark:text-neutral-950 dark:hover:bg-emerald-400"
          >
            <Check className="h-4 w-4" />
            <span>Terapkan Lokasi</span>
          </button>
        </div>
      </div>

      {saveFavSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-100/70 p-2.5 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200 animate-in fade-in duration-200">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
          <span>Lokasi <strong>"{tempLocation.name}"</strong> berhasil disimpan ke daftar Lokasi Favorit dan siap dicadangkan ke JSON!</span>
        </div>
      )}

      {gpsError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Main Container: Map on Left, Selector & Coordinates on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Interactive Leaflet Map */}
        <div className="relative h-[380px] w-full overflow-hidden rounded-2xl border border-neutral-200/80 shadow-sm lg:col-span-8 dark:border-neutral-800">
          <div ref={mapContainerRef} className="h-full w-full z-0" />

          {/* Overlay Tag */}
          <div className="absolute top-3 right-3 z-10 rounded-lg bg-white/90 px-3 py-1.5 text-[11px] font-medium text-neutral-700 shadow-sm backdrop-blur-xs dark:bg-neutral-900/90 dark:text-neutral-200">
            Garis hijau putus-putus: Arah lurus menuju Ka'bah
          </div>
        </div>

        {/* Selected Coordinates & Search Panel */}
        <div className="space-y-4 lg:col-span-4">
          {/* Active Coordinate Card */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Koordinat Dipilih
            </span>
            <div className="mt-2 text-base font-bold text-neutral-900 dark:text-white truncate">
              {tempLocation.name}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="rounded-lg bg-neutral-50 p-2 dark:bg-neutral-800/60">
                <span className="text-[10px] text-neutral-400">Lintang (Ardul Balad):</span>
                <div className="font-bold text-neutral-800 dark:text-neutral-200">
                  {formatDMS(tempLocation.latitude)} {tempLocation.latDir}
                </div>
                <span className="text-[10px] text-neutral-400">
                  {tempLocation.latitude.toFixed(4)}°
                </span>
              </div>

              <div className="rounded-lg bg-neutral-50 p-2 dark:bg-neutral-800/60">
                <span className="text-[10px] text-neutral-400">Bujur (Thulul Balad):</span>
                <div className="font-bold text-neutral-800 dark:text-neutral-200">
                  {formatDMS(tempLocation.longitude)} {tempLocation.lonDir}
                </div>
                <span className="text-[10px] text-neutral-400">
                  {tempLocation.longitude.toFixed(4)}°
                </span>
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-emerald-50/60 p-2.5 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
              <div className="flex justify-between">
                <span>Azimut Kiblat:</span>
                <span className="font-mono font-bold">{previewQibla.azimuth}°</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Jarak ke Ka'bah:</span>
                <span className="font-mono font-bold">{previewQibla.distanceKm.toLocaleString('id-ID')} km</span>
              </div>
            </div>
          </div>

          {/* Preset City vs Favorite Locations Switcher */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-3">
            <div className="flex border-b border-neutral-100 dark:border-neutral-800 pb-2 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPanelTab('preset')}
                className={`pb-1 px-1 border-b-2 transition ${
                  panelTab === 'preset'
                    ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                    : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                Kota Kitab Falak
              </button>
              <button
                type="button"
                onClick={() => setPanelTab('favorit')}
                className={`pb-1 px-1 border-b-2 transition flex items-center gap-1 ${
                  panelTab === 'favorit'
                    ? 'border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-400'
                    : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                <span>Lokasi Favorit ({favoriteLocations.length})</span>
              </button>
            </div>

            {panelTab === 'preset' ? (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
                  <input
                    id="input-search-cities"
                    type="text"
                    placeholder="Cari kota dari kitab..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-1.5 pl-8 pr-3 text-xs text-neutral-800 placeholder-neutral-400 transition focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                  />
                </div>

                {/* List of matching cities */}
                <div className="max-h-44 overflow-y-auto divide-y divide-neutral-100 pr-1 text-xs dark:divide-neutral-800">
                  {filteredCities.slice(0, 15).map((city) => (
                    <button
                      key={`${city.name}-${city.country}`}
                      onClick={() => handleSelectFromPreset(city)}
                      className={`flex w-full items-center justify-between py-2 text-left transition hover:text-emerald-600 ${
                        tempLocation.name === city.name
                          ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                          : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <span className="truncate">{city.name}</span>
                      <span className="text-[11px] text-neutral-400 shrink-0 ml-2">
                        {city.latDeg}°{city.latMin}' {city.latDir}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="max-h-56 overflow-y-auto divide-y divide-neutral-100 pr-1 text-xs dark:divide-neutral-800">
                {favoriteLocations.length === 0 ? (
                  <p className="py-4 text-center text-[11px] text-neutral-400">
                    Belum ada lokasi favorit tersimpan. Klik "Simpan Favorit" di atas untuk menambahkan titik saat ini.
                  </p>
                ) : (
                  favoriteLocations.map((fav) => (
                    <button
                      key={fav.id}
                      onClick={() => {
                        handleSelectFromPreset(fav.city);
                      }}
                      className={`flex w-full items-center justify-between py-2 text-left transition hover:text-amber-600 ${
                        tempLocation.name === fav.name
                          ? 'font-semibold text-amber-600 dark:text-amber-400'
                          : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-semibold truncate">{fav.name}</div>
                        <div className="text-[10px] text-neutral-400 uppercase">{fav.category}</div>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400 shrink-0 ml-2">
                        {formatDMS(fav.latitude)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
