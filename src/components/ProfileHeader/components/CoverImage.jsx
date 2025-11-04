import React from "react";
import { Image } from "lucide-react";
import styles from "../ProfileHeader.module.css";

const CoverImage = ({ isEditing, coverImage, onFileChange }) => {
  if (isEditing) {
    return (
      <div className={styles.coverPreviewModern}>
        <label className={styles.coverButtonModern}>
          <Image size={20} />
          {coverImage ? "Cambiar portada" : "Subir portada"}
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className={styles.fileInputModern}
          />
        </label>
        {coverImage && (
          <img src={coverImage} alt="Vista previa" className={styles.coverPreviewImgModern} />
        )}
      </div>
    );
  }

  return (
    <div className={styles.coverDisplayModern}>
      {coverImage ? (
        <img src={coverImage} alt="Portada" className={styles.coverImageModern} />
      ) : (
        <div className={styles.coverPlaceholderModern}>
          <Image size={48} color="#ccc" />
          <span>Sin portada</span>
        </div>
      )}
    </div>
  );
};

export default CoverImage;