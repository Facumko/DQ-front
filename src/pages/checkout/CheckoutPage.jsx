import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserContext } from "../../pages/UserContext";
import styles from "./CheckoutPage.module.css";
import {
  FaShieldAlt, FaLock, FaCheckCircle, FaArrowLeft,
  FaCreditCard, FaMoneyBillWave, FaMobileAlt
} from "react-icons/fa";

// ── Definición de planes ─────────────────────────────────────────────────────
// IMPORTANTE: los precios aquí son solo visuales.
// El backend define el monto real al crear la preferencia de MP.
const PLANES = {
  basic: {
    id: "basic",
    badge: "Básico",
    name: "Punto de Encuentro",
    tagline: "Para empezar a estar en el mapa",
    precio: 4500,
    color: "#0369a1",
    colorBg: "#e0f2fe",
    features: [
      "1 perfil de comercio",
      "Información completa del comercio",
      "Imagen de perfil y portada",
      "Aparición en sección destacada por categoría",
      "Hasta 5 imágenes en el perfil",
    ],
  },
  mid: {
    id: "mid",
    badge: "Intermedio",
    name: "Lugar en el Mapa",
    tagline: "Conectá con tu comunidad",
    precio: 7900,
    color: "#b45309",
    colorBg: "#fef3c7",
    features: [
      "Todo lo del plan Básico",
      "Publicaciones en el feed",
    ],
    highlight: true,
  },
  premium: {
    id: "premium",
    badge: "Premium",
    name: "Referente de la Ciudad",
    tagline: "Máxima visibilidad y presencia",
    precio: 12900,
    color: "#9d174d",
    colorBg: "#fce7f3",
    features: [
      "Todo lo del plan Intermedio",
      "Creación de eventos",
      "Aparición en carrusel principal",
      "Múltiples perfiles de comercio",
    ],
  },
};

// ── Formateador de pesos argentinos ─────────────────────────────────────────
const formatARS = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export default function CheckoutPage() {
  const { planId }  = useParams();
  const navigate    = useNavigate();
  const { user }    = useContext(UserContext);

  const plan = PLANES[planId];

  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  // Redirigir si el plan no existe o no hay sesión
  useEffect(() => {
    if (!plan)  { navigate("/planes"); return; }
    if (!user)  { navigate("/planes"); return; }
    window.scrollTo(0, 0);
    document.title = `Checkout — Plan ${plan.badge} | Dónde Queda?`;
    return () => { document.title = "Dónde Queda?"; };
  }, [plan, user, navigate]);

  if (!plan || !user) return null;

  // ── Iniciar pago ──────────────────────────────────────────────────────────
  const handlePagar = async () => {
    setError("");
    setLoading(true);

    try {
      // Llamada a TU backend — él crea la preferencia en MP y devuelve el init_point
      const response = await fetch("/api/pagos/crear-preferencia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Si usás JWT: "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          planId: plan.id,
          userId: user.id_user,
          userEmail: user.email,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.mensaje || "Error al iniciar el pago");
      }

      const { initPoint } = await response.json();

      // Redirigir al checkout de Mercado Pago
      window.location.href = initPoint;

    } catch (err) {
      setError(err.message || "No pudimos conectar con el sistema de pagos. Intentá de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ── Volver ── */}
        <button className={styles.backBtn} onClick={() => navigate("/planes")}>
          <FaArrowLeft /> Cambiar plan
        </button>

        <div className={styles.grid}>

          {/* ── Columna izquierda: resumen del plan ── */}
          <motion.div
            className={styles.summaryCol}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className={styles.summaryCard}>

              <div className={styles.planHeader}>
                <span
                  className={styles.planBadge}
                  style={{ background: plan.colorBg, color: plan.color }}
                >
                  {plan.badge}
                </span>
                <h2 className={styles.planName}>{plan.name}</h2>
                <p className={styles.planTagline}>{plan.tagline}</p>
              </div>

              <div className={styles.priceRow}>
                <span className={styles.priceLabel}>Total por mes</span>
                <span className={styles.price}>{formatARS(plan.precio)}</span>
              </div>

              <div className={styles.divider} />

              <ul className={styles.featureList}>
                {plan.features.map((f, i) => (
                  <li key={i} className={styles.featureItem}>
                    <FaCheckCircle className={styles.featureCheck} />
                    {f}
                  </li>
                ))}
              </ul>

              <div className={styles.divider} />

              {/* Medios de pago aceptados */}
              <div className={styles.metodosWrap}>
                <p className={styles.metodosTitle}>Medios de pago aceptados</p>
                <div className={styles.metodos}>
                  <div className={styles.metodoItem}>
                    <FaCreditCard style={{ color: "#0369a1" }} />
                    <span>Tarjeta de crédito / débito</span>
                  </div>
                  <div className={styles.metodoItem}>
                    <FaMobileAlt style={{ color: "#00b1ea" }} />
                    <span>Mercado Pago / saldo</span>
                  </div>
                  <div className={styles.metodoItem}>
                    <FaMoneyBillWave style={{ color: "#16a34a" }} />
                    <span>Rapipago / Pago Fácil</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>

          {/* ── Columna derecha: confirmar pago ── */}
          <motion.div
            className={styles.payCol}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className={styles.payCard}>

              <div className={styles.payHeader}>
                <FaLock className={styles.lockIcon} />
                <div>
                  <h2 className={styles.payTitle}>Confirmá tu suscripción</h2>
                  <p className={styles.paySubtitle}>Serás redirigido a Mercado Pago para completar el pago de forma segura.</p>
                </div>
              </div>

              {/* Datos del usuario */}
              <div className={styles.userBox}>
                <div className={styles.userAvatar}>
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <p className={styles.userName}>{user.name || "Mi cuenta"}</p>
                  <p className={styles.userEmail}>{user.email}</p>
                </div>
              </div>

              {/* Resumen del cobro */}
              <div className={styles.invoiceBox}>
                <div className={styles.invoiceLine}>
                  <span>Plan {plan.badge}</span>
                  <span>{formatARS(plan.precio)}</span>
                </div>
                <div className={styles.invoiceLine}>
                  <span>Período</span>
                  <span>Mensual</span>
                </div>
                <div className={`${styles.invoiceLine} ${styles.invoiceTotal}`}>
                  <span>Total</span>
                  <span>{formatARS(plan.precio)}/mes</span>
                </div>
              </div>

              {error && (
                <div className={styles.errorBox}>
                  {error}
                </div>
              )}

              {/* Botón principal */}
              <motion.button
                className={styles.payBtn}
                onClick={handlePagar}
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? (
                  <span className={styles.spinner} />
                ) : (
                  <>
                    <img
                      src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/5.21.22/mercadopago/logo__small@2x.png"
                      alt="Mercado Pago"
                      className={styles.mpLogo}
                      onError={(e) => e.target.style.display = "none"}
                    />
                    Pagar con Mercado Pago
                  </>
                )}
              </motion.button>

              {/* Seguridad */}
              <div className={styles.securityRow}>
                <FaShieldAlt className={styles.securityIcon} />
                <p className={styles.securityText}>
                  Pago 100% seguro procesado por Mercado Pago. Dónde Queda? nunca almacena datos de tu tarjeta.
                </p>
              </div>

              {/* Condiciones */}
              <p className={styles.terms}>
                Al confirmar aceptás nuestros{" "}
                <a href="/terminos-de-uso" target="_blank" rel="noopener noreferrer">Términos de Uso</a>
                {" "}y la{" "}
                <a href="/legal/politica-de-privacidad" target="_blank" rel="noopener noreferrer">Política de Privacidad</a>.
                Podés cancelar en cualquier momento.
              </p>

            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}