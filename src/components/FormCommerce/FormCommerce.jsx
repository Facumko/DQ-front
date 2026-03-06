"use client";
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../pages/UserContext";
import { createBusiness } from "../../Api/Api";
import ProgressBar from "./ProgressBar";
import CreatorInfo from "./CreatorInfo";
import BusinessInfo from "./BusinessInfo";
import SubscriptionPlan from "./SubscriptionPlan";
import Confirmation from "./Confirmation";
import "./FormCommerce.css";

function FormCommerce() {
  const navigate = useNavigate();
  const { user, loadBusinesses } = useContext(UserContext);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    idNumber: "",
    phone: "",
    businessName: "",
    businessDescription: "",
    category: "",
    categoryId: null,
    businessAddress: "",
    businessPhone: "",
    instagram: "",
    facebook: "",
    website: "",
    email: "",
    selectedPlan: "basic",
  });

  const steps = ["Propietario", "Negocio", "Plan", "Confirmación"];

  // ✅ Redirigir en useEffect, no durante el render
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const updateFormData = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    console.log("📝 Datos actualizados:", data);
  };

  const handleSuccess = async () => {
    console.log("🚀 EJECUTANDO handleSuccess - Creando negocio...");

    if (!formData.businessName || !formData.businessDescription) {
      alert("Por favor completa todos los campos requeridos del negocio");
      return;
    }

    setIsSubmitting(true);

    try {
      const businessData = {
        name: formData.businessName.trim(),
        description: formData.businessDescription.trim(),
        phone: formData.businessPhone?.replace(/\D/g, "") || formData.phone?.replace(/\D/g, "") || "",
        website: formData.website?.trim() || "",
        instagram: formData.instagram?.trim() || null,
        facebook: formData.facebook?.trim() || null,
        whatsapp: null,
        email: formData.email?.trim() || "",
        branchOf: null,
        idOwner: Number(user.id_user),
      };

      console.log("📤 ENVIANDO AL BACKEND...", businessData);

      const createdBusiness = await createBusiness(businessData);

      console.log("📦 RESPUESTA COMPLETA DEL BACKEND:", createdBusiness);

      await loadBusinesses(user.id_user);

      const extraData = {
        businessAddress: formData.businessAddress,
        instagram: formData.instagram,
        facebook: formData.facebook,
        selectedPlan: formData.selectedPlan,
        category: formData.category,
        categoryId: formData.categoryId,
      };
      localStorage.setItem("businessExtraData", JSON.stringify(extraData));

      if (createdBusiness?.id_business) {
        console.log("📍 REDIRIGIENDO a nuevo negocio:", `/negocios/${createdBusiness.id_business}`);
        navigate(`/negocios/${createdBusiness.id_business}`);
      } else {
        console.log("❌ NO HAY ID VÁLIDA - Redirigiendo a inicio como fallback");
        navigate("/");
      }
    } catch (error) {
      console.error("❌ ERROR AL CREAR NEGOCIO:", error);
      alert(`Error al crear el negocio: ${error.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app">
      <div className="form-container">
        <ProgressBar steps={steps} currentStep={currentStep} />

        <div className="form-content">
          {currentStep === 1 && (
            <CreatorInfo
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
              onBack={() => navigate("/")}
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
            <SubscriptionPlan
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