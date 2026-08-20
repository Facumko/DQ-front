import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
  searchCommerces,
  getAllCommerces,
  getRecentCommerces,
  getCategories,
  getCommercesByCategories,
  isCommerceOpenNow,
  isCommerceOpenToday,
  isEventToday,
  commerceHasSubcategoryMatching,
  getActivePromotions,
  getAllEvents,
} from "../Api/Api";
import SearchResultCard from "../components/SearchResultCard/SearchResultCard";
import PromotionExploreCard from "../components/PromotionExploreCard/PromotionExploreCard";
import EventTodayCard from "../components/EventTodayCard/EventTodayCard";
import EmergencyNumbers from "../components/EmergencyNumbers/EmergencyNumbers";
import { Loader, SearchX, Clock3 } from "lucide-react";
import styles from "./SearchPage.module.css";

const LIMIT = 12;

// Claves de "explora" que ya se resuelven en esta página.
const EXPLORA_TITLES = {
  "abierto-ahora": "De Turno y Abierto Ahora",
  "emergencias": "Servicios de Emergencia y 24hs",
  "cena": "¿Dónde cenar esta noche?",
  "promociones": "Promociones y Descuentos",
  "hoy": "¿Qué hacemos hoy?",
  "servicios": "Directorio de servicios",
};

// Tag que carga el formulario de onboarding cuando el dueño responde "Sí" a
// la pregunta de emergencias (ver ONBOARDING_QUESTIONS en
// OnboardingQuestionnaire.jsx). Emergencias es la única caja que sigue
// usando una pregunta directa — cena y hoy ahora se resuelven con
// subcategorías (ver más abajo).
const EMERGENCIA_TAG = "Urgencia24hs";

// Confirmado contra el catálogo real de /etiqueta/subcategoria (13
// categorías, ~78 subcategorías). Los nombres de abajo están copiados tal
// cual figuran ahí — si el back agrega/renombra subcategorías en el
// futuro, hay que revisar estas listas.
// Nombres EXACTOS del catálogo real de /etiqueta/subcategoria (confirmado
// por el equipo de back). commerceHasSubcategoryMatching normaliza tildes y
// mayúsculas en la comparación, así que estos strings no necesitan estar
// "recortados" a una palabra clave — van completos, tal cual figuran en el
// backend, porque ya sabemos que existen así.
const CENA_SUBCATEGORY_KEYWORDS = [
  "restaurantes", "comida rápida", "bares y cervecerías",
];
const HOY_SUBCATEGORY_KEYWORDS = [
  "cafeterías", "heladerías", "panaderías y pastelerías",
  "cines y teatros", "recreación infantil",
];
// Mismas subcategorías que arma el widget "Directorio de servicios" del
// Home (ver DIRECTORY_TARGET_SUBCATEGORIES en Home.jsx) — el widget solo
// muestra hasta 6 comercios por rubro en su carrusel, así que "Ver todos
// los servicios" tiene que traer la lista completa de estos mismos rubros
// acá. Nombres EXACTOS del catálogo, igual que arriba.
const SERVICIOS_SUBCATEGORY_KEYWORDS = [
  "clínicas y consultorios", "abogados", "contadores", "electricidad", "plomería",
];

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Leer query desde location para reaccionar a replace:true
  const query = new URLSearchParams(location.search).get("q");
  const categoryIdsParam = searchParams.get("categoryIds");
  const isAgregados = searchParams.get("agregados") === "true";
  const explora = searchParams.get("explora");
  const isAbiertoAhora = explora === "abierto-ahora";
  const isEmergencias = explora === "emergencias";
  const isCena = explora === "cena";
  const isPromociones = explora === "promociones";
  const isHoy = explora === "hoy";
  const isServicios = explora === "servicios";
  const isExploraComingSoon = Boolean(explora) && !EXPLORA_TITLES[explora];
  // query === null pasa cuando no hay parámetro "q" en la URL (ej. entrar
  // directo a /search sin nada más). Se trata igual que "" — mostrar todos
  // los negocios — en vez de caer en un estado roto sin título ni fetch.
  const isAllMode = !isAgregados && !explora && (query === null || query.trim() === "");
  const isSearchMode = !isAgregados && !explora && query !== null && query.trim() !== "";

  const [results, setResults] = useState([]);
  const [todayEvents, setTodayEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const offsetRef = useRef(0);

  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(() =>
    categoryIdsParam ? [Number(categoryIdsParam)] : []
  );

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const load = useCallback(
    async (isLoadMore = false) => {
      if (!isLoadMore) {
        setLoading(true);
        setError("");
        setResults([]);
        setTodayEvents([]);
        setHasMore(false);
        offsetRef.current = 0;
      } else {
        setLoadingMore(true);
      }

      try {
        if (isAbiertoAhora) {
          const all = await getAllCommerces();
          const open = Array.isArray(all) ? all.filter((c) => isCommerceOpenNow(c)) : [];
          setResults(open);
          setHasMore(false);
        } else if (isEmergencias) {
          const emergencyCommerces = await searchCommerces(EMERGENCIA_TAG, 50, 0);
          setResults(Array.isArray(emergencyCommerces) ? emergencyCommerces : []);
          setHasMore(false);
        } else if (isCena) {
          const all = await getAllCommerces();
          const list = (Array.isArray(all) ? all : []).filter(
            (c) => commerceHasSubcategoryMatching(c, CENA_SUBCATEGORY_KEYWORDS) && isCommerceOpenToday(c)
          );
          // Los que están abiertos ahora (ya, en este momento) van primero:
          // es una decisión para esta noche, así que lo más útil es lo más
          // accionable ya mismo. Los que abren más tarde quedan después,
          // pero siguen apareciendo porque abren hoy.
          const sorted = [...list].sort((a, b) => {
            const aOpen = isCommerceOpenNow(a) ? 0 : 1;
            const bOpen = isCommerceOpenNow(b) ? 0 : 1;
            return aOpen - bOpen;
          });
          setResults(sorted);
          setHasMore(false);
        } else if (isPromociones) {
          const promos = await getActivePromotions();
          setResults(promos);
          setHasMore(false);
        } else if (isHoy) {
          const [all, allEvents] = await Promise.all([
            getAllCommerces(),
            getAllEvents().catch(() => []),
          ]);
          const planCommerces = (Array.isArray(all) ? all : []).filter((c) =>
            commerceHasSubcategoryMatching(c, HOY_SUBCATEGORY_KEYWORDS)
          );
          setResults(planCommerces);
          const eventsToday = (Array.isArray(allEvents) ? allEvents : [])
            .filter((ev) => ev.active !== false && isEventToday(ev))
            .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
          setTodayEvents(eventsToday);
          setHasMore(false);
        } else if (isServicios) {
          const all = await getAllCommerces();
          const list = (Array.isArray(all) ? all : []).filter((c) =>
            commerceHasSubcategoryMatching(c, SERVICIOS_SUBCATEGORY_KEYWORDS)
          );
          setResults(list);
          setHasMore(false);
        } else if (isExploraComingSoon) {
          setResults([]);
          setHasMore(false);
        } else if (isAgregados) {
          const data = await getRecentCommerces();
          setResults(Array.isArray(data) ? data.slice(0, 50) : []);
          setHasMore(false);
        } else if (isAllMode && selectedCategoryIds.length === 0) {
          const all = await getAllCommerces();
          setResults(all);
          setHasMore(false);
        } else if (selectedCategoryIds.length > 0) {
          let newResults = await getCommercesByCategories(selectedCategoryIds);
          if (query?.trim()) {
            const q = query.toLowerCase();
            newResults = newResults.filter(
              (c) =>
                c.name?.toLowerCase().includes(q) ||
                c.description?.toLowerCase().includes(q)
            );
          }
          setResults(Array.isArray(newResults) ? newResults : []);
          setHasMore(false);
        } else if (isSearchMode) {
          const currentOffset = isLoadMore ? offsetRef.current : 0;
          const newResults = await searchCommerces(
            query.trim(),
            LIMIT,
            currentOffset
          );
          offsetRef.current = currentOffset + LIMIT;
          setHasMore(newResults.length === LIMIT);
          if (isLoadMore) {
            setResults((prev) => [...prev, ...newResults]);
          } else {
            setResults(newResults);
          }
        }
      } catch (err) {
        setError(err.message || "Error al cargar negocios");
        if (!isLoadMore) setResults([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [query, isAgregados, isAbiertoAhora, isEmergencias, isCena, isPromociones, isHoy, isServicios, isExploraComingSoon, isAllMode, isSearchMode, selectedCategoryIds]
  );

  useEffect(() => {
    load(false);
  }, [query, isAgregados, explora, selectedCategoryIds, load]);


  const handleLoadMore = () => {
    if (hasMore && !loadingMore) load(true);
  };

  const toggleCategory = (id) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedCategoryNames = categories
    .filter((cat) => selectedCategoryIds.includes(cat.idCategory))
    .map((cat) => cat.name);

  const getTitle = () => {
    if (isAbiertoAhora) return EXPLORA_TITLES["abierto-ahora"];
    if (isEmergencias) return EXPLORA_TITLES["emergencias"];
    if (isCena) return EXPLORA_TITLES["cena"];
    if (isPromociones) return EXPLORA_TITLES["promociones"];
    if (isHoy) return EXPLORA_TITLES["hoy"];
    if (isServicios) return EXPLORA_TITLES["servicios"];
    if (isExploraComingSoon) return "Muy pronto";
    if (isAgregados) return "Agregados recientemente";
    if (selectedCategoryIds.length > 0 && !query?.trim()) {
      return selectedCategoryNames.length > 0 ? selectedCategoryNames.join(" y ") : "Negocios por categoría";
    }
    if (selectedCategoryIds.length > 0 && query?.trim()) {
      return selectedCategoryNames.length > 0 ? `"${query}" en ${selectedCategoryNames.join(" y ")}` : `"${query}" en categorías seleccionadas`;
    }
    if (isAllMode) return "Todos los negocios";
    return `Resultados para "${query}"`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        {isEmergencias && <EmergencyNumbers />}
        {categories.length > 0 && (
          <div className={styles.categoryChips}>
            {categories.map((cat) => (
              <button
                key={cat.idCategory}
                className={`${styles.chip} ${selectedCategoryIds.includes(cat.idCategory) ? styles.chipActive : ""}`}
                onClick={() => toggleCategory(cat.idCategory)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
        <div className={styles.loadingContainer}>
          <Loader size={40} className={styles.spinner} />
          <p>
            {isAbiertoAhora ? "Viendo quién está abierto ahora..." : isEmergencias ? "Buscando servicios de emergencia..." : isCena ? "Buscando dónde cenar..." : isPromociones ? "Buscando promociones activas..." : isHoy ? "Viendo qué se puede hacer hoy..." : isServicios ? "Cargando el directorio de servicios..." : isAgregados ? "Cargando novedades..." : isAllMode ? "Cargando negocios..." : "Buscando..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {isEmergencias && <EmergencyNumbers />}

      {categories.length > 0 && !explora && (
        <div className={styles.categoryChips}>
          {selectedCategoryIds.length > 0 && (
            <button
              className={`${styles.chip} ${styles.chipClear}`}
              onClick={() => setSelectedCategoryIds([])}
            >
              ✕ Limpiar filtros
            </button>
          )}
          {categories.map((cat) => (
            <button
              key={cat.idCategory}
              className={`${styles.chip} ${selectedCategoryIds.includes(cat.idCategory) ? styles.chipActive : ""}`}
              onClick={() => toggleCategory(cat.idCategory)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{getTitle()}</h1>
          {(results.length > 0 || (isHoy && todayEvents.length > 0)) && (
            <p className={styles.queryText}>
              {isPromociones
                ? `${results.length} promoción${results.length !== 1 ? "es" : ""} activa${results.length !== 1 ? "s" : ""}`
                : isHoy
                ? [
                    results.length > 0 ? `${results.length} plan${results.length !== 1 ? "es" : ""} para hoy` : null,
                    todayEvents.length > 0 ? `${todayEvents.length} evento${todayEvents.length !== 1 ? "s" : ""} hoy` : null,
                  ].filter(Boolean).join(" · ")
                : `${results.length} negocio${results.length !== 1 ? "s" : ""}${isAbiertoAhora ? " abiertos en este momento" : isEmergencias ? " que atienden urgencias" : isCena ? " para cenar esta noche" : isServicios ? " en el directorio de servicios" : isAgregados ? " nuevos en los últimos 30 días" : isAllMode ? " en Sáenz Peña" : ` encontrado${results.length !== 1 ? "s" : ""}`}`}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <SearchX size={18} />
          <span>{error}</span>
        </div>
      )}

      {isExploraComingSoon && !error && (
        <div className={styles.noResults}>
          <Clock3 size={56} strokeWidth={1.5} />
          <h3>Estamos armando esta sección</h3>
          <p>Todavía estamos conectando este filtro. Volvé pronto.</p>
          <button className={styles.backButton} onClick={() => navigate("/")}>
            Volver al inicio
          </button>
        </div>
      )}

      {!isExploraComingSoon && !error && (isHoy ? results.length === 0 && todayEvents.length === 0 : results.length === 0) && (
        <div className={styles.noResults}>
          <SearchX size={56} strokeWidth={1.5} />
          <h3>
            {isAbiertoAhora ? "No hay negocios abiertos en este momento"
              : isEmergencias ? "Todavía no hay comercios cargados con este servicio"
              : isCena ? "Todavía no hay comercios con subcategoría gastronómica que abran hoy"
              : isServicios ? "Todavía no hay comercios cargados en médicos, abogados, contadores, electricistas o plomeros"
              : isPromociones ? "No hay promociones activas en este momento"
              : isHoy ? "Todavía no hay planes ni eventos cargados para hoy"
              : isAgregados ? "No hay negocios nuevos este mes"
              : isAllMode ? "Todavía no hay negocios registrados"
              : selectedCategoryIds.length > 0 ? "No hay negocios en estas categorías"
              : "No se encontraron negocios"}
          </h3>
          <p>
            {isAbiertoAhora ? "Probá de nuevo más tarde, los horarios cambian durante el día"
              : isEmergencias ? "Mientras tanto, usá los números útiles de arriba"
              : isCena ? "Puede que hoy sea el día de cierre de varios locales — probá explorando por categoría"
              : isServicios ? "Volvé a revisar más tarde, se van sumando comercios todos los días"
              : isPromociones ? "Volvé a revisar más tarde, los comercios suelen activarlas por tiempo limitado"
              : isHoy ? "Volvé a revisar más tarde, se va sumando contenido todos los días"
              : isAgregados ? "Volvé pronto, ¡cada día se suman más!"
              : selectedCategoryIds.length > 0 ? "Probá con otras categorías o limpiá los filtros"
              : "Probá con otro término o revisá la ortografía"}
          </p>
          {!isEmergencias && (
            <button className={styles.backButton} onClick={() => navigate("/")}>
              Volver al inicio
            </button>
          )}
        </div>
      )}

      {isHoy && todayEvents.length > 0 && (
        <div className={styles.eventsSection}>
          <h2 className={styles.subsectionTitle}>Eventos de hoy</h2>
          <div className={styles.eventsList}>
            {todayEvents.map((ev) => (
              <EventTodayCard key={ev.idEvent} event={ev} />
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <>
          {isHoy && <h2 className={styles.subsectionTitle}>Buenos planes para hoy</h2>}
          <div className={styles.resultsGrid}>
            {isPromociones
              ? results.map((promo) => (
                  <PromotionExploreCard key={promo.idPromotion} promotion={promo} />
                ))
              : results.map((commerce) => (
                  <SearchResultCard key={commerce.idCommerce} commerce={commerce} />
                ))}
          </div>

          {hasMore && (
            <div className={styles.loadMoreContainer}>
              <button
                className={styles.loadMoreButton}
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <><Loader size={16} className={styles.spinner} /> Cargando...</>
                ) : (
                  "Ver más resultados"
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchPage;