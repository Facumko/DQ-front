import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
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
  Share2
} from "lucide-react";

// ============================================
// 🔥 DATA MOCK TEMPORAL
// ============================================
const MOCK_DATA = {
  // Slides del carousel principal
  heroSlides: [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
      title: "Festival Gastronómico 2025",
      subtitle: "Los mejores sabores de la ciudad se reúnen este fin de semana",
      badge: { type: "event", text: "Evento Especial" },
      cta: "Ver Detalles",
      metadata: { date: "15-17 Nov" }
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
      title: "Restaurante Villa Gourmet",
      subtitle: "Nueva experiencia culinaria en el corazón de la ciudad",
      badge: { type: "featured", text: "Destacado" },
      cta: "Reservar Mesa",
      metadata: { rating: "4.9" }
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80",
      title: "Ofertas Black Friday",
      subtitle: "Hasta 50% de descuento en tus negocios favoritos",
      badge: { type: "promotion", text: "Oferta Limitada" },
      cta: "Ver Ofertas",
      metadata: { discount: "Hasta 50% OFF" }
    }
  ],

  // Negocios destacados (sidebar)
  featuredBusinesses: [
    {
      id: 1,
      name: "Café Artesanal Luna",
      logo: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=120&q=80",
      category: "Cafetería",
      location: "Centro Histórico",
      promotion: "Café + Postre $8.500"
    },
    {
      id: 2,
      name: "Gimnasio FitLife Pro",
      logo: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=120&q=80",
      category: "Deportes & Fitness",
      location: "Zona Norte",
      promotion: "Primer mes gratis"
    },
    {
      id: 3,
      name: "Spa Wellness Center",
      logo: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=120&q=80",
      category: "Salud & Belleza",
      location: "Plaza Central",
      promotion: "Masajes 2x1"
    }
  ],

  // Categorías sugeridas
  categories: [
    {
      id: "events",
      title: "¿Qué pasa esta semana?",
      description: "Eventos destacados",
      icon: Calendar,
      gradient: "gradientBlue",
      image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80"
    },
    {
      id: "restaurants",
      title: "¿Dónde cenar esta noche?",
      description: "Restaurantes y cafés",
      icon: Utensils,
      gradient: "gradientOrange",
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80"
    },
    {
      id: "deals",
      title: "Ofertas destacadas",
      description: "Descuentos especiales",
      icon: Tag,
      gradient: "gradientGreen",
      image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&q=80"
    },
    {
      id: "new",
      title: "¿Qué hay de nuevo cerca?",
      description: "Nuevos negocios",
      icon: Store,
      gradient: "gradientPurple",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80"
    },
    {
      id: "urgent",
      title: "Servicios urgentes",
      description: "Técnicos y delivery",
      icon: Wrench,
      gradient: "gradientRed",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80"
    },
    {
      id: "trending",
      title: "Lo más popular",
      description: "Tendencias actuales",
      icon: TrendingUp,
      gradient: "gradientPink",
      image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&q=80"
    }
  ],

  // Posts del feed
  posts: [
    {
      id: "1",
      businessName: "Restaurante El Buen Sabor",
      businessLogo: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=60&q=80",
      location: "Centro Histórico",
      timeAgo: "2 horas",
      content: "🍽️ ¡Nuevo menú de temporada disponible! Ven y prueba nuestros platos especiales preparados con ingredientes frescos de la región. Reserva tu mesa llamando al 555-0123 o a través de nuestra app. #NuevoMenu #ComidaFresca",
      images: [
        "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80",
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80"
      ],
      likes: 47,
      isLiked: false,
      saved: false
    },
    {
      id: "2",
      businessName: "Café Central",
      businessLogo: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=60&q=80",
      location: "Plaza Principal",
      timeAgo: "4 horas",
      content: "☕ Comenzamos la semana con energía. Nuestro café recién tostado te está esperando. Abierto desde las 7:00 AM con desayunos especiales y wifi gratuito para trabajar cómodamente. ¡Ven y disfruta del mejor ambiente!",
      images: [
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
      ],
      likes: 32,
      isLiked: true,
      saved: true
    },
    {
      id: "3",
      businessName: "Tienda La Esquina",
      businessLogo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=60&q=80",
      location: "Barrio Norte",
      timeAgo: "6 horas",
      content: "🛍️ Gran oferta de fin de semana: 20% de descuento en toda la ropa de temporada. Además, envío gratis en compras superiores a $50. ¡No te lo pierdas! Válido hasta el domingo.",
      images: [
        "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&q=80",
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80"
      ],
      likes: 28,
      isLiked: false,
      saved: false
    }
  ]
};

// ============================================
// 🎯 COMPONENTE PRINCIPAL
// ============================================
const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [posts, setPosts] = useState(MOCK_DATA.posts);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const sectionsRef = useRef([]);

  // Autoplay del carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % MOCK_DATA.heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Animaciones de entrada
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionsRef.current.forEach(section => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  // Funciones del carousel
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % MOCK_DATA.heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + MOCK_DATA.heroSlides.length) % MOCK_DATA.heroSlides.length);
  };

  const getBadgeClass = (type) => {
    switch (type) {
      case "event": return styles.badgeEvent;
      case "featured": return styles.badgeFeatured;
      case "promotion": return styles.badgePromotion;
      default: return styles.badgeDefault;
    }
  };

  // Funciones de posts
  const toggleLike = (postId) => {
    setPosts(posts.map(post =>
      post.id === postId
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const toggleSave = (postId) => {
    setPosts(posts.map(post =>
      post.id === postId ? { ...post, saved: !post.saved } : post
    ));
  };

  const nextImage = (postId, totalImages) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [postId]: ((prev[postId] || 0) + 1) % totalImages
    }));
  };

  const prevImage = (postId, totalImages) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [postId]: ((prev[postId] || 0) - 1 + totalImages) % totalImages
    }));
  };

  return (
    <div className={styles.homeContainer}>
      
      {/* ============================================ */}
      {/* 🎯 HERO SECTION - Carousel + Sidebar */}
      {/* ============================================ */}
      <section 
        ref={el => sectionsRef.current[0] = el} 
        className={`${styles.section} ${styles.heroSection}`}
      >
        <div className={styles.heroGrid}>
          
          {/* Carousel Principal */}
          <div className={styles.carouselContainer}>
            <div className={styles.carousel}>
              {MOCK_DATA.heroSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`${styles.slide} ${index === currentSlide ? styles.slideActive : ''}`}
                >
                  <img src={slide.image} alt={slide.title} className={styles.slideImage} />
                  
                  <div className={styles.slideOverlay}>
                    {/* Badge */}
                    <div className={styles.slideBadgeContainer}>
                      <span className={`${styles.slideBadge} ${getBadgeClass(slide.badge.type)}`}>
                        {slide.badge.text}
                      </span>
                    </div>

                    {/* Content */}
                    <div className={styles.slideContent}>
                      <div className={styles.slideMetadata}>
                        {slide.metadata.date && (
                          <div className={styles.metadataItem}>
                            <Clock size={16} />
                            <span>{slide.metadata.date}</span>
                          </div>
                        )}
                        {slide.metadata.rating && (
                          <div className={styles.metadataItem}>
                            <Star size={16} fill="currentColor" />
                            <span>{slide.metadata.rating}</span>
                          </div>
                        )}
                        {slide.metadata.discount && (
                          <span className={styles.discountBadge}>
                            {slide.metadata.discount}
                          </span>
                        )}
                      </div>
                      
                      <h2 className={styles.slideTitle}>{slide.title}</h2>
                      <p className={styles.slideSubtitle}>{slide.subtitle}</p>
                      
                      <button className={styles.slideCta}>
                        {slide.cta}
                        <ExternalLink size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Controles del carousel */}
              <button className={`${styles.carouselBtn} ${styles.carouselBtnPrev}`} onClick={prevSlide}>
                <ChevronLeft size={24} />
              </button>
              <button className={`${styles.carouselBtn} ${styles.carouselBtnNext}`} onClick={nextSlide}>
                <ChevronRight size={24} />
              </button>

              {/* Indicadores */}
              <div className={styles.carouselIndicators}>
                {MOCK_DATA.heroSlides.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.indicator} ${index === currentSlide ? styles.indicatorActive : ''}`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Negocios Destacados */}
          <div className={styles.sidebar}>
            {MOCK_DATA.featuredBusinesses.map((business) => (
              <Link to="/negocios" key={business.id} className={styles.businessCard}>
                <div className={styles.businessHeader}>
                  <img src={business.logo} alt={business.name} className={styles.businessLogo} />
                  <div className={styles.businessInfo}>
                    <h3 className={styles.businessName}>{business.name}</h3>
                    <p className={styles.businessCategory}>{business.category}</p>
                  </div>
                </div>
                <div className={styles.businessLocation}>
                  <MapPin size={14} />
                  <span>{business.location}</span>
                </div>
                <div className={styles.businessPromotion}>
                  {business.promotion}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 🔍 CATEGORÍAS SUGERIDAS */}
      {/* ============================================ */}
      <section 
        ref={el => sectionsRef.current[1] = el} 
        className={`${styles.section} ${styles.categoriesSection}`}
      >
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>¿Qué estás buscando?</h2>
          <p className={styles.sectionSubtitle}>
            Explora nuestras categorías más populares y encuentra exactamente lo que necesitas
          </p>
        </div>

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
      </section>

      {/* ============================================ */}
      {/* 📱 FEED DE PUBLICACIONES */}
      {/* ============================================ */}
      <section 
        ref={el => sectionsRef.current[2] = el} 
        className={`${styles.section} ${styles.postsSection}`}
      >
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Últimas Publicaciones</h2>
          <p className={styles.sectionSubtitle}>
            Mantente al día con lo que está pasando en tu ciudad
          </p>
        </div>

        <div className={styles.postsFeed}>
          {posts.map((post) => {
            const currentIndex = currentImageIndex[post.id] || 0;

            return (
              <div key={post.id} className={styles.postCard}>
                {/* Post Header */}
                <div className={styles.postHeader}>
                  <img src={post.businessLogo} alt={post.businessName} className={styles.postAvatar} />
                  <div className={styles.postBusinessInfo}>
                    <h3 className={styles.postBusinessName}>{post.businessName}</h3>
                    <div className={styles.postMetadata}>
                      <MapPin size={14} />
                      <span>{post.location}</span>
                      <span>•</span>
                      <Clock size={14} />
                      <span>hace {post.timeAgo}</span>
                    </div>
                  </div>
                  <button 
                    className={`${styles.postSaveBtn} ${post.saved ? styles.postSaveBtnActive : ''}`}
                    onClick={() => toggleSave(post.id)}
                  >
                    <Bookmark size={20} fill={post.saved ? "currentColor" : "none"} />
                  </button>
                </div>

                {/* Post Content */}
                <div className={styles.postContent}>
                  <p>{post.content}</p>
                </div>

                {/* Post Images */}
                {post.images.length > 0 && (
                  <div className={styles.postImagesContainer}>
                    <img 
                      src={post.images[currentIndex]} 
                      alt={`${post.businessName} - ${currentIndex + 1}`} 
                      className={styles.postImage} 
                    />

                    {post.images.length > 1 && (
                      <>
                        <button 
                          className={`${styles.postImageBtn} ${styles.postImageBtnPrev}`}
                          onClick={() => prevImage(post.id, post.images.length)}
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button 
                          className={`${styles.postImageBtn} ${styles.postImageBtnNext}`}
                          onClick={() => nextImage(post.id, post.images.length)}
                        >
                          <ChevronRight size={20} />
                        </button>

                        <div className={styles.postImageIndicators}>
                          {post.images.map((_, index) => (
                            <div
                              key={index}
                              className={`${styles.postImageDot} ${index === currentIndex ? styles.postImageDotActive : ''}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Post Actions */}
                <div className={styles.postActions}>
                  <div className={styles.postActionsLeft}>
                    <button 
                      className={`${styles.postActionBtn} ${post.isLiked ? styles.postLikeBtnActive : ''}`}
                      onClick={() => toggleLike(post.id)}
                    >
                      <Heart size={20} fill={post.isLiked ? "currentColor" : "none"} />
                      <span>{post.likes}</span>
                    </button>
                    <button className={styles.postActionBtn}>
                      <Share2 size={20} />
                      <span>Compartir</span>
                    </button>
                  </div>
                  <span className={styles.postLikesCount}>
                    {post.likes} me gusta
                  </span>
                </div>
              </div>
            );
          })}

          {/* Load More */}
          <div className={styles.loadMoreContainer}>
            <button className={styles.loadMoreBtn}>
              Cargar más publicaciones
            </button>
          </div>
        </div>
      </section>

      <FloatingChat />
    </div>
  );
};

export default Home;