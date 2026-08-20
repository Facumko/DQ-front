import { useEffect, useState, useContext, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../pages/UserContext";
import { getPlans, getMySubscription, changePlan, FRONT_PLAN_ID_TO_TYPE } from "../../Api/Api";
import { PLANS_CONFIG } from "../../data/PlansConfig";
import styles from "./Plans.module.css";

const formatARS = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

// highlight (tarjeta destacada) es solo un detalle visual de esta pantalla,
// no forma parte de la config compartida (data/plansConfig.js).
const PLANS = PLANS_CONFIG.map(p => ({ ...p, highlight: false }));

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
  const { user, openLoginModal } = useContext(UserContext);
  const navigate = useNavigate();
  const [openFaq, setOpenFaq]     = useState(null);
  const [hoveredPlan, setHoveredPlan] = useState(null);
  // Precios reales del backend, mapeados por id "amigable" del front
  // (basic/mid/premium). null mientras carga o si el fetch falla — en
  // ambos casos se muestra el fallback visual, nunca un precio inventado.
  const [realPrices, setRealPrices] = useState({});

  // Si el usuario ya tiene una suscripción ACTIVA, cambiar de plan no debe
  // pasar por Mercado Pago de nuevo (eso generaba una suscripción nueva en
  // paralelo a la existente) — se llama a changePlan() directamente.
  const [subscription, setSubscription] = useState(null);
  const [loadingSub,   setLoadingSub]   = useState(true);
  const [confirmPlan,  setConfirmPlan]  = useState(null); // planId pendiente de confirmar
  const [changingPlan, setChangingPlan] = useState(false);
  const [toast,        setToast]        = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  const typeToFrontId = useMemo(() => Object.fromEntries(
    Object.entries(FRONT_PLAN_ID_TO_TYPE).map(([frontId, type]) => [type, frontId])
  ), []);

  const loadSubscription = useCallback(async () => {
    if (!user) { setSubscription(null); setLoadingSub(false); return; }
    setLoadingSub(true);
    try {
      const sub = await getMySubscription();
      setSubscription(sub || null);
    } catch {
      setSubscription(null);
    } finally {
      setLoadingSub(false);
    }
  }, [user]);

  useEffect(() => { loadSubscription(); }, [loadSubscription]);

  useEffect(() => {
    let cancelled = false;
    getPlans()
      .then(plans => {
        if (cancelled || !Array.isArray(plans)) return;
        const typeToFrontId = Object.fromEntries(
          Object.entries(FRONT_PLAN_ID_TO_TYPE).map(([frontId, type]) => [type, frontId])
        );
        const prices = {};
        plans.forEach(p => {
          const frontId = typeToFrontId[p.planType];
          if (frontId && typeof p.price === "number") prices[frontId] = p.price;
        });
        setRealPrices(prices);
      })
      .catch(() => { /* silencioso — se muestra el fallback visual */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Planes de Suscripción – Dónde Queda?";
    return () => { document.title = "Dónde Queda?"; };
  }, []);

  const currentFrontPlanId = subscription?.status === "ACTIVE"
    ? typeToFrontId[subscription.plan?.planType]
    : null;

  const handleSelectPlan = (planId) => {
    if (!user) {
      openLoginModal();
      return;
    }
    // Ya tiene ESTE plan activo: no hay nada que hacer.
    if (planId === currentFrontPlanId) {
      showToast("Ya tenés este plan activo.");
      return;
    }
    // Tiene una suscripción activa (de OTRO plan): cambiar de plan en la
    // suscripción existente, no crear una nueva vía Mercado Pago.
    if (subscription?.status === "ACTIVE") {
      setConfirmPlan(planId);
      return;
    }
    // Sin suscripción activa (nunca se suscribió, o venció/canceló): flujo
    // normal de alta, pasa por checkout y Mercado Pago.
    navigate(`/checkout/${planId}`);
  };

  const handleConfirmChangePlan = async () => {
    if (!confirmPlan) return;
    const planType = FRONT_PLAN_ID_TO_TYPE[confirmPlan];
    setChangingPlan(true);
    try {
      await changePlan(planType);
      showToast("Tu plan se actualizó correctamente.");
      setConfirmPlan(null);
      await loadSubscription();
    } catch (err) {
      showToast(err?.message || "No se pudo cambiar el plan. Intentá de nuevo.", "error");
    } finally {
      setChangingPlan(false);
    }
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
                {realPrices[plan.id] != null ? (
                  <>
                    <span className={styles.priceLabel}>desde</span>
                    <span className={styles.priceAmount}>
                      <span className={styles.priceBig}>{formatARS(realPrices[plan.id])}</span>
                    </span>
                    <span className={styles.pricePeriod}>/mes</span>
                  </>
                ) : (
                  <>
                    <span className={styles.priceLabel}>desde</span>
                    <span className={styles.priceAmount}>$<span className={styles.priceBig}>—</span></span>
                    <span className={styles.pricePeriod}>/mes</span>
                    <p className={styles.priceNote}>El precio se muestra al seleccionar el plan</p>
                  </>
                )}
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
              {plan.id === currentFrontPlanId ? (
                <div className={styles.currentPlanBadge}>
                  <Check /> Tu plan actual
                </div>
              ) : (
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
                  disabled={loadingSub}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {subscription?.status === "ACTIVE" ? `Cambiar a ${plan.badge}` : `Elegir ${plan.badge}`}
                </motion.button>
              )}
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

        <p className={styles.tableSwipeHint}>Deslizá para ver los 3 planes →</p>

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
                ["Publicaciones en el feed",              true,  true,  true ],
                ["Creación de eventos",                   false, false, true ],
                ["Carrusel en página principal",          false, false, true ],
                ["Más de un perfil de comercio",          false, true,  true ],
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
            onClick={() => openLoginModal()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            Crear cuenta gratis
          </motion.button>
        </motion.div>
      </section>

      {/* ── Confirmación al cambiar de plan (suscripción ya activa) ── */}
      {confirmPlan && (
        <div className={styles.confirmOverlay} onClick={() => !changingPlan && setConfirmPlan(null)}>
          <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <p>
              ¿Cambiar tu plan a <strong>{PLANS.find(p => p.id === confirmPlan)?.badge}</strong>?
              El cambio se aplica al inicio del próximo período de facturación, no se te cobra nada ahora.
            </p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.confirmBtnCancel}
                onClick={() => setConfirmPlan(null)}
                disabled={changingPlan}
              >
                Volver
              </button>
              <button
                type="button"
                className={styles.confirmBtnOk}
                onClick={handleConfirmChangePlan}
                disabled={changingPlan}
              >
                {changingPlan ? "Cambiando…" : "Sí, cambiar plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`${styles.toast} ${styles["toast_" + toast.type]}`}>
          {toast.msg}
          <button className={styles.toastClose} onClick={() => setToast(null)}>✕</button>
        </div>
      )}
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