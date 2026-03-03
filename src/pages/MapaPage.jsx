import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import styles from "./MapaPage.module.css";
import {
  Search, X, ChevronDown, MapPin, Phone, Clock,
  ExternalLink, Filter, Layers, Navigation
} from "lucide-react";

// ─── Fix íconos Leaflet en Vite ───────────────────────────────────────────────
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ─── Coordenadas de Presidencia Roque Sáenz Peña ─────────────────────────────
const CITY_CENTER = [-26.7883, -60.4421];
const CITY_ZOOM = 14;

// ─── Icono personalizado por categoría ───────────────────────────────────────
const createCategoryIcon = (color = "#B00020", letra = "?") =>
  L.divIcon({
    className: "",
    html: `
      <div style="
        width:36px; height:36px;
        background:${color};
        border:3px solid #fff;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 3px 10px rgba(0,0,0,0.35);
        display:flex; align-items:center; justify-content:center;
      ">
        <span style="
          transform:rotate(45deg);
          color:#fff; font-size:13px; font-weight:700;
          font-family:sans-serif; line-height:1;
        ">${letra}</span>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });

// ─── Categorías con colores ───────────────────────────────────────────────────
const CATEGORIAS = [
  { id: "todas",        label: "Todas",          color: "#B00020", letra: "★" },
  { id: "gastronomia", label: "Gastronomía",     color: "#e67e22", letra: "G" },
  { id: "salud",       label: "Salud",           color: "#27ae60", letra: "S" },
  { id: "legal",       label: "Legal",           color: "#2980b9", letra: "L" },
  { id: "educacion",   label: "Educación",       color: "#8e44ad", letra: "E" },
  { id: "comercio",    label: "Comercio",        color: "#16a085", letra: "C" },
  { id: "servicios",   label: "Servicios",       color: "#d35400", letra: "T" },
  { id: "inmobiliaria",label: "Inmobiliaria",    color: "#c0392b", letra: "I" },
  { id: "entretenimiento", label: "Entretenimiento", color: "#e91e8c", letra: "F" },
];

// ─── MOCK DATA — reemplazar con llamada a API ─────────────────────────────────
const MOCK_COMERCIOS = [
  {
    id: 1, name: "Café del Centro", categoria: "gastronomia",
    address: "Av. San Martín 450", phone: "362 415-0001",
    description: "Café, pastelería y desayunos. Abierto desde las 7 AM.",
    lat: -26.7870, lng: -60.4390, profileImage: null,
    horario: "Lun–Sáb 7:00–22:00",
  },
  {
    id: 2, name: "Estudio Jurídico Ramírez", categoria: "legal",
    address: "Belgrano 210", phone: "362 415-0002",
    description: "Abogado civil, laboral y familia.",
    lat: -26.7900, lng: -60.4450, profileImage: null,
    horario: "Lun–Vie 8:00–18:00",
  },
  {
    id: 3, name: "Farmacia San Cayetano", categoria: "salud",
    address: "Brown 90", phone: "362 415-0003",
    description: "Farmacia y perfumería. Turno 24 hs.",
    lat: -26.7855, lng: -60.4410, profileImage: null,
    horario: "24 horas",
  },
  {
    id: 4, name: "Instituto Rivadavia", categoria: "educacion",
    address: "Rivadavia 780", phone: "362 415-0004",
    description: "Clases de inglés, apoyo escolar y computación.",
    lat: -26.7920, lng: -60.4360, profileImage: null,
    horario: "Lun–Sáb 8:00–20:00",
  },
  {
    id: 5, name: "Ferretería El Tornillo", categoria: "comercio",
    address: "Pellegrini 340", phone: "362 415-0005",
    description: "Herramientas, materiales de construcción y pinturería.",
    lat: -26.7865, lng: -60.4470, profileImage: null,
    horario: "Lun–Sáb 8:00–18:00",
  },
  {
    id: 6, name: "Electricista Herrera", categoria: "servicios",
    address: "Las Heras 560", phone: "362 415-0006",
    description: "Instalaciones eléctricas. Urgencias las 24 hs.",
    lat: -26.7940, lng: -60.4430, profileImage: null,
    horario: "Urgencias 24 hs",
  },
  {
    id: 7, name: "Parrilla Don Carlos", categoria: "gastronomia",
    address: "Moreno 120", phone: "362 415-0007",
    description: "Parrilla con cortes de primera. Reservas al teléfono.",
    lat: -26.7878, lng: -60.4398, profileImage: null,
    horario: "Mar–Dom 12:00–15:00 y 20:00–00:00",
  },
  {
    id: 8, name: "Dra. Fernández – Pediatría", categoria: "salud",
    address: "Sarmiento 670", phone: "362 415-0008",
    description: "Consultorio de pediatría. Obras sociales.",
    lat: -26.7910, lng: -60.4405, profileImage: null,
    horario: "Lun–Vie 9:00–13:00",
  },
];

// ─── Componente: vuela a una posición cuando cambia ──────────────────────────
const FlyToMarker = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 16, { duration: 0.9 });
  }, [position, map]);
  return null;
};

// ─── Componente: botón "Mi ubicación" ────────────────────────────────────────
const LocateButton = () => {
  const map = useMap();
  const [loading, setLoading] = useState(false);

  const locate = () => {
    setLoading(true);
    map.locate({ setView: true, maxZoom: 16 });
    map.once("locationfound", () => setLoading(false));
    map.once("locationerror", () => setLoading(false));
  };

  return (
    <button className={styles.locateBtn} onClick={locate} title="Mi ubicación">
      <Navigation size={18} className={loading ? styles.locateSpin : ""} />
    </button>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════
const MapaPage = () => {
  const navigate = useNavigate();

  // Estado
  const [comercios] = useState(MOCK_COMERCIOS); // ← reemplazar con useEffect + fetch
  const [categoriaActiva, setCategoriaActiva] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);
  const [tileLayer, setTileLayer] = useState("carto"); // "carto" | "osm" | "municipio"

  // Filtrado
  const filtrados = useMemo(() => {
    return comercios.filter((c) => {
      const matchCat = categoriaActiva === "todas" || c.categoria === categoriaActiva;
      const q = busqueda.toLowerCase().trim();
      const matchQ = !q || c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [comercios, categoriaActiva, busqueda]);

  const selectedComercio = filtrados.find((c) => c.id === selectedId) || null;

  // Al seleccionar desde la lista
  const handleListClick = (comercio) => {
    setSelectedId(comercio.id);
    setFlyTarget([comercio.lat, comercio.lng]);
  };

  // Obtener color/letra de categoría
  const getCatMeta = (catId) =>
    CATEGORIAS.find((c) => c.id === catId) || CATEGORIAS[0];

  // Tile URLs
  const TILES = {
    carto: {
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      label: "Carto (default)",
    },
    osm: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      label: "OpenStreetMap",
    },
    municipio: {
      // URL de prueba del WMTS municipal — si tiene CORS abierto funciona,
      // si no, Leaflet lo ignora silenciosamente y podés cambiar el layer
      url: "https://geomat-maps.com.ar/msp/maptiles/1.0.0/catastro/default/EPSG:3857/{z}/{y}/{x}.png",
      attribution: '&copy; Municipalidad de Sáenz Peña – GeoMat',
      label: "Catastro Municipal",
    },
  };

  return (
    <div className={styles.page}>

      {/* ── BARRA SUPERIOR ──────────────────────────────────────────────── */}
      <div className={styles.topBar}>

        {/* Buscador */}
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar negocio, calle o servicio..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={styles.searchInput}
          />
          {busqueda && (
            <button className={styles.clearBtn} onClick={() => setBusqueda("")}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtros de categoría */}
        <div className={styles.catBar}>
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.catChip} ${categoriaActiva === cat.id ? styles.catChipActive : ""}`}
              style={categoriaActiva === cat.id ? { background: cat.color, borderColor: cat.color } : {}}
              onClick={() => setCategoriaActiva(cat.id)}
            >
              <span
                className={styles.catDot}
                style={{ background: categoriaActiva === cat.id ? "#fff" : cat.color }}
              />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Contador */}
        <div className={styles.counterBadge}>
          <MapPin size={14} />
          {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── CUERPO: mapa + panel lateral ───────────────────────────────── */}
      <div className={styles.body}>

        {/* Panel lateral */}
        <aside className={`${styles.panel} ${panelOpen ? styles.panelOpen : styles.panelClosed}`}>
          <button
            className={styles.panelToggle}
            onClick={() => setPanelOpen((p) => !p)}
            title={panelOpen ? "Cerrar panel" : "Abrir panel"}
          >
            <ChevronDown
              size={18}
              className={`${styles.toggleIcon} ${panelOpen ? "" : styles.toggleIconRotated}`}
            />
          </button>

          {panelOpen && (
            <>
              <div className={styles.panelHeader}>
                <span className={styles.panelTitle}>Resultados</span>
                <span className={styles.panelCount}>{filtrados.length}</span>
              </div>

              <div className={styles.lista}>
                {filtrados.length === 0 ? (
                  <div className={styles.noResults}>
                    <MapPin size={32} strokeWidth={1} />
                    <p>Sin resultados para esta búsqueda</p>
                  </div>
                ) : (
                  filtrados.map((c) => {
                    const meta = getCatMeta(c.categoria);
                    const isSelected = c.id === selectedId;
                    return (
                      <div
                        key={c.id}
                        className={`${styles.listItem} ${isSelected ? styles.listItemActive : ""}`}
                        onClick={() => handleListClick(c)}
                      >
                        {/* Avatar */}
                        <div
                          className={styles.listAvatar}
                          style={{ background: meta.color }}
                        >
                          {c.profileImage
                            ? <img src={c.profileImage} alt={c.name} />
                            : <span>{meta.letra}</span>
                          }
                        </div>

                        {/* Info */}
                        <div className={styles.listInfo}>
                          <span className={styles.listName}>{c.name}</span>
                          <span className={styles.listAddress}>
                            <MapPin size={11} /> {c.address}
                          </span>
                          <span
                            className={styles.listCat}
                            style={{ color: meta.color }}
                          >
                            {meta.label}
                          </span>
                        </div>

                        {/* Flecha */}
                        <ExternalLink size={14} className={styles.listArrow} />
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </aside>

        {/* ── MAPA ──────────────────────────────────────────────────────── */}
        <div className={styles.mapWrapper}>
          <MapContainer
            center={CITY_CENTER}
            zoom={CITY_ZOOM}
            className={styles.map}
            zoomControl={false}
          >
            {/* Tile layer dinámico */}
            <TileLayer
              key={tileLayer}
              url={TILES[tileLayer].url}
              attribution={TILES[tileLayer].attribution}
              maxZoom={19}
            />

            {/* Volar al seleccionado */}
            {flyTarget && <FlyToMarker position={flyTarget} />}

            {/* Botón de ubicación */}
            <LocateButton />

            {/* Pins */}
            {filtrados.map((c) => {
              const meta = getCatMeta(c.categoria);
              const icon = createCategoryIcon(meta.color, meta.letra);
              return (
                <Marker
                  key={c.id}
                  position={[c.lat, c.lng]}
                  icon={icon}
                  eventHandlers={{
                    click: () => {
                      setSelectedId(c.id);
                      setFlyTarget([c.lat, c.lng]);
                    },
                  }}
                >
                  <Popup className={styles.popup}>
                    <div className={styles.popupInner}>
                      {/* Header popup */}
                      <div className={styles.popupHeader}>
                        <div
                          className={styles.popupAvatar}
                          style={{ background: meta.color }}
                        >
                          {c.profileImage
                            ? <img src={c.profileImage} alt={c.name} />
                            : <span>{meta.letra}</span>
                          }
                        </div>
                        <div>
                          <h3 className={styles.popupName}>{c.name}</h3>
                          <span
                            className={styles.popupCat}
                            style={{ color: meta.color }}
                          >
                            {meta.label}
                          </span>
                        </div>
                      </div>

                      {/* Descripción */}
                      <p className={styles.popupDesc}>{c.description}</p>

                      {/* Detalles */}
                      <div className={styles.popupDetails}>
                        <div className={styles.popupRow}>
                          <MapPin size={13} />
                          <span>{c.address}</span>
                        </div>
                        {c.phone && (
                          <div className={styles.popupRow}>
                            <Phone size={13} />
                            <span>{c.phone}</span>
                          </div>
                        )}
                        {c.horario && (
                          <div className={styles.popupRow}>
                            <Clock size={13} />
                            <span>{c.horario}</span>
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <button
                        className={styles.popupCta}
                        style={{ background: meta.color }}
                        onClick={() => navigate(`/negocios/${c.id}`)}
                      >
                        Ver perfil completo
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* ── Menú de capas ─────────────────────────────────────────── */}
          <div className={styles.layerControl}>
            <button
              className={styles.layerBtn}
              onClick={() => setLayerMenuOpen((p) => !p)}
              title="Cambiar mapa base"
            >
              <Layers size={18} />
            </button>
            {layerMenuOpen && (
              <div className={styles.layerMenu}>
                {Object.entries(TILES).map(([key, val]) => (
                  <button
                    key={key}
                    className={`${styles.layerOption} ${tileLayer === key ? styles.layerOptionActive : ""}`}
                    onClick={() => { setTileLayer(key); setLayerMenuOpen(false); }}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapaPage;