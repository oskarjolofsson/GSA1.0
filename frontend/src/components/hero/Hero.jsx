import "../../styles/comp1.css";

import { Link } from 'react-router-dom';
import Upload from "../fileUpload/VideoUploader.jsx"

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
                Swing Smarter. Play Better
                <span className="subtitle">Accurate, fast</span>
              </h1>
              <p className="desc">
               AI-powered Golf Swing Analyzer that helps you perfect your game. 
               Innovative, accurate, and designed to give you real-time insights for faster improvement on the course
              </p>
            </div>

            {/* Right column: modern CTA
             <div className="upload-wrap">
              <Upload />
            </div> */}
          </div>
        </section>
      </div>
    </div>
  );
}