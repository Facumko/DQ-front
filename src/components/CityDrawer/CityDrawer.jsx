import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories, getSubcategoryTags } from "../../Api/Api";
import styles from "./CityDrawer.module.css";
import {
  FaUtensils, FaHeartbeat, FaGavel, FaGraduationCap,
  FaShoppingBag, FaWrench, FaHome, FaMusic,
  FaMapMarkedAlt, FaCalendarAlt, FaStar, FaTimes,
  FaChevronRight, FaStore, FaCut, FaDumbbell, FaPaw,
  FaCarAlt, FaFlask, FaCamera, FaLandmark
} from "react-icons/fa";

// Estilo visual (ícono + color) por categoría, matcheado por nombre.
// El backend (CategoryDto) solo manda { idCategory, name, description } —
// esto es puramente decorativo, la fuente de verdad de qué categorías existen es la API.
const CATEGORY_STYLES = [
  { match: /gastronom|comida|restaurant|café|bar\b/i,        icon: FaUtensils,      color: "#e67e22" },
  { match: /salud|médic|medicin|clínic/i,                    icon: FaHeartbeat,     color: "#27ae60" },
  { match: /legal|contable|abogad|contad/i,                  icon: FaGavel,         color: "#2980b9" },
  { match: /educaci|escuela|academia|curso/i,                icon: FaGraduationCap, color: "#8e44ad" },
  { match: /comercio|tienda|shopping|retail/i,                icon: FaShoppingBag,   color: "#16a085" },
  { match: /servicio|hogar|reparaci|plomer|electric/i,        icon: FaWrench,        color: "#d35400" },
  { match: /inmobiliari|propiedad|alquiler/i,                 icon: FaHome,          color: "#c0392b" },
  { match: /entretenimiento|música|music|diversión/i,         icon: FaMusic,         color: "#e91e8c" },
  { match: /bellez|estétic|peluquer|spa/i,                    icon: FaCut,           color: "#9b59b6" },
  { match: /deporte|fitness|gimnasio/i,                       icon: FaDumbbell,      color: "#1abc9c" },
  { match: /mascota|veterinari|pet\b/i,                       icon: FaPaw,           color: "#f39c12" },
  { match: /automotor|auto\b|vehículo|mecánic/i,              icon: FaCarAlt,        color: "#7f8c8d" },
  { match: /farmacia/i,                                       icon: FaFlask,         color: "#2ecc71" },
  { match: /foto/i,                                           icon: FaCamera,        color: "#e74c3c" },
  { match: /públic|municipal|gobierno/i,                      icon: FaLandmark,      color: "#34495e" },
];
const DEFAULT_CATEGORY_STYLE = { icon: FaStore, color: "#B00020" };

const getCategoryStyle = (name) =>
  CATEGORY_STYLES.find((s) => s.match.test(name || "")) || DEFAULT_CATEGORY_STYLE;

const EXPLORAR = [
  { id: "mapa",      label: "Mapa de la ciudad",       sublabel: "Encontrá negocios cerca tuyo", icon: FaMapMarkedAlt, color: "#B00020", link: "/mapa",        highlight: true  },
  { id: "eventos",   label: "Eventos",                 sublabel: "Lo que pasa en la ciudad",     icon: FaCalendarAlt,  color: "#2980b9", link: "/eventos",     highlight: false },
  { id: "agregados", label: "Agregados recientemente", sublabel: "Lo nuevo en Sáenz Peña",       icon: FaStar,         color: "#f39c12", link: "/search?agregados=true",   highlight: false },
  { id: "todos",     label: "Ver todos los negocios",  sublabel: "Directorio completo",          icon: FaStore,        color: "#16a085", link: "/search?q=",   highlight: false },
];

const CityDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const bodyRef  = useRef(null);

  const [categories,        setCategories]        = useState([]);
  const [loadingCategories, setLoadingCategories]  = useState(true);
  const hasFetchedRef = useRef(false);

  // Subcategorías agrupadas por idCategory, para mostrar al pasar el cursor
  // (o al tocar la flechita en mobile) sobre una categoría.
  const [subcategoriesByCategory, setSubcategoriesByCategory] = useState({});
  const [loadingSubcategories,    setLoadingSubcategories]    = useState(true);
  const [openCategoryId,          setOpenCategoryId]          = useState(null);

  // Traer categorías reales del backend la primera vez que se abre el drawer
  useEffect(() => {
    if (!isOpen || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));

    getSubcategoryTags()
      .then((tags) => {
        const grouped = {};
        (Array.isArray(tags) ? tags : []).forEach((t) => {
          // El back a veces manda el id de categoría plano (idCategory) y a
          // veces anidado (category.idCategory), según el endpoint — cubrimos las dos formas.
          const catId = t.idCategory ?? t.category?.idCategory;
          if (catId == null || !t.nameTag) return;
          if (!grouped[catId]) grouped[catId] = [];
          grouped[catId].push(t.nameTag);
        });
        setSubcategoriesByCategory(grouped);
      })
      .catch(() => setSubcategoriesByCategory({}))
      .finally(() => setLoadingSubcategories(false));
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [isOpen]);

  const handleNavigate = (link) => { navigate(link); onClose(); };

  // Misma ruta y misma lógica de filtrado que ya usa SearchPage (categoryIds numérico),
  // así los negocios que se muestran son los negocios reales de esa categoría.
  const handleCategoryClick = (cat) => {
    handleNavigate(`/search?categoryIds=${cat.idCategory}`);
  };

  // Búsqueda por texto (mismo patrón que "Ver todos los negocios") filtrando
  // por el nombre de la subcategoría, que matchea contra los tags del negocio.
  const handleSubcategoryClick = (nameTag) => {
    handleNavigate(`/search?q=${encodeURIComponent(nameTag)}`);
  };

  useEffect(() => {
    if (!isOpen) setOpenCategoryId(null);
  }, [isOpen]);

  return (
    <>
      <div className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ""}`} onClick={onClose} aria-hidden="true" />

      <aside className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`} aria-label="Menú de categorías">

        <div className={styles.drawerHeader}>
          <div className={styles.drawerBrand}>
            <img src="/logoDQ.png" alt="Dónde Queda?" className={styles.drawerLogo} />
            <span>Dónde Queda?</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar menú"><FaTimes /></button>
        </div>

        <div className={styles.drawerBody} ref={bodyRef}>

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
                    <div className={styles.exploreIcon} style={{ background: item.highlight ? item.color : `${item.color}18`, color: item.highlight ? "#fff" : item.color }}>
                      <Icon />
                    </div>
                    <div className={styles.exploreText}>
                      <span className={styles.exploreLabel} style={item.highlight ? { color: item.color } : {}}>{item.label}</span>
                      <span className={styles.exploreSub}>{item.sublabel}</span>
                    </div>
                    <FaChevronRight className={styles.exploreArrow} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.section}>
            <span className={styles.sectionLabel}>Categorías</span>

            {loadingCategories ? (
              <span className={styles.catLoading}>Cargando categorías...</span>
            ) : categories.length === 0 ? (
              <span className={styles.catLoading}>No hay categorías disponibles</span>
            ) : (
              <div className={styles.catList}>
                {categories.map((cat) => {
                  const { icon: Icon, color } = getCategoryStyle(cat.name);
                  const subcats = subcategoriesByCategory[cat.idCategory] || [];
                  const isOpen = openCategoryId === cat.idCategory;
                  return (
                    <div
                      key={cat.idCategory}
                      className={styles.catRowWrapper}
                      onMouseEnter={() => setOpenCategoryId(cat.idCategory)}
                      onMouseLeave={() => setOpenCategoryId((prev) => (prev === cat.idCategory ? null : prev))}
                    >
                      <div className={styles.catRow}>
                        <button type="button" className={styles.catMain} onClick={() => handleCategoryClick(cat)}>
                          <div className={styles.catIconWrap} style={{ background: `${color}18`, color }}><Icon /></div>
                          <span className={styles.catLabel}>{cat.name}</span>
                        </button>
                        <button
                          type="button"
                          className={`${styles.catToggle} ${isOpen ? styles.catToggleOpen : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenCategoryId((prev) => (prev === cat.idCategory ? null : cat.idCategory));
                          }}
                          aria-expanded={isOpen}
                          aria-label={isOpen ? "Ocultar subcategorías" : "Ver subcategorías"}
                        >
                          <FaChevronRight className={styles.catArrow} />
                        </button>
                      </div>

                      <div className={`${styles.subcategoryPanel} ${isOpen ? styles.subcategoryPanelOpen : ""}`}>
                        {loadingSubcategories ? (
                          <span className={styles.catLoading}>Cargando...</span>
                        ) : subcats.length === 0 ? (
                          <span className={styles.catLoading}>Sin subcategorías</span>
                        ) : (
                          <div className={styles.subcategoryChips}>
                            {subcats.map((name) => (
                              <button
                                key={name}
                                type="button"
                                className={styles.subcategoryChip}
                                onClick={() => handleSubcategoryClick(name)}
                              >
                                {name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        <div className={styles.drawerFooter}>
          <span>© {new Date().getFullYear()} Dónde Queda? — Sáenz Peña, Chaco</span>
        </div>
      </aside>
    </>
  );
};

export default CityDrawer;