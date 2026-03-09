import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import FloatingChat from "../components/FloatingChat/FloatingChat";
import LoginModal from "../components/LoginForm/LoginModal";
import styles from "./Home.module.css";
import { getMainFeed } from "../Api/Api";
import { UserContext } from "./UserContext";
import {
  Calendar,
  Utensils,
  Tag,
  Store,
  Wrench,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Star,
  Clock,
  MapPin,
  Building2,
  Share2,
  Bookmark,
} from "lucide-react";

// ============================================
// 🔥 DATA MOCK TEMPORAL
// ============================================
const MOCK_DATA = {
  heroSlides: [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
      title: "Festival Gastronómico 2025",
      subtitle: "Los mejores sabores de la ciudad se reúnen este fin de semana",
      badge: { type: "event", text: "Evento Especial" },
      cta: "Ver Detalles",
      metadata: { date: "15-17 Nov" },
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
      title: "Restaurante Villa Gourmet",
      subtitle: "Nueva experiencia culinaria en el corazón de la ciudad",
      badge: { type: "featured", text: "Destacado" },
      cta: "Reservar Mesa",
      metadata: { rating: "4.9" },
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80",
      title: "Ofertas Black Friday",
      subtitle: "Hasta 50% de descuento en tus negocios favoritos",
      badge: { type: "promotion", text: "Oferta Limitada" },
      cta: "Ver Ofertas",
      metadata: { discount: "Hasta 50% OFF" },
    },
  ],

  featuredBusinesses: [
    {
      id: 1,
      name: "Café Artesanal Luna",
      logo: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=120&q=80",
      category: "Cafetería",
      location: "Centro Histórico",
      promotion: "Café + Postre $8.500",
    },
    {
      id: 2,
      name: "Gimnasio FitLife Pro",
      logo: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=120&q=80",
      category: "Deportes & Fitness",
      location: "Zona Norte",
      promotion: "Primer mes gratis",
    },
    {
      id: 3,
      name: "Spa Wellness Center",
      logo: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=120&q=80",
      category: "Salud & Belleza",
      location: "Plaza Central",
      promotion: "Masajes 2x1",
    },
  ],

  categories: [
    {
      id: "events",
      title: "¿Qué pasa esta semana?",
      description: "Eventos destacados",
      icon: Calendar,
      gradient: "gradientBlue",
      image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80",
    },
    {
      id: "restaurants",
      title: "¿Dónde cenar esta noche?",
      description: "Restaurantes y cafés",
      icon: Utensils,
      gradient: "gradientOrange",
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
    },
    {
      id: "deals",
      title: "Ofertas destacadas",
      description: "Descuentos especiales",
      icon: Tag,
      gradient: "gradientGreen",
      image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&q=80",
    },
    {
      id: "new",
      title: "¿Qué hay de nuevo cerca?",
      description: "Nuevos negocios",
      icon: Store,
      gradient: "gradientPurple",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80",
    },
    {
      id: "urgent",
      title: "Servicios urgentes",
      description: "Técnicos y delivery",
      icon: Wrench,
      gradient: "gradientRed",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80",
    },
    {
      id: "trending",
      title: "Lo más popular",
      description: "Tendencias actuales",
      icon: TrendingUp,
      gradient: "gradientPink",
      image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&q=80",
    },
  ],

  directorySlides: [
    {
      subcategory: "Abogados",
      businesses: [
        { id: 101, name: "Estudio Ramírez & Asociados", image: "https://images.unsplash.com/photo-1521791055366-0d553872952f?w=120&q=80" },
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
// 🗂️ COMPONENTE: Directorio Destacado (sidebar carrusel)
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
  }, [slides.length]);

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
                    ? <img src={biz.image} alt={biz.name} />
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
// 🎯 COMPONENTE PRINCIPAL
// ============================================
const Home = () => {
  const navigate = useNavigate();

  // ── Context ───────────────────────────────────────────────────────────
  const { user, savedPostIds, toggleSavedPost } = useContext(UserContext);

  // ── UI state ──────────────────────────────────────────────────────────
  const [currentSlide, setCurrentSlide]           = useState(0);
  const [posts, setPosts]                         = useState([]);
  const [feedPage, setFeedPage]                   = useState(0);
  const [feedLoading, setFeedLoading]             = useState(false);
  const [feedError, setFeedError]                 = useState("");
  const [feedHasMore, setFeedHasMore]             = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [showLogin, setShowLogin]                 = useState(false);
  const sectionsRef = useRef([]);

  const FEED_SIZE = 10;

  // ── Helpers ───────────────────────────────────────────────────────────
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
    const url  = post.businessId
      ? `${window.location.origin}/negocios/${post.businessId}`
      : window.location.href;
    const text = `${post.businessName}: ${post.content?.slice(0, 80)}...`;
    if (navigator.share) {
      try { await navigator.share({ title: post.businessName, text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert("¡Link copiado al portapapeles!");
    }
  };

  // Si no hay sesión → abre login en lugar de guardar silenciosamente
  const handleToggleSave = async (post) => {
    if (!user) { setShowLogin(true); return; }
    await toggleSavedPost(post);
  };

  // ── Feed ──────────────────────────────────────────────────────────────
  const normalizeFeedPost = (p) => {
    const d = p.data || p;
    return {
      id:           d.idPost       || d.id,
      idPost:       d.idPost       || d.id,   // necesario para toggleSavedPost
      businessName: d.commerceName || d.nameCommerce || d.businessName || d.commerce?.name || "Sin nombre",
      businessId:   d.commerceId   || d.idCommerce   || d.businessId   || d.commerce?.idCommerce,
      businessLogo: d.commerceProfileImage || d.profileImageCommerce || d.businessLogo || d.commerce?.profileImage?.url || null,
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % MOCK_DATA.heroSlides.length);
    }, 6000);
    loadFeed(0);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add(styles.visible); }),
      { threshold: 0.05, rootMargin: "0px 0px -60px 0px" }
    );
    sectionsRef.current.forEach((s) => s && observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const nextSlide = () => setCurrentSlide((p) => (p + 1) % MOCK_DATA.heroSlides.length);
  const prevSlide = () => setCurrentSlide((p) => (p - 1 + MOCK_DATA.heroSlides.length) % MOCK_DATA.heroSlides.length);

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

      {/* ── HERO ── */}
      <section ref={(el) => (sectionsRef.current[0] = el)} className={`${styles.section} ${styles.heroSection}`}>
        <div className={styles.heroGrid}>

          <div className={styles.carouselContainer}>
            <div className={styles.carousel}>
              {MOCK_DATA.heroSlides.map((slide, index) => (
                <div key={slide.id} className={`${styles.slide} ${index === currentSlide ? styles.slideActive : ""}`}>
                  <img src={slide.image} alt={slide.title} className={styles.slideImage} />
                  <div className={styles.slideOverlay}>
                    <div className={styles.slideBadgeContainer}>
                      <span className={`${styles.slideBadge} ${getBadgeClass(slide.badge.type)}`}>
                        {slide.badge.text}
                      </span>
                    </div>
                    <div className={styles.slideContent}>
                      <div className={styles.slideMetadata}>
                        {slide.metadata.date && (
                          <div className={styles.metadataItem}><Clock size={16} /><span>{slide.metadata.date}</span></div>
                        )}
                        {slide.metadata.rating && (
                          <div className={styles.metadataItem}><Star size={16} fill="currentColor" /><span>{slide.metadata.rating}</span></div>
                        )}
                        {slide.metadata.discount && (
                          <span className={styles.discountBadge}>{slide.metadata.discount}</span>
                        )}
                      </div>
                      <h2 className={styles.slideTitle}>{slide.title}</h2>
                      <p className={styles.slideSubtitle}>{slide.subtitle}</p>
                      <button className={styles.slideCta}>{slide.cta}<ExternalLink size={18} /></button>
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
                {MOCK_DATA.heroSlides.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.indicator} ${index === currentSlide ? styles.indicatorActive : ""}`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className={styles.sidebar}>
            {MOCK_DATA.featuredBusinesses.map((business) => (
              <Link to={`/negocios/${business.id}`} key={business.id} className={styles.businessCard}>
                <div className={styles.businessHeader}>
                  <img src={business.logo} alt={business.name} className={styles.businessLogo} />
                  <div className={styles.businessInfo}>
                    <h3 className={styles.businessName}>{business.name}</h3>
                    <p className={styles.businessCategory}>{business.category}</p>
                  </div>
                </div>
                <div className={styles.businessLocation}>
                  <MapPin size={14} /><span>{business.location}</span>
                </div>
                <div className={styles.businessPromotion}>{business.promotion}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORÍAS + DIRECTORIO ── */}
      <section ref={(el) => (sectionsRef.current[1] = el)} className={`${styles.section} ${styles.categoriesSection}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>¿Qué estás buscando?</h2>
          <p className={styles.sectionSubtitle}>
            Explorá nuestras categorías más populares y encontrá exactamente lo que necesitás
          </p>
        </div>

        <div className={styles.categoriesLayout}>
          <div className={styles.categoriesGrid}>
            {MOCK_DATA.categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <div key={category.id} className={styles.categoryCard}>
                  <div className={styles.categoryImageContainer}>
                    <img src={category.image} alt={category.title} className={styles.categoryImage} />
                    <div className={`${styles.categoryOverlay} ${styles[category.gradient]}`}>
                      <IconComponent size={64} className={styles.categoryIcon} />
                    </div>
                  </div>
                  <div className={styles.categoryContent}>
                    <h3 className={styles.categoryTitle}>{category.title}</h3>
                    <p className={styles.categoryDescription}>{category.description}</p>
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
              {[1,2,3].map((i) => (
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
            // Estado leído del contexto global — sincronizado con backend
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
                <p className={styles.feedEnd}>Ya viste todo por ahora 👀</p>
              )}
            </div>
          )}

        </div>
      </section>

      <FloatingChat />

      {/* Modal login — se abre si el usuario intenta guardar sin sesión */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
};

export default Home;