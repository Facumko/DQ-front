import React, { useEffect, useRef } from "react";
import Carousel from "../components/Carousel/Carousel";
import PromoCard from "../components/PromoCard/PromoCard";

const slides = [
  { id:1, title:"Restaurante Villa Gourmet", subtitle:"Experiencia culinaria única", ctaText:"Reservar Mesa", badge:{type:"destacado", text:"Destacado"}, imageUrl:"https://via.placeholder.com/800x320" },
  { id:2, title:"Ofertas Black Friday", subtitle:"Descuentos imperdibles", ctaText:"Ver Ofertas", badge:{type:"oferta", text:"Oferta limitada"}, imageUrl:"https://via.placeholder.com/800x320" }
];

const promos = [
  { title:"Café Artesanal Luna", subtitle:"Cafetería – Centro Histórico", promo:"Café + Postre $850", imageUrl:"https://via.placeholder.com/48" },
  { title:"Gimnasio FitLife Pro", subtitle:"Deportes & Fitness – Zona Norte", promo:"Primer mes gratis", imageUrl:"https://via.placeholder.com/48" },
  { title:"Spa Wellness Center", subtitle:"Salud & Belleza – Plaza Central", promo:"Masajes 2x1", imageUrl:"https://via.placeholder.com/48" }
];

const Home = () => {
  const carouselRef = useRef();
  const promoRefs = useRef([]);

  useEffect(() => {
    const windowHeight = window.innerHeight;

    // Fade-in inicial
    if(carouselRef.current){
      carouselRef.current.style.opacity = 1;
      carouselRef.current.style.transform = "translateY(0)";
    }
    promoRefs.current.forEach(card => {
      if(card){
        card.style.opacity = 1;
        card.style.transform = "translateY(0)";
      }
    });

    // Fade-in al scroll
    const handleScroll = () => {
      promoRefs.current.forEach(card => {
        if(card){
          const cardTop = card.getBoundingClientRect().top;
          if(cardTop < windowHeight - 50){
            card.style.opacity = 1;
            card.style.transform = "translateY(0)";
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:"3fr 1fr",
      gap:"24px",
      padding:"24px",
      maxWidth:"1200px",
      margin:"0 auto"
    }}>
      {/* Carrusel */}
      <div
        ref={carouselRef}
        style={{
          opacity: 0,
          transform: "translateY(20px)",
          transition: "opacity 0.8s ease, transform 0.8s ease"
        }}
      >
        <Carousel slides={slides} />
      </div>

      {/* PromoCards */}
      <div style={{
        display:"flex",
        flexDirection:"column",
        gap:"16px"
      }}>
        {promos.map((p,i) => (
          <div
            key={i}
            ref={el => promoRefs.current[i] = el}
            style={{
              opacity: 0,
              transform: "translateY(20px)",
              transition: "opacity 0.8s ease, transform 0.8s ease"
            }}
          >
            <PromoCard {...p} />
          </div>
        ))}
      </div>

      {/* Responsive Stack */}
      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr;
          }
          div[style*="flex-direction: column"] {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 12px;
          }
          div[style*="flex-direction: column"]::-webkit-scrollbar {
            height: 6px;
          }
          div[style*="flex-direction: column"]::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.2);
            border-radius: 3px;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
