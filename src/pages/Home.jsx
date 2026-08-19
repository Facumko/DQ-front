import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
import { getMainFeed, getFeaturedSection, getBusinessById } from "../Api/Api";
import { UserContext } from "./UserContext";
import {
  Siren,
  Coffee,
  UtensilsCrossed,
  Sparkles,
  Percent,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Star,
  Clock,
  Building2,
  Share2,
  Bookmark,
} from "lucide-react";

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23e0e0e0' width='100' height='100'/%3E%3Ctext x='50' y='50' font-size='14' fill='%23888' text-anchor='middle' dy='0.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

const handleImageError = (e) => {
  e.target.src = PLACEHOLDER_IMAGE;
  e.target.style.backgroundColor = '#f0f0f0';
};

const MOCK_DATA = {
  heroSlides: [],

  featuredBusinesses: [],

  directorySlides: [
    {
      subcategory: "Abogados",
      businesses: [
        { id: 101, name: "Estudio Ramírez & Asociados", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80" },
        { id: 102, name: "Dra. Silvia Méndez", image: null },
        { id: 103, name: "Bufete Legal Norte", image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=120&q=80" },
        { id: 104, name: "Asesoría Jurídica Pérez", image: null },
        { id: 105, name: "Dr. Carlos Vega – Civil", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=120&q=80" },
      ],
    },
    {
      subcategory: "Contadores",
      businesses: [
        { id: 201, name: "Estudio Contable Gómez", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=120&q=80" },
        { id: 202, name: "Lic. Fernández & Cia", image: null },
        { id: 203, name: "Asesoría Impositiva Ruiz", image: "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=120&q=80" },
        { id: 204, name: "Contadora López", image: null },
        { id: 205, name: "Tax Consulting Salta", image: null },
      ],
    },
    {
      subcategory: "Electricistas",
      businesses: [
        { id: 301, name: "Electro Servicios Torres", image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=120&q=80" },
        { id: 302, name: "Instalaciones Herrera", image: null },
        { id: 303, name: "Técnico Rápido – 24 hs", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&q=80" },
        { id: 304, name: "ElectroCiudad", image: null },
      ],
    },
    {
      subcategory: "Médicos",
      businesses: [
        { id: 401, name: "Dr. Martín Ríos – Clínica", image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=120&q=80" },
        { id: 402, name: "Consultorio Dra. Suárez", image: null },
        { id: 403, name: "Centro Médico del Norte", image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=120&q=80" },
        { id: 404, name: "Dr. Bravo – Pediatría", image: null },
        { id: 405, name: "Salud Integral SRL", image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=120&q=80" },
      ],
    },
  ],
};

// ============================================
// Cajas fijas de "Explorá más"
// ============================================
// A diferencia de las categorías (que venían del backend), estas 6 cajas son
// fijas y responden a una intención de búsqueda, no a un rubro. El campo
// "explora" es la clave que va a usar SearchPage (en un próximo paso) para
// pedir al backend el listado correspondiente a cada caja.
const EXPLORE_BOXES = [
  {
    key: "emergencias",
    icon: Siren,
    gradient: "gradientRed",
    image: "https://images.unsplash.com/photo-1587351021355-a479a299d2f9?w=400&q=80",
    title: "Servicios de Emergencia y 24hs",
    description: "Urgencias, guardias y atención inmediata",
    link: "/search?explora=emergencias",
  },
  {
    key: "hoy",
    icon: Coffee,
    gradient: "gradientOrange",
    image: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=400&q=80",
    title: "¿Qué hacemos hoy?",
    description: "Cafés, heladerías, planes y eventos de hoy",
    link: "/search?explora=hoy",
  },
  {
    key: "cena",
    icon: UtensilsCrossed,
    gradient: "gradientPurple",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
    title: "¿Dónde cenar esta noche?",
    description: "Restaurantes, bares y delivery nocturno",
    link: "/search?explora=cena",
  },
  {
    key: "abierto-ahora",
    icon: Clock,
    gradient: "gradientBlue",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80",
    title: "De Turno y Abierto Ahora",
    description: "Lo que está abierto en este momento",
    link: "/search?explora=abierto-ahora",
  },
  {
    key: "nuevos",
    icon: Sparkles,
    gradient: "gradientPink",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80",
    title: "Nuevos en la Ciudad",
    description: "Los últimos negocios en sumarse",
    // Este ya funciona hoy: reutiliza el modo "agregados" que SearchPage
    // trae de getRecentCommerces() (comercios de los últimos 30 días).
    link: "/search?agregados=true",
  },
  {
    key: "promociones",
    icon: Percent,
    gradient: "gradientGreen",
    image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&q=80",
    title: "Promociones y Descuentos",
    description: "Las mejores ofertas activas ahora",
    link: "/search?explora=promociones",
  },
];

// ============================================
// Directorio Destacado
// ============================================
const DirectorySpotlight = ({ slides }) => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const INTERVAL = 6000;

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, INTERVAL);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [slides.length]); // eslint-disable-line

  const goTo = (idx) => { setCurrent(idx); startTimer(); };
  const { subcategory, businesses } = slides[current];

  return (
    <aside className={styles.directoryWidget}>
      <div className={styles.directoryHeader}>
        <Building2 size={16} className={styles.directoryHeaderIcon} />
        <span>Directorio de servicios</span>
      </div>

      <div className={styles.directorySlide} key={current}>
        <h3 className={styles.directorySubcategory}>{subcategory}</h3>
        <ul className={styles.directoryList}>
          {businesses.map((biz) => (
            <li key={biz.id} className={styles.directoryItem}>
              <Link to={`/negocios/${biz.id}`} className={styles.directoryLink}>
                <div className={styles.directoryAvatar}>
                  {biz.image
                    ? <img src={biz.image} alt={biz.name} onError={handleImageError} />
                    : <span>{biz.name.charAt(0).toUpperCase()}</span>
                  }
                </div>
                <span className={styles.directoryName}>{biz.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.directoryNav}>
        {slides.map((slide, idx) => (
          <button
            key={idx}
            className={`${styles.directoryDot} ${idx === current ? styles.directoryDotActive : ""}`}
            onClick={() => goTo(idx)}
            title={slide.subcategory}
          />
        ))}
      </div>

      <div className={styles.directoryProgress}>
        <div
          className={styles.directoryProgressBar}
          key={`${current}-bar`}
          style={{ animationDuration: `${INTERVAL}ms` }}
        />
      </div>

      <Link to="/categorias" className={styles.directoryViewAll}>
        Ver todos los servicios →
      </Link>
    </aside>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const Home = () => {
  const navigate = useNavigate();
  const { user, savedPostIds, toggleSavedPost, openLoginModal } = useContext(UserContext);

  // ── Estado carrusel ──────────────────────────────────────────────────
  const [heroSlides,          setHeroSlides]          = useState(MOCK_DATA.heroSlides);
  const [currentSlide,        setCurrentSlide]        = useState(0);

  // ── Estado feed ──────────────────────────────────────────────────────
  const [posts,               setPosts]               = useState([]);
  const [feedPage,            setFeedPage]            = useState(0);
  const [feedLoading,         setFeedLoading]         = useState(false);
  const [feedError,           setFeedError]           = useState("");
  const [feedHasMore,         setFeedHasMore]         = useState(true);
  const [currentImageIndex,   setCurrentImageIndex]   = useState({});
  const [sideFeatured,        setSideFeatured]        = useState([]); // cajas laterales: misma fuente que el carrusel (/destacado → featured)
  const sectionsRef = useRef([]);
  const sidebarMarqueeRef = useRef(null);
  const FEED_SIZE = 10;

  // ── Normalizar item del carrusel del backend ──────────────────────────
  const normalizeFeaturedItem = (item) => {
    const d = item.data || {};
    const imageUrl = d.coverImageUrl || d.coverImage?.url || d.images?.[0]?.url || "";

    const getLink = () => {
      const rt = d.redirectType;
      const id = d.redirectTargetId;
      if (rt === "EVENT")    return `/eventos`;
      if (rt === "POST")     return `/negocios/${d.idCommerce}`;
      if (rt === "COMMERCE") return `/negocios/${id}`;
      if (item.type === "EVENT")    return `/eventos`;
      if (item.type === "COMMERCE") return `/negocios/${d.idCommerce || d.id}`;
      return `/negocios/${d.idCommerce || d.id || ""}`;
    };

    return {
      id:       d.idPromotion || d.idEvent || d.idPost || d.idCommerce || Math.random(),
      image:    imageUrl,
      title:    d.title || d.name || "",
      subtitle: d.description || "",
      badge: {
        type: item.type?.toLowerCase() || "featured",
        text: item.type === "EVENT" ? "Evento" : item.type === "PROMOTION" ? "Promoción" : "Destacado",
      },
      cta:      "Ver más",
      metadata: { rating: null, date: null, discount: null },
      link:     getLink(),
    };
  };

  // ── Normalizar item de las cajas laterales ─────────────────────────────
  // Misma fuente y misma forma de extraer datos que el carrusel (FeaturedItemDto: { type, data }),
  // pero viene del array "featured" de /destacado, que el backend ya separa del "carousel".
  // No toca normalizeFeaturedItem ni la carga del carrusel de arriba.
  const normalizeFeaturedBox = (item) => {
    const d = item.data || {};
    const type = item.type; // 'EVENT' | 'POST' | 'PROMOTION' | 'COMMERCE'

    // El comercio dueño del contenido: cada tipo lo expone distinto según el backend
    const commerce   = d.commerceOwner || d.commerce || {};
    const commerceId = d.idCommerce || commerce.idCommerce || d.commerceId
                        || (type === "COMMERCE" ? (d.idCommerce || d.id) : null);

    const businessName  = d.commerceName || d.nameCommerce || commerce.name || d.name || "Comercio";
    const businessImage = d.commerceProfileImageUrl || commerce.profileImage?.url
                        || d.profileImage?.url || d.coverImage?.url || null;
    // "category" es objeto único por comercio (no array).
    const category = commerce.category?.name || d.category?.name || "";

    const title = d.title || d.name || (d.description ? d.description.slice(0, 60) : "") || businessName;

    const badgeMap  = { EVENT: "Evento", POST: "Publicación", PROMOTION: "Promoción", COMMERCE: "Destacado" };
    const badgeText = badgeMap[type] || "Destacado";

    const itemId = d.idEvent || d.idPost || d.idPromotion || d.idCommerce || null;

    // Mismo criterio de link que el carrusel (siempre al negocio), pero acá además
    // apuntamos a la publicación/evento puntual cuando esa vista es pública (posts y eventos lo son).
    // Las promociones no tienen vista pública propia todavía, así que van al perfil del negocio nomás.
    let link = `/negocios/${commerceId || ""}`;
    if (type === "POST"  && commerceId && d.idPost)  link = `/negocios/${commerceId}?tab=posts&item=${d.idPost}`;
    if (type === "EVENT" && commerceId && d.idEvent) link = `/negocios/${commerceId}?tab=events&item=${d.idEvent}`;
    if (type === "PROMOTION" && commerceId) {
      // El backend ya manda a dónde apunta la promo (redirectType/redirectTargetId
      // del PromotionResponseDto), sin necesidad de pedir nada más.
      const rt = (d.redirectType || "").toUpperCase();
      if (rt === "POST"  && d.redirectTargetId) link = `/negocios/${commerceId}?tab=posts&item=${d.redirectTargetId}`;
      if (rt === "EVENT" && d.redirectTargetId) link = `/negocios/${commerceId}?tab=events&item=${d.redirectTargetId}`;
      // Si la promo no tiene publicación/evento vinculado (redirectType "NONE" o vacío),
      // no hay a dónde apuntar más específico que el negocio.
    }

    return {
      key: `${type}-${itemId ?? "x"}-${commerceId ?? "x"}`,
      type, badgeText, title, businessName, businessImage, category, link, commerceId,
    };
  };

  // ── Helpers feed ──────────────────────────────────────────────────────
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)     return "ahora";
    if (diff < 3600)   return `${Math.floor(diff / 60)}m`;
    if (diff < 86400)  return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return new Date(dateStr).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  };

  const handleShare = async (post) => {
    const url  = post.businessId ? `${window.location.origin}/negocios/${post.businessId}` : window.location.href;
    const text = `${post.businessName}: ${post.content?.slice(0, 80)}...`;
    if (navigator.share) {
      try { await navigator.share({ title: post.businessName, text, url }); } catch { /* usuario canceló el share nativo */ }
    } else {
      await navigator.clipboard.writeText(url);
      alert("¡Link copiado al portapapeles!");
    }
  };

  const handleToggleSave = async (post) => {
    if (!user) { openLoginModal(); return; }
    await toggleSavedPost(post);
  };

  const normalizeFeedPost = (p) => {
    const d = p.data || p;
    return {
      id:           d.idPost       || d.id,
      idPost:       d.idPost       || d.id,
      businessName: d.commerceName || d.nameCommerce || d.businessName || d.commerce?.name || "Sin nombre",
      businessId:   d.commerceId   || d.idCommerce   || d.businessId   || d.commerce?.idCommerce,
      businessLogo: p.commerceProfileImageUrl || d.commerceProfileImage || d.profileImageCommerce || d.commerce?.profileImage?.url || null,
      timeAgo:      p.createdAt    || d.postedAt || d.createdAt || "",
      content:      d.description  || d.text || "",
      images: Array.isArray(d.images)
        ? d.images.sort((a, b) => (a.imageOrder || 0) - (b.imageOrder || 0)).map((i) => i.url || i)
        : [],
    };
  };

  const loadFeed = async (page = 0, append = false) => {
    setFeedLoading(true);
    setFeedError("");
    try {
      const data       = await getMainFeed(page, FEED_SIZE);
      const normalized = data.map(normalizeFeedPost);
      setPosts((prev) => append ? [...prev, ...normalized] : normalized);
      setFeedHasMore(data.length === FEED_SIZE);
    } catch {
      setFeedError("No se pudo cargar el feed. Intentá de nuevo.");
    } finally {
      setFeedLoading(false);
    }
  };

  const loadMore = () => {
    const next = feedPage + 1;
    setFeedPage(next);
    loadFeed(next, true);
  };

  // ── Effect principal: timer carrusel + carga inicial ──────────────────
  useEffect(() => {
    // Timer autoplay — usa función para leer heroSlides actualizado
    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        // Usamos ref para saber el length actualizado sin re-crear el interval
        return prev + 1; // se normaliza abajo en el render
      });
    }, 6000);

    // Cargar carrusel del backend
    getFeaturedSection(0, 5)
      .then((data) => {
        const items = data?.carousel;
        if (Array.isArray(items) && items.length > 0) {
          setHeroSlides(items.map(normalizeFeaturedItem));
          setCurrentSlide(0);
        }
        // Cajas laterales: lo que el backend ya separa como "featured" (no está en el carrusel)
        const boxItems = data?.featured;
        if (Array.isArray(boxItems) && boxItems.length > 0) {
          setSideFeatured(boxItems.map(normalizeFeaturedBox));
        }
      })
      .catch(() => {}); // fallback silencioso → se queda con el mock

    loadFeed(0);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Enriquecer categoría de las cajas laterales ─────────────────────────
  // PostResponseDto y PromotionResponseDto (lo que trae /destacado para esos tipos)
  // no incluyen la categoría del comercio — solo EventResponseDto la trae completa
  // (vía commerceOwner.category). Para no dejar ese campo vacío, pedimos el negocio
  // completo (mismo GET que ya usa ProfileHeader) solo para los que faltan, una vez por comercio.
  const enrichedCommerceIds = useRef(new Set());
  useEffect(() => {
    const idsToFetch = [...new Set(
      sideFeatured
        .filter((b) => b.commerceId && !enrichedCommerceIds.current.has(b.commerceId) && !b.category)
        .map((b) => b.commerceId)
    )];
    if (idsToFetch.length === 0) return;
    idsToFetch.forEach((id) => enrichedCommerceIds.current.add(id)); // evita reintentos en cada render

    let cancelled = false;
    Promise.all(idsToFetch.map((id) => getBusinessById(id).catch(() => null)))
      .then((results) => {
        if (cancelled) return;
        const byId = {};
        idsToFetch.forEach((id, i) => { byId[id] = results[i]; });
        setSideFeatured((prev) => prev.map((b) => {
          const extra = byId[b.commerceId];
          if (!extra) return b;
          return { ...b, category: b.category || extra.category?.name || "" };
        }));
      });
    return () => { cancelled = true; };
  }, [sideFeatured]);

  // ── Auto-scroll horizontal del "marquee" mobile (pausable / arrastrable ──
useEffect(() => {
  if (sideFeatured.length === 0) return;
  const el = sidebarMarqueeRef.current;
  if (!el) return;
  if (!window.matchMedia("(max-width: 1024px)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let rafId;
  let paused = false;
  let resumeTimeout;
  const SPEED = 0.55;

  const step = () => {
    if (!paused) {
      const half = el.scrollWidth / 2;
      el.scrollLeft += SPEED;
      if (el.scrollLeft >= half) el.scrollLeft -= half;
    }
    rafId = requestAnimationFrame(step);
  };
  rafId = requestAnimationFrame(step);

  const pause = () => { paused = true; clearTimeout(resumeTimeout); };
  const scheduleResume = () => {
    clearTimeout(resumeTimeout);
    resumeTimeout = setTimeout(() => { paused = false; }, 3000);
  };

  el.addEventListener("pointerdown", pause);
  el.addEventListener("pointerup", scheduleResume);
  el.addEventListener("pointercancel", scheduleResume);
  el.addEventListener("touchstart", pause, { passive: true });
  el.addEventListener("touchend", scheduleResume);

  return () => {
    cancelAnimationFrame(rafId);
    clearTimeout(resumeTimeout);
    el.removeEventListener("pointerdown", pause);
    el.removeEventListener("pointerup", scheduleResume);
    el.removeEventListener("pointercancel", scheduleResume);
    el.removeEventListener("touchstart", pause);
    el.removeEventListener("touchend", scheduleResume);
  };
}, [sideFeatured.length]);

  // ── Effect intersection observer para animaciones ─────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add(styles.visible); }),
      { threshold: 0.05, rootMargin: "0px 0px -60px 0px" }
    );
    sectionsRef.current.forEach((s) => s && observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // ── Navegación carrusel ───────────────────────────────────────────────
  const prevSlide = () => setCurrentSlide((p) => (p - 1 + heroSlides.length) % heroSlides.length);
  const nextSlide = () => setCurrentSlide((p) => (p + 1) % heroSlides.length);
  // Normalizar currentSlide por si heroSlides cambió de tamaño
  const safeCurrentSlide = heroSlides.length > 0 ? currentSlide % heroSlides.length : 0;

  const getBadgeClass = (type) => {
    const map = { event: styles.badgeEvent, featured: styles.badgeFeatured, promotion: styles.badgePromotion };
    return map[type] || styles.badgeDefault;
  };

  const nextImage = (postId, total) =>
    setCurrentImageIndex((prev) => ({ ...prev, [postId]: ((prev[postId] || 0) + 1) % total }));
  const prevImage = (postId, total) =>
    setCurrentImageIndex((prev) => ({ ...prev, [postId]: ((prev[postId] || 0) - 1 + total) % total }));

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className={styles.homeContainer}>

      {/* ── HERO / CARRUSEL ── */}
      <section ref={(el) => (sectionsRef.current[0] = el)} className={`${styles.section} ${styles.heroSection}`}>
        <div className={styles.heroGrid}>

          <div className={styles.carouselContainer}>
            <div className={styles.carousel}>

              {heroSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`${styles.slide} ${index === safeCurrentSlide ? styles.slideActive : ""}`}
                >
                  <img src={slide.image} alt={slide.title} className={styles.slideImage} onError={handleImageError} />
                  <div className={styles.slideOverlay}>
                    <div className={styles.slideBadgeContainer}>
                      <span className={`${styles.slideBadge} ${getBadgeClass(slide.badge.type)}`}>
                        {slide.badge.text}
                      </span>
                    </div>
                    <div className={styles.slideContent}>
                      <div className={styles.slideMetadata}>
                        {slide.metadata?.date && (
                          <div className={styles.metadataItem}><Clock size={16} /><span>{slide.metadata.date}</span></div>
                        )}
                        {slide.metadata?.rating && (
                          <div className={styles.metadataItem}><Star size={16} fill="currentColor" /><span>{slide.metadata.rating}</span></div>
                        )}
                        {slide.metadata?.discount && (
                          <span className={styles.discountBadge}>{slide.metadata.discount}</span>
                        )}
                      </div>
                      <h2 className={styles.slideTitle}>{slide.title}</h2>
                      <p className={styles.slideSubtitle}>{slide.subtitle}</p>

                      {/* ← onClick navega al destino correcto */}
                      <button
                        className={styles.slideCta}
                        onClick={() => slide.link && navigate(slide.link)}
                      >
                        {slide.cta}<ExternalLink size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button className={`${styles.carouselBtn} ${styles.carouselBtnPrev}`} onClick={prevSlide}>
                <ChevronLeft size={24} />
              </button>
              <button className={`${styles.carouselBtn} ${styles.carouselBtnNext}`} onClick={nextSlide}>
                <ChevronRight size={24} />
              </button>

              <div className={styles.carouselIndicators}>
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.indicator} ${index === safeCurrentSlide ? styles.indicatorActive : ""}`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div 
          ref={sidebarMarqueeRef}
          className={`${styles.sidebar} ${sideFeatured.length > 0 ? styles.sidebarMarquee : ""}`}>
            {sideFeatured.length > 0 ? (
              <div
                className={styles.sidebarTrack}
                style={{ "--marquee-duration": `${Math.max(sideFeatured.length * 6, 18)}s` }}
              >
                {[...sideFeatured, ...sideFeatured].map((business, i) => (
                  <Link to={business.link} key={`${business.key}-${i}`} className={styles.businessCard}>
                    <div className={styles.businessHeader}>
                      <img
                        src={business.businessImage || PLACEHOLDER_IMAGE}
                        alt={business.businessName}
                        className={styles.businessLogo}
                        onError={handleImageError}
                      />
                      <div className={styles.businessInfo}>
                        <h3 className={styles.businessName}>{business.businessName}</h3>
                        {business.category && <p className={styles.businessCategory}>{business.category}</p>}
                      </div>
                    </div>
                    <div className={styles.businessFooter}>
                      <span className={`${styles.businessBadge} ${styles["badge" + business.type]}`}>
                        {business.badgeText}
                      </span>
                      <p className={styles.businessTitle}>{business.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              MOCK_DATA.featuredBusinesses.map((business) => (
                <Link to={`/negocios/${business.id}`} key={business.id} className={styles.businessCard}>
                  <div className={styles.businessHeader}>
                    <img src={business.logo} alt={business.name} className={styles.businessLogo} onError={handleImageError} />
                    <div className={styles.businessInfo}>
                      <h3 className={styles.businessName}>{business.name}</h3>
                      <p className={styles.businessCategory}>{business.category}</p>
                    </div>
                  </div>
                  <div className={styles.businessFooter}>
                    <span className={`${styles.businessBadge} ${styles.badgePROMOTION}`}>Promoción</span>
                    <p className={styles.businessTitle}>{business.promotion}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── EXPLORÁ MÁS + DIRECTORIO ── */}
      <section ref={(el) => (sectionsRef.current[1] = el)} className={`${styles.section} ${styles.categoriesSection}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Explorá más</h2>
          <p className={styles.sectionSubtitle}>
            Elegí qué necesitás en este momento y te mostramos lo que corresponde
          </p>
        </div>

        <div className={styles.categoriesLayout}>
          <div className={styles.categoriesGrid}>
            {EXPLORE_BOXES.map((box) => {
              const IconComponent = box.icon;
              return (
                <div
                  key={box.key}
                  className={styles.categoryCard}
                  onClick={() => navigate(box.link)}
                  style={{ cursor: "pointer" }}
                >
                  <div className={styles.categoryImageContainer}>
                    <img src={box.image} alt={box.title} className={styles.categoryImage} onError={handleImageError} />
                    <div className={`${styles.categoryOverlay} ${styles[box.gradient]}`}>
                      <IconComponent size={64} className={styles.categoryIcon} />
                    </div>
                  </div>
                  <div className={styles.categoryContent}>
                    <h3 className={styles.categoryTitle}>{box.title}</h3>
                    <p className={styles.categoryDescription}>{box.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <DirectorySpotlight slides={MOCK_DATA.directorySlides} />
        </div>
      </section>

      {/* ── FEED ── */}
      <section ref={(el) => (sectionsRef.current[2] = el)} className={`${styles.section} ${styles.postsSection}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Últimas Publicaciones</h2>
          <p className={styles.sectionSubtitle}>Mantenete al día con todo lo nuevo en SP</p>
        </div>

        <div className={styles.postsFeed}>

          {feedLoading && posts.length === 0 && (
            <div className={styles.feedLoading}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.postCardSkeleton}>
                  <div className={styles.skeletonHeader} />
                  <div className={styles.skeletonBody} />
                  <div className={styles.skeletonImage} />
                </div>
              ))}
            </div>
          )}

          {feedError && (
            <div className={styles.feedError}>
              <p>{feedError}</p>
              <button className={styles.retryBtn} onClick={() => loadFeed(0)}>Reintentar</button>
            </div>
          )}

          {!feedLoading && !feedError && posts.length === 0 && (
            <div className={styles.feedEmpty}>
              <p>No hay publicaciones todavía.</p>
            </div>
          )}

          {posts.map((post) => {
            const currentIndex = currentImageIndex[post.id] || 0;
            const isSaved = savedPostIds?.has(post.id) ?? false;

            return (
              <div key={post.id} className={styles.postCard}>

                <div className={styles.postHeader}>
                  {post.businessLogo
                    ? <img src={post.businessLogo} alt={post.businessName} className={styles.postAvatar} />
                    : <div className={styles.postAvatarFallback}>{post.businessName?.charAt(0).toUpperCase()}</div>
                  }
                  <div className={styles.postBusinessInfo}>
                    {post.businessId
                      ? <Link to={`/negocios/${post.businessId}`} className={styles.postBusinessName}>{post.businessName}</Link>
                      : <span className={styles.postBusinessName}>{post.businessName}</span>
                    }
                  </div>
                  <span className={styles.postHeaderTime}>{formatTimeAgo(post.timeAgo)}</span>
                </div>

                {post.images.length > 0 && (
                  <div className={styles.postImagesContainer}>
                    <img
                      src={post.images[currentIndex]}
                      alt={`${post.businessName} ${currentIndex + 1}`}
                      className={styles.postImage}
                    />
                    {post.images.length > 1 && (
                      <>
                        <button className={`${styles.postImageBtn} ${styles.postImageBtnPrev}`} onClick={() => prevImage(post.id, post.images.length)}>
                          <ChevronLeft size={20} />
                        </button>
                        <button className={`${styles.postImageBtn} ${styles.postImageBtnNext}`} onClick={() => nextImage(post.id, post.images.length)}>
                          <ChevronRight size={20} />
                        </button>
                        <div className={styles.postImageIndicators}>
                          {post.images.map((_, i) => (
                            <div key={`${post.id}-img-${i}`} className={`${styles.postImageDot} ${i === currentIndex ? styles.postImageDotActive : ""}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className={styles.postActions}>
                  <div className={styles.postActionsLeft}>
                    <button className={styles.postActionBtn} onClick={() => handleShare(post)} title="Compartir">
                      <Share2 size={20} />
                      <span>Compartir</span>
                    </button>
                  </div>
                  <button
                    className={`${styles.postActionBtn} ${isSaved ? styles.postActionBtnActive : ""}`}
                    onClick={() => handleToggleSave(post)}
                    title={isSaved ? "Guardado" : "Guardar"}
                  >
                    <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
                  </button>
                </div>

                {post.content && (
                  <div className={styles.postContent}>
                    <span className={styles.postContentBusiness}>{post.businessName} </span>
                    <span>{post.content}</span>
                  </div>
                )}

                <span className={styles.postFooterTime}>{formatTimeAgo(post.timeAgo)}</span>
              </div>
            );
          })}

          {posts.length > 0 && (
            <div className={styles.loadMoreContainer}>
              {feedHasMore ? (
                <button className={styles.loadMoreBtn} onClick={loadMore} disabled={feedLoading}>
                  {feedLoading ? "Cargando..." : "Cargar más publicaciones"}
                </button>
              ) : (
                <p className={styles.feedEnd}>Ya viste todo por ahora</p>
              )}
            </div>
          )}

        </div>
      </section>

    </div>
  );
};

export default Home;