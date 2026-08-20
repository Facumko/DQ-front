import { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../pages/UserContext";
import { createBusiness, setCommerceCategory, addCommerceSubcategories, getMySubscription } from "../../Api/Api";
import PlanRestrictedModal from "../ProfileHeader/PlanRestrictedModal";
import ProgressBar from "./ProgressBar";
import CreatorInfo from "./CreatorInfo";
import BusinessInfo from "./BusinessInfo";
import Confirmation from "./Confirmation";
import "./FormCommerce.css";
import "./FormStep.css";

// El paso de selección de plan se sacó del alta de comercio (no estaba
// conectado a ningún checkout real: el plan elegido nunca se enviaba al
// backend ni disparaba una suscripción). El comercio ahora se crea siempre
// bajo el plan vigente del usuario; el upsell de plan se maneja aparte, vía
// PlanRestrictedModal cuando corresponde y desde /planes.
const STEPS = ["Propietario", "Negocio", "Confirmación"];

// Sin ninguna suscripción activa NO se deja crear comercios — hay que
// suscribirse al menos al Básico primero (ver `noActivePlan` más abajo,
// que corta el flujo antes de mostrar el formulario). Estos mapas son solo
// para cuando SÍ hay una suscripción activa pero ya se llegó al tope de
// comercios de ese plan, para poder nombrar el próximo plan que hace falta.
const NEXT_PLAN = {
  BASIC:        { id: "mid",     badge: "Intermedio" },
  INTERMEDIATE: { id: "premium", badge: "Premium" },
  // PREMIUM no tiene tope de comercios (maxCommerces null), así que nunca
  // debería llegar a necesitar un "próximo plan".
};
const CURRENT_PLAN_BADGE = {
  BASIC:        "Básico",
  INTERMEDIATE: "Intermedio",
  PREMIUM:      "Premium",
};

function FormCommerce() {
  const navigate = useNavigate();
  const { user, businesses, loadBusinesses, openLoginModal } = useContext(UserContext);

  const [currentStep,      setCurrentStep]     = useState(1);
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [checkingBusiness, setCheckingBusiness] = useState(true);

  // Sin ninguna suscripción activa, se corta el alta antes de mostrar el
  // formulario: no tiene sentido dejar completar 3 pasos para recién al
  // final decirle que necesita un plan. Se lo redirige directo a
  // comprarlo (ver pantalla de bloqueo más abajo).
  const [noActivePlan, setNoActivePlan] = useState(false);

  // Límite de comercios (con suscripción activa): lo chequeamos nosotros
  // contra la suscripción real ANTES de dejar avanzar el alta, en vez de
  // dejar que el usuario llene todo el formulario y recién ahí reciba el
  // 403 del backend (que además hoy dispara el modal de "necesitás plan
  // superior para promociones", mensaje que no corresponde acá).
  const [commerceLimitReached, setCommerceLimitReached] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null); // { max, currentBadge, requiredPlanId, requiredBadge }

  const [formData, setFormData] = useState({
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
        const hasActiveSubscription = sub?.status === "ACTIVE";

        // Sin plan activo, no se puede crear ningún comercio — hay que
        // suscribirse primero. Cortamos acá, sin llegar a chequear límites.
        if (!hasActiveSubscription) {
          setNoActivePlan(true);
          return;
        }

        const currentPlanType = sub.plan?.planType;
        const max = sub.plan?.maxCommerces;
        if (typeof max === "number" && businesses.length >= max) {
          const next = NEXT_PLAN[currentPlanType];
          setCommerceLimitReached(true);
          setLimitInfo({
            max,
            currentBadge:   CURRENT_PLAN_BADGE[currentPlanType] || "actual",
            requiredPlanId: next?.id,
            requiredBadge:  next?.badge || "superior",
          });
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

  // Con suscripción activa de un plan inferior, el cambio de plan se
  // resuelve en /planes (usa changePlan, no un checkout nuevo de Mercado
  // Pago) — le pasamos el plan sugerido para que se lo resalte ahí.
  const handleUpgradeClick = () => {
    if (!limitInfo?.requiredPlanId) { navigate("/planes"); return; }
    navigate("/planes", { state: { suggestedPlan: limitInfo.requiredPlanId } });
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

  // Sin plan activo: no mostramos el formulario de alta — no tiene sentido
  // dejar completar 3 pasos para recién al final avisar que hace falta un
  // plan. Se lo manda directo a elegir/comprar uno.
  if (noActivePlan) {
    return (
      <div className="app">
        <div className="form-container">
          <div className="form-content">
            <div className="form-step fade-in">
              <h2 className="step-title">Necesitás un plan para crear tu comercio</h2>
              <p className="step-description">
                Todavía no tenés ningún plan activo. Para publicar tu comercio en Dónde Queda,
                elegí primero el plan Básico (o el que se ajuste mejor a lo que necesitás).
              </p>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => navigate("/")}>
                  Volver al inicio
                </button>
                <button className="btn btn-secondary" onClick={() => navigate("/planes")}>
                  Ver todos los planes
                </button>
                <button className="btn btn-primary" onClick={() => navigate("/checkout/basic")}>
                  Elegir plan Básico
                </button>
              </div>
            </div>
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
            <CreatorInfo
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 2 && (
            <BusinessInfo
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
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
        onUpgrade={handleUpgradeClick}
        title="Llegaste al límite de comercios de tu plan"
        message={
          limitInfo
            ? `Tu plan actual (${limitInfo.currentBadge}) permite hasta ${limitInfo.max} comercio${limitInfo.max === 1 ? "" : "s"}. Necesitás el plan ${limitInfo.requiredBadge} para agregar otro.`
            : "Tu plan actual no permite agregar otro comercio. Mejorá tu plan para agregar otro."
        }
      />
    </div>
  );
}

export default FormCommerce;