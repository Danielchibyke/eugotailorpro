import React from 'react';
import './LoadingScreen.css'; // Create this CSS file

const LoadingScreen = () => {
  return (
    <div className="loading-screen-container">
      <div className="loading-content">
        <img src="/logo-placeholder.png" alt="Logo" className="loading-logo" />
        <h1>Elyo Tailor Pro</h1>
        <div className="spinner"></div>
        <p>Crafting your perfect fit...</p>
      </div>
      <div className="catalog-preview">
        <img src="/gallery-img-1.png" alt="Design 1" className="catalog-item" />
        <img src="/hero-design-1.png" alt="Design 2" className="catalog-item" />
        <img src="/sample-design-1.png" alt="Design 3" className="catalog-item" />
      </div>
    </div>
  );
};

export default LoadingScreen;
