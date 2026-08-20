import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaCheckCircle, FaHourglassHalf, FaExclamationTriangle, FaArrowRight } from "react-icons/fa";
import { getMySubscription, verifyMySubscription } from "../../Api/Api";
import styles from "./PagoRetorno.module.css";

const PLAN_LABELS = { BASIC: "Básico", INTERMEDIATE: "Intermedio", PREMIUM: "Premium" };

// Cuántas veces reintentar y cada cuánto. El webhook de Mercado Pago que
// activa la suscripción del lado del back es asíncrono — puede tardar unos
// segundos en llegar y procesarse, así que no alcanza con pedir el estado
// una sola vez apenas volvemos de MP.
const MAX_RETRIES = 6;
const RETRY_DELAY_MS = 3000;

export default function SuscripcionResultado() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preapprovalId = searchParams.get("preapproval_id");

  // "checking" mientras reintenta, "active" si confirmó la suscripción,
  // "timeout" si se acabaron los reintentos y sigue sin verse activa
  // (no es necesariamente un error — puede seguir procesándose).
  const [phase, setPhase] = useState("checking");
  const [subscription, setSubscription] = useState(null);
  const attemptRef = useRef(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Confirmando suscripción — Dónde Queda?";
    return () => { document.title = "Dónde Queda?"; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      attemptRef.current += 1;
      try {
        // /suscripcion/verificar: el back pidió conectarlo como refuerzo
        // porque, según dice, "puede tardar un toque MP en confirmar al
        // back" — asumimos que este endpoint fuerza una reconciliación en
        // vivo contra MP (a diferencia de mi-suscripcion, que solo lee lo
        // que ya está guardado). No tiene DTO tipado en el swagger, así que
        // no confiamos en su forma exacta — solo lo llamamos para
        // "empujar" la actualización, y logueamos qué devuelve por si hace
        // falta ajustar esto después de ver la forma real.
        const verifyResult = await verifyMySubscription().catch(() => null);
        if (verifyResult) console.log("🔍 /suscripcion/verificar devolvió:", verifyResult);

        const sub = await getMySubscription();
        if (cancelled) return;
        if (sub && sub.status === "ACTIVE") {
          setSubscription(sub);
          setPhase("active");
          return;
        }
      } catch {
        // getMySubscription tira error/vacío cuando todavía no hay
        // suscripción activa — es esperable mientras el webhook no llegó,
        // no lo tratamos como fallo definitivo.
      }

      if (attemptRef.current >= MAX_RETRIES) {
        if (!cancelled) setPhase("timeout");
        return;
      }
      if (!cancelled) setTimeout(check, RETRY_DELAY_MS);
    };

    check();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {phase === "checking" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            >
              <FaHourglassHalf className={styles.iconPending} />
            </motion.div>
            <h1 className={styles.title}>Confirmando tu pago…</h1>
            <p className={styles.subtitle}>
              Mercado Pago ya recibió tu pago, estamos esperando la confirmación
              para activar tu suscripción. Puede tardar unos segundos.
            </p>
          </>
        )}

        {phase === "active" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <FaCheckCircle className={styles.iconSuccess} />
            </motion.div>
            <h1 className={styles.title}>¡Listo, ya sos {PLAN_LABELS[subscription.plan?.planType] || subscription.plan?.planType}!</h1>
            <p className={styles.subtitle}>
              Tu suscripción quedó activada. Ya podés usar todo lo que incluye tu plan.
            </p>
            <div className={styles.actions}>
              <motion.button
                className={styles.primaryBtn}
                onClick={() => navigate("/Mycommerce")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Ir a mi negocio <FaArrowRight />
              </motion.button>
              <button className={styles.secondaryBtn} onClick={() => navigate("/")}>
                Volver al inicio
              </button>
            </div>
          </>
        )}

        {phase === "timeout" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <FaExclamationTriangle className={styles.iconPending} />
            </motion.div>
            <h1 className={styles.title}>Tu pago se está procesando</h1>
            <p className={styles.subtitle}>
              Mercado Pago confirmó el pago, pero todavía no vemos la suscripción
              activada de nuestro lado — a veces tarda un par de minutos más.
              No hace falta que pagues de nuevo.
            </p>
            {preapprovalId && (
              <div className={styles.infoBox}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>N° de operación</span>
                  <span className={styles.infoValue}>{preapprovalId}</span>
                </div>
              </div>
            )}
            <p className={styles.note}>
              Revisá tu perfil en un rato, o contactanos si pasan más de 10 minutos:{" "}
              <a href="mailto:contacto@dondequeda.com.ar">contacto@dondequeda.com.ar</a>.
            </p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => navigate("/profile")}>
                Ir a mi perfil <FaArrowRight />
              </button>
              <button className={styles.secondaryBtn} onClick={() => navigate("/")}>
                Volver al inicio
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}