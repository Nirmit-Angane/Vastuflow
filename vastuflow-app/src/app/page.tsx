"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import anime from "animejs";

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = anime.timeline({ easing: "easeOutExpo" });

    tl.add({
      targets: ".compass-line, .compass-circle",
      strokeDashoffset: [anime.setDashoffset, 0],
      opacity: [0, (el: HTMLElement | SVGElement) => el.getAttribute("data-op") || 1],
      easing: "easeInOutSine",
      duration: 1500,
      delay: anime.stagger(50, { start: 200 }),
    })
      .add({
        targets: ".compass-dot, .compass-label",
        opacity: [0, (el: HTMLElement | SVGElement) => el.getAttribute("data-op") || 1],
        scale: [0.5, 1],
        duration: 800,
        delay: anime.stagger(100),
      }, "-=800")
      .add({
        targets: ".hero-stagger",
        translateY: [40, 0],
        opacity: [0, 1],
        duration: 1200,
        delay: anime.stagger(150),
      }, "-=1200")
      .add({
        targets: ".landing-nav",
        translateY: [-20, 0],
        opacity: [0, 1],
        duration: 800,
      }, "-=1400");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          anime({
            targets: entry.target,
            translateY: [30, 0],
            opacity: [0, 1],
            duration: 800,
            easing: "easeOutCubic",
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    const scrollElements = document.querySelectorAll(".scroll-anim");
    scrollElements.forEach((el) => {
      el.setAttribute("style", "opacity: 0;");
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing" ref={containerRef}>
      <nav className="landing-nav" style={{ opacity: 0 }}>
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

      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge hero-stagger">Smart Vastu Analysis Tool</div>
          <h1 className="hero-title hero-stagger">
            Ancient Geometry.<br />
            <span>Modern Precision.</span>
          </h1>
          <p className="hero-desc hero-stagger">
            Upload your floor plan. Trace boundaries. Get comprehensive,
            principle-based Vastu Shastra analysis with exportable reports.
            Powered by advanced deterministic geometry algorithms. Built for consultants and architects.
          </p>
          <div className="hero-actions hero-stagger">
            <Link href="/workspace" className="hero-btn-primary">
              Start Analysis →
            </Link>
            <Link href="/workspace" className="hero-btn-ghost">
              View Demo
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-compass">
            <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="compass-circle" data-op="0.3" cx="150" cy="150" r="140" stroke="var(--accent-gold)" strokeWidth="1" opacity="0" />
              <circle className="compass-circle" data-op="0.2" cx="150" cy="150" r="120" stroke="var(--accent-gold)" strokeWidth="0.5" opacity="0" />
              <circle className="compass-circle" data-op="0.15" cx="150" cy="150" r="80" stroke="var(--accent-gold)" strokeWidth="0.5" opacity="0" />

              {Array.from({ length: 16 }, (_, i) => {
                const angle = (i * 22.5 - 90) * (Math.PI / 180);
                const r1 = 80;
                const r2 = 140;
                const isMajor = i % 4 === 0;
                return (
                  <line
                    key={i}
                    className="compass-line"
                    data-op={isMajor ? "0.4" : "0.2"}
                    x1={150 + r1 * Math.cos(angle)}
                    y1={150 + r1 * Math.sin(angle)}
                    x2={150 + r2 * Math.cos(angle)}
                    y2={150 + r2 * Math.sin(angle)}
                    stroke="var(--accent-gold)"
                    strokeWidth={isMajor ? 0.8 : 0.3}
                    opacity="0"
                  />
                );
              })}

              <circle className="compass-circle" data-op="0.4" cx="150" cy="150" r="20" stroke="var(--accent-gold)" strokeWidth="1.5" fill="none" opacity="0" />
              <circle className="compass-circle" data-op="0.6" cx="150" cy="150" r="12" stroke="var(--accent-gold)" strokeWidth="2" fill="none" opacity="0" />
              <line className="compass-line" data-op="1" x1="140" y1="150" x2="160" y2="150" stroke="var(--accent-gold)" strokeWidth="1.5" opacity="0" />
              <line className="compass-line" data-op="1" x1="150" y1="140" x2="150" y2="160" stroke="var(--accent-gold)" strokeWidth="1.5" opacity="0" />
              <circle className="compass-dot" data-op="1" cx="150" cy="150" r="4" fill="var(--accent-gold)" opacity="0" />

              {["N", "E", "S", "W"].map((dir, i) => {
                const angle = (i * 90 - 90) * (Math.PI / 180);
                const r = 150;
                return (
                  <text
                    key={dir}
                    className="compass-label"
                    data-op="0.8"
                    x={150 + r * Math.cos(angle)}
                    y={150 + r * Math.sin(angle) + 4}
                    textAnchor="middle"
                    fontFamily="'Playfair Display', serif"
                    fontSize="14"
                    fill="var(--accent-gold)"
                    fontWeight="700"
                    opacity="0"
                  >
                    {dir}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="features-header scroll-anim">
          <div className="section-badge">Capabilities</div>
          <h2 className="section-title">Precision-Built Features</h2>
        </div>
        <div className="features-grid">
          {[
            { icon: "◎", title: "16-Zone Analysis", desc: "Complete directional zone mapping with individual deviation scoring for each sector." },
            { icon: "◇", title: "Shakti Chakra Overlay", desc: "Automatic geometric overlay generation aligned to true coordinate orientation." },
            { icon: "◈", title: "Interactive Canvas & Builder", desc: "Trace image perimeters or construct precise geometric maps from scratch in feet." },
            { icon: "◉", title: "Advanced Marma Points", desc: "Calculates precise internal energy nodes (Marma) avoiding crucial structural overlaps." },
            { icon: "◆", title: "Detailed PDF Reports", desc: "Professional, branded analysis reports with zone charts, scores, and visual diagrams." },
            { icon: "▣", title: "Deterministic Engine", desc: "Zero-dependency pure math algorithms ensure perfectly consistent calculations offline." },
          ].map((feat, i) => (
            <div key={i} className="feature-card scroll-anim">
              <div className="feature-icon">{feat.icon}</div>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-desc">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="how-section" id="how">
        <div className="features-header scroll-anim">
          <div className="section-badge">Workflow</div>
          <h2 className="section-title">How It Works</h2>
        </div>
        <div className="steps-flow">
          {[
            { step: "01", label: "Create", desc: "Upload plan or draw map" },
            { step: "02", label: "Align", desc: "Set geometric north" },
            { step: "03", label: "Trace", desc: "Click boundary vertices" },
            { step: "04", label: "Analyze", desc: "16-zone evaluation" },
            { step: "05", label: "Report", desc: "Export professional PDF" },
          ].map((s, i) => (
            <div key={i} className="step-card scroll-anim">
              <div className="step-card-num">{s.step}</div>
              <div>
                <div className="step-card-label">{s.label}</div>
                <div className="step-card-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer scroll-anim">
        <div className="landing-brand" style={{ fontSize: "16px" }}>
          Vastu<span>Flow</span>
        </div>
        <div className="footer-meta">
          Smart Vastu Analysis · Deterministic Math Engine · Client-Side Processing
        </div>
      </footer>

      <style jsx>{`
        .landing { min-height: 100vh; background: var(--base); overflow-x: hidden; }
        .landing-nav { display: flex; align-items: center; justify-content: space-between; padding: 16px 48px; border-bottom: 1px solid var(--border); background: rgba(247, 246, 242, 0.8); position: sticky; top: 0; z-index: 100; backdrop-filter: blur(12px); }
        .landing-brand { font-family: var(--font-display); font-size: 20px; font-weight: 600; color: var(--text-primary); letter-spacing: 0.04em; }
        .landing-brand span { color: var(--accent-gold); }
        .landing-nav-links { display: flex; align-items: center; gap: 28px; }
        .nav-link { font-family: var(--font-mono); font-size: 10px; font-weight: 400; color: var(--text-secondary); text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em; transition: color 0.15s; }
        .nav-link:hover { color: var(--text-primary); }
        .nav-cta { font-family: var(--font-mono); font-size: 10px; font-weight: 500; color: var(--base); background: var(--text-primary); padding: 8px 18px; border-radius: 6px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.08em; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: var(--shadow-sm); }
        .nav-cta:hover { background: #2A2820; box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .hero { display: flex; align-items: center; justify-content: space-between; padding: 100px 80px 120px; max-width: 1200px; margin: 0 auto; gap: 60px; position: relative; }
        .hero::before { content: ''; position: absolute; top: -100px; right: -100px; width: 600px; height: 600px; background: radial-gradient(circle, rgba(184,134,11,0.03) 0%, transparent 70%); z-index: 0; pointer-events: none; }
        .hero-content { max-width: 580px; position: relative; z-index: 10; }
        .hero-badge { display: inline-block; font-family: var(--font-mono); font-size: 9px; font-weight: 500; color: var(--accent-gold); background: var(--accent-gold-pale); border: 1px solid rgba(184,134,11,0.2); padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 24px; }
        .hero-title { font-family: var(--font-display); font-size: 52px; font-weight: 700; color: var(--text-primary); line-height: 1.1; letter-spacing: -0.01em; margin-bottom: 24px; }
        .hero-title span { color: transparent; background: linear-gradient(90deg, var(--accent-gold) 0%, #d4a017 100%); -webkit-background-clip: text; background-clip: text; }
        .hero-desc { font-family: var(--font-serif); font-size: 19px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 40px; }
        .hero-actions { display: flex; gap: 16px; align-items: center; }
        .hero-btn-primary { font-family: var(--font-mono); font-size: 11px; font-weight: 600; color: var(--base); background: var(--text-primary); padding: 14px 32px; border-radius: 8px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 4px 12px rgba(28, 26, 21, 0.15); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .hero-btn-primary:hover { background: #2A2820; box-shadow: 0 8px 24px rgba(28, 26, 21, 0.2); transform: translateY(-2px); }
        .hero-btn-ghost { font-family: var(--font-mono); font-size: 11px; font-weight: 600; color: var(--text-secondary); background: transparent; border: 1.5px solid var(--border-bright); padding: 13px 28px; border-radius: 8px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .hero-btn-ghost:hover { background: var(--surface-2); color: var(--text-primary); border-color: rgba(184,134,11,0.3); transform: translateY(-2px); }
        .hero-visual { flex-shrink: 0; position: relative; z-index: 10; }
        .hero-compass { width: 420px; height: 420px; display: flex; align-items: center; justify-content: center; position: relative; }
        .hero-compass::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle, rgba(184,134,11,0.05) 0%, transparent 60%); z-index: -1; }
        .hero-compass svg { width: 100%; height: 100%; overflow: visible; }
        .features, .how-section { padding: 100px 80px; max-width: 1200px; margin: 0 auto; position: relative; }
        .features-header { text-align: center; margin-bottom: 60px; }
        .section-badge { display: inline-block; font-family: var(--font-mono); font-size: 9px; font-weight: 500; color: var(--accent-gold); background: var(--accent-gold-pale); border: 1px solid rgba(184,134,11,0.2); padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.16em; margin-bottom: 16px; }
        .section-title { font-family: var(--font-display); font-size: 36px; font-weight: 600; color: var(--text-primary); letter-spacing: 0.01em; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .feature-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 32px; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: var(--shadow-sm); }
        .feature-card:hover { box-shadow: 0 12px 32px rgba(184,134,11,0.08); transform: translateY(-6px); border-color: rgba(184,134,11,0.3); }
        .feature-icon { font-size: 24px; color: var(--accent-gold); margin-bottom: 16px; }
        .feature-title { font-family: var(--font-display); font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 10px; }
        .feature-desc { font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary); line-height: 1.7; }
        .steps-flow { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }
        .step-card { display: flex; align-items: center; gap: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px 28px; min-width: 220px; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .step-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(184,134,11,0.06); border-color: rgba(184,134,11,0.25); }
        .step-card-num { font-family: var(--font-display); font-size: 28px; font-weight: 700; color: var(--accent-gold); opacity: 0.4; transition: opacity 0.3s; }
        .step-card:hover .step-card-num { opacity: 0.8; }
        .step-card-label { font-family: var(--font-mono); font-size: 12px; font-weight: 600; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.1em; }
        .step-card-desc { font-family: var(--font-mono); font-size: 10px; color: var(--text-secondary); margin-top: 4px; }
        .landing-footer { display: flex; align-items: center; justify-content: space-between; padding: 32px 64px; border-top: 1px solid var(--border); background: var(--surface); }
        .footer-meta { font-family: var(--font-mono); font-size: 10px; color: var(--text-tertiary); letter-spacing: 0.1em; text-transform: uppercase; }
        @media (max-width: 1024px) { .hero { padding: 60px 40px 80px; gap: 40px; flex-direction: column; text-align: center; } .hero-content { align-items: center; display: flex; flex-direction: column; } .hero-title { font-size: 42px; } .hero-desc { font-size: 17px; max-width: 480px; } .hero-compass { width: 320px; height: 320px; margin: 0 auto; } .features, .how-section { padding: 60px 40px; } .features-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { .landing-nav { padding: 12px 20px; } .landing-brand { font-size: 16px; } .landing-nav-links { gap: 14px; } .nav-link { font-size: 8px; } .nav-cta { padding: 6px 12px; font-size: 8px; } .hero { padding: 40px 24px 60px; gap: 32px; } .hero-title { font-size: 32px; } .hero-desc { font-size: 15px; margin-bottom: 24px; } .hero-actions { justify-content: center; } .hero-btn-primary { padding: 12px 24px; } .hero-btn-ghost { padding: 11px 20px; } .hero-compass { width: 260px; height: 260px; } .features, .how-section { padding: 40px 24px; } .section-title { font-size: 26px; } .features-grid { grid-template-columns: 1fr; gap: 16px; } .feature-card { padding: 24px; } .steps-flow { flex-direction: column; align-items: stretch; } .step-card { min-width: 0; padding: 16px 20px; } .landing-footer { flex-direction: column; gap: 12px; padding: 24px; text-align: center; } }
        @media (max-width: 480px) { .landing-nav { padding: 10px 14px; } .landing-brand { font-size: 14px; } .nav-link { display: none; } .nav-cta { font-size: 7px; padding: 6px 10px; } .hero { padding: 28px 16px 40px; } .hero-title { font-size: 26px; } .hero-desc { font-size: 14px; } .hero-badge { font-size: 8px; padding: 3px 10px; } .hero-compass { width: 220px; height: 220px; } .hero-actions { flex-direction: column; width: 100%; } .hero-btn-primary, .hero-btn-ghost { width: 100%; text-align: center; } .features, .how-section { padding: 32px 16px; } .features-header { margin-bottom: 32px; } .section-title { font-size: 22px; } }
      `}</style>
    </div>
  );
}
