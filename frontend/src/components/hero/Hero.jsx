// Hero.jsx
import React from "react";
import "./hero.css";
import { FileUpload } from 'primereact/fileupload';

import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <div className="page-wrap">
      {/* White frame hugging the viewport edges with a small margin */}
      <div className="frame">
        {/* Inner surface with soft radius to create a smooth transition between frame and page */}
        <section className="surface">
          <div className="hero">
            {/* Left column: heading + description */}
            <div className="copy">
              <h1 className="title">
                Swing Smarter. Play Bette
                <span className="subtitle">Accurate, fast</span>
              </h1>
              <p className="desc">
               AI-powered Golf Swing Analyzer that helps you perfect your game. 
               Innovative, accurate, and designed to give you real-time insights for faster improvement on the course
              </p>
            </div>

            {/* Right column: modern CTA */}
            <div className="cta-wrap">
              <a className="cta" href="#get-started" aria-label="Get started">
                <span>Get started</span>
                <svg className="cta-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M13.5 4.5L21 12l-7.5 7.5M21 12H3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <div className="support-links" aria-label="Secondary actions">
                <Link to="/" className="support-link">Learn more</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}