import { useState } from "react";
import { motion } from "framer-motion";
import "./FormStep.css";
import "./PlanStep.css";

// Mismos planes que Plans.jsx — fuente de verdad visual en el frontend
const PLANES = [
  {
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
  {
    id: "mid",
    badge: "Intermedio",
    name: "Lugar en el Mapa",
    tagline: "Conectá con tu comunidad",
    precio: 7900,
    color: "#b45309",
    colorBg: "#fef3c7",
    popular: false,
    features: [
      "Todo lo del plan Básico",
      "Publicaciones en el feed",
    ],
  },
  {
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
];

const formatARS = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export default function PlanStep({ selectedPlan, onSelect, onCancel }) {
  const [hovered, setHovered] = useState(null);
  const [chosen,  setChosen]  = useState(selectedPlan || null);

  const handleConfirm = () => {
    if (chosen) onSelect(chosen);
  };

  return (
    <div className="form-step fade-in">
      <h2 className="step-title">Elegí tu plan</h2>
      <p className="step-description">
        Seleccioná el plan que mejor se adapte a tu negocio. Podés cambiarlo en cualquier momento.
      </p>

      <div className="plan-step-grid">
        {PLANES.map((plan) => {
          const isChosen  = chosen  === plan.id;
          const isHovered = hovered === plan.id;

          return (
            <motion.div
              key={plan.id}
              className={`plan-step-card ${isChosen ? "plan-step-selected" : ""} ${plan.popular ? "plan-step-popular" : ""}`}
              style={{
                borderColor: isChosen || isHovered ? plan.color : undefined,
                boxShadow: isChosen
                  ? `0 8px 28px ${plan.color}30`
                  : isHovered
                  ? `0 6px 20px ${plan.color}20`
                  : undefined,
              }}
              onClick={() => setChosen(plan.id)}
              onMouseEnter={() => setHovered(plan.id)}
              onMouseLeave={() => setHovered(null)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >

              <div className="plan-step-header">
                <span
                  className="plan-step-badge"
                  style={{ background: plan.colorBg, color: plan.color }}
                >
                  {plan.badge}
                </span>
                <h3 className="plan-step-name">{plan.name}</h3>
                <p className="plan-step-tagline">{plan.tagline}</p>
              </div>

              <div className="plan-step-price">
                <span className="plan-step-price-amount">{formatARS(plan.precio)}</span>
                <span className="plan-step-price-period">/mes</span>
              </div>

              <ul className="plan-step-features">
                {plan.features.map((f, i) => (
                  <li key={i}>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <circle cx="7.5" cy="7.5" r="7.5" fill="#16a34a" fillOpacity="0.12" />
                      <path d="M4 7.5l2.5 2.5 4.5-5" stroke="#16a34a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Indicador de selección */}
              <div
                className="plan-step-selector"
                style={isChosen ? { background: plan.color, borderColor: plan.color, color: "#fff" } : {}}
              >
                {isChosen ? "✓ Seleccionado" : "Elegir este plan"}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={!chosen}
        >
          Continuar al pago
        </button>
      </div>
    </div>
  );
}