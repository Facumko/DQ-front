import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import FloatingChat from "../components/FloatingChat/FloatingChat";
import styles from "./Home.module.css";
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
  Bookmark,
  Heart,
  Share2,
  Building2,
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

  // ── MOCK: Directorio por subcategoría ──────────────────────────
  // En producción esto vendrá del endpoint del back.
  // El backend ya se encarga de elegir los comercios al azar
  // y rotar los que aún no fueron mostrados.
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

  posts: [
    {
      id: "1",
      businessName: "Restaurante El Buen Sabor",
      businessLogo: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=60&q=80",
      location: "Centro Histórico",
      timeAgo: "2 horas",
      content: "🍽️ ¡Nuevo menú de temporada disponible! Ven y prueba nuestros platos especiales preparados con ingredientes frescos de la región. Reserva tu mesa llamando al 555-0123.",
      images: [
        "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80",
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
      ],
      likes: 47,
      isLiked: false,
      saved: false,
    },
    {
      id: "2",
      businessName: "Café Central",
      businessLogo: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=60&q=80",
      location: "Plaza Principal",
      timeAgo: "4 horas",
      content: "☕ Comenzamos la semana con energía. Nuestro café recién tostado te está esperando. Abierto desde las 7:00 AM con desayunos especiales y wifi gratuito.",
      images: ["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"],
      likes: 32,
      isLiked: true,
      saved: true,
    },
    {
      id: "3",
      businessName: "Tienda La Esquina",
      businessLogo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=60&q=80",
      location: "Barrio Norte",
      timeAgo: "6 horas",
      content: "🛍️ Gran oferta de fin de semana: 20% de descuento en toda la ropa de temporada. Además, envío gratis en compras superiores a $50. Válido hasta el domingo.",
      images: [
        "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&q=80",
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80",
      ],
      likes: 28,
      isLiked: false,
      saved: false,
    },
  ],
};

// ============================================
// 🗂️ COMPONENTE: Directorio Destacado (sidebar carrusel)
// ============================================
const DirectorySpotlight = ({ slides }) => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const INTERVAL = 6000; // ms entre transiciones

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

  const goTo = (idx) => {
    setCurrent(idx);
    startTimer(); // reinicia el timer si el usuario hace click
  };

  const { subcategory, businesses } = slides[current];

  return (
    <aside className={styles.directoryWidget}>
      {/* Cabecera */}
      <div className={styles.directoryHeader}>
        <Building2 size={16} className={styles.directoryHeaderIcon} />
        <span>Directorio de servicios</span>
      </div>

      {/* Contenido con animación */}
      <div className={styles.directorySlide} key={current}>
        <h3 className={styles.directorySubcategory}>{subcategory}</h3>

        <ul className={styles.directoryList}>
          {businesses.map((biz) => (
            <li key={biz.id} className={styles.directoryItem}>
              <Link to={`/negocios/${biz.id}`} className={styles.directoryLink}>
                <div className={styles.directoryAvatar}>
                  {biz.image ? (
                    <img src={biz.image} alt={biz.name} />
                  ) : (
                    <span>{biz.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className={styles.directoryName}>{biz.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Indicadores / navegación */}
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

      {/* Barra de progreso */}
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [posts, setPosts] = useState(MOCK_DATA.posts);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const sectionsRef = useRef([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % MOCK_DATA.heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add(styles.visible);
        });
      },
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

  const toggleLike = (postId) =>
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p
      )
    );

  const toggleSave = (postId) =>
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, saved: !p.saved } : p)));

  const nextImage = (postId, total) =>
    setCurrentImageIndex((prev) => ({ ...prev, [postId]: ((prev[postId] || 0) + 1) % total }));

  const prevImage = (postId, total) =>
    setCurrentImageIndex((prev) => ({ ...prev, [postId]: ((prev[postId] || 0) - 1 + total) % total }));

  return (
    <div className={styles.homeContainer}>

      {/* ── HERO: Carousel + Sidebar negocios destacados ── */}
      <section ref={(el) => (sectionsRef.current[0] = el)} className={`${styles.section} ${styles.heroSection}`}>
        <div className={styles.heroGrid}>

          {/* Carousel */}
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

          {/* Sidebar negocios premium */}
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

      {/* ── ¿Qué estás buscando? + Directorio básico ── */}
      <section ref={(el) => (sectionsRef.current[1] = el)} className={`${styles.section} ${styles.categoriesSection}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>¿Qué estás buscando?</h2>
          <p className={styles.sectionSubtitle}>
            Explorá nuestras categorías más populares y encontrá exactamente lo que necesitás
          </p>
        </div>

        {/* Layout: categorías a la izq, directorio a la der */}
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

          {/* ── DIRECTORIO BÁSICO / INTERMEDIO ── */}
          <DirectorySpotlight slides={MOCK_DATA.directorySlides} />
        </div>
      </section>

      {/* ── Feed de publicaciones ── */}
      <section ref={(el) => (sectionsRef.current[2] = el)} className={`${styles.section} ${styles.postsSection}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Últimas Publicaciones</h2>
          <p className={styles.sectionSubtitle}>Mantenete al día con todo lo nuevo en SP</p>
        </div>

        <div className={styles.postsFeed}>
          {posts.map((post) => {
            const currentIndex = currentImageIndex[post.id] || 0;
            return (
              <div key={post.id} className={styles.postCard}>
                <div className={styles.postHeader}>
                  <img src={post.businessLogo} alt={post.businessName} className={styles.postAvatar} />
                  <div className={styles.postBusinessInfo}>
                    <h3 className={styles.postBusinessName}>{post.businessName}</h3>
                    <div className={styles.postMetadata}>
                      <MapPin size={14} /><span>{post.location}</span>
                      <span>•</span>
                      <Clock size={14} /><span>hace {post.timeAgo}</span>
                    </div>
                  </div>
                  <button
                    className={`${styles.postSaveBtn} ${post.saved ? styles.postSaveBtnActive : ""}`}
                    onClick={() => toggleSave(post.id)}
                  >
                    <Bookmark size={20} fill={post.saved ? "currentColor" : "none"} />
                  </button>
                </div>

                <div className={styles.postContent}><p>{post.content}</p></div>

                {post.images.length > 0 && (
                  <div className={styles.postImagesContainer}>
                    <img src={post.images[currentIndex]} alt={`${post.businessName} ${currentIndex + 1}`} className={styles.postImage} />
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
                            <div key={i} className={`${styles.postImageDot} ${i === currentIndex ? styles.postImageDotActive : ""}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className={styles.postActions}>
                  <div className={styles.postActionsLeft}>
                    <button className={`${styles.postActionBtn} ${post.isLiked ? styles.postLikeBtnActive : ""}`} onClick={() => toggleLike(post.id)}>
                      <Heart size={20} fill={post.isLiked ? "currentColor" : "none"} />
                      <span>{post.likes}</span>
                    </button>
                    <button className={styles.postActionBtn}>
                      <Share2 size={20} /><span>Compartir</span>
                    </button>
                  </div>
                  <span className={styles.postLikesCount}>{post.likes} me gusta</span>
                </div>
              </div>
            );
          })}

          <div className={styles.loadMoreContainer}>
            <button className={styles.loadMoreBtn}>Cargar más publicaciones</button>
          </div>
        </div>
      </section>

      <FloatingChat />
    </div>
  );
};

export default Home;