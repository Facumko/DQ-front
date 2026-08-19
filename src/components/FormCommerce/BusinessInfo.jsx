"use client"
import { useState, useEffect, useMemo } from "react"
import { getCategories, getSubcategoryTags } from "../../Api/Api"
import LocationPicker from "../../components/LocationPicker/LocationPicker"
import "./FormStep.css"
import "./CategoryChips.css"

function BusinessInfo({ data, onUpdate, onNext, onBack }) {
  const [formData, setFormData] = useState({
    businessName:        data?.businessName        || "",
    businessDescription: data?.businessDescription || "",
    selectedCategories:  data?.selectedCategories  || [],
    selectedSubcategories: data?.selectedSubcategories || [],
    businessAddress:     data?.businessAddress     || "",
    businessPhone:       data?.businessPhone       || "",
    instagram:           data?.instagram           || "",
    facebook:            data?.facebook            || "",
    website:             data?.website             || "",
    email:               data?.email               || "",
    location:            data?.location            || null,
  })

  const [categories, setCategories] = useState([])
  // Catálogo COMPLETO de subcategorías (todas las categorías mezcladas),
  // viene de /etiqueta/subcategoria (endpoint dedicado del back, ya trae
  // idCategory plano en cada tag). El agrupamiento por categoría se hace
  // client-side en subcategoriesByCategory (más abajo), así no hace falta
  // pegarle de nuevo al back cada vez que cambia la categoría elegida.
  const [allSubcategoryTags, setAllSubcategoryTags] = useState([])
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

  useEffect(() => {
    getSubcategoryTags()
      .then(tags => setAllSubcategoryTags(Array.isArray(tags) ? tags : []))
      .catch(() => setAllSubcategoryTags([])) // opcional: si falla, simplemente no se muestran
  }, [])

  // Agrupamos una sola vez por idCategory (Map), en vez de filtrar el
  // catálogo completo cada vez que cambia la categoría seleccionada.
  const subcategoriesByCategory = useMemo(() => {
    const map = new Map()
    for (const tag of allSubcategoryTags) {
      const key = String(tag.idCategory)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(tag)
    }
    return map
  }, [allSubcategoryTags])

  // Solo las subcategorías de la categoría elegida (si no hay categoría
  // elegida todavía, no mostramos ninguna — evita la "sopa" de subcategorías
  // de rubros que no tienen nada que ver).
  const selectedCategoryId = formData.selectedCategories[0]?.idCategory
  const subcategoryTags = useMemo(() => {
    if (!selectedCategoryId) return []
    return subcategoriesByCategory.get(String(selectedCategoryId)) ?? []
  }, [subcategoriesByCategory, selectedCategoryId])

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
    str.replace(/[^A-Za-z0-9\s&()/'.-]/g, "").slice(0, 100)

  useEffect(() => {
    const { businessName, businessDescription, email, instagram, facebook, website, businessPhone } = formData
    const newErrors = {}
    if (email     && !isValidEmail(email))   newErrors.email     = "Formato de correo inválido"
    if (instagram && !isValidUrl(instagram)) newErrors.instagram = "URL no válida"
    if (facebook  && !isValidUrl(facebook))  newErrors.facebook  = "URL no válida"
    if (website   && !isValidUrl(website))   newErrors.website   = "URL no válida"
    const phoneDigits = businessPhone.replace(/\D/g, "")
    if (phoneDigits && phoneDigits.length < 10) newErrors.businessPhone = "Ingresá el teléfono completo (10 dígitos)"
    setErrors(newErrors)
    const hasError = Object.values(newErrors).some(Boolean)
    setIsValid(
      businessName.trim().length >= 3 &&
      businessDescription.trim().length >= 10 &&
      businessDescription.trim().length <= 500 &&
      formData.selectedCategories.length === 1 &&
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
    if (name === "businessDescription") cleaned = value.slice(0, 500)
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

  const selectCategory = (cat) => {
    setFormData(prev => {
      const already = prev.selectedCategories.some(c => c.idCategory === cat.idCategory)
      // Click de nuevo sobre la ya seleccionada = deselecciona. Click sobre otra = la reemplaza.
      // Al cambiar de categoría, las subcategorías ya elegidas quedan obsoletas
      // (pertenecen a la categoría anterior), así que se limpian.
      return {
        ...prev,
        selectedCategories: already ? [] : [cat],
        selectedSubcategories: [],
      }
    })
  }

  const isCategorySelected = (cat) =>
    formData.selectedCategories.some(c => c.idCategory === cat.idCategory)

  const toggleSubcategory = (tag) => {
    setFormData(prev => {
      const already = prev.selectedSubcategories.some(t => t.nameTag === tag.nameTag)
      return {
        ...prev,
        selectedSubcategories: already
          ? prev.selectedSubcategories.filter(t => t.nameTag !== tag.nameTag)
          : [...prev.selectedSubcategories, tag],
      }
    })
  }

  const isSubcategorySelected = (tag) =>
    formData.selectedSubcategories.some(t => t.nameTag === tag.nameTag)

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
            maxLength={100}
          />
          <small className="field-note">Mínimo 3 caracteres</small>
        </div>

        <div className="form-group full-width">
          <label htmlFor="businessDescription">Descripción * (10–500 caracteres)</label>
          <textarea
            id="businessDescription"
            name="businessDescription"
            value={formData.businessDescription}
            onChange={handleChange}
            placeholder="Describí tu negocio, productos o servicios"
            rows="4"
            maxLength={500}
          />
          <div className="char-counter">{formData.businessDescription.length}/500</div>
        </div>

        {/* Categoría — selección única */}
        <div className="form-group full-width">
          <label>
            Categoría *
          </label>
          <p className="field-note category-hint">
            Seleccioná la categoría que mejor describa tu negocio.
          </p>
          <div className="category-chips-wrap">
            {categories.map(cat => (
              <button
                key={cat.idCategory}
                type="button"
                className={`category-chip ${isCategorySelected(cat) ? "category-chip--selected" : ""}`}
                onClick={() => selectCategory(cat)}
              >
                {isCategorySelected(cat) && <span className="category-chip-check">✓</span>}
                {cat.name}
              </button>
            ))}
          </div>
          {formData.selectedCategories.length === 0 && (
            <p className="field-note">Elegí una categoría para continuar</p>
          )}
        </div>

        {/* Subcategorías — selección múltiple, opcional. Depende de la categoría elegida */}
        {selectedCategoryId && subcategoryTags.length > 0 && (
          <div className="form-group full-width">
            <label>Subcategorías <span className="field-note" style={{ display: "inline", fontWeight: 400 }}>(opcional, podés elegir varias)</span></label>
            <div className="category-chips-wrap">
              {subcategoryTags.map(tag => (
                <button
                  key={tag.nameTag}
                  type="button"
                  className={`category-chip ${isSubcategorySelected(tag) ? "category-chip--selected" : ""}`}
                  onClick={() => toggleSubcategory(tag)}
                >
                  {isSubcategorySelected(tag) && <span className="category-chip-check">✓</span>}
                  {tag.nameTag}
                </button>
              ))}
            </div>
          </div>
        )}

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
          <label htmlFor="businessPhone">Teléfono del Negocio *</label>
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
          {errors.businessPhone && <small className="error-message">{errors.businessPhone}</small>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Correo Electrónico del Negocio *</label>
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