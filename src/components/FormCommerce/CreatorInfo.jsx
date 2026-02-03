"use client"
import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { UserContext } from "../../pages/UserContext"
import { getUserById, updateUser } from "../../Api/Api"
import "./FormStep.css"

function CreatorInfo({ data, onUpdate, onNext, onBack }) {
  const navigate = useNavigate()
  const { user } = useContext(UserContext)
  const [formData, setFormData] = useState({
    firstName: data?.firstName || "",
    lastName: data?.lastName || "",
    idNumber: data?.idNumber || "",
    phone: data?.phone || "",
  })
  const [isValid, setIsValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoadedUser, setHasLoadedUser] = useState(false) // ✅ Nueva bandera

  /* ---------- CARGA DE DATOS DEL USUARIO ---------- */
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id_user || hasLoadedUser) {
        console.log("❌ No hay usuario o ya se cargó")
        return
      }

      try {
        setIsLoading(true)
        console.log("🔍 Cargando datos del usuario ID:", user.id_user)
        const userData = await getUserById(user.id_user)
        
        console.log("📋 Datos del usuario recibidos:", userData)
        
        // Actualizar el formulario con datos del usuario
        const newFormData = {
          firstName: userData.name || "",
          lastName: userData.lastname || "",
          idNumber: userData.idNumber || "",
          phone: userData.phone || "",
        }
        
        setFormData(newFormData)
        setHasLoadedUser(true) // ✅ Marcar como cargado
        
        // Solo actualizar padre si hay datos nuevos
        if (userData.name || userData.lastname) {
          onUpdate(newFormData)
        }

      } catch (error) {
        console.error("❌ Error cargando usuario:", error)
        setHasLoadedUser(true) // ✅ Marcar como cargado incluso en error
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [user, onUpdate, hasLoadedUser]) // ✅ Agregar hasLoadedUser a dependencias

  /* ---------- HELPERS ---------- */
  const onlyLetters = (str) => str.replace(/[^A-Za-zÀ-ÿ\s]/g, "")
  const onlyDigits = (str, len) => str.replace(/\D/g, "").slice(0, len)

  const formatPhone = (raw) => {
    const digits = raw.replace(/\D/g, "").slice(0, 10)
    if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    return digits
  }

  /* ---------- VALIDACIÓN CORREGIDA ---------- */
  useEffect(() => {
    const firstName = formData?.firstName?.trim() || ""
    const lastName = formData?.lastName?.trim() || ""
    const idNumber = formData?.idNumber || ""
    const phone = formData?.phone || ""

    // ✅ VALIDACIÓN CORREGIDA: DNI 7-8 dígitos, teléfono 10-11 dígitos
    const ok =
      firstName.length >= 2 &&
      lastName.length >= 2 &&
      idNumber.length >= 7 && // Mínimo 7 dígitos para DNI
      idNumber.length <= 8 && // Máximo 8 dígitos para DNI
      phone.replace(/\D/g, "").length >= 10 && // Mínimo 10 dígitos
      phone.replace(/\D/g, "").length <= 11   // Máximo 11 dígitos

    console.log("✅ Validación paso 1 CORREGIDA:", { 
      firstName, 
      lastName, 
      idNumber, 
      phoneDigits: phone.replace(/\D/g, "").length,
      isValid: ok 
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
    if (name === "idNumber") cleaned = onlyDigits(value, 8) // Máximo 8 dígitos
    if (name === "phone") cleaned = formatPhone(value)

    const newFormData = { ...formData, [name]: cleaned }
    setFormData(newFormData)
    
    // ✅ Solo actualizar padre cuando el usuario edita manualmente
    if (hasLoadedUser) {
      onUpdate(newFormData)
    }
  }

  const handleNext = async () => {
    if (!isValid || !user?.id_user) {
      console.log("❌ No se puede avanzar:", { isValid, userId: user?.id_user })
      alert("Por favor completa todos los campos requeridos correctamente")
      return
    }

    try {
      // Verificar si hay datos nuevos para actualizar
      const userData = await getUserById(user.id_user)
      const updates = {}
      
      if (!userData.phone && formData.phone) updates.phone = formData.phone
      if (!userData.idNumber && formData.idNumber) updates.idNumber = formData.idNumber

      if (Object.keys(updates).length > 0) {
        console.log("📝 Actualizando datos del usuario:", updates)
        await updateUser(user.id_user, updates)
      }

      // Pasar al siguiente paso
      console.log("➡️ Avanzando al paso 2 con datos:", formData)
      onNext()

    } catch (error) {
      console.error("❌ Error actualizando usuario:", error)
      // Continuar aunque falle la actualización
      onNext()
    }
  }

  /* ---------- RENDER ---------- */
  if (isLoading) {
    return (
      <div className="form-step fade-in">
        <div className="loading-spinner"></div>
        <p>Cargando tus datos...</p>
      </div>
    )
  }

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
          {user?.name && <small className="field-note">✓ Precargado desde tu cuenta</small>}
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
          {user?.lastname && <small className="field-note">✓ Precargado desde tu cuenta</small>}
        </div>

        <div className="form-group">
          <label htmlFor="idNumber">DNI *</label>
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
          <small className="field-note">7 u 8 dígitos sin puntos</small>
        </div>

        <div className="form-group">
          <label htmlFor="phone">Teléfono *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="(364) 441-2345"
            required
            maxLength={15}
            inputMode="numeric"
          />
          <small className="field-note">10 u 11 dígitos (con código de área)</small>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={() => navigate("/")}>
          Cancelar
        </button>
        <button className="btn btn-primary" onClick={handleNext} disabled={!isValid}>
          Siguiente
        </button>
      </div>

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px', fontSize: '12px' }}>
          <strong>Debug:</strong> 
          User ID: {user?.id_user} | 
          Valid: {isValid ? 'Sí' : 'No'} | 
          Loaded: {hasLoadedUser ? 'Sí' : 'No'} | 
          Name: {formData.firstName} {formData.lastName}
        </div>
      )}
    </div>
  )
}

export default CreatorInfo