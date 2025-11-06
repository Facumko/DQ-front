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
  const { user } = useContext(UserContext);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1
    firstName: "",
    lastName: "",
    idNumber: "",
    phone: "",
    // Step 2
    businessName: "",
    businessDescription: "",
    category: "",
    businessAddress: "",
    businessPhone: "",
    instagram: "",
    facebook: "",
    website: "",
    email: "",
    // Step 3
    selectedPlan: "basic",
  });

  const steps = ["Información del Creador", "Información del Negocio", "Plan de Suscripción", "Confirmación"];

  // Reset al montar
  useEffect(() => {
    setCurrentStep(1);
    // Si hay datos de usuario, prellenar el paso 1
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.name || "",
        lastName: user.lastname || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const updateFormData = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSuccess = async () => {
    if (!user) {
      alert("Debes iniciar sesión para crear un negocio");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Preparar datos para el backend
      const businessData = {
        id_user: user.id_user,
        name: formData.businessName,
        description: formData.businessDescription,
        email: formData.email,
        phone: formData.businessPhone,
        link: formData.website,
        // Si tu backend acepta branchOf para categoría:
        branchOf: formData.category || null,
      };

      console.log("📤 Enviando datos de negocio al backend:", businessData);

      // Crear negocio en backend
      const createdBusiness = await createBusiness(businessData);
      
      console.log("✅ Negocio creado:", createdBusiness);
      
      // Redirigir al perfil del negocio creado
      navigate(`/negocios/${createdBusiness.id_business}`);
      
    } catch (error) {
      console.error("❌ Error al crear negocio:", error);
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
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default FormCommerce;