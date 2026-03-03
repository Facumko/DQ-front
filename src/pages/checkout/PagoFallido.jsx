import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaTimesCircle, FaArrowLeft } from "react-icons/fa";
import styles from "./PagoRetorno.module.css";

export default function PagoFallido() {
  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();

  const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Pago fallido — Dónde Queda?";
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
          <FaTimesCircle className={styles.iconError} />
        </motion.div>

        <h1 className={styles.title}>El pago no se pudo procesar</h1>
        <p className={styles.subtitle}>
          Puede haber ocurrido un error con el medio de pago. No se realizó ningún cobro.
        </p>

        <div className={styles.infoBox}>
          <p className={styles.tipsTitle}>Posibles causas:</p>
          <ul className={styles.tipsList}>
            <li>Fondos insuficientes en la tarjeta o cuenta</li>
            <li>Datos de la tarjeta incorrectos</li>
            <li>La tarjeta no está habilitada para pagos online</li>
            <li>El banco rechazó la transacción por seguridad</li>
          </ul>
        </div>

        <div className={styles.actions}>
          <motion.button
            className={styles.primaryBtn}
            onClick={() => navigate(-1)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <FaArrowLeft /> Intentar de nuevo
          </motion.button>
          <button className={styles.secondaryBtn} onClick={() => navigate("/planes")}>
            Ver planes
          </button>
        </div>

        <p className={styles.note}>
          Si el problema persiste, contactanos en{" "}
          <a href="mailto:contacto@dondequeda.com.ar">contacto@dondequeda.com.ar</a>{" "}
          {paymentId && `indicando el N° ${paymentId}`}.
        </p>
      </motion.div>
    </div>
  );
}