"use client"


import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./FormStep.css"


function CreatorInfo({ data, onUpdate, onNext, onBack }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: data?.firstName || "",
    lastName: data?.lastName || "",
    idNumber: data?.idNumber || "",
    phone: data?.phone || "",
  })


  const [isValid, setIsValid] = useState(false)


  /* ---------- HELPERS ---------- */
  const onlyLetters = (str) => str.replace(/[^A-Za-zÀ-ÿ\s]/g, "")
  const onlyDigits = (str, len) => str.replace(/\D/g, "").slice(0, len)


  const formatPhone = (raw) => {
    const digits = raw.replace(/\D/g, "").slice(0, 10)
    if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    return digits
  }


  /* ---------- VALIDACIÓN ---------- */
  useEffect(() => {
    const firstName = formData?.firstName ?? ""
    const lastName = formData?.lastName ?? ""
    const idNumber = formData?.idNumber ?? ""
    const phone = formData?.phone ?? ""


    const ok =
      firstName.trim().length >= 2 &&
      lastName.trim().length >= 2 &&
      idNumber.length === 8 &&
      phone.replace(/\D/g, "").length === 10


    console.log("🔍 Validación:", {
      firstName: firstName.trim().length,
      lastName: lastName.trim().length,
      idNumber: idNumber.length,
      phoneDigits: phone.replace(/\D/g, "").length,
      resultado: ok,
    })


    setIsValid(ok)
  }, [formData])


  /* ---------- HANDLERS ---------- */
  const handleChange = (e) => {
    const { name, value } = e.target
    let cleaned = value


    if (name === "firstName" || name === "lastName") {
      cleaned = onlyLetters(value).slice(0, 30)
    }
    if (name === "idNumber") cleaned = onlyDigits(value, 8)
    if (name === "phone") cleaned = formatPhone(value)


    setFormData((prev) => ({ ...prev, [name]: cleaned }))
  }


  const handleNext = () => {
    if (isValid) {
      onUpdate(formData)
      onNext()
    }
  }


  /* ---------- RENDER ---------- */
  return (
    <div className="form-step fade-in">
      <h2 className="step-title">Información del propietario</h2>
      <p className="step-description">Por favor proporciona tu información personal</p>


      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="firstName">Nombre *</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Ingresa tu nombre"
            required
            maxLength={30}
          />
        </div>


        <div className="form-group">
          <label htmlFor="lastName">Apellido *</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Ingresa tu apellido"
            required
            maxLength={45}
          />
        </div>


        <div className="form-group">
          <label htmlFor="idNumber">DNI * </label>
          <input
            type="text"
            id="idNumber"
            name="idNumber"
            value={formData.idNumber}
            onChange={handleChange}
            placeholder="12345678"
            required
            maxLength={8}
            inputMode="numeric"
          />
        </div>


        <div className="form-group">
          <label htmlFor="phone">Teléfono *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="(011) 2345-6789"
            required
            maxLength={15} // formato incluye () y -
            inputMode="numeric"
          />
        </div>
      </div>


      <div className="form-actions">
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/")}
        >
          Atrás
        </button>
        <button className="btn btn-primary" onClick={handleNext} disabled={!isValid}>
          Siguiente
        </button>
      </div>
    </div>
  )
}

export default CreatorInfo