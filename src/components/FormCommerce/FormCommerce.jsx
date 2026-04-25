import { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../pages/UserContext";
import { createBusiness, addCommerceCategories } from "../../Api/Api";
import ProgressBar from "./ProgressBar";
import PlanStep from "./PlanStep";
import CreatorInfo from "./CreatorInfo";
import BusinessInfo from "./BusinessInfo";
import Confirmation from "./Confirmation";
import "./FormCommerce.css";

const STEPS = ["Plan", "Propietario", "Negocio", "Confirmación"];

function FormCommerce() {
  const navigate = useNavigate();
  const { user, loadBusinesses } = useContext(UserContext);

  const [currentStep,      setCurrentStep]     = useState(1);
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [checkingBusiness, setCheckingBusiness] = useState(true);

  const [formData, setFormData] = useState({
    selectedPlan:        "",
    firstName:           "",
    lastName:            "",
    idNumber:            "",
    phone:               "",
    businessName:        "",
    businessDescription: "",
    selectedCategories:  [],
    businessAddress:     "",
    businessPhone:       "",
    instagram:           "",
    facebook:            "",
    website:             "",
    email:               "",
    location:            null,
  });

  useEffect(() => {
    if (!user?.id_user) { navigate("/login"); return; }
    setCheckingBusiness(false);
  }, [user, navigate]);

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
        location:    formData.location          || null,
      };

      const created = await createBusiness(businessData);

      // Si el usuario seleccionó categorías, las agregamos en un segundo request
      if (formData.selectedCategories.length > 0) {
        try {
          const categoryIds = formData.selectedCategories.map(c => c.idCategory);
          await addCommerceCategories(created.id_business, categoryIds);
        } catch (categoryError) {
          // No bloqueamos la navegación si falla la asignación de categorías
          console.warn("No se pudieron asignar las categorías:", categoryError.message);
        }
      }

      await loadBusinesses();

      navigate(`/negocios/${created.id_business}`);
    } catch (err) {
      alert(`Error al crear el negocio: ${err.message}`);
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
    </div>
  );
}

export default FormCommerce;