import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./LocationPicker.module.css";

// Fix ícono de Leaflet con Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Ícono personalizado rojo para el negocio
const businessIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize:    [25, 41],
  iconAnchor:  [12, 41],
  popupAnchor: [1, -34],
  shadowSize:  [41, 41],
});

// Centro por defecto: Presidencia Roque Sáenz Peña, Chaco
const DEFAULT_CENTER = { lat: -26.7909, lng: -60.4437 };
const DEFAULT_ZOOM   = 14;

// ── Sub-componente: mueve el mapa cuando cambia el centro ─────────────────────
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView([center.lat, center.lng], DEFAULT_ZOOM, { animate: true });
  }, [center, map]);
  return null;
}

// ── Sub-componente: maneja clics en el mapa ───────────────────────────────────
function ClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function LocationPicker({ value, onChange, label = "Ubicación del negocio" }) {
  // value: { lat, lng, address } | null
  const [searchQuery,   setSearchQuery]   = useState(value?.address || "");
  const [mapCenter,     setMapCenter]     = useState(value || DEFAULT_CENTER);
  const [markerPos,     setMarkerPos]     = useState(value || null);
  const [searching,     setSearching]     = useState(false);
  const [searchError,   setSearchError]   = useState("");
  const [suggestions,   setSuggestions]   = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

  // Sincronizar si value cambia desde afuera
  useEffect(() => {
    if (value?.lat && value?.lng) {
      setMarkerPos({ lat: value.lat, lng: value.lng });
      setMapCenter({ lat: value.lat, lng: value.lng });
      if (value.address) setSearchQuery(value.address);
    }
  }, []);

  // ── Geocoding con Nominatim (OpenStreetMap, gratuito) ──────────────────────
  const searchAddress = useCallback(async (query) => {
    if (!query || query.trim().length < 4) { setSuggestions([]); return; }
    setSearching(true);
    setSearchError("");
    try {
      // Bias hacia Argentina/Chaco para mejores resultados locales
      const url = `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query + ", Chaco, Argentina")}` +
        `&format=json&addressdetails=1&limit=5&countrycodes=ar`;

      const res  = await fetch(url, { headers: { "Accept-Language": "es" } });
      const data = await res.json();

      if (data.length === 0) {
        setSearchError("No encontramos esa dirección. Probá con otra o hacé clic en el mapa.");
        setSuggestions([]);
      } else {
        setSuggestions(data);
        setShowSuggestions(true);
        setSearchError("");
      }
    } catch {
      setSearchError("Error al buscar. Verificá tu conexión o usá el mapa directamente.");
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounce del input
  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setShowSuggestions(false);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(val), 600);
  };

  // Seleccionar sugerencia
  const handleSuggestionSelect = (suggestion) => {
    const lat  = parseFloat(suggestion.lat);
    const lng  = parseFloat(suggestion.lon);
    const addr = suggestion.display_name;

    setSearchQuery(addr);
    setMarkerPos({ lat, lng });
    setMapCenter({ lat, lng });
    setSuggestions([]);
    setShowSuggestions(false);
    onChange({ lat, lng, address: addr });
  };

  // Buscar al presionar Enter o botón
  const handleSearchSubmit = async (e) => {
    e?.preventDefault();
    clearTimeout(debounceRef.current);
    await searchAddress(searchQuery);
  };

  // Clic en el mapa
  const handleMapClick = useCallback(async ({ lat, lng }) => {
    setMarkerPos({ lat, lng });

    // Reverse geocoding para obtener la dirección
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "es" } }
      );
      const data = await res.json();
      const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setSearchQuery(addr);
      onChange({ lat, lng, address: addr });
    } catch {
      const addr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setSearchQuery(addr);
      onChange({ lat, lng, address: addr });
    }
  }, [onChange]);

  // Arrastrar marcador
  const handleMarkerDrag = useCallback(async (e) => {
    const { lat, lng } = e.target.getLatLng();
    setMarkerPos({ lat, lng });

    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "es" } }
      );
      const data = await res.json();
      const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setSearchQuery(addr);
      onChange({ lat, lng, address: addr });
    } catch {
      onChange({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
    }
  }, [onChange]);

  const handleClear = () => {
    setMarkerPos(null);
    setSearchQuery("");
    setSuggestions([]);
    setSearchError("");
    onChange(null);
  };

  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}

      {/* ── Buscador de dirección ── */}
      <div className={styles.searchRow}>
        <div className={styles.searchInputWrap}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Escribí la dirección, ej: Av. San Martín 123..."
            value={searchQuery}
            onChange={handleSearchInput}
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(e)}
            autoComplete="off"
          />
          {searching && <span className={styles.searchSpinner} />}

          {/* Sugerencias */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className={styles.suggestions}>
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  className={styles.suggestionItem}
                  onClick={() => handleSuggestionSelect(s)}
                >
                  <span className={styles.suggestionIcon}>📍</span>
                  <span className={styles.suggestionText}>{s.display_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          className={styles.searchBtn}
          onClick={handleSearchSubmit}
          disabled={searching || !searchQuery.trim()}
        >
          Buscar
        </button>

        {markerPos && (
          <button type="button" className={styles.clearBtn} onClick={handleClear} title="Quitar ubicación">
            ✕
          </button>
        )}
      </div>

      {searchError && <p className={styles.searchError}>{searchError}</p>}

      <p className={styles.hint}>
        💡 También podés hacer clic directamente en el mapa o arrastrar el marcador para ajustar la posición.
      </p>

      {/* ── Mapa ── */}
      <div className={styles.mapWrap}>
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={DEFAULT_ZOOM}
          className={styles.map}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          <MapController center={mapCenter} />
          <ClickHandler onLocationSelect={handleMapClick} />

          {markerPos && (
            <Marker
              position={[markerPos.lat, markerPos.lng]}
              icon={businessIcon}
              draggable={true}
              eventHandlers={{ dragend: handleMarkerDrag }}
            />
          )}
        </MapContainer>

        {/* Overlay cuando no hay ubicación seleccionada */}
        {!markerPos && (
          <div className={styles.mapOverlay}>
            <span>Buscá una dirección o hacé clic en el mapa</span>
          </div>
        )}
      </div>

      {/* Coordenadas seleccionadas */}
      {markerPos && (
        <div className={styles.coordsBox}>
          <span className={styles.coordsIcon}>✓</span>
          <span className={styles.coordsText}>
            Ubicación fijada — {markerPos.lat.toFixed(5)}, {markerPos.lng.toFixed(5)}
          </span>
        </div>
      )}
    </div>
  );
}