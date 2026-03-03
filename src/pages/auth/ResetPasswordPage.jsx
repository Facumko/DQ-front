import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { validatePasswordStrength } from "../../Api/Api";
import { FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import styles from "./ResetPasswordPage.module.css";

// TODO: importar cuando esté en el backend
// import { validateResetToken, resetPassword } from "../../Api/Api";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  // Estados del flujo
  const [tokenStatus, setTokenStatus]   = useState("validating"); // "validating" | "valid" | "invalid" | "expired"
  const [newPassword, setNewPassword]   = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ strength: "none", message: "", color: "" });
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState(false);

  // Validar token al montar
  useEffect(() => {
    if (!token) {
      setTokenStatus("invalid");
      return;
    }

    const validate = async () => {
      try {
        // TODO: reemplazar con llamada real
        // const result = await validateResetToken(token);
        // if (!result.valid) { setTokenStatus(result.expired ? "expired" : "invalid"); return; }

        // Simulación: token válido si tiene más de 10 caracteres
        await new Promise((r) => setTimeout(r, 800)); // simula latencia
        if (token.length > 10) {
          setTokenStatus("valid");
        } else {
          setTokenStatus("invalid");
        }
      } catch {
        setTokenStatus("invalid");
      }
    };

    validate();
  }, [token]);

  const handlePasswordChange = (value) => {
    setNewPassword(value);
    if (!value) {
      setPasswordStrength({ strength: "none", message: "", color: "" });
      return;
    }
    setPasswordStrength(validatePasswordStrength(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      // TODO: reemplazar con llamada real
      // await resetPassword({ token, newPassword });
      await new Promise((r) => setTimeout(r, 900)); // simula latencia
      setSuccess(true);
      setTimeout(() => navigate("/?login=true"), 3000);
    } catch (err) {
      setError("Ocurrió un error. El enlace puede haber expirado. Solicitá uno nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ── Pantalla: validando token ─────────────────────────────────────────────
  if (tokenStatus === "validating") {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.spinner} />
          <p className={styles.validatingText}>Verificando enlace...</p>
        </div>
      </div>
    );
  }

  // ── Pantalla: token inválido ──────────────────────────────────────────────
  if (tokenStatus === "invalid" || tokenStatus === "expired") {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <FaTimesCircle className={styles.errorIcon} />
          <h1 className={styles.title}>
            {tokenStatus === "expired" ? "Enlace expirado" : "Enlace inválido"}
          </h1>
          <p className={styles.subtitle}>
            {tokenStatus === "expired"
              ? "Este enlace de restablecimiento ya expiró. Los enlaces son válidos por 1 hora."
              : "Este enlace no es válido o ya fue utilizado."
            }
          </p>
          <button
            className={styles.primaryBtn}
            onClick={() => navigate("/?forgot=true")}
          >
            Solicitar un nuevo enlace
          </button>
        </div>
      </div>
    );
  }

  // ── Pantalla: éxito ───────────────────────────────────────────────────────
  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <FaCheckCircle className={styles.successIcon} />
          <h1 className={styles.title}>¡Contraseña actualizada!</h1>
          <p className={styles.subtitle}>
            Tu contraseña fue restablecida correctamente.<br />
            Serás redirigido al inicio de sesión en unos segundos.
          </p>
          <div className={styles.redirectBar}>
            <div className={styles.redirectProgress} />
          </div>
        </div>
      </div>
    );
  }

  // ── Pantalla: formulario de nueva contraseña ──────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* Logo */}
        <div className={styles.logoWrap}>
          <img src="/logoDQ.png" alt="Dónde Queda?" className={styles.logo} />
          <span className={styles.logoText}>Dónde Queda?</span>
        </div>

        <h1 className={styles.title}>Nueva contraseña</h1>
        <p className={styles.subtitle}>
          Elegí una contraseña segura para tu cuenta.
        </p>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Nueva contraseña */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Nueva contraseña</label>
            <div className={styles.passwordWrap}>
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={styles.input}
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowNew((p) => !p)}
                tabIndex={-1}
              >
                {showNew ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Barra de fortaleza */}
            {newPassword && (
              <div className={styles.strengthWrap}>
                <div className={styles.strengthBar}>
                  <div
                    className={styles.strengthFill}
                    style={{
                      width: passwordStrength.strength === "weak" ? "33%"
                        : passwordStrength.strength === "medium" ? "66%"
                        : passwordStrength.strength === "strong" ? "100%" : "0%",
                      background: passwordStrength.color,
                    }}
                  />
                </div>
                <span style={{ color: passwordStrength.color }} className={styles.strengthText}>
                  {passwordStrength.message}
                </span>
              </div>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Confirmar contraseña</label>
            <div className={styles.passwordWrap}>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onPaste={(e) => e.preventDefault()}
                placeholder="Repetí la contraseña"
                className={styles.input}
                disabled={loading}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowConfirm((p) => !p)}
                tabIndex={-1}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {confirmPassword && (
              <p className={styles.matchText} style={{ color: newPassword === confirmPassword ? "#16a34a" : "#dc2626" }}>
                {newPassword === confirmPassword ? "✓ Las contraseñas coinciden" : "✗ Las contraseñas no coinciden"}
              </p>
            )}
          </div>

          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
          >
            {loading ? <span className={styles.spinnerSmall} /> : "Guardar nueva contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;