import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaArrowLeft, FaTimes } from "react-icons/fa";
import "./Confirmation.css";
import "./FormStep.css";

const PLAN_NAMES = {
  basic:   "Básico — Punto de Encuentro",
  mid:     "Intermedio — Lugar en el Mapa",
  premium: "Premium — Referente de la Ciudad",
};

const PLAN_COLORS = {
  basic:   { color: "#0369a1", bg: "#e0f2fe" },
  mid:     { color: "#b45309", bg: "#fef3c7" },
  premium: { color: "#9d174d", bg: "#fce7f3" },
};

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="confirm-row">
      <span className="confirm-label">{label}</span>
      <span className="confirm-value">{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="confirm-section">
      <h4 className="confirm-section-title">{title}</h4>
      {children}
    </div>
  );
}

function Confirmation({ data, onSuccess, isSubmitting, onBack }) {
  const navigate = useNavigate();

  const planColor = PLAN_COLORS[data?.selectedPlan] || PLAN_COLORS.basic;

  return (
    <div className="form-step fade-in">
      <div className="confirm-header">
        <FaCheckCircle className="confirm-header-icon" />
        <div>
          <h2 className="step-title" style={{ marginBottom: 4 }}>Revisá tu información</h2>
          <p className="step-description" style={{ marginBottom: 0 }}>
            Confirmá que todos los datos son correctos antes de crear tu negocio.
          </p>
        </div>
      </div>

      <div className="confirm-preview">

        {/* Plan contratado */}
        <Section title="Plan contratado">
          <div className="confirm-plan-badge" style={{ background: planColor.bg, color: planColor.color }}>
            {PLAN_NAMES[data?.selectedPlan] || "—"}
          </div>
        </Section>

        {/* Propietario */}
        <Section title="Datos del propietario">
          <Row label="Nombre"   value={`${data?.firstName || ""} ${data?.lastName || ""}`.trim() || null} />
          <Row label="DNI"      value={data?.idNumber} />
          <Row label="Teléfono" value={data?.phone} />
        </Section>

        {/* Negocio */}
        <Section title="Datos del negocio">
          <Row label="Nombre"      value={data?.businessName} />
          <Row label="Categoría"   value={data?.category} />
          <Row label="Descripción" value={data?.businessDescription} />
          <Row label="Dirección"   value={data?.businessAddress} />
          <Row label="Teléfono"    value={data?.businessPhone} />
          <Row label="Email"       value={data?.email} />
        </Section>

        {/* Redes — solo si hay algo */}
        {(data?.website || data?.instagram || data?.facebook) && (
          <Section title="Redes y web">
            <Row label="Sitio web"  value={data?.website} />
            <Row label="Instagram"  value={data?.instagram} />
            <Row label="Facebook"   value={data?.facebook} />
          </Section>
        )}

      </div>

      <div className="form-actions">
        <button
          className="btn btn-secondary"
          onClick={onBack}
          disabled={isSubmitting}
        >
          <FaArrowLeft style={{ marginRight: 6 }} /> Atrás
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => navigate("/")}
          disabled={isSubmitting}
        >
          <FaTimes style={{ marginRight: 6 }} /> Cancelar
        </button>

        <button
          className="btn btn-primary"
          onClick={onSuccess}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <><span className="loading-spinner small" style={{ marginRight: 8 }} /> Creando negocio...</>
          ) : (
            "Confirmar y crear negocio"
          )}
        </button>
      </div>
    </div>
  );
}

export default Confirmation;