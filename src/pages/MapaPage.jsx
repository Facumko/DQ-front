import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCategories } from "../Api/Api";

// ─── Fix íconos Leaflet + Vite ────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Íconos por categoría ─────────────────────────────────────────────────────
const CATEGORY_ICONS = {
  "gastronomía":  { emoji: "🍽️", color: "#e67e22" },
  "restaurante":  { emoji: "🍽️", color: "#e67e22" },
  "comida":       { emoji: "🍔", color: "#e67e22" },
  "cafetería":    { emoji: "☕", color: "#795548" },
  "café":         { emoji: "☕", color: "#795548" },
  "ropa":         { emoji: "👗", color: "#9c27b0" },
  "indumentaria": { emoji: "👗", color: "#9c27b0" },
  "moda":         { emoji: "👗", color: "#9c27b0" },
  "tecnología":   { emoji: "💻", color: "#1565c0" },
  "electrónica":  { emoji: "📱", color: "#1565c0" },
  "salud":        { emoji: "⚕️", color: "#2e7d32" },
  "farmacia":     { emoji: "💊", color: "#2e7d32" },
  "servicios":    { emoji: "🔧", color: "#37474f" },
  "educación":    { emoji: "📚", color: "#6a1b9a" },
  "deporte":      { emoji: "⚽", color: "#00838f" },
  "hogar":        { emoji: "🏠", color: "#bf6900" },
  "belleza":      { emoji: "💅", color: "#c2185b" },
  "peluquería":   { emoji: "✂️", color: "#c2185b" },
  "supermercado": { emoji: "🛒", color: "#388e3c" },
  "ferretería":   { emoji: "🔩", color: "#546e7a" },
};

const getCategoryStyle = (categories = []) => {
  for (const cat of categories) {
    const key = cat.toLowerCase();
    for (const [k, v] of Object.entries(CATEGORY_ICONS)) {
      if (key.includes(k)) return v;
    }
  }
  return { emoji: "🏪", color: "#B00020" };
};

const makeIcon = (categories = [], isActive = false) => {
  const { emoji, color } = getCategoryStyle(categories);
  const size = isActive ? 46 : 38;
  const bg   = isActive ? "#ff6b00" : color;
  const svg = `
    <div style="
      width:${size}px;height:${size}px;
      background:${bg};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      box-shadow:${isActive ? "0 4px 16px rgba(0,0,0,0.35)" : "0 2px 8px rgba(0,0,0,0.25)"};
      border:2.5px solid white;
    ">
      <span style="transform:rotate(45deg);font-size:${isActive ? 20 : 16}px;line-height:1;">${emoji}</span>
    </div>`;
  return new L.DivIcon({
    html: svg,
    className: "",
    iconSize:   [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor:[0, -size],
  });
};

const USER_ICON = new L.DivIcon({
  html: `<div style="width:18px;height:18px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(37,99,235,0.25);"></div>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// ─── Config ───────────────────────────────────────────────────────────────────
const DEFAULT_CENTER = [-26.7909, -60.4437];
const DEFAULT_ZOOM   = 14;
const API_URL = import.meta.env.VITE_API_URL || "http://192.168.1.3:8080";

// ─── Distancia haversine (km) ─────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target?.lat && target?.lng)
      map.flyTo([target.lat, target.lng], 17, { animate: true, duration: 0.8 });
  }, [target, map]);
  return null;
}

function FlyToUser({ userLocation }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation)
      map.flyTo([userLocation.lat, userLocation.lng], 16, { animate: true, duration: 1 });
  }, [userLocation, map]);
  return null;
}

// ─── Normalizar ───────────────────────────────────────────────────────────────
const normalizeBusiness = (b) => ({
  id:           b.idCommerce,
  name:         b.name         || "Sin nombre",
  description:  b.description  || "",
  phone:        b.phone        || "",
  email:        b.email        || "",
  website:      b.website      || "",
  instagram:    b.instagram    || "",
  facebook:     b.facebook     || "",
  profileImage: b.profileImage?.url || null,
  coverImage:   b.coverImage?.url   || null,
  categories:   Array.isArray(b.categories) ? b.categories.map(c => c.name || c) : [],
  lat:          b.address?.lat  ? parseFloat(b.address.lat)  : null,
  lng:          b.address?.lng  ? parseFloat(b.address.lng)  : null,
  address:      b.address?.address || b.address?.street || "",
});

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function MapaPage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const [businesses,  setBusinesses]  = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [selectedCat, setSelectedCat] = useState("todas");
  const [search,      setSearch]      = useState("");
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [flyTarget,   setFlyTarget]   = useState(null);
  const [activeId,    setActiveId]    = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Geo
  const [userLocation,   setUserLocation]   = useState(null);
  const [locating,       setLocating]       = useState(false);
  const [locError,       setLocError]       = useState("");
  const [flyToUser,      setFlyToUser]      = useState(null);
  const [distanceFilter, setDistanceFilter] = useState(0);
  const [showDistSlider, setShowDistSlider] = useState(false);

  // Deep link
  const [deepLinkDone, setDeepLinkDone] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const markersRef = useRef({});

  const showToast = useCallback((msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Cargar comercios ────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${API_URL}/comercio/traer`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        const arr = Array.isArray(data) ? data : [data];
        const normalized = arr
          .map(normalizeBusiness)
          .filter(b => b.lat !== null && b.lng !== null);
        setBusinesses(normalized);
        setFiltered(normalized);
      } catch (err) {
        setError("No se pudieron cargar los comercios.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Categorías ──────────────────────────────────────────────────────────────
  useEffect(() => {
    getCategories().then(c => setCategories(c || [])).catch(() => setCategories([]));
  }, []);

  // ── Deep link ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (deepLinkDone || loading || businesses.length === 0) return;
    const id  = searchParams.get("id");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (id) {
      const biz = businesses.find(b => String(b.id) === String(id));
      if (biz) {
        setActiveId(biz.id);
        setFlyTarget({ lat: biz.lat, lng: biz.lng });
        setTimeout(() => markersRef.current[biz.id]?.openPopup(), 1000);
      }
    } else if (lat && lng) {
      setFlyTarget({ lat: parseFloat(lat), lng: parseFloat(lng) });
    }
    setDeepLinkDone(true);
  }, [businesses, loading, deepLinkDone, searchParams]);

  // ── Filtros ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let result = businesses;
    if (selectedCat !== "todas")
      result = result.filter(b =>
        b.categories.some(c => c.toLowerCase() === selectedCat.toLowerCase())
      );
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q)
      );
    }
    if (distanceFilter > 0 && userLocation)
      result = result.filter(b =>
        haversine(userLocation.lat, userLocation.lng, b.lat, b.lng) <= distanceFilter
      );
    setFiltered(result);
  }, [businesses, selectedCat, search, distanceFilter, userLocation]);

  // ── Seleccionar desde sidebar ───────────────────────────────────────────────
  const handleSelectBusiness = useCallback((biz) => {
    setActiveId(biz.id);
    setFlyTarget({ lat: biz.lat, lng: biz.lng });
    setTimeout(() => markersRef.current[biz.id]?.openPopup(), 900);
    document.getElementById(`biz-${biz.id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  // ── Geolocalización ─────────────────────────────────────────────────────────
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) { setLocError("Tu navegador no soporta geolocalización"); return; }
    setLocating(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setFlyToUser(loc);
        setLocating(false);
        showToast("📍 Ubicación encontrada");
      },
      () => { setLocating(false); setLocError("No se pudo obtener tu ubicación"); },
      { timeout: 10000 }
    );
  }, [showToast]);

  // ── Compartir ───────────────────────────────────────────────────────────────
  const handleShare = useCallback((biz) => {
    const url = `${window.location.origin}/mapa?id=${biz.id}&lat=${biz.lat}&lng=${biz.lng}`;
    navigator.clipboard?.writeText(url).then(() => showToast("🔗 Link copiado"));
  }, [showToast]);

  // ── Cómo llegar ─────────────────────────────────────────────────────────────
  const handleDirections = useCallback((biz) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${biz.lat},${biz.lng}`, "_blank");
  }, []);

  return (
    <div style={s.page}>

      {/* Toast */}
      {toast && <div style={s.toast}>{toast.msg}</div>}

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <h1 style={s.title}><span style={s.accent}>Mapa</span> de Comercios</h1>
          <p style={s.subtitle}>
            {loading ? "Cargando..." : `${filtered.length} de ${businesses.length} comercios`}
          </p>
        </div>

        <div style={s.headerRight}>
          {/* Buscador */}
          <div style={s.searchWrap}>
            <span>🔍</span>
            <input
              style={s.searchInput}
              placeholder="Buscar comercio..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button style={s.clearBtn} onClick={() => setSearch("")}>✕</button>}
          </div>

          {/* Btn geolocalizar */}
          <button
            style={{ ...s.iconBtn, ...(userLocation ? s.iconBtnBlue : {}) }}
            onClick={handleLocate}
            disabled={locating}
            title="Mi ubicación"
          >
            {locating ? "⏳" : "📍"}
          </button>

          {/* Btn filtro distancia */}
          {userLocation && (
            <div style={{ position: "relative" }}>
              <button
                style={{ ...s.iconBtn, ...(distanceFilter > 0 ? s.iconBtnBlue : {}) }}
                onClick={() => setShowDistSlider(p => !p)}
                title="Filtrar por distancia"
              >
                📏
              </button>
              {showDistSlider && (
                <div style={s.distPanel}>
                  <p style={s.distLabel}>
                    {distanceFilter === 0 ? "Sin límite" : `≤ ${distanceFilter} km`}
                  </p>
                  <input
                    type="range" min={0} max={10} step={0.5}
                    value={distanceFilter}
                    onChange={e => setDistanceFilter(parseFloat(e.target.value))}
                    style={{ width: "100%", accentColor: "#2563eb" }}
                  />
                  <div style={s.distMarks}><span>0</span><span>5 km</span><span>10 km</span></div>
                  {distanceFilter > 0 && (
                    <button style={s.clearDistBtn} onClick={() => { setDistanceFilter(0); setShowDistSlider(false); }}>
                      Quitar filtro
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error geo */}
      {locError && <div style={s.locError}>{locError}</div>}

      {/* Filtros por categoría */}
      <div style={s.filtersBar}>
        <button
          style={{ ...s.chip, ...(selectedCat === "todas" ? s.chipActive : {}) }}
          onClick={() => setSelectedCat("todas")}
        >Todas</button>
        {categories.map(cat => (
          <button
            key={cat.idCategory || cat.name}
            style={{ ...s.chip, ...(selectedCat === cat.name ? s.chipActive : {}) }}
            onClick={() => setSelectedCat(cat.name)}
          >
            {getCategoryStyle([cat.name]).emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={s.body}>

        {/* Sidebar */}
        <div style={{
          ...s.sidebar,
          width:    sidebarOpen ? 310 : 0,
          minWidth: sidebarOpen ? 310 : 0,
          overflow: sidebarOpen ? "auto" : "hidden",
        }}>
          <div style={{ padding: "8px 0" }}>
            {loading ? (
              <div style={s.center}><div style={s.spinner} /><span style={s.muted}>Cargando...</span></div>
            ) : error ? (
              <div style={s.errorBox}>{error}</div>
            ) : filtered.length === 0 ? (
              <div style={s.center}>
                <div style={{ fontSize: "2.2rem", marginBottom: 6 }}>🗺️</div>
                <p style={s.muted}>No hay resultados</p>
                {(selectedCat !== "todas" || search || distanceFilter > 0) && (
                  <button style={s.resetBtn} onClick={() => { setSelectedCat("todas"); setSearch(""); setDistanceFilter(0); }}>
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              filtered.map(biz => {
                const { emoji, color } = getCategoryStyle(biz.categories);
                const dist = userLocation
                  ? haversine(userLocation.lat, userLocation.lng, biz.lat, biz.lng)
                  : null;
                return (
                  <div
                    id={`biz-${biz.id}`}
                    key={biz.id}
                    style={{
                      ...s.card,
                      ...(activeId === biz.id ? { background: "#fff5f5", borderLeftColor: color } : {}),
                    }}
                    onClick={() => handleSelectBusiness(biz)}
                  >
                    <div style={{ ...s.thumb, background: color + "15" }}>
                      {biz.profileImage
                        ? <img src={biz.profileImage} alt={biz.name} style={s.thumbImg} />
                        : <span style={{ fontSize: "1.3rem" }}>{emoji}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={s.cardName}>{biz.name}</p>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 2 }}>
                        {biz.categories[0] && (
                          <span style={{ ...s.catBadge, color, background: color + "15" }}>
                            {biz.categories[0]}
                          </span>
                        )}
                        {dist !== null && (
                          <span style={s.distBadge}>📏 {formatDistance(dist)}</span>
                        )}
                      </div>
                      {biz.address && (
                        <p style={s.cardAddr}>📍 {biz.address.split(",").slice(0, 2).join(", ")}</p>
                      )}
                    </div>
                    <span style={{ color: "#d1d5db", fontSize: "1.1rem" }}>›</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Toggle sidebar */}
        <button
          style={{ ...s.sidebarToggle, left: sidebarOpen ? 310 : 0 }}
          onClick={() => setSidebarOpen(p => !p)}
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>

        {/* Mapa */}
        <div style={s.mapWrap}>
          {loading ? (
            <div style={s.mapLoading}><div style={s.spinner} /><span style={s.muted}>Cargando mapa...</span></div>
          ) : (
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={DEFAULT_ZOOM}
              style={{ width: "100%", height: "100%" }}
              scrollWheelZoom
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <FlyTo target={flyTarget} />
              {flyToUser && <FlyToUser userLocation={flyToUser} />}

              {/* Marcador usuario + radio */}
              {userLocation && (
                <>
                  <Marker position={[userLocation.lat, userLocation.lng]} icon={USER_ICON} />
                  {distanceFilter > 0 && (
                    <Circle
                      center={[userLocation.lat, userLocation.lng]}
                      radius={distanceFilter * 1000}
                      pathOptions={{
                        color: "#2563eb", fillColor: "#2563eb",
                        fillOpacity: 0.06, weight: 1.5, dashArray: "6 4",
                      }}
                    />
                  )}
                </>
              )}

              {/* Marcadores comercios */}
              {filtered.map(biz => (
                <Marker
                  key={biz.id}
                  position={[biz.lat, biz.lng]}
                  icon={makeIcon(biz.categories, activeId === biz.id)}
                  ref={el => { if (el) markersRef.current[biz.id] = el; }}
                  eventHandlers={{ click: () => setActiveId(biz.id) }}
                >
                  <Popup minWidth={250} maxWidth={280}>
                    <div style={{ fontFamily: "'Open Sans', sans-serif", width: 250 }}>

                      {/* Imagen / placeholder */}
                      {(biz.coverImage || biz.profileImage) ? (
                        <div style={{ position: "relative" }}>
                          <img
                            src={biz.coverImage || biz.profileImage}
                            alt={biz.name}
                            style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }}
                          />
                          {biz.categories[0] && (
                            <span style={{
                              position: "absolute", bottom: 7, left: 7,
                              background: getCategoryStyle(biz.categories).color,
                              color: "#fff", fontSize: "0.67rem", fontWeight: 700,
                              padding: "2px 8px", borderRadius: 10,
                            }}>
                              {getCategoryStyle(biz.categories).emoji} {biz.categories[0]}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div style={{
                          height: 64, display: "flex", alignItems: "center", justifyContent: "center",
                          background: getCategoryStyle(biz.categories).color + "18",
                          fontSize: "2rem",
                        }}>
                          {getCategoryStyle(biz.categories).emoji}
                        </div>
                      )}

                      <div style={{ padding: "10px 12px 8px" }}>
                        <h3 style={{ margin: "0 0 5px", fontSize: "0.93rem", fontWeight: 700, color: "#111827" }}>
                          {biz.name}
                        </h3>
                        {biz.description && (
                          <p style={{ margin: "0 0 7px", fontSize: "0.76rem", color: "#4b5563", lineHeight: 1.5 }}>
                            {biz.description.length > 85 ? biz.description.slice(0, 85) + "..." : biz.description}
                          </p>
                        )}

                        {/* Info de contacto */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 9 }}>
                          {biz.phone && (
                            <a href={`tel:${biz.phone}`} style={{ fontSize: "0.73rem", color: "#6b7280", textDecoration: "none" }}>
                              📞 {biz.phone}
                            </a>
                          )}
                          {biz.address && (
                            <span style={{ fontSize: "0.73rem", color: "#6b7280" }}>
                              📍 {biz.address.split(",").slice(0, 2).join(", ")}
                            </span>
                          )}
                          {userLocation && (
                            <span style={{ fontSize: "0.73rem", color: "#2563eb", fontWeight: 600 }}>
                              📏 {formatDistance(haversine(userLocation.lat, userLocation.lng, biz.lat, biz.lng))}
                            </span>
                          )}
                        </div>

                        {/* Acciones */}
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            style={s.popupActionBtn}
                            onClick={() => handleShare(biz)}
                            title="Copiar link"
                          >🔗</button>
                          <button
                            style={s.popupActionBtn}
                            onClick={() => handleDirections(biz)}
                            title="Cómo llegar"
                          >🧭</button>
                          <button
                            style={s.popupMainBtn}
                            onClick={() => navigate(`/negocios/${biz.id}`)}
                          >
                            Ver perfil →
                          </button>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}

          {/* Badge */}
          {!loading && (
            <div style={s.badge}>
              {filtered.length} comercio{filtered.length !== 1 ? "s" : ""}
              {selectedCat !== "todas" ? ` · ${selectedCat}` : ""}
              {distanceFilter > 0 ? ` · ≤${distanceFilter}km` : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const s = {
  page: {
    display: "flex", flexDirection: "column",
    height: "calc(100vh - 64px)",
    background: "#f9fafb",
    fontFamily: "'Open Sans', sans-serif",
    overflow: "hidden",
  },
  toast: {
    position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
    background: "#111827", color: "#fff",
    padding: "9px 20px", borderRadius: 30,
    fontSize: "0.83rem", fontWeight: 600,
    zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    whiteSpace: "nowrap", pointerEvents: "none",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "11px 20px", background: "#fff",
    borderBottom: "1.5px solid #e5e7eb",
    flexShrink: 0, flexWrap: "wrap", gap: 10,
  },
  headerLeft: { display: "flex", flexDirection: "column", gap: 1 },
  headerRight: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  title: { margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#111827" },
  accent: { color: "#B00020" },
  subtitle: { margin: 0, fontSize: "0.76rem", color: "#6b7280" },
  searchWrap: {
    display: "flex", alignItems: "center", gap: 7,
    background: "#f3f4f6", border: "1.5px solid #e5e7eb",
    borderRadius: 30, padding: "6px 13px",
    fontSize: "0.85rem", minWidth: 210,
  },
  searchInput: {
    border: "none", background: "transparent", outline: "none",
    fontSize: "0.84rem", color: "#111827", flex: 1, minWidth: 0,
  },
  clearBtn: { background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "0.75rem", padding: 0 },
  iconBtn: {
    width: 36, height: 36,
    border: "1.5px solid #e5e7eb", borderRadius: 10,
    background: "#fff", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.95rem", flexShrink: 0,
  },
  iconBtnBlue: { background: "#eff6ff", borderColor: "#2563eb" },
  distPanel: {
    position: "absolute", top: 42, right: 0,
    background: "#fff", border: "1.5px solid #e5e7eb",
    borderRadius: 12, padding: "13px 15px",
    width: 210, boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
    zIndex: 1000,
  },
  distLabel: { margin: "0 0 7px", fontSize: "0.8rem", fontWeight: 700, color: "#111827", textAlign: "center" },
  distMarks: { display: "flex", justifyContent: "space-between", fontSize: "0.67rem", color: "#9ca3af", marginTop: 2 },
  clearDistBtn: {
    marginTop: 9, width: "100%", padding: "5px",
    background: "#f3f4f6", border: "none", borderRadius: 7,
    fontSize: "0.76rem", fontWeight: 600, color: "#374151",
    cursor: "pointer", fontFamily: "inherit",
  },
  locError: {
    background: "#fef2f2", borderBottom: "1px solid #fecaca",
    color: "#b91c1c", fontSize: "0.78rem",
    padding: "5px 20px", flexShrink: 0,
  },
  filtersBar: {
    display: "flex", gap: 6, padding: "8px 20px",
    background: "#fff", borderBottom: "1.5px solid #e5e7eb",
    overflowX: "auto", flexShrink: 0, scrollbarWidth: "none",
  },
  chip: {
    padding: "4px 12px", borderRadius: 20,
    border: "1.5px solid #e5e7eb", background: "#f9fafb",
    fontSize: "0.76rem", fontWeight: 600, color: "#374151",
    cursor: "pointer", whiteSpace: "nowrap",
    transition: "all 0.15s", fontFamily: "inherit",
  },
  chipActive: { background: "#B00020", borderColor: "#B00020", color: "#fff" },
  body: { display: "flex", flex: 1, overflow: "hidden", position: "relative" },
  sidebar: {
    background: "#fff", borderRight: "1.5px solid #e5e7eb",
    flexShrink: 0,
    transition: "width 0.25s ease, min-width 0.25s ease",
    overflowY: "auto", overflowX: "hidden",
  },
  sidebarToggle: {
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    zIndex: 500, background: "#fff",
    border: "1.5px solid #e5e7eb", borderLeft: "none",
    borderRadius: "0 8px 8px 0",
    width: 18, height: 42,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.62rem", color: "#6b7280",
    boxShadow: "2px 0 8px rgba(0,0,0,0.06)",
    transition: "left 0.25s ease", padding: 0,
  },
  card: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 13px",
    cursor: "pointer",
    borderBottom: "1px solid #f3f4f6",
    borderLeft: "3px solid transparent",
    transition: "background 0.15s",
  },
  thumb: {
    width: 44, height: 44, borderRadius: 10,
    overflow: "hidden", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover" },
  cardName: {
    margin: 0, fontSize: "0.84rem", fontWeight: 700, color: "#111827",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  catBadge: {
    fontSize: "0.67rem", fontWeight: 600,
    padding: "1px 7px", borderRadius: 10,
  },
  distBadge: {
    fontSize: "0.66rem", color: "#2563eb", fontWeight: 600,
    background: "#eff6ff", padding: "1px 6px", borderRadius: 10,
  },
  cardAddr: {
    margin: "2px 0 0", fontSize: "0.69rem", color: "#9ca3af",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  mapWrap: { flex: 1, position: "relative", overflow: "hidden" },
  mapLoading: {
    width: "100%", height: "100%",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 12,
    background: "#f9fafb",
  },
  badge: {
    position: "absolute", bottom: 16, right: 16,
    background: "rgba(17,24,39,0.78)", color: "#fff",
    fontSize: "0.73rem", fontWeight: 700,
    padding: "5px 13px", borderRadius: 20,
    backdropFilter: "blur(8px)", zIndex: 500, pointerEvents: "none",
  },
  popupActionBtn: {
    width: 32, height: 32,
    border: "1.5px solid #e5e7eb", borderRadius: 7,
    background: "#f9fafb", cursor: "pointer",
    fontSize: "0.9rem", display: "flex",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, padding: 0,
  },
  popupMainBtn: {
    flex: 1, padding: "6px 0",
    background: "#B00020", color: "#fff",
    border: "none", borderRadius: 7,
    fontSize: "0.78rem", fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  center: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 10,
    padding: "40px 20px",
  },
  muted: { color: "#6b7280", fontSize: "0.84rem" },
  errorBox: {
    margin: 12, padding: "14px",
    background: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: 8, fontSize: "0.8rem",
    color: "#b91c1c", textAlign: "center",
  },
  resetBtn: {
    marginTop: 8, padding: "5px 15px",
    background: "#f3f4f6", border: "none",
    borderRadius: 8, fontSize: "0.76rem",
    fontWeight: 600, color: "#374151",
    cursor: "pointer", fontFamily: "inherit",
  },
  spinner: {
    width: 28, height: 28,
    border: "3px solid #f3f4f6",
    borderTopColor: "#B00020",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};