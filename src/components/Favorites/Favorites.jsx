import { useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserContext } from "../../pages/UserContext";
import styles from "./Favorites.module.css";


export default function Favorites() {
  const { favorites, removeFavorite } = useContext(UserContext);


  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAscending, setIsAscending] = useState(true);


  const categories = ["all", "Restaurante", "Gimnasio", "Salud", "Moda", "Cafetería", "Belleza"];


  const handleCardClick = (id) => {
    console.log(`Navegando al perfil del negocio ${id}`);
  };


  const toggleSortOrder = () => {
    setIsAscending((prev) => !prev);
  };


  const filteredAndSortedFavorites = favorites
    .filter((fav) => {
      const matchesSearch =
        fav.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fav.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || fav.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const dateA = new Date(a.savedAt);
      const dateB = new Date(b.savedAt);
      return isAscending ? dateA - dateB : dateB - dateA;
    });


  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Mis Favoritos</h1>
        <p className={styles.subtitle}>Tus negocios guardados en un solo lugar</p>
      </header>


      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Buscar negocios..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>


        <select
          className={styles.select}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">Todas las categorías</option>
          {categories.slice(1).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>


        <button
          className={styles.sortButton}
          onClick={toggleSortOrder}
          title={isAscending ? "Más antiguos primero" : "Más recientes primero"}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            {isAscending ? (
              <path
                d="M12 5v14M5 12l7-7 7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M12 19V5M5 12l7 7 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </button>
      </div>


      {filteredAndSortedFavorites.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No se encontraron negocios favoritos</p>
        </div>
      ) : (
        <div className={styles.grid}>
          <AnimatePresence>
            {filteredAndSortedFavorites.map((negocio) => (
              <motion.div
                key={negocio.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={styles.card}
                onClick={() => handleCardClick(negocio.id)}
              >
                <div className={styles.coverImage}>
                  <img src={negocio.coverImage || "/placeholder.svg"} alt={`Portada de ${negocio.name}`} />
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(negocio.id);
                    }}
                    aria-label="Eliminar de favoritos"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M2.5 5h15M8.333 9.167v5M11.667 9.167v5M3.333 5l.834 11.667c0 .916.75 1.666 1.666 1.666h8.334c.916 0 1.666-.75 1.666-1.666L16.667 5M7.5 5V3.333c0-.916.75-1.666 1.667-1.666h1.666c.917 0 1.667.75 1.667 1.666V5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>


                <div className={styles.cardContent}>
                  <div className={styles.profileSection}>
                    <img
                      src={negocio.profileImage || "/placeholder.svg"}
                      alt={negocio.name}
                      className={styles.profileImage}
                    />
                    <div className={styles.businessInfo}>
                      <h3 className={styles.businessName}>{negocio.name}</h3>
                      <span className={styles.category}>{negocio.category}</span>
                    </div>
                  </div>


                  <p className={styles.description}>{negocio.description}</p>


                  <div className={styles.hours}>
                    <svg className={styles.clockIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>{negocio.hours}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
