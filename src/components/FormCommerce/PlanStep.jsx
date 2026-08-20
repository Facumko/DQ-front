import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getPlans, FRONT_PLAN_ID_TO_TYPE } from "../../Api/Api";
import { PLANS_CONFIG } from "../../data/plansConfig";
import "./FormStep.css";
import "./PlanStep.css";

// Mismos planes que Plans.jsx (fuente única en /data/plansConfig.js).
// Acá solo se muestran las features incluidas (included: true).
const PLANES = PLANS_CONFIG.map(p => ({
  ...p,
  features: p.features.filter(f => f.included).map(f => f.text),
}));

const formatARS = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export default function PlanStep({ selectedPlan, onSelect, onCancel }) {
  const [hovered, setHovered] = useState(null);
  const [chosen,  setChosen]  = useState(selectedPlan || null);

  // Precio real del backend, igual que en Plans.jsx — nunca se muestra un
  // precio inventado. Mientras carga o si falla, se oculta el monto.
  const [realPrices, setRealPrices] = useState({});
  useEffect(() => {
    let cancelled = false;
    const typeToFrontId = Object.fromEntries(
      Object.entries(FRONT_PLAN_ID_TO_TYPE).map(([frontId, type]) => [type, frontId])
    );
    getPlans()
      .then(plans => {
        if (cancelled || !Array.isArray(plans)) return;
        const prices = {};
        plans.forEach(p => {
          const frontId = typeToFrontId[p.planType];
          if (frontId && typeof p.price === "number") prices[frontId] = p.price;
        });
        setRealPrices(prices);
      })
      .catch(() => { /* silencioso — se oculta el precio */ });
    return () => { cancelled = true; };
  }, []);

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
                {realPrices[plan.id] != null ? (
                  <>
                    <span className="plan-step-price-amount">{formatARS(realPrices[plan.id])}</span>
                    <span className="plan-step-price-period">/mes</span>
                  </>
                ) : (
                  <span className="plan-step-price-amount">$—</span>
                )}
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