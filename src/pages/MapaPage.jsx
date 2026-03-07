import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { getCategories } from "../Api/Api";

// ─── Fix íconos Leaflet + Vite ────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Ícono personalizado rojo (marca del proyecto) ───────────────────────────
const makeIcon = (color = "#B00020", size = 36) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="${size}" height="${size * 1.33}">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 8 12 20 12 20S24 20 24 12C24 5.373 18.627 0 12 0z"
        fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`;
  return new L.DivIcon({
    html: svg,
    className: "",
    iconSize:   [size, size * 1.33],
    iconAnchor: [size / 2, size * 1.33],
    popupAnchor:[0, -(size * 1.33)],
  });
};

const DEFAULT_ICON     = makeIcon("#B00020");
const HIGHLIGHT_ICON   = makeIcon("#ff6b00", 44);

// ─── Centro por defecto: Presidencia Roque Sáenz Peña, Chaco ─────────────────
const DEFAULT_CENTER = [-26.7909, -60.4437];
const DEFAULT_ZOOM   = 14;

const API_URL = import.meta.env.VITE_API_URL || "http://192.168.1.3:8080";

// ─── Sub-componente: mueve el mapa al comercio seleccionado ───────────────────
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target?.lat && target?.lng) {
      map.flyTo([target.lat, target.lng], 17, { animate: true, duration: 0.8 });
    }
  }, [target, map]);
  return null;
}

// ─── Normalizar comercio desde el backend ────────────────────────────────────
const normalizeBusiness = (b) => ({
  id:           b.idCommerce,
  name:         b.name         || "Sin nombre",
  description:  b.description  || "",
  phone:        b.phone        || "",
  email:        b.email        || "",
  website:      b.website      || "",
  profileImage: b.profileImage?.url || null,
  coverImage:   b.coverImage?.url   || null,
  categories:   Array.isArray(b.categories) ? b.categories.map(c => c.name || c) : [],
  lat:          b.address?.lat  ? parseFloat(b.address.lat)  : null,
  lng:          b.address?.lng  ? parseFloat(b.address.lng)  : null,
  address:      b.address?.address || b.address?.street || "",
});

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function MapaPage() {
  const navigate = useNavigate();

  const [businesses,    setBusinesses]    = useState([]);
  const [filtered,      setFiltered]      = useState([]);
  const [categories,    setCategories]    = useState([]);
  const [selectedCat,   setSelectedCat]   = useState("todas");
  const [search,        setSearch]        = useState("");
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [flyTarget,     setFlyTarget]     = useState(null);
  const [activeId,      setActiveId]      = useState(null);
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const markersRef = useRef({});

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
          .filter(b => b.lat !== null && b.lng !== null); // solo con ubicación
        setBusinesses(normalized);
        setFiltered(normalized);
      } catch (err) {
        setError("No se pudieron cargar los comercios. Verificá tu conexión.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Cargar categorías ───────────────────────────────────────────────────────
  useEffect(() => {
    getCategories()
      .then(cats => setCategories(cats || []))
      .catch(() => setCategories([]));
  }, []);

  // ── Filtrar comercios ───────────────────────────────────────────────────────
  useEffect(() => {
    let result = businesses;

    if (selectedCat !== "todas") {
      result = result.filter(b =>
        b.categories.some(c =>
          c.toLowerCase() === selectedCat.toLowerCase()
        )
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [businesses, selectedCat, search]);

  // ── Seleccionar comercio desde sidebar ─────────────────────────────────────
  const handleSelectBusiness = useCallback((biz) => {
    setActiveId(biz.id);
    setFlyTarget({ lat: biz.lat, lng: biz.lng });
    // Abrir popup del marcador
    setTimeout(() => {
      const marker = markersRef.current[biz.id];
      if (marker) marker.openPopup();
    }, 900);
  }, []);

  const withLocationCount = businesses.filter(b => b.lat && b.lng).length;
  const totalCount = businesses.length;

  return (
    <div style={styles.page}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>
            <span style={styles.titleAccent}>Mapa</span> de Comercios
          </h1>
          <p style={styles.subtitle}>
            {loading ? "Cargando..." : `${withLocationCount} comercios con ubicación${totalCount > withLocationCount ? ` (${totalCount - withLocationCount} sin geolocalizar)` : ""}`}
          </p>
        </div>

        {/* Buscador */}
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            style={styles.searchInput}
            placeholder="Buscar comercio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button style={styles.clearBtn} onClick={() => setSearch("")}>✕</button>
          )}
        </div>
      </div>

      {/* ── FILTROS POR CATEGORÍA ───────────────────────────────────────────── */}
      <div style={styles.filtersBar}>
        <button
          style={{ ...styles.filterChip, ...(selectedCat === "todas" ? styles.filterChipActive : {}) }}
          onClick={() => setSelectedCat("todas")}
        >
          Todas
        </button>
        {categories.map(cat => (
          <button
            key={cat.idCategory || cat.name}
            style={{ ...styles.filterChip, ...(selectedCat === cat.name ? styles.filterChipActive : {}) }}
            onClick={() => setSelectedCat(cat.name)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* ── CONTENIDO PRINCIPAL ────────────────────────────────────────────── */}
      <div style={styles.body}>

        {/* Sidebar */}
        <div style={{
          ...styles.sidebar,
          width: sidebarOpen ? 320 : 0,
          minWidth: sidebarOpen ? 320 : 0,
          overflow: sidebarOpen ? "auto" : "hidden",
        }}>
          <div style={styles.sidebarInner}>
            {loading ? (
              <div style={styles.loadingBox}>
                <div style={styles.spinner} />
                <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>Cargando comercios...</span>
              </div>
            ) : error ? (
              <div style={styles.errorBox}>{error}</div>
            ) : filtered.length === 0 ? (
              <div style={styles.emptyBox}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>🗺️</div>
                <p style={{ color: "#6b7280", fontSize: "0.88rem", textAlign: "center" }}>
                  No hay comercios que coincidan con tu búsqueda
                </p>
              </div>
            ) : (
              filtered.map(biz => (
                <div
                  key={biz.id}
                  style={{
                    ...styles.bizCard,
                    ...(activeId === biz.id ? styles.bizCardActive : {}),
                  }}
                  onClick={() => handleSelectBusiness(biz)}
                >
                  {/* Imagen */}
                  <div style={styles.bizThumb}>
                    {biz.profileImage ? (
                      <img src={biz.profileImage} alt={biz.name} style={styles.bizThumbImg} />
                    ) : (
                      <div style={styles.bizThumbPlaceholder}>🏪</div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={styles.bizInfo}>
                    <p style={styles.bizName}>{biz.name}</p>
                    {biz.categories.length > 0 && (
                      <span style={styles.bizCat}>{biz.categories[0]}</span>
                    )}
                    {biz.address && (
                      <p style={styles.bizAddr}>📍 {biz.address}</p>
                    )}
                  </div>

                  {/* Chevron */}
                  <span style={styles.bizChevron}>›</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Toggle sidebar */}
        <button
          style={styles.sidebarToggle}
          onClick={() => setSidebarOpen(p => !p)}
          title={sidebarOpen ? "Ocultar lista" : "Ver lista"}
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>

        {/* Mapa */}
        <div style={styles.mapWrap}>
          {loading ? (
            <div style={styles.mapLoading}>
              <div style={styles.spinner} />
              <span style={{ color: "#6b7280", marginTop: 12 }}>Cargando mapa...</span>
            </div>
          ) : (
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={DEFAULT_ZOOM}
              style={{ width: "100%", height: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              <FlyTo target={flyTarget} />

              {filtered.map(biz => (
                <Marker
                  key={biz.id}
                  position={[biz.lat, biz.lng]}
                  icon={activeId === biz.id ? HIGHLIGHT_ICON : DEFAULT_ICON}
                  ref={el => { if (el) markersRef.current[biz.id] = el; }}
                  eventHandlers={{
                    click: () => setActiveId(biz.id),
                  }}
                >
                  <Popup minWidth={240} maxWidth={280}>
                    <div style={styles.popup}>
                      {/* Cover o imagen de perfil */}
                      {(biz.coverImage || biz.profileImage) && (
                        <img
                          src={biz.coverImage || biz.profileImage}
                          alt={biz.name}
                          style={styles.popupImg}
                        />
                      )}

                      <div style={styles.popupBody}>
                        {/* Nombre */}
                        <h3 style={styles.popupName}>{biz.name}</h3>

                        {/* Categorías */}
                        {biz.categories.length > 0 && (
                          <div style={styles.popupCats}>
                            {biz.categories.map((c, i) => (
                              <span key={i} style={styles.popupCatBadge}>{c}</span>
                            ))}
                          </div>
                        )}

                        {/* Descripción */}
                        {biz.description && (
                          <p style={styles.popupDesc}>
                            {biz.description.length > 100
                              ? biz.description.slice(0, 100) + "..."
                              : biz.description}
                          </p>
                        )}

                        {/* Contacto */}
                        <div style={styles.popupContact}>
                          {biz.phone && <span style={styles.popupContactItem}>📞 {biz.phone}</span>}
                          {biz.address && <span style={styles.popupContactItem}>📍 {biz.address}</span>}
                        </div>

                        {/* Botón ver perfil */}
                        <button
                          style={styles.popupBtn}
                          onClick={() => navigate(`/negocios/${biz.id}`)}
                        >
                          Ver perfil completo →
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}

          {/* Badge contador */}
          {!loading && (
            <div style={styles.mapBadge}>
              {filtered.length} comercio{filtered.length !== 1 ? "s" : ""}
              {selectedCat !== "todas" ? ` en "${selectedCat}"` : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ESTILOS (inline para ser autocontenido) ──────────────────────────────────
const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 64px)", // descuenta la Navbar
    background: "#f9fafb",
    fontFamily: "'Open Sans', sans-serif",
    overflow: "hidden",
  },

  // Header
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 24px",
    background: "#fff",
    borderBottom: "1.5px solid #e5e7eb",
    flexShrink: 0,
    flexWrap: "wrap",
    gap: 12,
  },
  headerLeft: { display: "flex", flexDirection: "column", gap: 2 },
  title: { margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "#111827" },
  titleAccent: { color: "#B00020" },
  subtitle: { margin: 0, fontSize: "0.82rem", color: "#6b7280" },

  // Buscador
  searchWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    background: "#f3f4f6",
    border: "1.5px solid #e5e7eb",
    borderRadius: 30,
    padding: "8px 14px",
    gap: 8,
    minWidth: 240,
  },
  searchIcon: { fontSize: "0.9rem", flexShrink: 0 },
  searchInput: {
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: "0.88rem",
    color: "#111827",
    flex: 1,
    minWidth: 0,
  },
  clearBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9ca3af",
    fontSize: "0.82rem",
    padding: 0,
    flexShrink: 0,
  },

  // Filtros
  filtersBar: {
    display: "flex",
    gap: 8,
    padding: "10px 24px",
    background: "#fff",
    borderBottom: "1.5px solid #e5e7eb",
    overflowX: "auto",
    flexShrink: 0,
    scrollbarWidth: "none",
  },
  filterChip: {
    padding: "5px 14px",
    borderRadius: 20,
    border: "1.5px solid #e5e7eb",
    background: "#f9fafb",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#374151",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s ease",
    fontFamily: "inherit",
  },
  filterChipActive: {
    background: "#B00020",
    borderColor: "#B00020",
    color: "#fff",
  },

  // Body (sidebar + mapa)
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },

  // Sidebar
  sidebar: {
    background: "#fff",
    borderRight: "1.5px solid #e5e7eb",
    flexShrink: 0,
    transition: "width 0.25s ease, min-width 0.25s ease",
    overflowY: "auto",
    overflowX: "hidden",
  },
  sidebarInner: { padding: "12px 0" },

  sidebarToggle: {
    position: "absolute",
    left: 320,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 500,
    background: "#fff",
    border: "1.5px solid #e5e7eb",
    borderLeft: "none",
    borderRadius: "0 8px 8px 0",
    width: 22,
    height: 48,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.7rem",
    color: "#6b7280",
    boxShadow: "2px 0 8px rgba(0,0,0,0.06)",
    transition: "left 0.25s ease",
    padding: 0,
  },

  // Cards de la lista
  bizCard: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 16px",
    cursor: "pointer",
    borderBottom: "1px solid #f3f4f6",
    transition: "background 0.15s ease",
    borderLeft: "3px solid transparent",
  },
  bizCardActive: {
    background: "#fff5f5",
    borderLeftColor: "#B00020",
  },
  bizThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: "hidden",
    flexShrink: 0,
    background: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  bizThumbImg: { width: "100%", height: "100%", objectFit: "cover" },
  bizThumbPlaceholder: { fontSize: "1.4rem" },
  bizInfo: { flex: 1, minWidth: 0 },
  bizName: {
    margin: 0,
    fontSize: "0.88rem",
    fontWeight: 700,
    color: "#111827",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  bizCat: {
    display: "inline-block",
    fontSize: "0.7rem",
    color: "#B00020",
    fontWeight: 600,
    background: "#fff0f0",
    padding: "1px 8px",
    borderRadius: 10,
    marginTop: 3,
  },
  bizAddr: {
    margin: "3px 0 0",
    fontSize: "0.72rem",
    color: "#9ca3af",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  bizChevron: { color: "#d1d5db", fontSize: "1.2rem", flexShrink: 0 },

  // Mapa
  mapWrap: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  mapLoading: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f9fafb",
  },
  mapBadge: {
    position: "absolute",
    bottom: 16,
    right: 16,
    background: "rgba(0,0,0,0.72)",
    color: "#fff",
    fontSize: "0.78rem",
    fontWeight: 600,
    padding: "6px 14px",
    borderRadius: 20,
    backdropFilter: "blur(8px)",
    zIndex: 500,
    pointerEvents: "none",
  },

  // Popup
  popup: {
    width: 240,
    fontFamily: "'Open Sans', sans-serif",
    overflow: "hidden",
    borderRadius: 8,
  },
  popupImg: {
    width: "100%",
    height: 110,
    objectFit: "cover",
    display: "block",
    borderRadius: "8px 8px 0 0",
    marginBottom: 0,
  },
  popupBody: { padding: "12px 14px 8px" },
  popupName: {
    margin: "0 0 6px",
    fontSize: "0.98rem",
    fontWeight: 700,
    color: "#111827",
    lineHeight: 1.3,
  },
  popupCats: { display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 },
  popupCatBadge: {
    fontSize: "0.68rem",
    fontWeight: 700,
    color: "#B00020",
    background: "#fff0f0",
    padding: "2px 8px",
    borderRadius: 10,
  },
  popupDesc: {
    margin: "0 0 8px",
    fontSize: "0.8rem",
    color: "#4b5563",
    lineHeight: 1.5,
  },
  popupContact: { display: "flex", flexDirection: "column", gap: 3, marginBottom: 10 },
  popupContactItem: { fontSize: "0.76rem", color: "#6b7280" },
  popupBtn: {
    width: "100%",
    padding: "8px",
    background: "#B00020",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: "0.82rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  // Estados
  loadingBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: "40px 20px",
  },
  errorBox: {
    padding: "20px 16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    margin: 12,
    fontSize: "0.85rem",
    color: "#b91c1c",
    textAlign: "center",
  },
  emptyBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 20px",
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid #f3f4f6",
    borderTopColor: "#B00020",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};