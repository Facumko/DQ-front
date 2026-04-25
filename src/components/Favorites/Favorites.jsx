import { useContext, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { UserContext } from "../../pages/UserContext";
import styles from "./Favorites.module.css";

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
};

const truncate = (str, n) =>
  str && str.length > n ? str.slice(0, n).trimEnd() + "…" : str || "";

// ─────────────────────────────────────────
// CARD: COMERCIO
// ─────────────────────────────────────────

function CommerceCard({ commerce, onRemove, onNavigate }) {
  const coverUrl     = commerce.coverImage?.url   || commerce.coverImage   || null;
  const avatarUrl    = commerce.profileImage?.url || commerce.profileImage || null;
  const rawCategory =
    commerce.categories?.[0]?.name ||
    commerce.commerceType           ||
    commerce.category               || "";
  const HIDDEN = ["private", "PUBLIC", "PRIVATE", "public"];
  const categoryName = HIDDEN.includes(rawCategory) ? "" : rawCategory;
  const addressText =
    commerce.address?.address ||
    commerce.address?.street  ||
    commerce.location?.address || "";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.22 }}
      className={styles.card}
    >
      <div className={styles.coverWrap}>
        {coverUrl ? (
          <img src={coverUrl} alt={`Portada de ${commerce.name}`} className={styles.coverImg} />
        ) : (
          <div className={styles.coverPlaceholder}>
            <span>{commerce.name?.[0]?.toUpperCase() || "?"}</span>
          </div>
        )}

        {categoryName && <span className={styles.coverChip}>{categoryName}</span>}

        <button
          className={styles.removeBtn}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label="Quitar de favoritos"
          title="Quitar de favoritos"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.profileRow}>
          <div className={styles.avatarWrap}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={commerce.name} className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback}>
                {commerce.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>
          <h3 className={styles.cardName}>{commerce.name || "Sin nombre"}</h3>
        </div>

        {commerce.description && (
          <p className={styles.cardDesc}>{truncate(commerce.description, 90)}</p>
        )}

        {addressText && (
          <div className={styles.addressRow}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>{truncate(addressText, 52)}</span>
          </div>
        )}

        <button className={styles.viewBtn} onClick={onNavigate}>
          Ver perfil
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </motion.article>
  );
}

// ─────────────────────────────────────────
// CARD: POST
// ─────────────────────────────────────────

function PostCard({ post, onRemove, onNavigate }) {
  const imageUrl     = post.images?.[0] || null;
  const commerceName = post.businessName || post.nameCommerce || "Comercio";
  const dateStr      = formatDate(post.createdAt || post.postedAt);
  const text         = post.text || post.description || "";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.22 }}
      className={`${styles.card} ${styles.postCardVariant}`}
    >
      <div className={styles.postImgWrap}>
        {imageUrl ? (
          <img src={imageUrl} alt="Imagen del post" className={styles.postImg} />
        ) : (
          <div className={styles.postImgPlaceholder}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="m21 15-5-5L5 21"/>
            </svg>
          </div>
        )}

        <button
          className={styles.removeBtn}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label="Quitar de guardados"
          title="Quitar de guardados"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.postMeta}>
          <span className={styles.postCommerce}>{commerceName}</span>
          {dateStr && <span className={styles.postDate}>{dateStr}</span>}
        </div>

        {text && <p className={styles.cardDesc}>{truncate(text, 110)}</p>}

        <button className={styles.viewBtn} onClick={onNavigate}>
          Ver comercio
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </motion.article>
  );
}

// ─────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────

function EmptyState({ tab }) {
  const navigate   = useNavigate();
  const isNegocios = tab === "negocios";
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>{isNegocios ? "⭐" : "🔖"}</div>
      <h3 className={styles.emptyTitle}>
        {isNegocios ? "No guardaste ningún negocio" : "No guardaste ninguna publicación"}
      </h3>
      <p className={styles.emptyDesc}>
        {isNegocios
          ? "Explorá el directorio y tocá ⭐ en los negocios que te gusten."
          : "Tocá 🔖 en las publicaciones del feed para guardarlas acá."}
      </p>
      <button
        className={styles.emptyBtn}
        onClick={() => navigate(isNegocios ? "/mapa" : "/")}
      >
        {isNegocios ? "Ver mapa de negocios" : "Ir al feed"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────

export default function Favorites() {
  const navigate = useNavigate();
  const {
    favoriteCommerces = [],
    savedPosts        = [],
    toggleFavoriteCommerce,
    toggleSavedPost,
  } = useContext(UserContext);

  const [activeTab,   setActiveTab]   = useState("negocios");
  const [searchTerm,  setSearchTerm]  = useState("");
  const [isAscending, setIsAscending] = useState(false);

  // ── Filtrado ──────────────────────────────────────────────────────────

  const filteredCommerces = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return favoriteCommerces
      .filter((c) => {
        if (!q) return true;
        return (
          c.name?.toLowerCase().includes(q)                   ||
          c.description?.toLowerCase().includes(q)            ||
          c.address?.address?.toLowerCase().includes(q)       ||
          c.categories?.[0]?.name?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const na = a.name?.toLowerCase() || "";
        const nb = b.name?.toLowerCase() || "";
        return isAscending ? na.localeCompare(nb) : nb.localeCompare(na);
      });
  }, [favoriteCommerces, searchTerm, isAscending]);

  const filteredPosts = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return savedPosts
      .filter((p) => {
        if (!q) return true;
        const text = (p.text || p.description || "").toLowerCase();
        const biz  = (p.businessName || p.nameCommerce || "").toLowerCase();
        return text.includes(q) || biz.includes(q);
      })
      .sort((a, b) => {
        const da = new Date(a.createdAt || a.postedAt || 0);
        const db = new Date(b.createdAt || b.postedAt || 0);
        return isAscending ? da - db : db - da;
      });
  }, [savedPosts, searchTerm, isAscending]);

  const activeCount   = activeTab === "negocios" ? filteredCommerces.length : filteredPosts.length;
  const totalNegocios = favoriteCommerces.length;
  const totalPosts    = savedPosts.length;
  const hasAnyContent = activeTab === "negocios" ? totalNegocios > 0 : totalPosts > 0;

  // ── Nav ───────────────────────────────────────────────────────────────

  const goToCommerce = (commerce) => {
    const id = commerce.idCommerce || commerce.id_business || commerce.id;
    if (id) navigate(`/negocios/${id}`);
  };

  const goToCommerceFromPost = (post) => {
    const id = post.businessId || post.idCommerce || post.commerceId;
    if (id) navigate(`/negocios/${id}`);
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>

      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Mis guardados</h1>
        <p className={styles.subtitle}>Negocios y publicaciones que querés tener a mano</p>
      </header>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "negocios" ? styles.tabActive : ""}`}
          onClick={() => { setActiveTab("negocios"); setSearchTerm(""); }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24"
            fill={activeTab === "negocios" ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth="2">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          Negocios
          {totalNegocios > 0 && (
            <span className={`${styles.tabBadge} ${activeTab === "negocios" ? styles.tabBadgeActive : ""}`}>
              {totalNegocios}
            </span>
          )}
        </button>

        <button
          className={`${styles.tab} ${activeTab === "posts" ? styles.tabActive : ""}`}
          onClick={() => { setActiveTab("posts"); setSearchTerm(""); }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24"
            fill={activeTab === "posts" ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          Publicaciones
          {totalPosts > 0 && (
            <span className={`${styles.tabBadge} ${activeTab === "posts" ? styles.tabBadgeActive : ""}`}>
              {totalPosts}
            </span>
          )}
        </button>
      </div>

      {/* Controls — solo si hay items */}
      {hasAnyContent && (
        <div className={styles.controls}>
          <div className={styles.searchBar}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4-4"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder={activeTab === "negocios" ? "Buscar negocios..." : "Buscar publicaciones..."}
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className={styles.clearSearch} onClick={() => setSearchTerm("")} aria-label="Limpiar">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          <button
            className={styles.sortBtn}
            onClick={() => setIsAscending((p) => !p)}
            title={isAscending ? "Más recientes primero" : "Más antiguos / A-Z primero"}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              {isAscending ? (
                <path d="M12 5v14M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <path d="M12 19V5M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </svg>
          </button>
        </div>
      )}

      {/* Contador con búsqueda activa */}
      {searchTerm && activeCount > 0 && (
        <p className={styles.resultsCount}>
          {activeCount} resultado{activeCount !== 1 ? "s" : ""} para &ldquo;{searchTerm}&rdquo;
        </p>
      )}

      {/* Grid */}
      <div className={styles.grid}>
        <AnimatePresence mode="popLayout">

          {/* Vacío total */}
          {!hasAnyContent && (
            <EmptyState tab={activeTab} key={`empty-${activeTab}`} />
          )}

          {/* Vacío por búsqueda */}
          {hasAnyContent && activeCount === 0 && (
            <motion.div
              key="empty-search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.emptyState}
            >
              <div className={styles.emptyIcon}>🔍</div>
              <h3 className={styles.emptyTitle}>Sin resultados</h3>
              <p className={styles.emptyDesc}>Probá con otro término de búsqueda.</p>
              <button className={styles.emptyBtn} onClick={() => setSearchTerm("")}>
                Limpiar búsqueda
              </button>
            </motion.div>
          )}

          {/* Lista negocios */}
          {activeTab === "negocios" && filteredCommerces.map((commerce) => (
            <CommerceCard
              key={commerce.idCommerce || commerce.id}
              commerce={commerce}
              onRemove={() => toggleFavoriteCommerce(commerce)}
              onNavigate={() => goToCommerce(commerce)}
            />
          ))}

          {/* Lista posts */}
          {activeTab === "posts" && filteredPosts.map((post) => (
            <PostCard
              key={post.idPost || post.id}
              post={post}
              onRemove={() => toggleSavedPost(post)}
              onNavigate={() => goToCommerceFromPost(post)}
            />
          ))}

        </AnimatePresence>
      </div>

    </div>
  );
}