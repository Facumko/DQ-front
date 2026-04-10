"use client"
import { useState, useEffect } from "react"
import { getCategories } from "../../Api/Api"
import LocationPicker from "../../components/LocationPicker/LocationPicker"
import "./FormStep.css"
import "./CategoryChips.css"

function BusinessInfo({ data, onUpdate, onNext, onBack }) {
  const [formData, setFormData] = useState({
    businessName:        data?.businessName        || "",
    businessDescription: data?.businessDescription || "",
    selectedCategories:  data?.selectedCategories  || [],
    businessAddress:     data?.businessAddress     || "",
    businessPhone:       data?.businessPhone       || "",
    instagram:           data?.instagram           || "",
    facebook:            data?.facebook            || "",
    website:             data?.website             || "",
    email:               data?.email               || "",
    location:            data?.location            || null,
  })

  const [categories, setCategories] = useState([])
  const [errors,     setErrors]     = useState({})
  const [isValid,    setIsValid]    = useState(false)
  const [isLoading,  setIsLoading]  = useState(true)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getCategories()
        setCategories(cats)
      } catch {
        setCategories([
          { idCategory: 1, name: "Restaurante" },
          { idCategory: 2, name: "Comercio Minorista" },
          { idCategory: 3, name: "Tecnología" },
          { idCategory: 4, name: "Salud" },
          { idCategory: 5, name: "Educación" },
          { idCategory: 6, name: "Entretenimiento" },
          { idCategory: 7, name: "Servicios Profesionales" },
          { idCategory: 8, name: "Otro" },
        ])
      } finally {
        setIsLoading(false)
      }
    }
    loadCategories()
  }, [])

  const formatPhone = (raw) => {
    const digits = raw.replace(/\D/g, "").slice(0, 10)
    if (digits.length === 10)
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    return digits
  }

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isValidUrl = (str) => {
    if (!str) return true
    try { new URL(str); return true } catch { return false }
  }
  const cleanBusinessName = (str) =>
    str.replace(/[^A-Za-z0-9\s&()/'.-]/g, "").slice(0, 50)

  useEffect(() => {
    const { businessName, businessDescription, email, instagram, facebook, website } = formData
    const newErrors = {}
    if (email     && !isValidEmail(email))   newErrors.email     = "Formato de correo inválido"
    if (instagram && !isValidUrl(instagram)) newErrors.instagram = "URL no válida"
    if (facebook  && !isValidUrl(facebook))  newErrors.facebook  = "URL no válida"
    if (website   && !isValidUrl(website))   newErrors.website   = "URL no válida"
    setErrors(newErrors)
    const hasError = Object.values(newErrors).some(Boolean)
    setIsValid(
      businessName.trim().length >= 3 &&
      businessDescription.trim().length >= 10 &&
      businessDescription.trim().length <= 300 &&
      !hasError
    )
  }, [formData])

  useEffect(() => {
    if (typeof onUpdate === 'function') onUpdate(formData)
  }, [formData, onUpdate])

  const handleChange = (e) => {
    const { name, value } = e.target
    let cleaned = value
    if (name === "businessName")        cleaned = cleanBusinessName(value)
    if (name === "businessDescription") cleaned = value.slice(0, 300)
    if (name === "businessAddress")     cleaned = value.slice(0, 80)
    if (name === "businessPhone")       cleaned = formatPhone(value)
    if (name === "email")               cleaned = value.slice(0, 60)
    if (["instagram", "facebook", "website"].includes(name)) cleaned = value.slice(0, 120)
    setFormData(prev => ({ ...prev, [name]: cleaned }))
  }

  const handleLocationChange = (loc) => {
    setFormData(prev => ({
      ...prev,
      location:        loc,
      businessAddress: loc?.address || prev.businessAddress,
    }))
  }

  const toggleCategory = (cat) => {
    setFormData(prev => {
      const already = prev.selectedCategories.some(c => c.idCategory === cat.idCategory)
      const updated = already
        ? prev.selectedCategories.filter(c => c.idCategory !== cat.idCategory)
        : [...prev.selectedCategories, cat]
      return { ...prev, selectedCategories: updated }
    })
  }

  const isCategorySelected = (cat) =>
    formData.selectedCategories.some(c => c.idCategory === cat.idCategory)

  const handleNext = () => {
    if (!isValid) {
      alert("Por favor completá todos los campos requeridos correctamente")
      return
    }
    onNext()
  }

  if (isLoading) {
    return (
      <div className="form-step fade-in">
        <div className="loading-spinner" />
        <p>Cargando categorías...</p>
      </div>
    )
  }

  return (
    <div className="form-step fade-in">
      <h2 className="step-title">Información del Negocio</h2>
      <p className="step-description">Contanos sobre tu negocio</p>

      <div className="form-grid">

        <div className="form-group full-width">
          <label htmlFor="businessName">Nombre del Negocio *</label>
          <input
            type="text"
            id="businessName"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            placeholder="Ingresá el nombre de tu negocio"
            maxLength={50}
          />
          <small className="field-note">Mínimo 3 caracteres</small>
        </div>

        <div className="form-group full-width">
          <label htmlFor="businessDescription">Descripción * (10–300 caracteres)</label>
          <textarea
            id="businessDescription"
            name="businessDescription"
            value={formData.businessDescription}
            onChange={handleChange}
            placeholder="Describí tu negocio, productos o servicios"
            rows="4"
            maxLength={300}
          />
          <div className="char-counter">{formData.businessDescription.length}/300</div>
        </div>

        {/* Categorías — chips multi-selección */}
        <div className="form-group full-width">
          <label>
            Categorías
            <span className="category-recommended-badge">Recomendado</span>
          </label>
          <p className="field-note category-hint">
            Seleccioná las categorías que mejor describan tu negocio. Podés elegir más de una.
          </p>
          <div className="category-chips-wrap">
            {categories.map(cat => (
              <button
                key={cat.idCategory}
                type="button"
                className={`category-chip ${isCategorySelected(cat) ? "category-chip--selected" : ""}`}
                onClick={() => toggleCategory(cat)}
              >
                {isCategorySelected(cat) && <span className="category-chip-check">✓</span>}
                {cat.name}
              </button>
            ))}
          </div>
          {formData.selectedCategories.length > 0 && (
            <p className="category-selected-count">
              {formData.selectedCategories.length} categoría{formData.selectedCategories.length !== 1 ? "s" : ""} seleccionada{formData.selectedCategories.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="optional-section full-width">
          <p className="optional-note">
            💡 Los campos opcionales pueden completarse más tarde desde tu perfil de negocio
          </p>
        </div>

        <div className="form-group full-width">
          <LocationPicker
            label="Ubicación del negocio"
            value={formData.location}
            onChange={handleLocationChange}
          />
        </div>

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
          {errors.email && <small className="error-message">{errors.email}</small>}
        </div>

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
          {errors.instagram && <small className="error-message">{errors.instagram}</small>}
        </div>

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
          {errors.facebook && <small className="error-message">{errors.facebook}</small>}
        </div>

        <div className="form-group">
          <label htmlFor="website">Sitio Web (opcional)</label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://www.tusitio.com"
            maxLength={120}
          />
          {errors.website && <small className="error-message">{errors.website}</small>}
        </div>

      </div>

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onBack}>Atrás</button>
        <button className="btn btn-primary" onClick={handleNext} disabled={!isValid}>
          Siguiente
        </button>
      </div>
    </div>
  )
}

export default BusinessInfo