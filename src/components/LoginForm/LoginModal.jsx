import { useState, useContext, useEffect, useRef } from "react";
import { UserContext } from "../../pages/UserContext";
import { validateEmail, validatePasswordStrength } from "../../Api/Api";
import "./LoginModal.css";
import { FaEye, FaEyeSlash, FaGoogle, FaFacebook, FaCheckCircle, FaArrowLeft } from "react-icons/fa";

// Pasos:
// "email"     → ingresá tu email
// "choose"    → ¿tenés cuenta? (temporal hasta tener checkEmailExists)
// "login"     → email existe → contraseña
// "register"  → email nuevo  → crear contraseña
// "forgot"    → olvidé contraseña
// "resetSent" → enlace enviado

export default function LoginModal({ onClose }) {
  const { login, register, loading, error, clearError, isLocked } = useContext(UserContext);

  const [step,  setStep]  = useState("email");
  const [email, setEmail] = useState("");
  const [emailValidation, setEmailValidation] = useState({ valid: null, message: "" });

  // Login
  const [loginPassword,     setLoginPassword]     = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register
  const [registerPassword,     setRegisterPassword]     = useState("");
  const [confirmPassword,      setConfirmPassword]      = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword,  setShowConfirmPassword]  = useState(false);
  const [passwordStrength,     setPasswordStrength]     = useState({ strength: "none", message: "", color: "" });

  // Reset
  const [resetEmail, setResetEmail] = useState("");

  // Cooldown
  const COOLDOWN_SECS = 60;
  const MAX_RESENDS   = 3;
  const LS_KEY        = (e) => `dq_reset_${e}`;

  const getPersistedState = (em) => {
    if (!em) return { count: 0, secondsLeft: 0 };
    try {
      const raw = localStorage.getItem(LS_KEY(em));
      if (!raw) return { count: 0, secondsLeft: 0 };
      const { count, lastSentAt } = JSON.parse(raw);
      const secondsLeft = Math.max(0, COOLDOWN_SECS - Math.floor((Date.now() - lastSentAt) / 1000));
      return { count, secondsLeft };
    } catch { return { count: 0, secondsLeft: 0 }; }
  };

  const persistSend = (em) => {
    const { count } = getPersistedState(em);
    localStorage.setItem(LS_KEY(em), JSON.stringify({ count: count + 1, lastSentAt: Date.now() }));
  };

  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount,    setResendCount]    = useState(0);
  const [localError,     setLocalError]     = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const emailRef    = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    if (step === "email"    && emailRef.current)    emailRef.current.focus();
    if ((step === "login" || step === "register") && passwordRef.current) passwordRef.current.focus();
  }, [step]);

  useEffect(() => { if (localError) setLocalError(""); }, [email, loginPassword, registerPassword, confirmPassword]);
  useEffect(() => { return () => { if (clearError) clearError(); }; }, [clearError]);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  useEffect(() => {
    if (successMessage) { const t = setTimeout(() => setSuccessMessage(""), 3000); return () => clearTimeout(t); }
  }, [successMessage]);

  useEffect(() => {
    if (step === "resetSent" && resetEmail) {
      const { count, secondsLeft } = getPersistedState(resetEmail);
      setResendCount(count);
      setResendCooldown(secondsLeft);
    }
  }, [step, resetEmail]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const iv = setInterval(() => {
      setResendCooldown(p => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(iv);
  }, [resendCooldown]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleEmailChange = (val) => {
    setEmail(val);
    if (!val) { setEmailValidation({ valid: null, message: "" }); return; }
    const ok = validateEmail(val);
    setEmailValidation({ valid: ok, message: ok ? "✓ Email válido" : "✗ Email inválido" });
  };

  const handlePasswordChange = (val) => {
    setRegisterPassword(val);
    if (!val) { setPasswordStrength({ strength: "none", message: "", color: "" }); return; }
    setPasswordStrength(validatePasswordStrength(val));
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setLocalError("");
    if (!email.trim())         { setLocalError("Por favor ingresá tu email"); return; }
    if (!validateEmail(email)) { setLocalError("Por favor ingresá un email válido"); return; }
    // TODO: const exists = await checkEmailExists(email);
    // if (exists) setStep("login"); else setStep("register");
    setStep("choose");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError("");
    if (clearError) clearError();
    if (!loginPassword.trim()) { setLocalError("Por favor ingresá tu contraseña"); return; }
    const result = await login(email, loginPassword);
    if (result.success) { setSuccessMessage("¡Bienvenido de vuelta!"); setTimeout(() => onClose(), 1500); }
    else setLocalError(result.error);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError("");
    if (clearError) clearError();
    if (!registerPassword.trim() || !confirmPassword.trim()) { setLocalError("Por favor completá todos los campos"); return; }
    if (registerPassword !== confirmPassword) { setLocalError("Las contraseñas no coinciden"); return; }
    if (registerPassword.length < 6) { setLocalError("La contraseña debe tener al menos 6 caracteres"); return; }
    const result = await register({ email, password: registerPassword });
    if (result.success) { setSuccessMessage("¡Cuenta creada exitosamente! ✅"); setTimeout(() => onClose(), 1500); }
    else setLocalError(result.error);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLocalError("");
    if (!resetEmail.trim())         { setLocalError("Por favor ingresá tu correo"); return; }
    if (!validateEmail(resetEmail)) { setLocalError("Por favor ingresá un email válido"); return; }
    if (resendCount >= MAX_RESENDS) { setLocalError("Alcanzaste el límite de reenvíos. Esperá unos minutos."); return; }
    try {
      // TODO: await requestPasswordReset(resetEmail);
      persistSend(resetEmail);
      const { count, secondsLeft } = getPersistedState(resetEmail);
      setResendCount(count); setResendCooldown(secondsLeft);
      setStep("resetSent");
    } catch { setLocalError("Ocurrió un error. Intentá de nuevo más tarde."); }
  };

  const handleSocialLogin = (provider) => {
    // TODO: window.location.href = `/oauth2/authorization/${provider.toLowerCase()}`;
    setLocalError(`${provider} estará disponible próximamente.`);
  };

  // ── Sub-componentes ───────────────────────────────────────────────────────
  const TermsNotice = () => (
    <p className="terms-notice">
      Al continuar, aceptás la{" "}
      <a href="/politica-de-privacidad" target="_blank" rel="noopener noreferrer" className="terms-link">Política de privacidad</a>
      {" "}y los{" "}
      <a href="/terminos-de-uso" target="_blank" rel="noopener noreferrer" className="terms-link">Términos de uso</a>
      {" "}de Dónde Queda.
    </p>
  );

  const StepHeader = ({ onBack, title, subtitle }) => (
    <div className="step-header">
      {onBack && (
        <button className="back-btn" onClick={onBack} type="button" aria-label="Volver">
          <FaArrowLeft />
        </button>
      )}
      <div>
        {title    && <h2 className="modal-title">{title}</h2>}
        {subtitle && <p className="modal-email-chip">{subtitle}</p>}
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>

        {/* Logo */}
        <div className="modal-logo">
          <img src="/logoDQ.png" alt="Dónde Queda" className="logo-img" />
          <span className="logo-text">Dónde Queda?</span>
        </div>

        {/* Banners */}
        {successMessage && (
          <div className="success-banner"><FaCheckCircle /> {successMessage}</div>
        )}
        {(error || localError) && (
          <div className="error-message">{localError || error}</div>
        )}

        {/* ══ PASO: EMAIL ══════════════════════════════ */}
        {step === "email" && (
          <>
            <h2 className="modal-title">Bienvenido</h2>
            <p className="modal-subtitle">Ingresá tu email o continuá con una red social</p>

            <div className="social-section">
              <button type="button" className="social-btn-full google" onClick={() => handleSocialLogin("Google")}>
                <FaGoogle className="social-icon" /> Continuar con Google
              </button>
              <button type="button" className="social-btn-full facebook" onClick={() => handleSocialLogin("Facebook")}>
                <FaFacebook className="social-icon" /> Continuar con Facebook
              </button>
            </div>

            <div className="separator">o</div>

            <form onSubmit={handleEmailSubmit} className="modal-form">
              <div className="input-group">
                <input
                  ref={emailRef}
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`modal-input ${emailValidation.valid === true ? "valid" : emailValidation.valid === false ? "invalid" : ""}`}
                />
                {email && (
                  <span className={`validation-icon ${emailValidation.valid ? "valid" : "invalid"}`}>
                    {emailValidation.message}
                  </span>
                )}
              </div>
              <button type="submit" className="modal-button login-btn" disabled={loading || !emailValidation.valid}>
                Continuar
              </button>
            </form>

            <TermsNotice />
          </>
        )}

        {/* ══ PASO: CHOOSE (temporal) ══════════════════ */}
        {step === "choose" && (
          <>
            <StepHeader onBack={() => setStep("email")} title="¿Cómo querés continuar?" subtitle={email} />

            <div className="choose-actions">
              <button type="button" className="choose-btn" onClick={() => setStep("login")}>
                <div className="choose-btn-text">
                  <span className="choose-btn-title">Iniciar sesión</span>
                  <span className="choose-btn-sub">Ya tengo una cuenta</span>
                </div>
                <span className="choose-btn-arrow">→</span>
              </button>
              <button type="button" className="choose-btn" onClick={() => setStep("register")}>
                <div className="choose-btn-text">
                  <span className="choose-btn-title">Crear cuenta</span>
                  <span className="choose-btn-sub">Es mi primera vez en Dónde Queda</span>
                </div>
                <span className="choose-btn-arrow">→</span>
              </button>
            </div>

            <TermsNotice />
          </>
        )}

        {/* ══ PASO: LOGIN ══════════════════════════════ */}
        {step === "login" && (
          <>
            <StepHeader onBack={() => setStep("email")} title="Iniciá sesión" subtitle={email} />

            <form onSubmit={handleLogin} className="modal-form">
              <div className="password-container">
                <input
                  ref={passwordRef}
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="modal-input password-input"
                  disabled={loading || isLocked?.locked}
                />
                <span className="toggle-password" onClick={() => setShowLoginPassword(!showLoginPassword)}>
                  {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <a href="#" className="forgot-password" onClick={(e) => { e.preventDefault(); setResetEmail(email); setStep("forgot"); }}>
                Olvidé mi contraseña
              </a>

              <button type="submit" className="modal-button login-btn" disabled={loading || isLocked?.locked}>
                {loading ? <span className="spinner" /> : "Iniciar sesión"}
              </button>
            </form>

            <TermsNotice />
          </>
        )}

        {/* ══ PASO: REGISTER ══════════════════════════ */}
        {step === "register" && (
          <>
            <StepHeader onBack={() => setStep("email")} title="Creá tu cuenta" subtitle={email} />

            <form onSubmit={handleRegister} className="modal-form">
              <div className="password-container">
                <input
                  ref={passwordRef}
                  type={showRegisterPassword ? "text" : "password"}
                  placeholder="Creá una contraseña"
                  value={registerPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="modal-input password-input"
                  disabled={loading}
                />
                <span className="toggle-password" onClick={() => setShowRegisterPassword(!showRegisterPassword)}>
                  {showRegisterPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              {registerPassword && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className={`strength-fill ${passwordStrength.strength}`}
                      style={{
                        width: passwordStrength.strength === "weak" ? "33%" : passwordStrength.strength === "medium" ? "66%" : "100%",
                        backgroundColor: passwordStrength.color,
                      }}
                    />
                  </div>
                  <span className="strength-text" style={{ color: passwordStrength.color }}>{passwordStrength.message}</span>
                </div>
              )}

              <div className="password-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmá tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  className="modal-input password-input"
                  disabled={loading}
                />
                <span className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              {confirmPassword && (
                <p className="password-match" style={{ color: registerPassword === confirmPassword ? "#00cc66" : "#ff4444" }}>
                  {registerPassword === confirmPassword ? "✓ Las contraseñas coinciden" : "✗ Las contraseñas no coinciden"}
                </p>
              )}

              <button
                type="submit"
                className="modal-button register-btn"
                disabled={loading || !registerPassword || !confirmPassword || registerPassword !== confirmPassword}
              >
                {loading ? <span className="spinner" /> : "Crear cuenta"}
              </button>
            </form>

            <TermsNotice />
          </>
        )}

        {/* ══ PASO: FORGOT ════════════════════════════ */}
        {step === "forgot" && (
          <>
            <StepHeader onBack={() => setStep("login")} title="Restablecer contraseña" subtitle="Te enviaremos un enlace para crear una nueva contraseña." />

            <form onSubmit={handleForgotPassword} className="modal-form">
              <input
                type="email"
                placeholder="Correo electrónico"
                value={resetEmail}
                onChange={(e) => {
                  setResetEmail(e.target.value);
                  if (validateEmail(e.target.value)) {
                    const { count, secondsLeft } = getPersistedState(e.target.value);
                    setResendCount(count); setResendCooldown(secondsLeft);
                  }
                }}
                className="modal-input"
                disabled={loading}
                autoFocus
              />
              <button type="submit" className="modal-button login-btn" disabled={loading}>
                {loading ? <span className="spinner" /> : "Enviar enlace"}
              </button>
            </form>
          </>
        )}

        {/* ══ PASO: RESET SENT ════════════════════════ */}
        {step === "resetSent" && (
          <>
            <div className="reset-sent-icon">✉️</div>
            <h2 className="modal-title">Revisá tu correo</h2>
            <p className="modal-subtitle">
              Enviamos un enlace a <b>{resetEmail}</b>.<br />
              Hacé clic en el enlace para crear una nueva contraseña.<br />
              Expira en <b>1 hora</b>.
            </p>
            <p className="reset-sent-note">¿No lo encontrás? Revisá la carpeta de spam.</p>

            {resendCount < MAX_RESENDS ? (
              <button
                type="button"
                className="modal-button login-btn"
                style={{ marginTop: "8px" }}
                disabled={resendCooldown > 0}
                onClick={async () => {
                  try {
                    persistSend(resetEmail);
                    const { count, secondsLeft } = getPersistedState(resetEmail);
                    setResendCount(count); setResendCooldown(secondsLeft);
                  } catch { setLocalError("Error al reenviar. Intentá más tarde."); }
                }}
              >
                {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : "Reenviar enlace"}
              </button>
            ) : (
              <p className="reset-sent-note" style={{ color: "#dc2626" }}>
                Alcanzaste el límite de reenvíos. Esperá unos minutos.
              </p>
            )}

            <button type="button" className="modal-link" onClick={() => setStep("email")}>← Volver al inicio</button>
          </>
        )}
      </div>
    </div>
  );
}