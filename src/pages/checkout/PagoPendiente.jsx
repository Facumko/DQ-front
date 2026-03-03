import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaHourglassHalf } from "react-icons/fa";
import styles from "./PagoRetorno.module.css";

export default function PagoPendiente() {
  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();

  const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Pago pendiente — Dónde Queda?";
    return () => { document.title = "Dónde Queda?"; };
  }, []);

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <FaHourglassHalf className={styles.iconPending} />
        </motion.div>

        <h1 className={styles.title}>Pago pendiente de confirmación</h1>
        <p className={styles.subtitle}>
          Tu pago está siendo procesado. Esto puede tardar hasta <strong>2 días hábiles</strong>{" "}
          dependiendo del medio de pago elegido (Rapipago, Pago Fácil, transferencia).
        </p>

        {paymentId && (
          <div className={styles.infoBox}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>N° de operación</span>
              <span className={styles.infoValue}>{paymentId}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Estado</span>
              <span className={`${styles.infoValue} ${styles.statusPending}`}>
                Pendiente ⏳
              </span>
            </div>
          </div>
        )}

        <p className={styles.note}>
          Una vez confirmado el pago, activaremos tu plan automáticamente y te notificaremos por email.
          Guardá el número de operación para cualquier consulta.
        </p>

        <div className={styles.actions}>
          <motion.button
            className={styles.primaryBtn}
            onClick={() => navigate("/")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Volver al inicio
          </motion.button>
          <button className={styles.secondaryBtn} onClick={() => navigate("/planes")}>
            Ver planes
          </button>
        </div>
      </motion.div>
    </div>
  );
}