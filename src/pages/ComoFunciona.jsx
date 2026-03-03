import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ComoFunciona.module.css";
import {
  FaSearch, FaMapMarkerAlt, FaStar, FaStore,
  FaCamera, FaCalendarAlt, FaChevronRight
} from "react-icons/fa";

const PASOS_USUARIO = [
  {
    num: "01", icon: FaSearch, color: "#2980b9",
    titulo: "Buscá lo que necesitás",
    desc: "Usá el buscador o explorá por categorías. Encontrás negocios, profesionales y servicios de Presidencia Roque Sáenz Peña en un solo lugar.",
  },
  {
    num: "02", icon: FaMapMarkerAlt, color: "#B00020",
    titulo: "Usá el mapa de la ciudad",
    desc: "Vizualizá todos los comercios en el mapa interactivo. Filtrá por categoría y encontrá lo que buscás cerca de donde estás.",
  },
  {
    num: "03", icon: FaStar, color: "#f39c12",
    titulo: "Guardá tus favoritos",
    desc: "Con una cuenta gratuita podés guardar los negocios que más usás y recibir notificaciones de sus novedades y eventos.",
  },
];

const PASOS_NEGOCIO = [
  {
    num: "01", icon: FaStore, color: "#16a085",
    titulo: "Elegí tu plan",
    desc: "Seleccioná el plan que mejor se adapte a tu negocio. Desde el plan Básico con tu perfil y fotos, hasta el Premium con eventos y lugar destacado.",
  },
  {
    num: "02", icon: FaCamera, color: "#8e44ad",
    titulo: "Completá tu perfil",
    desc: "Cargá el nombre, descripción, fotos, horarios, teléfono y ubicación exacta en el mapa. Tu negocio empieza a aparecer en búsquedas de inmediato.",
  },
  {
    num: "03", icon: FaCalendarAlt, color: "#e67e22",
    titulo: "Publicá y conectá",
    desc: "Con los planes Intermedio y Premium podés crear publicaciones y eventos para mantener a tus clientes informados de tus novedades.",
  },
];

const ComoFunciona = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.header}>
          <h1 className={styles.title}>¿Cómo funciona?</h1>
          <p className={styles.subtitle}>
            Dónde Queda? conecta a los vecinos de Sáenz Peña con los negocios y
            servicios locales de manera simple y rápida.
          </p>
        </div>

        {/* Para usuarios */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Para vecinos</span>
            <h2 className={styles.sectionTitle}>Encontrá lo que necesitás en tu ciudad</h2>
          </div>
          <div className={styles.stepsGrid}>
            {PASOS_USUARIO.map((paso) => {
              const Icon = paso.icon;
              return (
                <div key={paso.num} className={styles.stepCard}>
                  <div className={styles.stepNum} style={{ color: paso.color }}>
                    {paso.num}
                  </div>
                  <div className={styles.stepIconWrap} style={{ background: `${paso.color}18`, color: paso.color }}>
                    <Icon />
                  </div>
                  <h3 className={styles.stepTitle}>{paso.titulo}</h3>
                  <p className={styles.stepDesc}>{paso.desc}</p>
                </div>
              );
            })}
          </div>
          <div className={styles.ctaRow}>
            <button className={styles.ctaBtn} onClick={() => navigate("/search?q=")}>
              Explorar negocios <FaChevronRight />
            </button>
            <button className={styles.ctaSecondary} onClick={() => navigate("/mapa")}>
              Ver el mapa <FaChevronRight />
            </button>
          </div>
        </section>

        <div className={styles.divider} />

        {/* Para negocios */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag} style={{ background: "#fef9ec", color: "#d97706" }}>
              Para dueños de negocios
            </span>
            <h2 className={styles.sectionTitle}>Mostrá tu negocio a toda la ciudad</h2>
          </div>
          <div className={styles.stepsGrid}>
            {PASOS_NEGOCIO.map((paso) => {
              const Icon = paso.icon;
              return (
                <div key={paso.num} className={styles.stepCard}>
                  <div className={styles.stepNum} style={{ color: paso.color }}>
                    {paso.num}
                  </div>
                  <div className={styles.stepIconWrap} style={{ background: `${paso.color}18`, color: paso.color }}>
                    <Icon />
                  </div>
                  <h3 className={styles.stepTitle}>{paso.titulo}</h3>
                  <p className={styles.stepDesc}>{paso.desc}</p>
                </div>
              );
            })}
          </div>
          <div className={styles.ctaRow}>
            <button
              className={styles.ctaBtn}
              style={{ background: "#16a085" }}
              onClick={() => navigate("/planes")}
            >
              Ver planes y precios <FaChevronRight />
            </button>
          </div>
        </section>

        {/* FAQ link */}
        <div className={styles.faqBanner}>
          <p>¿Todavía tenés dudas?</p>
          <a href="/preguntas-frecuentes" className={styles.faqLink}>
            Revisá las preguntas frecuentes →
          </a>
        </div>

      </div>
    </div>
  );
};

export default ComoFunciona;