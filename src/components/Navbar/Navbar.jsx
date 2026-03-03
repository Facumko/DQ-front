import React, { useContext, useState, useEffect, useRef, useCallback } from "react";
import { UserContext } from "../../pages/UserContext";
import LoginModal from "../LoginForm/LoginModal";
import { useNavigate } from "react-router-dom";
import { searchCommerces, getBusinessByUserId } from "../../Api/Api";
import styles from "./Navbar.module.css";
import {
  FaRegStar, FaRegBell, FaRegCalendarAlt,
  FaRegCreditCard, FaRegUser, FaSearch, FaBars,
  FaMapMarkerAlt, FaStore, FaCog, FaSignOutAlt, FaChevronDown
} from "react-icons/fa";
import CityDrawer from "../CityDrawer/CityDrawer";

const Navbar = () => {
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();

  const [showLogin, setShowLogin]     = useState(false);
  const [showMenu, setShowMenu]       = useState(false);
  const [showDrawer, setShowDrawer]   = useState(false);
  const [hasBusiness, setHasBusiness] = useState(false);
  const menuRef = useRef(null);

  // Búsqueda
  const [searchText, setSearchText]             = useState("");
  const [suggestions, setSuggestions]           = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions]   = useState(false);
  const searchTimeoutRef = useRef(null);

  // Cerrar menú usuario al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Verificar si el usuario tiene negocio
  useEffect(() => {
    const checkBusiness = async () => {
      if (!user?.id_user) return;
      try {
        const business = await getBusinessByUserId(user.id_user);
        setHasBusiness(!!business);
      } catch {
        setHasBusiness(false);
      }
    };
    checkBusiness();
  }, [user]);

  // Búsqueda con debounce
  const handleSearchChange = useCallback((text) => {
    setSearchText(text);
    if (text.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setLoadingSuggestions(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchCommerces(text.trim(), 5, 0);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);
  }, []);

  const handleSearch = useCallback(() => {
    if (!searchText.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchText.trim())}`);
    setShowSuggestions(false);
    setSearchText("");
  }, [searchText, navigate]);

  const handleKeyPress = useCallback(
    (e) => { if (e.key === "Enter") handleSearch(); },
    [handleSearch]
  );

  useEffect(() => {
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, []);

  const handleMiCommerceClick = () => {
    if (!user) return setShowLogin(true);
    if (hasBusiness) navigate("/Mycommerce");
    else navigate("/register-commerce");
    setShowMenu(false);
  };

  // Íconos solo visibles con sesión
  const authIcons = [
    { icon: FaRegStar, label: "Favoritos",     link: "/favorites"      },
    { icon: FaRegBell, label: "Notificaciones", link: "/notificaciones" },
  ];

  // Íconos siempre visibles
  const publicIcons = [
    { icon: FaMapMarkerAlt,   label: "Mapa",    link: "/mapa"   },
    { icon: FaRegCalendarAlt, label: "Eventos", link: "/eventos" },
    { icon: FaRegCreditCard,  label: "Planes",  link: "/planes"  },
  ];

  return (
    <>
      <nav className={styles.navbar}>

        {/* ── Hamburger (izquierda) → abre CityDrawer ── */}
        <div
          className={`${styles.hamburger} ${showDrawer ? styles.activeIcon : ""}`}
          title="Categorías y más"
          onClick={() => setShowDrawer(true)}
        >
          <FaBars className={styles.outlineIcon} />
        </div>

        {/* ── Logo ── */}
        <div className={styles.logo} onClick={() => navigate("/")}>
          <img src="/logoDQ.png" alt="Logo" className={styles.logoIcon} />
          <span className={styles.logoText}>Dónde Queda?</span>
        </div>

        {/* ── Buscador ── */}
        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} onClick={handleSearch} />
          <input
            type="text"
            placeholder="Buscá negocios, servicios, lugares..."
            className={styles.searchInput}
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyPress={handleKeyPress}
          />

          {/* Sugerencias */}
          {showSuggestions && suggestions.length > 0 && (
            <div className={styles.suggestions}>
              {suggestions.map((commerce) => (
                <div
                  key={commerce.idCommerce}
                  className={styles.suggestionItem}
                  onClick={() => {
                    navigate(`/negocios/${commerce.idCommerce}`);
                    setShowSuggestions(false);
                    setSearchText("");
                  }}
                >
                  <div className={styles.suggestionIcon}>
                    {commerce.profileImage?.url
                      ? <img src={commerce.profileImage.url} alt="" />
                      : <span>{commerce.name.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <div className={styles.suggestionInfo}>
                    <span className={styles.suggestionName}>{commerce.name}</span>
                    {commerce.description && (
                      <span className={styles.suggestionDesc}>
                        {commerce.description.substring(0, 55)}...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {loadingSuggestions && (
            <div className={styles.suggestions}>
              <div className={styles.loadingItem}>
                <span className={styles.loadingDot} />
                <span className={styles.loadingDot} />
                <span className={styles.loadingDot} />
              </div>
            </div>
          )}
        </div>

        {/* ── Íconos área derecha ── */}
        <div className={styles.icons}>

          {/* Íconos con sesión */}
          {user && authIcons.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className={styles.iconWrapper}
                title={item.label}
                onClick={() => navigate(item.link)}
              >
                <IconComp className={styles.outlineIcon} />
                <span className={styles.iconTooltip}>{item.label}</span>
              </div>
            );
          })}

          {/* Íconos públicos */}
          {publicIcons.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className={`${styles.iconWrapper} ${item.link === "/mapa" ? styles.mapIcon : ""}`}
                title={item.label}
                onClick={() => navigate(item.link)}
              >
                <IconComp className={styles.outlineIcon} />
                <span className={styles.iconTooltip}>{item.label}</span>
              </div>
            );
          })}

          {/* ── Botón / menú de usuario ── */}
          {!user ? (
            <button className={styles.loginButton} onClick={() => setShowLogin(true)}>
              <FaRegUser className={styles.loginBtnIcon} />
              <span>Ingresar</span>
            </button>
          ) : (
            <div className={styles.userWrapper} ref={menuRef}>
              <div
                className={`${styles.userTrigger} ${showMenu ? styles.userTriggerActive : ""}`}
                onClick={() => setShowMenu((p) => !p)}
              >
                <div className={styles.userAvatar}>
                  {user.name ? user.name.charAt(0).toUpperCase() : <FaRegUser />}
                </div>
                <span className={styles.userName}>
                  {user.name?.split(" ")[0] || "Mi cuenta"}
                </span>
                <FaChevronDown className={`${styles.chevron} ${showMenu ? styles.chevronOpen : ""}`} />
              </div>

              {showMenu && (
                <div className={styles.userMenu}>
                  <div className={styles.userMenuHeader}>
                    <div className={styles.userMenuAvatar}>
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <p className={styles.userMenuName}>{user.name || "Usuario"}</p>
                      <p className={styles.userMenuEmail}>{user.email || ""}</p>
                    </div>
                  </div>

                  <div className={styles.userMenuDivider} />

                  <div className={styles.userMenuItem} onClick={() => { navigate("/profile"); setShowMenu(false); }}>
                    <FaRegUser className={styles.menuItemIcon} />
                    Mi perfil
                  </div>
                  <div className={styles.userMenuItem} onClick={handleMiCommerceClick}>
                    <FaStore className={styles.menuItemIcon} />
                    {hasBusiness ? "Mi negocio" : "Registrar negocio"}
                  </div>
                  <div className={styles.userMenuItem} onClick={() => { navigate("/configuracion"); setShowMenu(false); }}>
                    <FaCog className={styles.menuItemIcon} />
                    Configuración
                  </div>

                  <div className={styles.userMenuDivider} />

                  <div className={`${styles.userMenuItem} ${styles.logoutItem}`} onClick={() => { logout(); setShowMenu(false); }}>
                    <FaSignOutAlt className={styles.menuItemIcon} />
                    Cerrar sesión
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Drawer lateral */}
      <CityDrawer isOpen={showDrawer} onClose={() => setShowDrawer(false)} />

      {/* Modal login */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
};

export default Navbar;