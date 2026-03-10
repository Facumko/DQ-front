import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchCommerces, getAllCommerces, getRecentCommerces } from "../Api/Api";
import SearchResultCard from "../components/SearchResultCard/SearchResultCard";
import { Loader, SearchX, Store} from "lucide-react";
import styles from "./SearchPage.module.css";

const LIMIT = 12;

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const query       = searchParams.get("q");
  const isAgregados = searchParams.get("agregados") === "true";
  const isAllMode    = !isAgregados && query !== null && query.trim() === "";
  const isSearchMode = !isAgregados && query !== null && query.trim() !== "";

  const [results,     setResults]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState("");
  const [hasMore,     setHasMore]     = useState(false);
  const offsetRef = useRef(0);

  const load = useCallback(async (isLoadMore = false) => {
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
      } else if (isAllMode) {
        const all = await getAllCommerces();
        setResults(all);
        setHasMore(false);
      } else if (isSearchMode) {
        const currentOffset = isLoadMore ? offsetRef.current : 0;
        const newResults = await searchCommerces(query.trim(), LIMIT, currentOffset);
        offsetRef.current = currentOffset + LIMIT;
        setHasMore(newResults.length === LIMIT);
        if (isLoadMore) {
          setResults(prev => [...prev, ...newResults]);
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
  }, [query, isAgregados, isAllMode, isSearchMode]);

  useEffect(() => {
    load(false);
  }, [query, isAgregados]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) load(true);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Loader size={40} className={styles.spinner} />
          <p>{isAgregados ? "Cargando novedades..." : isAllMode ? "Cargando negocios..." : "Buscando..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {isAgregados
              ? "Agregados recientemente"
              : isAllMode
                ? "Todos los negocios"
                : `Resultados para "${query}"`}
          </h1>
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
                : "No se encontraron negocios"}
          </h3>
          <p>
            {isAgregados
              ? "Volvé pronto, ¡cada día se suman más!"
              : isAllMode
                ? "Pronto aparecerán los primeros negocios de la ciudad"
                : "Probá con otro término o revisá la ortografía"}
          </p>
          <button className={styles.backButton} onClick={() => navigate("/")}>
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