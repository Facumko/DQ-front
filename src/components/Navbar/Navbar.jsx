import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Navbar.module.css";
import {
  FaMapMarkerAlt,
  FaRegStar,
  FaRegBell,
  FaRegCalendarAlt,
  FaRegCreditCard,
  FaRegUser,
  FaBars,
  FaSearch
} from "react-icons/fa";

const businessList = [
  "Panadería Los Aromas",
  "Supermercado Central",
  "Café La Esquina",
  "Peluquería Moderno",
  "Gimnasio FitLife",
  "Tienda de Ropa Urban"
];

const Navbar = () => {
  const navigate = useNavigate();
  const [searchActive, setSearchActive] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredList, setFilteredList] = useState([]);

  const icons = [
    { icon: FaRegStar, label: "Favoritos", link: "/favoritos" },
    { icon: FaRegBell, label: "Notificaciones", link: "/notificaciones" },
    { icon: FaRegCalendarAlt, label: "Eventos", link: "/eventos" },
    { icon: FaRegCreditCard, label: "Métodos de pago", link: "/pagos" },
    { icon: FaRegUser, label: "Perfil", link: "/perfil" },
    { icon: FaBars, label: "Menú", link: "/menu" }
  ];

  const handleSearchChange = (text) => {
    setSearchText(text);
    if (text.trim() === "") setFilteredList([]);
    else
      setFilteredList(
        businessList.filter((b) =>
          b.toLowerCase().includes(text.toLowerCase())
        )
      );
  };

  const handleIconClick = (link, e) => {
    const ripple = document.createElement("span");
    ripple.className = styles.rippleDynamic;
    ripple.style.left = `${e.nativeEvent.offsetX}px`;
    ripple.style.top = `${e.nativeEvent.offsetY}px`;
    e.currentTarget.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
    navigate(link);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo} onClick={() => navigate("/")}>
        <FaMapMarkerAlt className={styles.icon} />
        <span className={styles.logoText}>Donde Queda?</span>
      </div>

      <div
        className={`${styles.searchContainer} ${
          searchActive ? styles.active : ""
        }`}
        onClick={() => setSearchActive(true)}
      >
        <input
          type="text"
          placeholder="Buscar negocio, servicio o lugar..."
          className={styles.searchInput}
          value={searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <FaSearch className={styles.searchIcon} />

        {searchActive && filteredList.length > 0 && (
          <div className={styles.suggestions}>
            {filteredList.map((item, idx) => (
              <div
                key={idx}
                className={styles.suggestionItem}
                onClick={() => {
                  setSearchText(item);
                  setFilteredList([]);
                  navigate(`/search/${item}`);
                }}
              >
                {item}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.icons}>
        {icons.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div
              key={idx}
              className={styles.iconWrapper}
              title={item.label}
              onClick={(e) => handleIconClick(item.link, e)}
            >
              <IconComp className={styles.outlineIcon} />
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
