"use client";
import "./Confirmation.css";
import { useNavigate } from "react-router-dom";

function Confirmation({ data, onSuccess, isSubmitting }) {
  const navigate = useNavigate();

  const planNames = {
    basic: "Básico",
    professional: "Profesional",
    enterprise: "Empresarial",
  };

  const handleGoToProfile = () => {
    onSuccess?.();
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
        <h3 className="preview-title">Vista Previa del Perfil de Negocio</h3>

        <div className="preview-content">
          <div className="preview-item">
            <span className="preview-label">Nombre del Negocio:</span>
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

          <div className="preview-item">
            <span className="preview-label">Plan de Suscripción:</span>
            <span className="preview-value plan-badge">{planNames[data?.selectedPlan] || "Sin plan"}</span>
          </div>

          {data?.businessPhone && (
            <div className="preview-item">
              <span className="preview-label">Teléfono:</span>
              <span className="preview-value">{data.businessPhone}</span>
            </div>
          )}

          {data?.email && (
            <div className="preview-item">
              <span className="preview-label">Correo:</span>
              <span className="preview-value">{data.email}</span>
            </div>
          )}

          {data?.website && (
            <div className="preview-item">
              <span className="preview-label">Sitio Web:</span>
              <span className="preview-value">{data.website}</span>
            </div>
          )}

          <div className="social-links">
            {data?.instagram && (
              <span className="social-link">Instagram: {data.instagram}</span>
            )}
            {data?.facebook && (
              <span className="social-link">Facebook: {data.facebook}</span>
            )}
          </div>
        </div>
      </div>

      <div className="confirmation-actions">
        <button 
          className="btn btn-primary" 
          onClick={handleGoToProfile}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creando..." : "Confirmar y Crear Negocio"}
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={handleGoHome}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
      </div>

      {isSubmitting && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <div className="loading-spinner" />
          <p style={{ color: '#666', marginTop: '10px' }}>Creando tu negocio...</p>
        </div>
      )}
    </div>
  );
}

export default Confirmation;