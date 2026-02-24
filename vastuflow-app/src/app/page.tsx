"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="landing">
      {/* NAV */}
      <nav className="landing-nav">
        <div className="landing-brand">
          Vastu<span>Flow</span>
        </div>
        <div className="landing-nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how" className="nav-link">How It Works</a>
          <Link href="/workspace" className="nav-cta">
            Open Workspace →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="hero-badge">Smart Vastu Analysis Tool</div>
          <h1 className="hero-title">
            Ancient Geometry.<br />
            <span>Modern Precision.</span>
          </h1>
          <p className="hero-desc">
            Upload your floor plan. Trace boundaries. Get comprehensive,
            principle-based Vastu Shastra analysis with exportable reports.
            Built for consultants and architects.
          </p>
          <div className="hero-actions">
            <Link href="/workspace" className="hero-btn-primary">
              Start Analysis →
            </Link>
            <Link href="/workspace" className="hero-btn-ghost">
              View Demo
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          <div className="hero-compass">
            <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Outer ring */}
              <circle cx="150" cy="150" r="140" stroke="var(--accent-gold)" strokeWidth="1" opacity="0.3" />
              <circle cx="150" cy="150" r="120" stroke="var(--accent-gold)" strokeWidth="0.5" opacity="0.2" />
              <circle cx="150" cy="150" r="80" stroke="var(--accent-gold)" strokeWidth="0.5" opacity="0.15" />

              {/* 16 sector lines */}
              {Array.from({ length: 16 }, (_, i) => {
                const angle = (i * 22.5 - 90) * (Math.PI / 180);
                const r1 = 80;
                const r2 = 140;
                return (
                  <line
                    key={i}
                    x1={150 + r1 * Math.cos(angle)}
                    y1={150 + r1 * Math.sin(angle)}
                    x2={150 + r2 * Math.cos(angle)}
                    y2={150 + r2 * Math.sin(angle)}
                    stroke="var(--accent-gold)"
                    strokeWidth={i % 4 === 0 ? 0.8 : 0.3}
                    opacity={i % 4 === 0 ? 0.4 : 0.2}
                  />
                );
              })}

              {/* Brahm Bindu */}
              <circle cx="150" cy="150" r="20" stroke="var(--accent-gold)" strokeWidth="1.5" fill="none" opacity="0.4" />
              <circle cx="150" cy="150" r="12" stroke="var(--accent-gold)" strokeWidth="2" fill="none" opacity="0.6" />
              <line x1="140" y1="150" x2="160" y2="150" stroke="var(--accent-gold)" strokeWidth="1.5" />
              <line x1="150" y1="140" x2="150" y2="160" stroke="var(--accent-gold)" strokeWidth="1.5" />
              <circle cx="150" cy="150" r="4" fill="var(--accent-gold)" />

              {/* Cardinal labels */}
              {["N", "E", "S", "W"].map((dir, i) => {
                const angle = (i * 90 - 90) * (Math.PI / 180);
                const r = 150;
                return (
                  <text
                    key={dir}
                    x={150 + r * Math.cos(angle)}
                    y={150 + r * Math.sin(angle) + 3}
                    textAnchor="middle"
                    fontFamily="'Playfair Display', serif"
                    fontSize="12"
                    fill="var(--accent-gold)"
                    fontWeight="600"
                    opacity="0.6"
                  >
                    {dir}
                  </text>
                );
              })}
            </svg>
          </div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="features-header">
          <div className="section-badge">Capabilities</div>
          <h2 className="section-title">Precision-Built Features</h2>
        </div>
        <div className="features-grid">
          {[
            {
              icon: "◎",
              title: "16-Zone Analysis",
              desc: "Complete directional zone mapping with individual deviation scoring for each sector.",
            },
            {
              icon: "◇",
              title: "Shakti Chakra Overlay",
              desc: "Automatic geometric overlay generation aligned to magnetic north orientation.",
            },
            {
              icon: "◈",
              title: "Interactive Canvas",
              desc: "Click-to-trace perimeter, drag-to-rotate, pinch-to-zoom with real-time feedback.",
            },
            {
              icon: "◉",
              title: "PDF Reports",
              desc: "Professional, branded analysis reports with scores, recommendations, and visual diagrams.",
            },
            {
              icon: "◆",
              title: "10-Step Workflow",
              desc: "Guided, gated process from upload to final report. No step skipped, no room for error.",
            },
            {
              icon: "▣",
              title: "Client-Side Only",
              desc: "All computation runs in your browser. No data ever leaves your machine.",
            },
          ].map((feat, i) => (
            <motion.div
              key={i}
              className="feature-card"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <div className="feature-icon">{feat.icon}</div>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-desc">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section" id="how">
        <div className="features-header">
          <div className="section-badge">Workflow</div>
          <h2 className="section-title">How It Works</h2>
        </div>
        <div className="steps-flow">
          {[
            { step: "01", label: "Upload", desc: "Drop your floor plan image" },
            { step: "02", label: "Align", desc: "Rotate to true north" },
            { step: "03", label: "Trace", desc: "Click boundary vertices" },
            { step: "04", label: "Analyze", desc: "16-zone Vastu evaluation" },
            { step: "05", label: "Report", desc: "Export professional PDF" },
          ].map((s, i) => (
            <motion.div
              key={i}
              className="step-card"
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <div className="step-card-num">{s.step}</div>
              <div>
                <div className="step-card-label">{s.label}</div>
                <div className="step-card-desc">{s.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-brand" style={{ fontSize: "16px" }}>
          Vastu<span>Flow</span>
        </div>
        <div className="footer-meta">
          Smart Vastu Analysis · Deterministic · Client-Side
        </div>
      </footer>

      <style jsx>{`
        .landing {
          min-height: 100vh;
          background: var(--base);
        }

        /* Nav */
        .landing-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 48px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(8px);
        }
        .landing-brand {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: 0.04em;
        }
        .landing-brand span { color: var(--accent-gold); }
        .landing-nav-links {
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .nav-link {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 400;
          color: var(--text-secondary);
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: color 0.15s;
        }
        .nav-link:hover { color: var(--text-primary); }
        .nav-cta {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 500;
          color: var(--base);
          background: var(--text-primary);
          padding: 8px 18px;
          border-radius: 6px;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          transition: all 0.15s;
          box-shadow: var(--shadow-sm);
        }
        .nav-cta:hover {
          background: #2A2820;
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }

        /* Hero */
        .hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 80px 80px 100px;
          max-width: 1200px;
          margin: 0 auto;
          gap: 60px;
        }
        .hero-content { max-width: 560px; }
        .hero-badge {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 500;
          color: var(--accent-gold);
          background: var(--accent-gold-pale);
          border: 1px solid rgba(184,134,11,0.2);
          padding: 4px 12px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 20px;
        }
        .hero-title {
          font-family: var(--font-display);
          font-size: 44px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.15;
          letter-spacing: -0.01em;
          margin-bottom: 18px;
        }
        .hero-title span { color: var(--accent-gold); }
        .hero-desc {
          font-family: var(--font-serif);
          font-size: 18px;
          color: var(--text-secondary);
          line-height: 1.65;
          margin-bottom: 32px;
        }
        .hero-actions { display: flex; gap: 12px; align-items: center; }
        .hero-btn-primary {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 500;
          color: var(--base);
          background: var(--text-primary);
          padding: 12px 28px;
          border-radius: 8px;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          box-shadow: var(--shadow-md);
          transition: all 0.15s;
        }
        .hero-btn-primary:hover {
          background: #2A2820;
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
        }
        .hero-btn-ghost {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: 1.5px solid var(--border-bright);
          padding: 11px 24px;
          border-radius: 8px;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          transition: all 0.15s;
        }
        .hero-btn-ghost:hover {
          background: var(--surface-2);
          color: var(--text-primary);
          transform: translateY(-1px);
        }

        .hero-visual { flex-shrink: 0; }
        .hero-compass {
          width: 320px;
          height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.8;
        }
        .hero-compass svg { width: 100%; height: 100%; }

        /* Features */
        .features, .how-section {
          padding: 80px 80px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .features-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .section-badge {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 500;
          color: var(--accent-gold);
          background: var(--accent-gold-pale);
          border: 1px solid rgba(184,134,11,0.2);
          padding: 3px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          margin-bottom: 12px;
        }
        .section-title {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: 0.01em;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .feature-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 24px;
          transition: all 0.2s;
        }
        .feature-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-3px);
          border-color: rgba(184,134,11,0.3);
        }
        .feature-icon {
          font-size: 18px;
          color: var(--accent-gold);
          margin-bottom: 12px;
        }
        .feature-title {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .feature-desc {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-secondary);
          line-height: 1.7;
        }

        /* Steps flow */
        .steps-flow {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .step-card {
          display: flex;
          align-items: center;
          gap: 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 18px 22px;
          min-width: 200px;
          transition: all 0.2s;
        }
        .step-card:hover {
          box-shadow: var(--shadow-sm);
          border-color: rgba(184,134,11,0.2);
        }
        .step-card-num {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 700;
          color: var(--accent-gold);
          opacity: 0.6;
        }
        .step-card-label {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 500;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .step-card-desc {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        /* Footer */
        .landing-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 48px;
          border-top: 1px solid var(--border);
          background: var(--surface);
        }
        .footer-meta {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-tertiary);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /* ── Responsive: Tablet ── */
        @media (max-width: 1024px) {
          .hero {
            padding: 60px 40px 80px;
            gap: 40px;
          }
          .hero-title { font-size: 36px; }
          .hero-desc { font-size: 16px; }
          .hero-compass { width: 240px; height: 240px; }
          .features, .how-section { padding: 60px 40px; }
          .features-grid { grid-template-columns: repeat(2, 1fr); }
        }

        /* ── Responsive: Mobile ── */
        @media (max-width: 768px) {
          .landing-nav {
            padding: 12px 20px;
          }
          .landing-brand { font-size: 16px; }
          .landing-nav-links { gap: 14px; }
          .nav-link { font-size: 8px; }
          .nav-cta { padding: 6px 12px; font-size: 8px; }

          .hero {
            flex-direction: column;
            padding: 40px 24px 60px;
            text-align: center;
            gap: 32px;
          }
          .hero-content { max-width: 100%; }
          .hero-title { font-size: 30px; }
          .hero-desc { font-size: 15px; margin-bottom: 24px; }
          .hero-actions { justify-content: center; }
          .hero-btn-primary { padding: 10px 24px; }
          .hero-btn-ghost { padding: 9px 20px; }
          .hero-compass { width: 200px; height: 200px; }

          .features, .how-section { padding: 40px 24px; }
          .section-title { font-size: 22px; }
          .features-grid { grid-template-columns: 1fr; gap: 14px; }
          .feature-card { padding: 18px; }
          .feature-title { font-size: 13px; }
          .feature-desc { font-size: 9px; }

          .steps-flow { flex-direction: column; align-items: stretch; }
          .step-card { min-width: 0; padding: 14px 18px; }

          .landing-footer {
            flex-direction: column;
            gap: 8px;
            padding: 16px 24px;
            text-align: center;
          }
        }

        /* ── Responsive: Small phone ── */
        @media (max-width: 480px) {
          .landing-nav { padding: 10px 14px; }
          .landing-brand { font-size: 14px; }
          .nav-link { display: none; }
          .nav-cta { font-size: 7px; padding: 5px 10px; }

          .hero { padding: 28px 16px 40px; }
          .hero-title { font-size: 24px; }
          .hero-desc { font-size: 13px; }
          .hero-badge { font-size: 7px; padding: 3px 8px; }
          .hero-compass { width: 160px; height: 160px; }
          .hero-btn-primary, .hero-btn-ghost { font-size: 8px; padding: 8px 16px; }

          .features, .how-section { padding: 28px 16px; }
          .features-header { margin-bottom: 28px; }
          .section-title { font-size: 18px; }
        }
      `}</style>
    </div>
  );
}
