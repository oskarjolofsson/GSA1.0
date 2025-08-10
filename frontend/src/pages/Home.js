import '../styles/Home.css';
import golfImg from '../assets/golfer.png';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section className="hero">
      <div className="hero-icon">
        <span className="icon-bg">
          <img
            src={golfImg}
            alt="Globe"
            className="hero-img"
          />
        </span>
      </div>
      <div className="hero-badge">
        <span className="dot" /> Train Like a Pro — Powered by AI
      </div>
      <h1 className="hero-title">
        Practice Smarter. Grow <br />
        <span className="hero-highlight">Faster.</span>
        <span className="hero-italic">With True Form.</span>
      </h1>
      <p className="hero-desc">
        AI-powered golf training with personalized swing feedback.
      </p>
      <Link to="/upload" className="hero-btn">
        Analyse your swing <span className="arrow">↗</span>
      </Link>
    </section>
  );
}