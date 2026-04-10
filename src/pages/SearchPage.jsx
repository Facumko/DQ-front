import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  searchCommerces,
  getAllCommerces,
  getRecentCommerces,
  getCategories,
  getCommercesByCategories,
} from "../Api/Api";
import SearchResultCard from "../components/SearchResultCard/SearchResultCard";
import { Loader, SearchX } from "lucide-react";
import styles from "./SearchPage.module.css";

const LIMIT = 12;

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const query = searchParams.get("q");
  const categoryIdsParam = searchParams.get("categoryIds");
  const isAgregados = searchParams.get("agregados") === "true";
  const isAllMode = !isAgregados && query !== null && query.trim() === "";
  const isSearchMode = !isAgregados && query !== null && query.trim() !== "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const offsetRef = useRef(0);

  // Categorías
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
        setHasMore(false);
        offsetRef.current = 0;
      } else {
        setLoadingMore(true);
      }

      try {
        if (isAgregados) {
          const data = await getRecentCommerces();
          setResults(Array.isArray(data) ? data.slice(0, 50) : []);
          setHasMore(false);
        } else if (isAllMode && selectedCategoryIds.length === 0) {
          const all = await getAllCommerces();
          setResults(all);
          setHasMore(false);
        } else if (selectedCategoryIds.length > 0) {
          // Filtrar por categorías, opcionalmente combinar con texto
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
    [query, isAgregados, isAllMode, isSearchMode, selectedCategoryIds]
  );

  useEffect(() => {
    load(false);
  }, [query, isAgregados, selectedCategoryIds]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) load(true);
  };

  const toggleCategory = (id) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Título dinámico
  const getTitle = () => {
    if (isAgregados) return "Agregados recientemente";
    if (selectedCategoryIds.length > 0 && !query?.trim())
      return "Negocios por categoría";
    if (selectedCategoryIds.length > 0 && query?.trim())
      return `"${query}" en categorías seleccionadas`;
    if (isAllMode) return "Todos los negocios";
    return `Resultados para "${query}"`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        {/* Chips de categoría visibles aunque esté cargando */}
        {categories.length > 0 && (
          <div className={styles.categoryChips}>
            {categories.map((cat) => (
              <button
                key={cat.idCategory}
                className={`${styles.chip} ${
                  selectedCategoryIds.includes(cat.idCategory)
                    ? styles.chipActive
                    : ""
                }`}
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
            {isAgregados
              ? "Cargando novedades..."
              : isAllMode
              ? "Cargando negocios..."
              : "Buscando..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Chips de categoría */}
      {categories.length > 0 && (
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
              className={`${styles.chip} ${
                selectedCategoryIds.includes(cat.idCategory)
                  ? styles.chipActive
                  : ""
              }`}
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
          {results.length > 0 && (
            <p className={styles.queryText}>
              {results.length} negocio{results.length !== 1 ? "s" : ""}
              {isAgregados
                ? " nuevos en los últimos 30 días"
                : isAllMode
                ? " en Sáenz Peña"
                : ` encontrado${results.length !== 1 ? "s" : ""}`}
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

      {results.length === 0 && !error && (
        <div className={styles.noResults}>
          <SearchX size={56} strokeWidth={1.5} />
          <h3>
            {isAgregados
              ? "No hay negocios nuevos este mes"
              : isAllMode
              ? "Todavía no hay negocios registrados"
              : selectedCategoryIds.length > 0
              ? "No hay negocios en estas categorías"
              : "No se encontraron negocios"}
          </h3>
          <p>
            {isAgregados
              ? "Volvé pronto, ¡cada día se suman más!"
              : selectedCategoryIds.length > 0
              ? "Probá con otras categorías o limpiá los filtros"
              : "Probá con otro término o revisá la ortografía"}
          </p>
          <button
            className={styles.backButton}
            onClick={() => navigate("/")}
          >
            Volver al inicio
          </button>
        </div>
      )}

      {results.length > 0 && (
        <>
          <div className={styles.resultsGrid}>
            {results.map((commerce) => (
              <SearchResultCard
                key={commerce.idCommerce}
                commerce={commerce}
              />
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
                  <>
                    <Loader size={16} className={styles.spinner} /> Cargando...
                  </>
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