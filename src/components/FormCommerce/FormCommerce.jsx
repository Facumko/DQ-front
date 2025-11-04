"use client"


import { useState, useEffect } from "react"
import ProgressBar from "./ProgressBar"
import CreatorInfo from "./CreatorInfo"
import BusinessInfo from "./BusinessInfo"
import SubscriptionPlan from "./SubscriptionPlan"
import Confirmation from "./Confirmation"
import "./FormCommerce.css"


function FormCommerce({ onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1
    firstName: "",
    lastName: "",
    idNumber: "",
    phone: "",
    address: "",
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
    selectedPlan: null,
  })


  const steps = ["Información del Creador", "Información del Negocio", "Plan de Suscripción", "Confirmación"]


  // ← RESET al montar
  useEffect(() => {
    setCurrentStep(1)
    setFormData({
      firstName: "",
      lastName: "",
      idNumber: "",
      phone: "",
      address: "",
      businessName: "",
      businessDescription: "",
      category: "",
      businessAddress: "",
      businessPhone: "",
      instagram: "",
      facebook: "",
      website: "",
      email: "",
      selectedPlan: null,
    })
  }, [])


  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length))
  }


  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }


  const updateFormData = (data) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }


  const handleSuccess = () => {
    if (onSuccess) onSuccess()
  }


  return (
    <div className="app">
      <div className="form-container">
        <ProgressBar steps={steps} currentStep={currentStep} />


        <div className="form-content">
          {currentStep === 1 && (
            <CreatorInfo data={formData} onUpdate={updateFormData} onNext={() => setCurrentStep(2)} onBack={() => setCurrentStep(0)} />
          )}


          {currentStep === 2 && (
            <BusinessInfo data={formData} onUpdate={updateFormData} onNext={handleNext} onBack={handleBack} />
          )}


          {currentStep === 3 && (
            <SubscriptionPlan data={formData} onUpdate={updateFormData} onNext={handleNext} onBack={handleBack} />
          )}


          {currentStep === 4 && (
            <Confirmation data={formData} onSuccess={handleSuccess} />
          )}
        </div>
      </div>
    </div>
  )
}


export default FormCommerce