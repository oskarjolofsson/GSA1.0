import React from 'react';
import './Hero.css';

const Hero = () => {
    return (
        <div className="hero-container">
            <div className="hero-content">
                <h1 className="hero-title">Welcome to Our Platform</h1>
                <p className="hero-description">
                    Discover endless possibilities and transform the way you experience the web.
                </p>
                <button className="hero-button">Get Started</button>
            </div>
        </div>
    );
};

export default Hero;
