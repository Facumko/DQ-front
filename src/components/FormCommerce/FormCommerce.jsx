import { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../pages/UserContext";
import { createBusiness, setCommerceCategory, addCommerceSubcategories, getMySubscription } from "../../Api/Api";
import PlanRestrictedModal from "../ProfileHeader/PlanRestrictedModal";
import ProgressBar from "./ProgressBar";
import PlanStep from "./PlanStep";
import CreatorInfo from "./CreatorInfo";
import BusinessInfo from "./BusinessInfo";
import Confirmation from "./Confirmation";
import "./FormCommerce.css";

const STEPS = ["Plan", "Propietario", "Negocio", "Confirmación"];

function FormCommerce() {
  const navigate = useNavigate();
  const { user, businesses, loadBusinesses, openLoginModal } = useContext(UserContext);

  const [currentStep,      setCurrentStep]     = useState(1);
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [checkingBusiness, setCheckingBusiness] = useState(true);

  // Límite de comercios: lo chequeamos nosotros contra la suscripción real
  // ANTES de dejar avanzar el alta, en vez de dejar que el usuario llene
  // todo el formulario y recién ahí reciba el 403 del backend (que además
  // hoy dispara el modal de "necesitás plan superior para promociones",
  // mensaje que no corresponde acá).
  const [commerceLimitReached, setCommerceLimitReached] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null); // { max, planBadge }

  const [formData, setFormData] = useState({
    selectedPlan:        "",
    firstName:           "",
    lastName:            "",
    idNumber:            "",
    phone:               "",
    businessName:        "",
    businessDescription: "",
    selectedCategories:  [],
    selectedSubcategories: [],
    businessAddress:     "",
    businessPhone:       "",
    instagram:           "",
    facebook:            "",
    website:             "",
    email:               "",
    location:            null,
  });

  useEffect(() => {
    if (!user?.id_user) { openLoginModal(); return; }
    let cancelled = false;
    getMySubscription()
      .then(sub => {
        if (cancelled) return;
        const max = sub?.status === "ACTIVE" ? sub.plan?.maxCommerces : 1; // sin suscripción activa, 1 comercio (plan Básico implícito)
        if (typeof max === "number" && businesses.length >= max) {
          setCommerceLimitReached(true);
          setLimitInfo({ max, planBadge: sub?.plan?.planType || "actual" });
        }
      })
      .catch(() => { /* si falla el chequeo, no bloqueamos — el backend valida igual */ })
      .finally(() => { if (!cancelled) setCheckingBusiness(false); });
    return () => { cancelled = true; };
  }, [user, businesses, openLoginModal]);

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

  const handleSuccess = async () => {
    if (!user?.id_user) { openLoginModal(); return; }
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
        location:    formData.location          || null,
      };

      const created = await createBusiness(businessData);

      // El backend solo admite una categoría por comercio; BusinessInfo ya
      // restringe la selección a una sola, así que tomamos la primera.
      if (formData.selectedCategories.length > 0) {
        try {
          await setCommerceCategory(created.id_business, formData.selectedCategories[0].idCategory);
        } catch (categoryError) {
          // No bloqueamos la navegación si falla la asignación de categoría
          console.warn("No se pudo asignar la categoría:", categoryError.message);
        }
      }

      if (formData.selectedSubcategories.length > 0) {
        try {
          await addCommerceSubcategories(created.id_business, formData.selectedSubcategories.map(t => t.nameTag));
        } catch (subcategoryError) {
          // Tampoco bloqueamos por esto — son opcionales
          console.warn("No se pudieron asignar las subcategorías:", subcategoryError.message);
        }
      }

      await loadBusinesses();

      navigate(`/negocios/${created.id_business}`);
    } catch (err) {
      if (err.isPlanError) {
        // Ya deberíamos haber bloqueado esto antes (ver commerceLimitReached),
        // esto es solo red de seguridad si el chequeo previo falló o quedó desactualizado.
        setCommerceLimitReached(true);
      } else {
        alert(`Error al crear el negocio: ${err.message}`);
      }
      setIsSubmitting(false);
    }
  };

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

      <PlanRestrictedModal
        isOpen={commerceLimitReached}
        onClose={() => setCommerceLimitReached(false)}
        onUpgrade={() => navigate("/planes")}
        title="Llegaste al límite de comercios de tu plan"
        message={
          limitInfo
            ? `Tu plan actual permite hasta ${limitInfo.max} comercio${limitInfo.max === 1 ? "" : "s"}. Mejorá tu plan para agregar otro.`
            : "Tu plan actual no permite agregar otro comercio. Mejorá tu plan para agregar otro."
        }
      />
    </div>
  );
}

export default FormCommerce;