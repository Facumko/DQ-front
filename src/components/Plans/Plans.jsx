import { useEffect, useState, useContext } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../pages/UserContext";
import LoginModal from "../LoginForm/LoginModal";
import styles from "./Plans.module.css";

const PLANS = [
  {
    id: "basic",
    badge: "Básico",
    name: "Punto de Encuentro",
    tagline: "Para empezar a estar en el mapa",
    color: "#0369a1",
    colorBg: "#e0f2fe",
    highlight: false,
    features: [
      { text: "1 perfil de comercio", included: true },
      { text: "Información completa del comercio", included: true },
      { text: "Imagen de perfil y portada", included: true },
      { text: "Aparición en sección destacada por categoría", included: true },
      { text: "Hasta 5 imágenes en el perfil", included: true },
      { text: "Publicaciones en el feed", included: false },
      { text: "Creación de eventos", included: false },
      { text: "Aparición en carrusel principal", included: false },
      { text: "Más de un perfil de comercio", included: false },
    ],
  },
  {
    id: "mid",
    badge: "Intermedio",
    name: "Lugar en el Mapa",
    tagline: "Conectá con tu comunidad",
    color: "#b45309",
    colorBg: "#fef3c7",
    highlight: false,
    features: [
      { text: "1 perfil de comercio", included: true },
      { text: "Información completa del comercio", included: true },
      { text: "Imagen de perfil y portada", included: true },
      { text: "Aparición en sección destacada por categoría", included: true },
      { text: "Hasta 5 imágenes en el perfil", included: true },
      { text: "Publicaciones en el feed", included: true },
      { text: "Creación de eventos", included: false },
      { text: "Aparición en carrusel principal", included: false },
      { text: "Más de un perfil de comercio", included: false },
    ],
  },
  {
    id: "premium",
    badge: "Premium",
    name: "Referente de la Ciudad",
    tagline: "Máxima visibilidad y presencia",
    color: "#9d174d",
    colorBg: "#fce7f3",
    highlight: false,
    features: [
      { text: "Múltiples perfiles de comercio", included: true },
      { text: "Información completa del comercio", included: true },
      { text: "Imagen de perfil y portada", included: true },
      { text: "Aparición en sección destacada por categoría", included: true },
      { text: "Hasta 5 imágenes en el perfil", included: true },
      { text: "Publicaciones en el feed", included: true },
      { text: "Creación de eventos", included: true },
      { text: "Aparición en carrusel principal", included: true },
      { text: "Más de un perfil de comercio", included: true },
    ],
  },
];

const FAQS = [
  {
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: "Sí. Podés actualizar o bajar tu plan cuando quieras. El cambio se aplica al inicio del próximo período de facturación.",
  },
  {
    q: "¿Cómo cancelo mi suscripción?",
    a: "Podés cancelar desde la configuración de tu cuenta. Al cancelar, conservás los beneficios del plan hasta el fin del mes ya abonado. No se realizan cargos adicionales.",
  },
  {
    q: "¿Los precios pueden cambiar?",
    a: "Sí, los precios pueden modificarse en cualquier momento. Los cambios no afectan las suscripciones activas hasta su renovación, y te notificaremos con anticipación.",
  },
  {
    q: "¿Qué medios de pago están disponibles?",
    a: "Aceptamos pagos a través de Mercado Pago (tarjetas, transferencias) y mediante código de pago presencial en Rapipago o Pago Fácil.",
  },
  {
    q: "¿Necesito tener un comercio para registrarme?",
    a: "No. Podés registrarte gratis como usuario y usar todas las funciones del directorio. Los planes de suscripción son solo para quienes quieran publicar su propio comercio.",
  },
];

export default function Planes() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [openFaq, setOpenFaq]     = useState(null);
  const [hoveredPlan, setHoveredPlan] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Planes de Suscripción – Dónde Queda?";
    return () => { document.title = "Dónde Queda?"; };
  }, []);

  const handleSelectPlan = (planId) => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    navigate(`/checkout/${planId}`);
  };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div className={styles.page}>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className={styles.heroPill}>Suscripciones mensuales</span>
          <h1 className={styles.heroTitle}>
            Poné tu negocio en el mapa<br />
            <span className={styles.heroAccent}>de toda la ciudad</span>
          </h1>
          <p className={styles.heroSub}>
            Elegí el plan que mejor se adapte a tu negocio. Sin contratos largos, sin letra chica.
            Podés cambiar o cancelar cuando quieras.
          </p>
        </motion.div>

        {/* Olas decorativas */}
        <div className={styles.heroWave}>
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* ── TARJETAS ── */}
      <section className={styles.plansSection}>
        <motion.div
          className={styles.plansGrid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {PLANS.map((plan) => (
            <motion.div
              key={plan.id}
              variants={cardVariants}
              className={`${styles.card} ${plan.highlight ? styles.cardHighlight : ""}`}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              style={{
                borderColor: hoveredPlan === plan.id ? plan.color : undefined,
                boxShadow: hoveredPlan === plan.id
                  ? `0 12px 40px ${plan.color}30`
                  : undefined,
              }}
            >

              {/* Cabecera de la tarjeta */}
              <div className={styles.cardHeader}>
                <span
                  className={styles.planBadge}
                  style={{ background: plan.colorBg, color: plan.color }}
                >
                  {plan.badge}
                </span>
                <h2 className={styles.planName}>{plan.name}</h2>
                <p className={styles.planTagline}>{plan.tagline}</p>
              </div>

              {/* Precio */}
              <div className={styles.priceBox}>
                <span className={styles.priceLabel}>desde</span>
                <span className={styles.priceAmount}>$<span className={styles.priceBig}>—</span></span>
                <span className={styles.pricePeriod}>/mes</span>
                <p className={styles.priceNote}>El precio se muestra al seleccionar el plan</p>
              </div>

              {/* Separador */}
              <div className={styles.divider} />

              {/* Features */}
              <ul className={styles.featureList}>
                {plan.features.map((feat, i) => (
                  <li key={i} className={`${styles.featureItem} ${feat.included ? styles.featureOn : styles.featureOff}`}>
                    <span className={styles.featureIcon}>
                      {feat.included ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="8" fill="#16a34a" fillOpacity="0.12"/>
                          <path d="M4.5 8.5l2.5 2.5 4.5-5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="8" fill="#9ca3af" fillOpacity="0.12"/>
                          <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                      )}
                    </span>
                    {feat.text}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <motion.button
                className={`${styles.ctaBtn} ${plan.highlight ? styles.ctaBtnHighlight : ""}`}
                style={
                  plan.highlight
                    ? {}
                    : {
                        borderColor: hoveredPlan === plan.id ? plan.color : undefined,
                        color: hoveredPlan === plan.id ? "#fff" : plan.color,
                        background: hoveredPlan === plan.id ? plan.color : "transparent",
                      }
                }
                onClick={() => handleSelectPlan(plan.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Elegir {plan.badge}
              </motion.button>
            </motion.div>
          ))}
        </motion.div>

        <p className={styles.disclaimer}>
          Los precios están sujetos a modificación. Las promociones vigentes se muestran al momento de la suscripción.
          Podés cancelar en cualquier momento. Consultá nuestros{" "}
          <a href="/terminos-de-uso" target="_blank" rel="noopener noreferrer">Términos de Uso</a>.
        </p>
      </section>

      {/* ── COMPARATIVA ── */}
      <section className={styles.compareSection}>
        <motion.h2
          className={styles.sectionTitle}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Compará los planes
        </motion.h2>

        <motion.div
          className={styles.tableWrapper}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <table className={styles.compareTable}>
            <thead>
              <tr>
                <th className={styles.featCol}>Funcionalidad</th>
                <th><span className={styles.thBadge} style={{ background: "#e0f2fe", color: "#0369a1" }}>Básico</span></th>
                <th><span className={styles.thBadge} style={{ background: "#fef3c7", color: "#b45309" }}>Intermedio</span></th>
                <th><span className={styles.thBadge} style={{ background: "#fce7f3", color: "#9d174d" }}>Premium</span></th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Perfil de comercio",                    true,  true,  true ],
                ["Información + imagen de perfil y portada", true,  true,  true ],
                ["Sección destacada por categoría",       true,  true,  true ],
                ["Hasta 5 imágenes en el perfil",         true,  true,  true ],
                ["Publicaciones en el feed",              false, true,  true ],
                ["Creación de eventos",                   false, false, true ],
                ["Carrusel en página principal",          false, false, true ],
                ["Más de un perfil de comercio",          false, false, true ],
              ].map(([label, basic, mid, premium], i) => (
                <tr key={i}>
                  <td className={styles.featLabel}>{label}</td>
                  <td className={styles.checkCell}>{basic   ? <Check /> : <Cross />}</td>
                  <td className={styles.checkCell}>{mid     ? <Check /> : <Cross />}</td>
                  <td className={styles.checkCell}>{premium ? <Check /> : <Cross />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </section>

      {/* ── MÉTODOS DE PAGO ── */}
      <section className={styles.paySection}>
        <motion.h2
          className={styles.sectionTitle}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Medios de pago
        </motion.h2>
        <motion.div
          className={styles.payGrid}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className={styles.payCard}>
            <div className={styles.payIcon}>💳</div>
            <h3>Mercado Pago</h3>
            <p>Tarjetas de crédito, débito y transferencias bancarias. Procesamiento seguro e inmediato.</p>
          </div>
          <div className={styles.payCard}>
            <div className={styles.payIcon}>🏪</div>
            <h3>Rapipago / Pago Fácil</h3>
            <p>Generá un código desde la plataforma y pagá en efectivo en cualquier sucursal habilitada.</p>
          </div>
        </motion.div>
      </section>

      {/* ── FAQ ── */}
      <section className={styles.faqSection}>
        <motion.h2
          className={styles.sectionTitle}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Preguntas frecuentes
        </motion.h2>
        <div className={styles.faqList}>
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ""}`}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <button
                className={styles.faqQuestion}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {faq.q}
                <span className={styles.faqArrow}>{openFaq === i ? "▲" : "▼"}</span>
              </button>
              {openFaq === i && (
                <motion.p
                  className={styles.faqAnswer}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                >
                  {faq.a}
                </motion.p>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className={styles.ctaSection}>
        <motion.div
          className={styles.ctaBox}
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2>¿Todavía no tenés cuenta?</h2>
          <p>Registrate gratis y explorá todo lo que tiene para ofrecer tu ciudad.</p>
          <motion.button
            className={styles.ctaFinalBtn}
            onClick={() => setShowLogin(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            Crear cuenta gratis
          </motion.button>
        </motion.div>
      </section>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}

// Iconos auxiliares
function Check() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="#16a34a" fillOpacity="0.1"/>
      <path d="M5.5 10.5l3.5 3.5 5.5-7" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Cross() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="#9ca3af" fillOpacity="0.1"/>
      <path d="M7 7l6 6M13 7l-6 6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}