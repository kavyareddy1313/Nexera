import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import heroMockup from '../assets/hero_mockup.png';
import chatFeature from '../assets/chat_feature.png';
import meetingFeature from '../assets/meeting_feature.png';
import whiteboardFeature from '../assets/whiteboard_feature.png';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">Nexera</div>
        <div className="navbar-links">
          <a href="#product">Product</a>
          <a href="#solutions">Solutions</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
        </div>
        <div className="navbar-actions">
          <button className="btn-login" onClick={() => navigate('/login')}>Login</button>
          <button className="btn-primary" onClick={() => navigate('/login')}>Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <span className="badge">WHAT'S NEW V2.1</span>
          <h1>All-in-one <span className="text-purple">collaboration</span> platform for teams</h1>
          <p>
            Experience the ethereal workspace. Nexera unifies your chat, meetings, and whiteboard into a single, high-performance environment designed for focus.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate('/login')}>Get Started</button>
            <button className="btn-secondary">Download App</button>
          </div>
        </div>
        <div className="hero-visual">
          <img src={heroMockup} alt="Nexera Platform Mockup" className="hero-img" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stat-item">
          <div className="stat-icon">👥</div>
          <h3>10K+</h3>
          <p>ACTIVE USERS</p>
        </div>
        <div className="stat-item">
          <div className="stat-icon">🏢</div>
          <h3>500+</h3>
          <p>GLOBAL TEAMS</p>
        </div>
        <div className="stat-item">
          <div className="stat-icon">🛡️</div>
          <h3>99.9%</h3>
          <p>PLATFORM UPTIME</p>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="feature feature-chat">
        <div className="feature-visual">
          <img src={chatFeature} alt="Real-time Chat" />
        </div>
        <div className="feature-content">
          <span className="feature-label">COMMUNICATION</span>
          <h2>Real-time <span className="text-purple">Chat</span> that actually helps you focus.</h2>
          <p>Organize conversations into threads and spaces. Our intelligent noise reduction keeps you alerted only to what truly matters for your project.</p>
          <a href="#chat" className="feature-link">Explore Chat →</a>
        </div>
      </section>

      <section className="feature feature-meeting feature-reverse">
        <div className="feature-visual">
          <img src={meetingFeature} alt="Nexus Video Meetings" />
        </div>
        <div className="feature-content">
          <span className="feature-label">CONNECT</span>
          <h2>Crystal Clear <span className="text-purple">Meetings</span> with Nexus Video.</h2>
          <p>Experience low-latency 4K video conferencing. Integrated screen sharing and live transcription make every meeting productive and documented.</p>
          <a href="#meeting" className="feature-link">See Nexus Video →</a>
        </div>
      </section>

      <section className="feature feature-whiteboard">
        <div className="feature-visual">
          <img src={whiteboardFeature} alt="Infinite Whiteboard" />
        </div>
        <div className="feature-content">
          <span className="feature-label">IDEATION</span>
          <h2>Infinite <span className="text-purple">Whiteboard</span> for visual thinkers.</h2>
          <p>Brainstorm with anyone, drag-and-drop, and draw together in real-time. From wireframes to mind maps, Nexera boards capture every spark of genius.</p>
          <a href="#whiteboard" className="feature-link">Start Drawing →</a>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-box">
          <div className="cta-content">
            <h2>Ready to transform how your team works?</h2>
            <p>Get the full Nexera experience on any device. Native apps available for macOS, Windows, iOS, and Android.</p>
            <div className="cta-buttons">
              <button className="btn-white"><span className="icon">💻</span> Desktop App</button>
              <button className="btn-outline"><span className="icon">📱</span> Mobile App</button>
            </div>
          </div>
          <div className="cta-qr">
            <div className="qr-card">
              <div className="qr-code">SCAN</div>
              <p>SCAN TO DOWNLOAD</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust">
        <p>EMPOWERING 500+ GLOBAL TEAMS</p>
        <div className="trust-logos">
          <div className="logo-placeholder"></div>
          <div className="logo-placeholder"></div>
          <div className="logo-placeholder"></div>
          <div className="logo-placeholder"></div>
          <div className="logo-placeholder">+496</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-logo">Nexera</div>
            <p>Building the future of distributed work with a focus on speed and uncompromising performance.</p>
          </div>
          <div className="footer-links">
            <div className="link-col">
              <h4>Product</h4>
              <a href="#enterprise">Enterprise</a>
              <a href="#security">Security</a>
            </div>
            <div className="link-col">
              <h4>Legal</h4>
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
            </div>
            <div className="link-col">
              <h4>Contact</h4>
              <a href="#support">Support</a>
              <a href="#sales">Sales</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Nexera. The Ethereal Workspace.</p>
          <div className="social-links">
            <span>🌐</span>
            <span>🐦</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
