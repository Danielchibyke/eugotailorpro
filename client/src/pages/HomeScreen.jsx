// client/src/pages/HomeScreen.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css'; // For general app structure
import './styles/HomeScreen.css'; // Specific styles for Home Screen

const HomeScreen = () => {
    return (
        <div className="home-screen-container">
            {/* Top Logo and Title */}
            <header className="home-header">
                <img src="/logo-placeholder.png" alt="Elyo Logo" className="home-logo" />
                <h1 className="home-title">Elyo</h1>
            </header>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-image-overlay">
                    <img src="/hero-design-1.png" alt="Hero Design" className="hero-image" />
                </div>
                <div className="hero-content">
                    <h2>Unleash your unique style.</h2>
                    <p>
                        Our mission is to help clients realize their vision with precision and passion.
                        We craft unique garments, ensuring satisfaction in every stitch.
                    </p>
                    <Link to="/login" className="btn btn-accent get-started-btn">
                        Get Started
                    </Link>
                </div>
            </section>

            {/* Image Gallery/Carousel Placeholder */}
            <section className="gallery-section">
                <h3>Our Designs</h3>
                <div className="image-gallery">
                    <img src="/gallery-img-1.png" alt="Design 1" className="gallery-item" />
                    <img src="/gallery-img-2.png" alt="Design 2" className="gallery-item" />
                    <img src="/gallery-img-3.png" alt="Design 3" className="gallery-item" />
                    <img src="/gallery-img-4.png" alt="Design 4" className="gallery-item" />
                </div>
            </section>

            {/* Bottom Nav Placeholder for consistency, though it might not be active on home */}
            {/* The design frames show a bottom nav even on the Home screen. */}
            <nav className="bottom-navbar-home"> {/* Using a slightly different class if behavior differs */}
                {/* Replicate icons from BottomNavbar.js but potentially static or for public access */}
                <div className="nav-item"></div> {/* Placeholder icon */}
                <div className="nav-item"></div> {/* Placeholder icon */}
                <div className="nav-item active"></div> {/* Placeholder icon */}
                <div className="nav-item"></div> {/* Placeholder icon */}
                <div className="nav-item"></div> {/* Placeholder icon */}
            </nav>
        </div>
    );
};

export default HomeScreen;