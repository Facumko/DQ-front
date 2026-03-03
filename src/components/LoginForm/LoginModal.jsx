import { useState, useContext, useEffect, useRef } from "react";
import { UserContext } from "../../pages/UserContext";
import { validateEmail, validatePasswordStrength } from "../../Api/Api";
import "./LoginModal.css";
import { FaEye, FaEyeSlash, FaGoogle, FaFacebook, FaCheckCircle } from "react-icons/fa";

export default function LoginModal({ onClose }) {
  const { login, register, loading, error, clearError, isLocked } = useContext(UserContext);
  
  // Tabs
  const [activeTab, setActiveTab] = useState("login"); // "login" o "register"
  const [step, setStep] = useState("main"); // "main", "forgot", "resetCode"
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register fields
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // Reset password
  const [resetEmail, setResetEmail]                   = useState("");
  const [newPassword, setNewPassword]                 = useState("");
  const [confirmNewPassword, setConfirmNewPassword]   = useState("");
  const [showNewPassword, setShowNewPassword]         = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // ── Cooldown persistido en localStorage ──────────────────────────────────
  // Clave: "dq_reset_<email>" → { count, lastSentAt (timestamp ms) }
  const COOLDOWN_SECS = 60;
  const MAX_RESENDS   = 3;
  const LS_KEY        = (email) => `dq_reset_${email}`;

  // Leer estado persistido para un email dado
  const getPersistedState = (email) => {
    if (!email) return { count: 0, secondsLeft: 0 };
    try {
      const raw = localStorage.getItem(LS_KEY(email));
      if (!raw) return { count: 0, secondsLeft: 0 };
      const { count, lastSentAt } = JSON.parse(raw);
      const elapsed = Math.floor((Date.now() - lastSentAt) / 1000);
      const secondsLeft = Math.max(0, COOLDOWN_SECS - elapsed);
      return { count, secondsLeft };
    } catch {
      return { count: 0, secondsLeft: 0 };
    }
  };

  // Persistir un nuevo envío
  const persistSend = (email) => {
    const { count } = getPersistedState(email);
    localStorage.setItem(LS_KEY(email), JSON.stringify({
      count: count + 1,
      lastSentAt: Date.now(),
    }));
  };

  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount,    setResendCount]    = useState(0);
  
  // UI states
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emailValidation, setEmailValidation] = useState({ valid: null, message: '' });
  const [passwordStrength, setPasswordStrength] = useState({ strength: 'none', message: '', color: '' });
  const [lockCountdown, setLockCountdown] = useState(0);
  
  // Refs para focus automático
  const loginEmailRef = useRef(null);
  const registerEmailRef = useRef(null);
  
  // Focus automático al abrir
  useEffect(() => {
    if (activeTab === "login" && loginEmailRef.current) {
      loginEmailRef.current.focus();
    } else if (activeTab === "register" && registerEmailRef.current) {
      registerEmailRef.current.focus();
    }
  }, [activeTab]);
  
  // Limpiar errores al cambiar inputs
  useEffect(() => {
    if (localError) {
      setLocalError('');
    }
  }, [loginEmail, loginPassword, registerEmail, registerPassword, confirmPassword]);
  
  // Limpiar errores del contexto al desmontar
  useEffect(() => {
    return () => {
      if (clearError) clearError();
    };
  }, [clearError]);
  
  // Cerrar modal con ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  // Auto-limpiar mensajes de éxito
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Cuando se vuelve al paso resetSent (por ej. recarga o reapertura),
  // restaurar el cooldown desde localStorage
  useEffect(() => {
    if (step === "resetSent" && resetEmail) {
      const { count, secondsLeft } = getPersistedState(resetEmail);
      setResendCount(count);
      setResendCooldown(secondsLeft);
    }
  }, [step, resetEmail]);

  // Countdown del cooldown de reenvío
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);
  
  // Countdown para bloqueo
  useEffect(() => {
    if (isLocked && isLocked.locked) {
      setLockCountdown(isLocked.remainingSeconds);
      
      const interval = setInterval(() => {
        setLockCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isLocked]);
  
  // Validación email en tiempo real
  const handleEmailChange = (email, isLogin = true) => {
    if (isLogin) {
      setLoginEmail(email);
    } else {
      setRegisterEmail(email);
    }
    
    if (!email) {
      setEmailValidation({ valid: null, message: '' });
      return;
    }
    
    const isValid = validateEmail(email);
    setEmailValidation({
      valid: isValid,
      message: isValid ? '✓ Email válido' : '✗ Email inválido'
    });
  };
  
  // Validación password strength en tiempo real
  const handlePasswordChange = (password) => {
    setRegisterPassword(password);
    
    if (!password) {
      setPasswordStrength({ strength: 'none', message: '', color: '' });
      return;
    }
    
    const strength = validatePasswordStrength(password);
    setPasswordStrength(strength);
  };
  
  // --- LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (clearError) clearError();
    
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLocalError('Por favor completa todos los campos');
      return;
    }
    
    if (!validateEmail(loginEmail)) {
      setLocalError('Por favor ingresa un email válido');
      return;
    }
    
    const result = await login(loginEmail, loginPassword);
    
    if (result.success) {
      setSuccessMessage('¡Bienvenido de vuelta! 🎉');
      setTimeout(() => onClose(), 1500);
    } else {
      setLocalError(result.error);
    }
  };
  
  // --- REGISTRO ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (clearError) clearError();
    
    if (!registerEmail.trim() || !registerPassword.trim() || !confirmPassword.trim()) {
      setLocalError('Por favor completa todos los campos');
      return;
    }
    
    if (!validateEmail(registerEmail)) {
      setLocalError('Por favor ingresa un email válido');
      return;
    }
    
    if (registerPassword !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }
    
    if (registerPassword.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!acceptedTerms) {
      setLocalError('Debes aceptar los Términos de Uso y la Política de Privacidad');
      return;
    }
    
    const result = await register({
      email: registerEmail,
      password: registerPassword,
    });
    
    if (result.success) {
      setSuccessMessage('¡Cuenta creada exitosamente! ✅');
      setTimeout(() => onClose(), 1500);
    } else {
      setLocalError(result.error);
    }
  };
  
  // --- OLVIDÉ CONTRASEÑA ---
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!resetEmail.trim()) {
      setLocalError('Por favor ingresa tu correo electrónico');
      return;
    }
    if (!validateEmail(resetEmail)) {
      setLocalError('Por favor ingresa un email válido');
      return;
    }
    if (resendCount >= MAX_RESENDS) {
      setLocalError('Alcanzaste el límite de reenvíos. Esperá unos minutos e intentá de nuevo.');
      return;
    }

    try {
      // TODO: await requestPasswordReset(resetEmail);
      persistSend(resetEmail);
      const { count, secondsLeft } = getPersistedState(resetEmail);
      setResendCount(count);
      setResendCooldown(secondsLeft);
      setStep("resetSent");
    } catch {
      setLocalError('Ocurrió un error. Intentá de nuevo más tarde.');
    }
  };
  
  const handleResetPassword = (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (!resetCode.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      setLocalError('Por favor completa todos los campos');
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }
    
    if (newPassword.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setSuccessMessage("Contraseña restablecida correctamente ✅");
    setTimeout(() => {
      setStep("main");
      setActiveTab("login");
      setResetCode("");
      setNewPassword("");
      setConfirmNewPassword("");
      setResetEmail("");
    }, 1500);
  };
  
  // Social logins
  const handleSocialLogin = (provider) => {
    setLocalError(`${provider} estará disponible próximamente `);
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        {/* Logo */}
        <div className="modal-logo">
          <img src="/logoDQ.png" alt="Dónde Queda logo" className="logo-img" />
          <span className="logo-text">Dónde Queda?</span>
        </div>
        
        {/* Mensaje de éxito */}
        {successMessage && (
          <div className="success-banner">
            <FaCheckCircle /> {successMessage}
          </div>
        )}
        

        {step === "main" && (
          <>
            <h2 className="modal-title">Bienvenido a Dónde Queda</h2>
            
            {/* Tabs */}
            <div className="tabs-container">
              <button
                className={`tab ${activeTab === "login" ? "active" : ""}`}
                onClick={() => setActiveTab("login")}
              >
                Iniciar Sesión
              </button>
              <button
                className={`tab ${activeTab === "register" ? "active" : ""}`}
                onClick={() => setActiveTab("register")}
              >
                Crear Cuenta
              </button>
            </div>
            
            {/* Errores */}
            {(error || localError) && (
              <div className="error-message">
                {localError || error}
              </div>
            )}
            
            {/* TAB LOGIN */}
            {activeTab === "login" && (
              <form onSubmit={handleLogin} className="modal-form">
                <div className="input-group">
                  <input
                    ref={loginEmailRef}
                    type="email"
                    placeholder="Correo electrónico"
                    value={loginEmail}
                    onChange={(e) => handleEmailChange(e.target.value, true)}
                    className={`modal-input ${emailValidation.valid === true ? 'valid' : emailValidation.valid === false ? 'invalid' : ''}`}
                    disabled={loading || (isLocked && isLocked.locked)}
                  />
                  {loginEmail && (
                    <span className={`validation-icon ${emailValidation.valid ? 'valid' : 'invalid'}`}>
                      {emailValidation.message}
                    </span>
                  )}
                </div>
                
                <div className="password-container">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="modal-input password-input"
                    disabled={loading || (isLocked && isLocked.locked)}
                  />
                  <span className="toggle-password" onClick={() => setShowLoginPassword(!showLoginPassword)}>
                    {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                
                <a href="#" className="forgot-password" onClick={(e) => { e.preventDefault(); setStep("forgot"); }}>
                  Olvidé mi contraseña
                </a>
                
                <button
                  type="submit"
                  className="modal-button login-btn"
                  disabled={loading || (isLocked && isLocked.locked)}
                >
                  {loading ? (
                    <span className="spinner"></span>
                  ) : (
                    'Iniciar sesión'
                  )}
                </button>
                
                <div className="separator">o continúa con</div>
                
                <div className="social-buttons">
                  <button type="button" className="social-btn google" onClick={() => handleSocialLogin('Google')} title="Próximamente">
                    <FaGoogle />
                  </button>
                  <button type="button" className="social-btn facebook" onClick={() => handleSocialLogin('Facebook')} title="Próximamente">
                    <FaFacebook />
                  </button>
                </div>
              </form>
            )}
            
            {/* TAB REGISTRO */}
            {activeTab === "register" && (
              <form onSubmit={handleRegister} className="modal-form">
                <div className="input-group">
                  <input
                    ref={registerEmailRef}
                    type="email"
                    placeholder="Correo electrónico"
                    value={registerEmail}
                    onChange={(e) => handleEmailChange(e.target.value, false)}
                    className={`modal-input ${emailValidation.valid === true ? 'valid' : emailValidation.valid === false ? 'invalid' : ''}`}
                    disabled={loading}
                  />
                  {registerEmail && (
                    <span className={`validation-icon ${emailValidation.valid ? 'valid' : 'invalid'}`}>
                      {emailValidation.message}
                    </span>
                  )}
                </div>
                
                <div className="password-container">
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    placeholder="Crea una contraseña"
                    value={registerPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="modal-input password-input"
                    disabled={loading}
                  />
                  <span className="toggle-password" onClick={() => setShowRegisterPassword(!showRegisterPassword)}>
                    {showRegisterPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                
                {/* Password strength bar */}
                {registerPassword && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div
                        className={`strength-fill ${passwordStrength.strength}`}
                        style={{ width: passwordStrength.strength === 'weak' ? '33%' : passwordStrength.strength === 'medium' ? '66%' : '100%', backgroundColor: passwordStrength.color }}
                      ></div>
                    </div>
                    <span className="strength-text" style={{ color: passwordStrength.color }}>
                      {passwordStrength.message}
                    </span>
                  </div>
                )}
                
                <div className="password-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirma tu contraseña"
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

                {/* Aceptación de términos y políticas */}
                <label className="terms-label">
                  <input
                    type="checkbox"
                    className="terms-checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    disabled={loading}
                  />
                  <span className="terms-text">
                    Acepto los{" "}
                    <a
                      href="/terminos-de-uso"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="terms-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Términos de Uso
                    </a>
                    {" "}y la{" "}
                    <a
                      href="/politica-de-privacidad"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="terms-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Política de Privacidad
                    </a>
                    {" "}de Dónde Queda
                  </span>
                </label>
                
                <button
                  type="submit"
                  className="modal-button register-btn"
                  disabled={loading || !registerPassword || !confirmPassword || registerPassword !== confirmPassword || !acceptedTerms}
                >
                  {loading ? (
                    <span className="spinner"></span>
                  ) : (
                    'Crear cuenta'
                  )}
                </button>
              </form>
            )}
          </>
        )}
        
        {/* OLVIDÉ CONTRASEÑA — ingresar email */}
        {step === "forgot" && (
          <>
            <h2 className="modal-title">Restablecer contraseña</h2>
            <p className="modal-subtitle">
              Ingresá tu correo y te enviaremos un enlace para crear una nueva contraseña.
            </p>

            {(error || localError) && (
              <div className="error-message">
                {localError || error}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="modal-form">
              <input
                type="email"
                placeholder="Correo electrónico"
                value={resetEmail}
                onChange={(e) => {
                  const email = e.target.value;
                  setResetEmail(email);
                  // Cargar cooldown persistido para este email
                  if (validateEmail(email)) {
                    const { count, secondsLeft } = getPersistedState(email);
                    setResendCount(count);
                    setResendCooldown(secondsLeft);
                  }
                }}
                className="modal-input"
                disabled={loading}
                autoFocus
              />

              <button type="submit" className="modal-button login-btn" disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Enviar enlace'}
              </button>

              <button type="button" className="modal-link" onClick={() => setStep("main")}>
                ← Volver al inicio de sesión
              </button>
            </form>
          </>
        )}

        {/* ENLACE ENVIADO — confirmación */}
        {step === "resetSent" && (
          <>
            <div className="reset-sent-icon">✉️</div>
            <h2 className="modal-title">Revisá tu correo</h2>
            <p className="modal-subtitle">
              Te enviamos un enlace a <b>{resetEmail}</b>.<br />
              Hacé clic en el enlace del email para crear tu nueva contraseña.<br />
              El enlace expira en <b>1 hora</b>.
            </p>
            <p className="reset-sent-note">
              ¿No lo encontrás? Revisá la carpeta de spam o correo no deseado.
            </p>

            {localError && <div className="error-message">{localError}</div>}

            {/* Botón reenviar con cooldown */}
            {resendCount < MAX_RESENDS ? (
              <button
                type="button"
                className="modal-button login-btn"
                style={{ marginTop: '8px' }}
                disabled={resendCooldown > 0}
                onClick={async () => {
                  setLocalError('');
                  try {
                    // TODO: await requestPasswordReset(resetEmail);
                    persistSend(resetEmail);
                    const { count, secondsLeft } = getPersistedState(resetEmail);
                    setResendCount(count);
                    setResendCooldown(secondsLeft);
                  } catch {
                    setLocalError('Error al reenviar. Intentá más tarde.');
                  }
                }}
              >
                {resendCooldown > 0
                  ? `Reenviar en ${resendCooldown}s`
                  : `Reenviar enlace`
                }
              </button>
            ) : (
              <p className="reset-sent-note" style={{ color: '#dc2626', marginTop: '8px' }}>
                Alcanzaste el límite de reenvíos. Esperá unos minutos e intentá de nuevo.
              </p>
            )}

            <button type="button" className="modal-link" onClick={() => setStep("main")}>
              ← Volver al inicio de sesión
            </button>
          </>
        )}
      </div>
    </div>
  );
}