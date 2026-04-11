import React, { useContext, useState, useEffect, useRef, useCallback } from "react";
import { UserContext } from "../../pages/UserContext";
import LoginModal from "../LoginForm/LoginModal";
import { useNavigate, useLocation } from "react-router-dom";
import { searchCommerces } from "../../Api/Api";
import styles from "./Navbar.module.css";
import {
  FaRegStar, FaRegBell, FaRegCalendarAlt,
  FaRegCreditCard, FaRegUser, FaSearch, FaBars,
  FaMapMarkerAlt, FaStore, FaCog, FaSignOutAlt,
  FaChevronDown, FaChevronRight, FaPlus
} from "react-icons/fa";
import CityDrawer from "../CityDrawer/CityDrawer";

const HighlightText = ({ text, query }) => {
  if (!query) return <span>{text}</span>;
  const regex = new RegExp(`(${query})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part)
          ? <strong key={i}>{part}</strong>
          : <span key={i}>{part}</span>
      )}
    </span>
  );
};

const Navbar = () => {
  const { user, logout, businesses, hasBusiness } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogin, setShowLogin]           = useState(false);
  const [showMenu, setShowMenu]             = useState(false);
  const [showDrawer, setShowDrawer]         = useState(false);
  const [showBusinesses, setShowBusinesses] = useState(false);

  const menuRef   = useRef(null);
  const searchRef = useRef(null);

  const [searchText, setSearchText]                 = useState("");
  const [suggestions, setSuggestions]               = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions]       = useState(false);
  const searchTimeoutRef = useRef(null);

  // Cerrar sugerencias al cambiar de ruta
  useEffect(() => {
    setShowSuggestions(false);
    setSearchText("");
  }, [location.pathname]);

  // Cerrar menú usuario al clickear afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setShowBusinesses(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cerrar sugerencias al clickear afuera del buscador
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowSuggestions(false);
        setShowMenu(false);
        setShowBusinesses(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, []);

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
        setShowSuggestions(false);
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

  const handleBusinessMenuClick = () => {
    if (!user) return setShowLogin(true);
    if (!hasBusiness) {
      navigate("/register-commerce");
      setShowMenu(false);
      return;
    }
    setShowBusinesses((prev) => !prev);
  };

  const authIcons = [
    { icon: FaRegStar,        label: "Favoritos",      link: "/favorites"      },
    { icon: FaRegBell,        label: "Notificaciones", link: "/notificaciones" },
  ];

  const publicIcons = [
    { icon: FaMapMarkerAlt,   label: "Mapa",    link: "/mapa"    },
    { icon: FaRegCalendarAlt, label: "Eventos", link: "/eventos" },
    { icon: FaRegCreditCard,  label: "Planes",  link: "/planes"  },
  ];

  const businessMenuLabel = !hasBusiness
    ? "Registrar negocio"
    : businesses.length === 1
    ? "Mi negocio"
    : "Mis negocios";

  return (
    <>
      <nav className={styles.navbar}>

        <div className={styles.navLeft}>
          <div
            className={`${styles.hamburger} ${showDrawer ? styles.activeIcon : ""}`}
            title="Categorías y más"
            onClick={() => setShowDrawer(true)}
          >
            <FaBars className={styles.outlineIcon} />
          </div>
          <div className={styles.logo} onClick={() => navigate("/")}>
            <img src="/logoDQ.png" alt="Logo" className={styles.logoIcon} />
            <span className={styles.logoText}>Dónde Queda?</span>
          </div>
        </div>

        {/* Buscador */}
        <div className={styles.searchContainer} ref={searchRef}>
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
          {(showSuggestions || loadingSuggestions) && (
            <div className={styles.suggestions}>

              {loadingSuggestions && (
                <div className={styles.loadingItem}>
                  <span className={styles.loadingDot} />
                  <span className={styles.loadingDot} />
                  <span className={styles.loadingDot} />
                </div>
              )}

              {!loadingSuggestions && showSuggestions && suggestions.length === 0 && (
                <div className={styles.noResults}>
                  Sin resultados para "{searchText}"
                </div>
              )}

              {!loadingSuggestions && suggestions.map((commerce, idx) => (
                <div key={commerce.idCommerce}>
                  <div
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
                      <span className={styles.suggestionName}>
                        <HighlightText text={commerce.name} query={searchText} />
                      </span>
                      {commerce.description && (
                        <span className={styles.suggestionDesc}>
                          {commerce.description.substring(0, 55)}...
                        </span>
                      )}
                    </div>
                  </div>
                  {idx < suggestions.length - 1 && <div className={styles.suggestionDivider} />}
                </div>
              ))}

            </div>
          )}
        </div>

        {/* Íconos derecha */}
        <div className={styles.icons}>
          {user && authIcons.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div key={idx} className={styles.iconWrapper} title={item.label} onClick={() => navigate(item.link)}>
                <IconComp className={styles.outlineIcon} />
                <span className={styles.iconTooltip}>{item.label}</span>
              </div>
            );
          })}

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

          {!user ? (
            <button className={styles.loginButton} onClick={() => setShowLogin(true)}>
              <FaRegUser className={styles.loginBtnIcon} />
              <span>Ingresar</span>
            </button>
          ) : (
            <div className={styles.userWrapper} ref={menuRef}>
              <div
                className={`${styles.userTrigger} ${showMenu ? styles.userTriggerActive : ""}`}
                onClick={() => { setShowMenu((p) => !p); setShowBusinesses(false); }}
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

                  <div
                    className={`${styles.userMenuItem} ${hasBusiness ? styles.userMenuItemExpandable : ""}`}
                    onClick={handleBusinessMenuClick}
                  >
                    <FaStore className={styles.menuItemIcon} />
                    {businessMenuLabel}
                    {hasBusiness && (
                      <FaChevronRight
                        className={`${styles.menuItemChevron} ${showBusinesses ? styles.menuItemChevronOpen : ""}`}
                      />
                    )}
                  </div>

                  {hasBusiness && showBusinesses && (
                    <div className={styles.businessSubmenu}>
                      {businesses.map((biz) => (
                        <div
                          key={biz.id_business}
                          className={styles.businessSubmenuItem}
                          onClick={() => {
                            navigate(`/negocios/${biz.id_business}`);
                            setShowMenu(false);
                            setShowBusinesses(false);
                          }}
                        >
                          <div className={styles.businessSubmenuAvatar}>
                            {biz.profileImage
                              ? <img src={biz.profileImage} alt={biz.name} />
                              : <span>{biz.name.charAt(0).toUpperCase()}</span>
                            }
                          </div>
                          <span className={styles.businessSubmenuName}>{biz.name}</span>
                        </div>
                      ))}

                      <div
                        className={`${styles.businessSubmenuItem} ${styles.businessSubmenuAdd}`}
                        onClick={() => {
                          navigate("/register-commerce");
                          setShowMenu(false);
                          setShowBusinesses(false);
                        }}
                      >
                        <div className={styles.businessSubmenuAvatar}>
                          <FaPlus />
                        </div>
                        <span className={styles.businessSubmenuName}>Agregar negocio</span>
                      </div>
                    </div>
                  )}

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

      <CityDrawer isOpen={showDrawer} onClose={() => setShowDrawer(false)} />
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
};

export default Navbar;