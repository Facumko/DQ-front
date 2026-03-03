import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CityDrawer.module.css";
import {
  FaUtensils, FaHeartbeat, FaGavel, FaGraduationCap,
  FaShoppingBag, FaWrench, FaHome, FaMusic,
  FaMapMarkedAlt, FaCalendarAlt, FaStar, FaTimes,
  FaChevronRight, FaStore, FaCut, FaDumbbell, FaPaw,
  FaCarAlt, FaFlask, FaCamera, FaLandmark
} from "react-icons/fa";

// ── Categorías principales ────────────────────────────────────────────────────
const CATEGORIAS = [
  { id: "gastronomia",     label: "Gastronomía",       icon: FaUtensils,    color: "#e67e22" },
  { id: "salud",           label: "Salud y Medicina",  icon: FaHeartbeat,   color: "#27ae60" },
  { id: "legal",           label: "Legal y Contable",  icon: FaGavel,       color: "#2980b9" },
  { id: "educacion",       label: "Educación",         icon: FaGraduationCap, color: "#8e44ad" },
  { id: "comercio",        label: "Comercio",          icon: FaShoppingBag, color: "#16a085" },
  { id: "servicios",       label: "Servicios del Hogar", icon: FaWrench,    color: "#d35400" },
  { id: "inmobiliaria",    label: "Inmobiliaria",      icon: FaHome,        color: "#c0392b" },
  { id: "entretenimiento", label: "Entretenimiento",   icon: FaMusic,       color: "#e91e8c" },
  { id: "belleza",         label: "Belleza y Estética",icon: FaCut,         color: "#9b59b6" },
  { id: "deportes",        label: "Deportes y Fitness",icon: FaDumbbell,    color: "#1abc9c" },
  { id: "mascotas",        label: "Mascotas",          icon: FaPaw,         color: "#f39c12" },
  { id: "automotor",       label: "Automotor",         icon: FaCarAlt,      color: "#7f8c8d" },
  { id: "farmacia",        label: "Farmacias",         icon: FaFlask,       color: "#2ecc71" },
  { id: "fotografia",      label: "Fotografía",        icon: FaCamera,      color: "#e74c3c" },
  { id: "publico",         label: "Entes Públicos",    icon: FaLandmark,    color: "#34495e" },
];

// ── Sección Explorar ──────────────────────────────────────────────────────────
const EXPLORAR = [
  {
    id: "mapa",
    label: "Mapa de la ciudad",
    sublabel: "Encontrá negocios cerca tuyo",
    icon: FaMapMarkedAlt,
    color: "#B00020",
    link: "/mapa",
    highlight: true,
  },
  {
    id: "eventos",
    label: "Eventos",
    sublabel: "Lo que pasa en la ciudad",
    icon: FaCalendarAlt,
    color: "#2980b9",
    link: "/eventos",
  },
  {
    id: "agregados",
    label: "Agregados recientemente",
    sublabel: "Lo nuevo de DQ",
    icon: FaStar,
    color: "#f39c12",
    link: "/search?agregados=true",
  },
  {
    id: "todos",
    label: "Ver todos los negocios",
    sublabel: "Directorio completo",
    icon: FaStore,
    color: "#16a085",
    link: "/search?q=",
  },
];

// ═════════════════════════════════════════════════════════════════════════════
const CityDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const drawerRef = useRef(null);
  const bodyRef   = useRef(null);

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Volver al tope cada vez que se abre
  useEffect(() => {
    if (isOpen && bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  const handleNavigate = (link) => {
    navigate(link);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}
        aria-label="Menú de categorías"
      >
        {/* Header del drawer */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerBrand}>
            <img src="/logoDQ.png" alt="Dónde Queda?" className={styles.drawerLogo} />
            <span>Dónde Queda?</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar menú">
            <FaTimes />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className={styles.drawerBody} ref={bodyRef}>

          {/* ── Sección: Explorar ── */}
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Explorar</span>
            <div className={styles.exploreGrid}>
              {EXPLORAR.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`${styles.exploreCard} ${item.highlight ? styles.exploreCardHighlight : ""}`}
                    style={item.highlight ? { borderColor: item.color } : {}}
                    onClick={() => handleNavigate(item.link)}
                  >
                    <div
                      className={styles.exploreIcon}
                      style={{ background: item.highlight ? item.color : `${item.color}18`, color: item.highlight ? "#fff" : item.color }}
                    >
                      <Icon />
                    </div>
                    <div className={styles.exploreText}>
                      <span className={styles.exploreLabel} style={item.highlight ? { color: item.color } : {}}>
                        {item.label}
                      </span>
                      <span className={styles.exploreSub}>{item.sublabel}</span>
                    </div>
                    <FaChevronRight className={styles.exploreArrow} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divisor */}
          <div className={styles.divider} />

          {/* ── Sección: Categorías ── */}
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Categorías</span>
            <div className={styles.catList}>
              {CATEGORIAS.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    className={styles.catRow}
                    onClick={() => handleNavigate(`/search?categoria=${cat.id}`)}
                  >
                    <div
                      className={styles.catIconWrap}
                      style={{ background: `${cat.color}18`, color: cat.color }}
                    >
                      <Icon />
                    </div>
                    <span className={styles.catLabel}>{cat.label}</span>
                    <FaChevronRight className={styles.catArrow} />
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer del drawer */}
        <div className={styles.drawerFooter}>
          <span>© {new Date().getFullYear()} Dónde Queda? — Sáenz Peña, Chaco</span>
        </div>
      </aside>
    </>
  );
};

export default CityDrawer;