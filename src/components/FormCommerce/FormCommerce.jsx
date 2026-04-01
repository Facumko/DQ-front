import { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../pages/UserContext";
import { createBusiness } from "../../Api/Api";
import ProgressBar from "./ProgressBar";
import PlanStep from "./PlanStep";
import CreatorInfo from "./CreatorInfo";
import BusinessInfo from "./BusinessInfo";
import Confirmation from "./Confirmation";
import "./FormCommerce.css";

// Pasos del formulario
// 1 → Elegir plan
// 2 → Datos del propietario
// 3 → Datos del negocio  (incluye LocationPicker → guarda location: { lat, lng, address })
// 4 → Confirmación
// TODO: reincorporar paso de Pago (Mercado Pago) entre Plan y Propietario

const STEPS = ["Plan", "Propietario", "Negocio", "Confirmación"];

function FormCommerce() {
  const navigate = useNavigate();
  const { user, loadBusinesses } = useContext(UserContext);

  const [currentStep,      setCurrentStep]     = useState(1);
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [checkingBusiness, setCheckingBusiness] = useState(true);

  const [formData, setFormData] = useState({
    // Paso 1 — Plan
    selectedPlan: "",
    // Paso 2 — Propietario
    firstName: "",
    lastName:  "",
    idNumber:  "",
    phone:     "",
    // Paso 3 — Negocio
    businessName:        "",
    businessDescription: "",
    category:            "",
    categoryId:          null,
    businessAddress:     "",
    businessPhone:       "",
    instagram:           "",
    facebook:            "",
    website:             "",
    email:               "",
    // 🆕 Ubicación del LocationPicker: { lat, lng, address } | null
    location:            null,
  });

  // ── Verificar sesión ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id_user) {
      navigate("/login");
      return;
    }
    setCheckingBusiness(false);
  }, [user, navigate]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  // useCallback evita que updateFormData se recree en cada render,
  // lo que causaba que BusinessInfo perdiera la location al sincronizar
  const updateFormData = useCallback(
    (data) => setFormData(prev => ({ ...prev, ...data })),
    []
  );
  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handlePlanSelected = (planId) => {
    updateFormData({ selectedPlan: planId });
    setCurrentStep(2);
  };

  // ── Paso 4: crear negocio ─────────────────────────────────────────────────
  const handleSuccess = async () => {
    console.log("🗺️ formData.location en handleSuccess:", formData.location)
    console.log("📋 formData completo:", JSON.stringify(formData, null, 2))

    if (!user?.id_user) { navigate("/login"); return; }

    if (!formData.businessName || !formData.businessDescription) {
      alert("Por favor completá todos los campos requeridos");
      return;
    }

    setIsSubmitting(true);

    try {
      const businessData = {
        name:        formData.businessName.trim(),
        description: formData.businessDescription.trim(),
        phone:       formData.businessPhone?.replace(/\D/g, "") || formData.phone?.replace(/\D/g, "") || "",
        website:     formData.website?.trim()   || "",
        instagram:   formData.instagram?.trim() || null,
        facebook:    formData.facebook?.trim()  || null,
        whatsapp:    null,
        email:       formData.email?.trim()     || "",
        branchOf:    null,
        // 🆕 Pasar location para que Api.jsx lo convierta a AddressDto
        // location viene del LocationPicker como { lat, lng, address }
        location:    formData.location || null,
      };

      if (import.meta.env.MODE === 'development') {
        console.log("📤 Creando negocio con datos:", businessData);
        console.log("🗺️ Ubicación incluida:", businessData.location);
      }

      const created = await createBusiness(businessData);

      // Refrescar lista de negocios en el Navbar
      await loadBusinesses();
      loadBusinesses();

      navigate(`/negocios/${created.id_business}`);
    } catch (err) {
      alert(`Error al crear el negocio: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (checkingBusiness) {
    return (
      <div className="app">
        <div className="form-container">
          <div className="form-content form-loading">
            <div className="loading-spinner" />
            <p>Verificando tus datos...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <div className="form-container">
        <ProgressBar steps={STEPS} currentStep={currentStep} />

        <div className="form-content">

          {currentStep === 1 && (
            <PlanStep
              selectedPlan={formData.selectedPlan}
              onSelect={handlePlanSelected}
              onCancel={() => navigate("/")}
            />
          )}

          {currentStep === 2 && (
            <CreatorInfo
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
            <BusinessInfo
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 4 && (
            <Confirmation
              data={formData}
              onSuccess={handleSuccess}
              isSubmitting={isSubmitting}
              onBack={handleBack}
            />
          )}

        </div>
      </div>
    </div>
  );
}

export default FormCommerce;