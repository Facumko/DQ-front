"use client"


import { useState } from "react"
import "./SubscriptionPlan.css"


function SubscriptionPlan({ data, onUpdate, onNext, onBack }) {
  const [selectedPlan, setSelectedPlan] = useState(data.selectedPlan || null)


  const plans = [
    {
      id: "basic",
      name: "Básico",
      price: "$9.99",
      period: "/mes",
      features: ["Perfil de negocio básico", "Hasta 10 productos", "Soporte por correo", "Analíticas básicas"],
    },
    {
      id: "professional",
      name: "Profesional",
      price: "$29.99",
      period: "/mes",
      features: [
        "Perfil de negocio mejorado",
        "Productos ilimitados",
        "Soporte prioritario",
        "Analíticas avanzadas",
        "Integración de redes sociales",
        "Dominio personalizado",
      ],
      popular: true,
    },
    {
      id: "enterprise",
      name: "Empresarial",
      price: "$99.99",
      period: "/mes",
      features: [
        "Perfil de negocio premium",
        "Todo ilimitado",
        "Soporte dedicado 24/7",
        "Analíticas e informes avanzados",
        "Acceso a API",
        "Integraciones personalizadas",
        "Opciones de marca blanca",
      ],
    },
  ]


  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId)
  }


  const handleConfirm = () => {
    if (selectedPlan) {
      onUpdate({ selectedPlan })
      onNext()
    }
  }


  return (
    <div className="form-step fade-in">
      <h2 className="step-title">Elige tu Plan de Suscripción</h2>
      <p className="step-description">Selecciona el plan que mejor se adapte a las necesidades de tu negocio</p>


      <div className="plans-container">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${selectedPlan === plan.id ? "selected" : ""} ${plan.popular ? "popular" : ""}`}
            onClick={() => handleSelectPlan(plan.id)}
          >
            {plan.popular && <div className="popular-badge">Más Popular</div>}


            <h3 className="plan-name">{plan.name}</h3>
            <div className="plan-price">
              <span className="price">{plan.price}</span>
              <span className="period">{plan.period}</span>
            </div>


            <ul className="plan-features">
              {plan.features.map((feature, index) => (
                <li key={index}>
                  <span className="checkmark">✓</span>
                  {feature}
                </li>
              ))}
            </ul>


            <div className="select-indicator">{selectedPlan === plan.id ? "Seleccionado" : "Seleccionar Plan"}</div>
          </div>
        ))}
      </div>


      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onBack}>
          Atrás
        </button>
        <button className="btn btn-primary" onClick={handleConfirm} disabled={!selectedPlan}>
          Confirmar
        </button>
      </div>
    </div>
  )
}


export default SubscriptionPlan
