import { useState, useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserContext } from "../../pages/UserContext";
import { createBusiness, getBusinessByUserId } from "../../Api/Api";
import ProgressBar from "./ProgressBar";
import PlanStep from "./PlanStep";
import PaymentStep from "./PaymentStep";
import CreatorInfo from "./CreatorInfo";
import BusinessInfo from "./BusinessInfo";
import Confirmation from "./Confirmation";
import "./FormCommerce.css";

// Pasos del formulario
// 1 → Elegir plan
// 2 → Pagar (CheckoutPage embebido / redirección a MP)
// 3 → Datos del propietario
// 4 → Datos del negocio
// 5 → Confirmación

const STEPS = ["Plan", "Pago", "Propietario", "Negocio", "Confirmación"];

function FormCommerce() {
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();
  const { user }      = useContext(UserContext);

  // ── Leer params de retorno de MP ─────────────────────────────────────────
  // MP redirige a: /registro-negocio?step=3&plan=basic&paid=true
  const paramStep = parseInt(searchParams.get("step"));
  const paramPlan = searchParams.get("plan");
  const paramPaid = searchParams.get("paid") === "true";

  const [currentStep,      setCurrentStep]      = useState(paramPaid && paramStep ? paramStep : 1);
  const [isSubmitting,     setIsSubmitting]      = useState(false);
  const [checkingBusiness, setCheckingBusiness]  = useState(true);

  const [formData, setFormData] = useState({
    // Paso 1 — Plan
    selectedPlan: paramPlan || "",
    planPaid:     paramPaid,
    // Paso 3 — Propietario
    firstName: "",
    lastName:  "",
    idNumber:  "",
    phone:     "",
    // Paso 4 — Negocio
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
  });

  // ── Verificar sesión y negocio existente ─────────────────────────────────
  useEffect(() => {
    const check = async () => {
      if (!user?.id_user) {
        navigate("/");
        return;
      }
      try {
        const existing = await getBusinessByUserId(user.id_user);
        if (existing) navigate(`/negocios/${existing.id_business}`);
      } catch {
        // no tiene negocio, puede continuar
      } finally {
        setCheckingBusiness(false);
      }
    };
    check();
  }, [user, navigate]);

  // Limpiar params de URL una vez leídos (evita confusión si el usuario recarga)
  useEffect(() => {
    if (paramPaid) {
      navigate("/registro-negocio", { replace: true });
    }
  }, []); // eslint-disable-line

  // ── Handlers ─────────────────────────────────────────────────────────────
  const updateFormData = (data) => setFormData(prev => ({ ...prev, ...data }));

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // Paso 1 → 2: guardar plan y avanzar al paso de pago
  const handlePlanSelected = (planId) => {
    updateFormData({ selectedPlan: planId });
    setCurrentStep(2);
  };

  // Paso 2: el PaymentStep redirige a MP con la URL de retorno correcta
  // Cuando MP devuelve al usuario, el componente se remonta con ?paid=true&plan=X

  // Paso 5: crear negocio
  const handleSuccess = async () => {
    if (!user?.id_user) { navigate("/"); return; }
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
        website:     formData.website?.trim()    || "",
        instagram:   formData.instagram?.trim()  || null,
        facebook:    formData.facebook?.trim()   || null,
        whatsapp:    null,
        email:       formData.email?.trim()      || "",
        branchOf:    null,
        idOwner:     Number(user.id_user),
      };

      const created = await createBusiness(businessData);

      if (created?.id_business) {
        navigate(`/negocios/${created.id_business}`);
      } else {
        navigate("/mis-negocios");
      }
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
            <PaymentStep
              planId={formData.selectedPlan}
              user={user}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
            <CreatorInfo
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
              onBack={() => navigate("/")}
            />
          )}

          {currentStep === 4 && (
            <BusinessInfo
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 5 && (
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