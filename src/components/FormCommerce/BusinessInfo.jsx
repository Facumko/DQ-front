"use client"
import { useState, useEffect } from "react"
import "./FormStep.css"


function BusinessInfo({ data, onUpdate, onNext, onBack }) {
  /* ---------- ESTADO ---------- */
  const [formData, setFormData] = useState({
    businessName: data?.businessName || "",
    businessDescription: data?.businessDescription || "",
    category: data?.category || "",
    businessAddress: data?.businessAddress || "",
    businessPhone: data?.businessPhone || "",
    instagram: data?.instagram || "",
    facebook: data?.facebook || "",
    website: data?.website || "",
    email: data?.email || "",
  })


  /* Errores individuales */
  const [errors, setErrors] = useState({
    email: "",
    instagram: "",
    facebook: "",
    website: "",
  })


  /* ---------- HELPERS ---------- */
  const formatPhone = (raw) => {
    const digits = raw.replace(/\D/g, "").slice(0, 10)
    if (digits.length === 10)
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    return digits
  }


  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)


  const isValidUrl = (str) => {
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  }


  const cleanBusinessName = (str) =>
    str.replace(/[^A-Za-z0-9\s&/-]/g, "").slice(0, 50)


  /* ---------- VALIDACIÓN GENERAL ---------- */
  const [isValid, setIsValid] = useState(false)


  useEffect(() => {
    const { businessName, businessDescription, category, email, instagram, facebook, website } =
      formData


    const hasError =
      errors.email ||
      (instagram && errors.instagram) ||
      (facebook && errors.facebook) ||
      (website && errors.website)


    const ok =
      businessName.trim().length >= 3 &&
      businessDescription.trim().length >= 10 &&
      businessDescription.trim().length <= 300 &&
      category !== "" &&
      !hasError


    setIsValid(ok)
  }, [formData, errors])


  /* ---------- HANDLERS ---------- */
  const handleChange = (e) => {
    const { name, value } = e.target
    let cleaned = value


    /* Limpiezas / cortes */
    if (name === "businessName") cleaned = cleanBusinessName(value)
    if (name === "businessDescription") cleaned = value.slice(0, 300)
    if (name === "businessAddress") cleaned = value.slice(0, 80)
    if (name === "businessPhone") cleaned = formatPhone(value)
    if (name === "email") cleaned = value.slice(0, 60)
    if (["instagram", "facebook", "website"].includes(name))
      cleaned = value.slice(0, 120)


    /* Actualiza el campo */
    setFormData((prev) => ({ ...prev, [name]: cleaned }))


    /* Valida en paralelo */
    if (name === "email") {
      if (cleaned && !isValidEmail(cleaned))
        setErrors((e) => ({ ...e, email: "Formato de correo inválido" }))
      else setErrors((e) => ({ ...e, email: "" }))
    }


    if (name === "instagram") {
      if (cleaned && !isValidUrl(cleaned))
        setErrors((e) => ({ ...e, instagram: "URL no válida" }))
      else setErrors((e) => ({ ...e, instagram: "" }))
    }


    if (name === "facebook") {
      if (cleaned && !isValidUrl(cleaned))
        setErrors((e) => ({ ...e, facebook: "URL no válida" }))
      else setErrors((e) => ({ ...e, facebook: "" }))
    }


    if (name === "website") {
      if (cleaned && !isValidUrl(cleaned))
        setErrors((e) => ({ ...e, website: "URL no válida" }))
      else setErrors((e) => ({ ...e, website: "" }))
    }
  }


  const handleNext = () => {
    if (isValid) {
      onUpdate(formData)
      onNext()
    }
  }


  const categories = [
    "Restaurante",
    "Comercio Minorista",
    "Tecnología",
    "Salud",
    "Educación",
    "Entretenimiento",
    "Servicios Profesionales",
    "Otro",
  ]


  /* ---------- RENDER ---------- */
  return (
    <div className="form-step fade-in">
      <h2 className="step-title">Información del Negocio</h2>
      <p className="step-description">Cuéntanos sobre tu negocio</p>


      <div className="form-grid">
        {/* ----- Nombre ----- */}
        <div className="form-group full-width">
          <label htmlFor="businessName">Nombre del Negocio *</label>
          <input
            type="text"
            id="businessName"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            placeholder="Ingresa el nombre de tu negocio"
            required
            maxLength={50}
          />
        </div>


        {/* ----- Descripción ----- */}
        <div className="form-group full-width">
          <label htmlFor="businessDescription">
            Descripción del Negocio * (10-300 caracteres)
          </label>
          <textarea
            id="businessDescription"
            name="businessDescription"
            value={formData.businessDescription}
            onChange={handleChange}
            placeholder="Describe tu negocio"
            rows="4"
            required
            maxLength={300}
          />
          <div className="char-counter">
            {formData.businessDescription.length}/300
          </div>
        </div>


        {/* ----- Categoría ----- */}
        <div className="form-group full-width">
          <label htmlFor="category">Categoría *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>


        {/* ----- Nota campos opcionales ----- */}
        <div className="optional-section full-width">
          <p className="optional-note">
            💡 Los campos opcionales pueden completarse más tarde desde tu perfil
            de negocio
          </p>
        </div>


        {/* ----- Dirección ----- */}
        <div className="form-group">
          <label htmlFor="businessAddress">Dirección del Negocio</label>
          <input
            type="text"
            id="businessAddress"
            name="businessAddress"
            value={formData.businessAddress}
            onChange={handleChange}
            placeholder="Dirección del negocio"
            maxLength={80}
          />
        </div>


        {/* ----- Teléfono ----- */}
        <div className="form-group">
          <label htmlFor="businessPhone">Teléfono del Negocio</label>
          <input
            type="tel"
            id="businessPhone"
            name="businessPhone"
            value={formData.businessPhone}
            onChange={handleChange}
            placeholder="(011) 2345-6789"
            maxLength={15}
            inputMode="numeric"
          />
        </div>


        {/* ----- Email ----- */}
        <div className="form-group">
          <label htmlFor="email">Correo Electrónico del Negocio</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="ejemplo@dominio.com"
            maxLength={60}
          />
          {errors.email && (
            <small className="error-message">{errors.email}</small>
          )}
        </div>


        {/* ----- Instagram ----- */}
        <div className="form-group">
          <label htmlFor="instagram">Instagram (opcional)</label>
          <input
            type="url"
            id="instagram"
            name="instagram"
            value={formData.instagram}
            onChange={handleChange}
            placeholder="https://instagram.com/tu_usuario"
            maxLength={120}
          />
          {errors.instagram && (
            <small className="error-message">{errors.instagram}</small>
          )}
        </div>


        {/* ----- Facebook ----- */}
        <div className="form-group">
          <label htmlFor="facebook">Facebook (opcional)</label>
          <input
            type="url"
            id="facebook"
            name="facebook"
            value={formData.facebook}
            onChange={handleChange}
            placeholder="https://facebook.com/tu_pagina"
            maxLength={120}
          />
          {errors.facebook && (
            <small className="error-message">{errors.facebook}</small>
          )}
        </div>


        {/* ----- Sitio web ----- */}
        <div className="form-group">
          <label htmlFor="website">Sitio Web (opcional)</label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="www.tusitio.com"
            maxLength={120}
          />
          {errors.website && (
            <small className="error-message">{errors.website}</small>
          )}
        </div>
      </div>


      {/* ----- Botones ----- */}
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onBack}
        >
          Atrás
        </button>
        <button
          className="btn btn-primary"
          onClick={handleNext}
          disabled={!isValid}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}


export default BusinessInfo