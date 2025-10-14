import { useState, useContext, useEffect, useRef } from "react";
import { UserContext } from "../../pages/UserContext";
import { validateEmail, validatePasswordStrength } from "../../Api/Api";
import "./LoginModal.css";
import { FaEye, FaEyeSlash, FaMapMarkerAlt, FaGoogle, FaFacebook, FaApple, FaCheckCircle } from "react-icons/fa";

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
  
  // Reset password
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  
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
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
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
    
    // Validaciones
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
    
    // Validaciones
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
  const handleForgotPassword = (e) => {
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
    
    setSuccessMessage(`Código enviado a ${resetEmail} ✉️`);
    setStep("resetCode");
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
          <FaMapMarkerAlt className="logo-icon" />
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
                  <button type="button" className="social-btn apple" onClick={() => handleSocialLogin('Apple')} title="Próximamente">
                    <FaApple />
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
                
                <button
                  type="submit"
                  className="modal-button register-btn"
                  disabled={loading || !registerPassword || !confirmPassword || registerPassword !== confirmPassword}
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
        
        {/* OLVIDÉ CONTRASEÑA */}
        {step === "forgot" && (
          <>
            <h2 className="modal-title">Restablecer contraseña</h2>
            <p className="modal-subtitle">Ingresa tu correo y te enviaremos un código</p>
            
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
                onChange={(e) => setResetEmail(e.target.value)}
                className="modal-input"
                disabled={loading}
                autoFocus
              />
              
              <button type="submit" className="modal-button login-btn" disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Enviar código'}
              </button>
              
              <button type="button" className="modal-link" onClick={() => setStep("main")}>
                ← Volver al inicio
              </button>
            </form>
          </>
        )}
        
        {/* RESET CONTRASEÑA */}
        {step === "resetCode" && (
          <>
            <h2 className="modal-title">Código de confirmación</h2>
            <p className="modal-subtitle">Revisa tu correo <b>{resetEmail}</b></p>
            
            {(error || localError) && (
              <div className="error-message">
                {localError || error}
              </div>
            )}
            
            <form onSubmit={handleResetPassword} className="modal-form">
              <input
                type="text"
                placeholder="Código de confirmación"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="modal-input"
                disabled={loading}
                autoFocus
              />
              
              <div className="password-container">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="modal-input password-input"
                  disabled={loading}
                />
                <span className="toggle-password" onClick={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              
              <div className="password-container">
                <input
                  type={showConfirmNewPassword ? "text" : "password"}
                  placeholder="Confirma nueva contraseña"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  className="modal-input password-input"
                  disabled={loading}
                />
                <span className="toggle-password" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
                  {showConfirmNewPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              
              {confirmNewPassword && (
                <p className="password-match" style={{ color: newPassword === confirmNewPassword ? "#00cc66" : "#ff4444" }}>
                  {newPassword === confirmNewPassword ? "✓ Las contraseñas coinciden" : "✗ Las contraseñas no coinciden"}
                </p>
              )}
              
              <button
                type="submit"
                className="modal-button login-btn"
                disabled={loading || !resetCode || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
              >
                {loading ? <span className="spinner"></span> : 'Restablecer contraseña'}
              </button>
              
              <button type="button" className="modal-link" onClick={() => setStep("forgot")}>
                ← Volver
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}