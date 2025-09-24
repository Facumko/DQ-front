import React from "react";
import styles from "./Gallery.module.css";
import Carousel from "../Carousel/Carousel";

const Gallery = ({ images = [] }) => {
  const defaultImages = [
    { id: 1, img: "" },
    { id: 2, img: "" },
    { id: 3, img: "" }
  ];

  const imgs = images.length > 0 ? images : defaultImages;

  return (
    <div className={styles.container}>
      <h2>Galería</h2>
      <Carousel items={imgs} />
    </div>
  );
};

export default Gallery;
