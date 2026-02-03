"use client";
import "./Confirmation.css";
import { useNavigate } from "react-router-dom";

function Confirmation({ data, onSuccess, isSubmitting, onBack }) { // ✅ Agregar onBack
  const navigate = useNavigate();

  const planNames = {
    basic: "Básico",
    professional: "Profesional", 
    enterprise: "Empresarial",
  };

  const handleConfirm = () => {
    console.log("🟢 Botón Confirmar clickeado");
    if (onSuccess && !isSubmitting) {
      console.log("🟢 Ejecutando onSuccess...");
      onSuccess();
    } else {
      console.log("🔴 onSuccess no disponible o submitting:", { 
        hasOnSuccess: !!onSuccess, 
        isSubmitting 
      });
    }
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="confirmation fade-in">
      <div className="success-icon">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="40" fill="#8B1538" fillOpacity="0.1" />
          <circle cx="40" cy="40" r="32" fill="#8B1538" />
          <path d="M28 40L36 48L52 32" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2 className="success-title">¡Revisa tu información!</h2>
      <p className="success-description">
        Por favor confirma que todos los datos son correctos antes de crear tu negocio.
      </p>

      <div className="business-preview">
        <h3 className="preview-title">Resumen del Negocio</h3>

        <div className="preview-content">
          <div className="preview-section">
            <h4>Información del Propietario</h4>
            <div className="preview-item">
              <span className="preview-label">Nombre:</span>
              <span className="preview-value">{data?.firstName} {data?.lastName}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">DNI:</span>
              <span className="preview-value">{data?.idNumber || "No especificado"}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Teléfono:</span>
              <span className="preview-value">{data?.phone || "No especificado"}</span>
            </div>
          </div>

          <div className="preview-section">
            <h4>Información del Negocio</h4>
            <div className="preview-item">
              <span className="preview-label">Nombre:</span>
              <span className="preview-value">{data?.businessName || "Sin nombre"}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Categoría:</span>
              <span className="preview-value">{data?.category || "Sin categoría"}</span>
            </div>
            <div className="preview-item full-width">
              <span className="preview-label">Descripción:</span>
              <span className="preview-value">{data?.businessDescription || "Sin descripción"}</span>
            </div>
          </div>

          <div className="preview-section">
            <h4>Contacto y Plan</h4>
            <div className="preview-item">
              <span className="preview-label">Plan:</span>
              <span className="preview-value plan-badge">{planNames[data?.selectedPlan] || "Básico"}</span>
            </div>
            {data?.email && (
              <div className="preview-item">
                <span className="preview-label">Email:</span>
                <span className="preview-value">{data.email}</span>
              </div>
            )}
            {data?.businessPhone && (
              <div className="preview-item">
                <span className="preview-label">Teléfono Negocio:</span>
                <span className="preview-value">{data.businessPhone}</span>
              </div>
            )}
          </div>

          {(data?.website || data?.instagram || data?.facebook) && (
            <div className="preview-section">
              <h4>Redes Sociales</h4>
              <div className="social-links">
                {data?.website && (
                  <div className="preview-item">
                    <span className="preview-label">Sitio Web:</span>
                    <span className="preview-value">{data.website}</span>
                  </div>
                )}
                {data?.instagram && (
                  <div className="preview-item">
                    <span className="preview-label">Instagram:</span>
                    <span className="preview-value">{data.instagram}</span>
                  </div>
                )}
                {data?.facebook && (
                  <div className="preview-item">
                    <span className="preview-label">Facebook:</span>
                    <span className="preview-value">{data.facebook}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="confirmation-actions">
        <button 
          className="btn btn-primary" 
          onClick={handleConfirm} // ✅ Usar handleConfirm en lugar de onSuccess directo
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creando Negocio..." : "✅ Confirmar y Crear Negocio"}
        </button>
        
        {/* ✅ Botón para volver atrás */}
        <button 
          className="btn btn-secondary" 
          onClick={onBack}
          disabled={isSubmitting}
        >
          Atrás
        </button>
        
        {/* ✅ Botón cancelar */}
        <button 
          className="btn btn-secondary" 
          onClick={handleGoHome}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
      </div>

      {isSubmitting && (
        <div className="submitting-overlay">
          <div className="loading-spinner large"></div>
          <p>Creando tu negocio, por favor espera...</p>
        </div>
      )}

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px', fontSize: '12px' }}>
          <strong>Debug Confirmation:</strong><br/>
          Business Name: {data?.businessName}<br/>
          Has onSuccess: {!!onSuccess}<br/>
          Is Submitting: {isSubmitting ? 'Sí' : 'No'}
        </div>
      )}
    </div>
  );
}

export default Confirmation;