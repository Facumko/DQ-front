"use client";
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../pages/UserContext";
import { createBusiness, getBusinessByUserId } from "../../Api/Api";
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
  const [hasExistingBusiness, setHasExistingBusiness] = useState(false);
  const [checkingBusiness, setCheckingBusiness] = useState(true);
  const [formData, setFormData] = useState({
    // Step 1 - Datos personales
    firstName: "",
    lastName: "",
    idNumber: "",
    phone: "",
    // Step 2 - Datos del negocio
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
    // Step 3 - Plan
    selectedPlan: "basic",
  });

  const steps = ["Propietario", "Negocio", "Plan", "Confirmación"];

  /* ---------- VERIFICAR SI EL USUARIO YA TIENE NEGOCIO ---------- */
  useEffect(() => {
    const checkExistingBusiness = async () => {
      if (!user?.id_user) {
        console.log("❌ No hay usuario logueado, redirigiendo a login...");
        navigate("/login");
        return;
      }

      console.log("🔍 Verificando si usuario ya tiene negocio...", user.id_user);
      setCheckingBusiness(true);

      try {
        const existingBusiness = await getBusinessByUserId(user.id_user);
        console.log("📊 Resultado de verificación:", existingBusiness);

        if (existingBusiness) {
          console.log("✅ Usuario YA TIENE NEGOCIO, redirigiendo...");
          console.log("📋 Negocio:", existingBusiness);
          setHasExistingBusiness(true);
          // Redirigir al negocio existente
          navigate(`/negocios/${existingBusiness.id_business}`);
        } else {
          console.log("ℹ️ Usuario NO tiene negocio, puede crear uno");
          setHasExistingBusiness(false);
        }
      } catch (error) {
        console.log("❌ Error verificando negocio:", error.message);
        setHasExistingBusiness(false);
      } finally {
        setCheckingBusiness(false);
      }
    };

    checkExistingBusiness();
  }, [user, navigate]);

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
    
    if (!user) {
      alert("Debes iniciar sesión para crear un negocio");
      navigate("/login");
      return;
    }

    console.log("👤 Usuario ID:", user.id_user);

    // Validar datos mínimos antes de enviar
    if (!formData.businessName || !formData.businessDescription) {
      alert("Por favor completa todos los campos requeridos del negocio");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // ✅ FORMATO EXACTO QUE ESPERA CommerceDto - BRANCHOF NULL
      const businessData = {
        name: formData.businessName.trim(),
        description: formData.businessDescription.trim(),
        phone: formData.businessPhone?.replace(/\D/g, "") || formData.phone?.replace(/\D/g, "") || "",
        website: formData.website?.trim() || "",
        instagram: formData.instagram?.trim() || null,
        facebook: formData.facebook?.trim() || null,
        whatsapp: null,
        email: formData.email?.trim() || "",
        branchOf: null, // ✅ FORZAR null
        idOwner: Number(user.id_user),
      };

      console.log("📤 ENVIANDO AL BACKEND...", businessData);

      // Crear negocio en backend
      const createdBusiness = await createBusiness(businessData);
      
      // 🎯 DEBUG CRÍTICO - VER QUÉ DEVUELVE EL BACKEND
      console.log("📦 RESPUESTA COMPLETA DEL BACKEND:", createdBusiness);
      console.log("🔍 ID del negocio:", createdBusiness?.id_business);
      console.log("🔍 Tipo de ID:", typeof createdBusiness?.id_business);
      console.log("🔍 ¿Tenemos ID válida?", createdBusiness?.id_business ? "SÍ" : "NO");
      
      // Guardar datos extra en localStorage para futura expansión
      const extraData = {
        businessAddress: formData.businessAddress,
        instagram: formData.instagram,
        facebook: formData.facebook,
        selectedPlan: formData.selectedPlan,
        category: formData.category,
        categoryId: formData.categoryId
      };
      localStorage.setItem('businessExtraData', JSON.stringify(extraData));
      
      // 🎯 REDIRIGIR AL NEGOCIO CREADO
      if (createdBusiness?.id_business) {
        console.log("📍 REDIRIGIENDO a nuevo negocio:", `/negocios/${createdBusiness.id_business}`);
        navigate(`/negocios/${createdBusiness.id_business}`);
      } else {
        console.log("❌ NO HAY ID VÁLIDA - Respuesta completa:", createdBusiness);
        console.log("📍 Redirigiendo a mis negocios como fallback");
        navigate('/mis-negocios');
      }
      
    } catch (error) {
      console.error("❌ ERROR AL CREAR NEGOCIO:", error);
      alert(`Error al crear el negocio: ${error.message}`);
      setIsSubmitting(false);
    }
  };

  // Mostrar loading mientras verificamos si tiene negocio
  if (checkingBusiness) {
    return (
      <div className="app">
        <div className="form-container">
          <div className="form-content" style={{ textAlign: 'center', padding: '50px' }}>
            <div className="loading-spinner"></div>
            <p>Verificando tus datos...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si ya tiene negocio, no mostrar el formulario (ya redirigió)
  if (hasExistingBusiness) {
    return (
      <div className="app">
        <div className="form-container">
          <div className="form-content" style={{ textAlign: 'center', padding: '50px' }}>
            <p>Ya tienes un negocio creado. Serás redirigido...</p>
          </div>
        </div>
      </div>
    );
  }

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