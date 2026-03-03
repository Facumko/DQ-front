import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaCheckCircle, FaArrowRight } from "react-icons/fa";
import styles from "./PagoRetorno.module.css";

// Mercado Pago devuelve en la URL:
// ?collection_id=...&collection_status=approved&payment_id=...
// &status=approved&external_reference=...&payment_type=credit_card
// &merchant_order_id=...&preference_id=...

export default function PagoExitoso() {
  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();

  const paymentId  = searchParams.get("payment_id")  || searchParams.get("collection_id");
  const status     = searchParams.get("status")       || searchParams.get("collection_status");
  const externalRef = searchParams.get("external_reference"); // tu referencia interna

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Pago exitoso — Dónde Queda?";
    return () => { document.title = "Dónde Queda?"; };
  }, []);

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <FaCheckCircle className={styles.iconSuccess} />
        </motion.div>

        <h1 className={styles.title}>¡Pago exitoso!</h1>
        <p className={styles.subtitle}>
          Tu suscripción quedó activada. Ya podés publicar tu negocio en Dónde Queda.
        </p>

        {paymentId && (
          <div className={styles.infoBox}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>N° de pago</span>
              <span className={styles.infoValue}>{paymentId}</span>
            </div>
            {status && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Estado</span>
                <span className={`${styles.infoValue} ${styles.statusApproved}`}>
                  Aprobado ✓
                </span>
              </div>
            )}
            {externalRef && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Referencia</span>
                <span className={styles.infoValue}>{externalRef}</span>
              </div>
            )}
          </div>
        )}

        <p className={styles.note}>
          Te enviamos un email de confirmación. Si tenés algún problema,
          contactanos en <a href="mailto:contacto@dondequeda.com.ar">contacto@dondequeda.com.ar</a>.
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
      </motion.div>
    </div>
  );
}