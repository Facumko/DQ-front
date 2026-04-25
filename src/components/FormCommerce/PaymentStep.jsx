import { useState } from "react";
import { FaLock, FaShieldAlt, FaCreditCard, FaMobileAlt, FaMoneyBillWave, FaArrowLeft } from "react-icons/fa";
import "./FormStep.css";
import "./PaymentStep.css";

const PLANES = {
  basic: {
    badge: "Básico",
    name: "Punto de Encuentro",
    precio: 4500,
    color: "#0369a1",
    colorBg: "#e0f2fe",
  },
  mid: {
    badge: "Intermedio",
    name: "Lugar en el Mapa",
    precio: 7900,
    color: "#b45309",
    colorBg: "#fef3c7",
  },
  premium: {
    badge: "Premium",
    name: "Referente de la Ciudad",
    precio: 12900,
    color: "#9d174d",
    colorBg: "#fce7f3",
  },
};

const formatARS = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export default function PaymentStep({ planId, user, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const plan = PLANES[planId];
  if (!plan) return null;

  const handlePagar = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/pagos/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          userEmail: user.email,
          // URL de retorno: vuelve al form en paso 3 con el plan seleccionado
          successUrl: `${window.location.origin}/registro-negocio?step=3&plan=${planId}&paid=true`,
          failureUrl: `${window.location.origin}/registro-negocio?step=2&plan=${planId}&paid=false`,
          pendingUrl: `${window.location.origin}/registro-negocio?step=2&plan=${planId}&paid=false`,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.mensaje || "Error al iniciar el pago");
      }

      const { initPoint } = await response.json();
      window.location.href = initPoint;

    } catch (err) {
      setError(err.message || "No pudimos conectar con el sistema de pagos. Intentá de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="form-step fade-in">
      <h2 className="step-title">Confirmá el pago</h2>
      <p className="step-description">
        Serás redirigido a Mercado Pago para completar el pago de forma segura.
      </p>

      {/* Resumen del plan elegido */}
      <div className="payment-summary">
        <div className="payment-plan-row">
          <span
            className="payment-plan-badge"
            style={{ background: plan.colorBg, color: plan.color }}
          >
            {plan.badge}
          </span>
          <div className="payment-plan-info">
            <span className="payment-plan-name">{plan.name}</span>
            <span className="payment-plan-period">Suscripción mensual</span>
          </div>
          <span className="payment-plan-price">{formatARS(plan.precio)}</span>
        </div>

        <div className="payment-divider" />

        <div className="payment-total-row">
          <span>Total por mes</span>
          <strong>{formatARS(plan.precio)}/mes</strong>
        </div>
      </div>

      {/* Métodos aceptados */}
      <div className="payment-methods">
        <p className="payment-methods-title">Medios de pago aceptados</p>
        <div className="payment-methods-list">
          <span><FaCreditCard style={{ color: "#0369a1" }} /> Tarjeta crédito / débito</span>
          <span><FaMobileAlt style={{ color: "#00b1ea" }} /> Mercado Pago / saldo</span>
          <span><FaMoneyBillWave style={{ color: "#16a34a" }} /> Rapipago / Pago Fácil</span>
        </div>
      </div>

      {error && <div className="payment-error">{error}</div>}

      {/* Botón MP */}
      <motion.button
        className="payment-btn-mp"
        onClick={handlePagar}
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.97 }}
      >
        {loading ? (
          <span className="loading-spinner small" />
        ) : (
          <>
            <img
              src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/5.21.22/mercadopago/logo__small@2x.png"
              alt="MP"
              className="mp-logo"
              onError={(e) => e.target.style.display = "none"}
            />
            Pagar con Mercado Pago
          </>
        )}
      </motion.button>

      {/* Seguridad */}
      <div className="payment-security">
        <FaShieldAlt className="payment-security-icon" />
        <p>Pago 100% seguro procesado por Mercado Pago. Dónde Queda? nunca almacena datos de tu tarjeta.</p>
      </div>

      <div className="form-actions" style={{ borderTop: "1px solid #f0f0f0", paddingTop: "20px" }}>
        <button className="btn btn-secondary" onClick={onBack}>
          <FaArrowLeft style={{ marginRight: 6 }} /> Cambiar plan
        </button>
      </div>
    </div>
  );
}