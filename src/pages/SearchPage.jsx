import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchCommerces } from "../Api/Api";
import SearchResultCard from "../components/SearchResultCard/SearchResultCard";
import { Loader, SearchX } from "lucide-react";
import styles from "./SearchPage.module.css";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  const loadResults = useCallback(async (isLoadMore = false) => {
    if (!query.trim()) {
      setLoading(false);
      return;
    }

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setOffset(0);
      setHasMore(true);
    }

    try {
      const currentOffset = isLoadMore ? offset : 0;
      const newResults = await searchCommerces(query.trim(), limit, currentOffset);

      if (isLoadMore) {
        setResults(prev => [...prev, ...newResults]);
        setHasMore(newResults.length === limit);
        setOffset(prev => prev + limit);
      } else {
        setResults(newResults);
        setHasMore(newResults.length === limit);
        setOffset(limit);
      }
    } catch (err) {
      setError(err.message || "Error al buscar negocios");
      if (!isLoadMore) setResults([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [query, offset, limit]);

  useEffect(() => {
    loadResults(false);
  }, [query]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      loadResults(true);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Loader size={48} className={styles.spinner} />
          <p>Buscando negocios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Resultados de búsqueda</h1>
        <p className={styles.queryText}>
          "{query}" - {results.length} resultado{results.length !== 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <SearchX size={20} />
          {error}
        </div>
      )}

      {results.length === 0 && !error ? (
        <div className={styles.noResults}>
          <SearchX size={64} />
          <h3>No se encontraron negocios</h3>
          <p>Intentá con otra búsqueda o revisá la ortografía</p>
          <button 
            className={styles.backButton}
            onClick={() => navigate('/')}
          >
            Volver al inicio
          </button>
        </div>
      ) : (
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
                    <Loader size={20} className={styles.spinner} />
                    Cargando...
                  </>
                ) : (
                  'Cargar más resultados'
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