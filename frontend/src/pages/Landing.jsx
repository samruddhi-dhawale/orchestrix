import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

const STEPS = ["Validate Configuration", "Checkout Source", "Build", "Test", "Package", "Publish Artifact"];
const FEATURES = [
  ["Step-by-step results", "Every run reports each of the six steps with its status and message."],
  ["Clear failures", "When a step fails you see which one and why. The remaining steps stay unrun."],
  ["One dashboard", "Totals, active runs and the latest results for every component in one place."],
  ["Ready to extend", "Steps and artifact publishing are pluggable, so real tooling can replace the demo steps."],
];
const FLOW = [
  ["Choose", "Pick a component and subcomponent."],
  ["Configure", "Set the branch and the target environment."],
  ["Run", "One click starts all six pipeline steps."],
  ["Review", "See results on the dashboard and the executions list."],
];

function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${shown ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function Landing() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing">
      <header className={`lp-header ${scrolled ? "scrolled" : ""}`}>
        <a href="#top" className="lp-brand"><span className="lp-logo">O</span>Orchestrix</a>
        <nav className="lp-nav" aria-label="Main">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
        </nav>
        <div className="lp-actions">
          <Link to="/login" className="lp-link">Sign in</Link>
          <Link to="/dashboard" className="lp-btn">Open dashboard</Link>
        </div>
      </header>

      <main id="top">
        <section className="lp-hero">
          <div className="blob blob-a" /><div className="blob blob-b" />
          <div className="hero-copy">
            <span className="lp-pill up" style={{ "--d": "0ms" }}>CI/CD from one screen</span>
            <h1 className="up" style={{ "--d": "80ms" }}>Ship every build with <em>confidence</em></h1>
            <p className="up" style={{ "--d": "160ms" }}>
              Orchestrix runs your pipeline from checkout to publish and shows every step as it happens.
            </p>
            <div className="hero-cta up" style={{ "--d": "240ms" }}>
              <Link to="/login" className="lp-btn lg">Get started</Link>
              <Link to="/dashboard" className="lp-btn lg ghost">View dashboard</Link>
            </div>
            <p className="hero-stats up" style={{ "--d": "320ms" }}>6 automated steps &nbsp;·&nbsp; 3 environments &nbsp;·&nbsp; 1 dashboard</p>
          </div>

          <div className="hero-visual up" style={{ "--d": "200ms" }} aria-hidden="true">
            <div className="chip chip-a">Build passed</div>
            <div className="chip chip-b">Deployed to development</div>
            <div className="run-card">
              <div className="run-card-top">
                <strong>component-a / sub-a1</strong>
                <span className="badge running">Running</span>
              </div>
              <ol>
                {STEPS.map((s, i) => (
                  <li key={s} style={{ "--i": i }}><span className="tick" />{s}</li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="features" className="lp-section">
          <Reveal><h2>Everything a release needs</h2><p className="lp-sub">Less switching between tools, more time shipping.</p></Reveal>
          <div className="feature-grid">
            {FEATURES.map(([t, d], i) => (
              <Reveal key={t} delay={i * 80} className="feature">
                <span className="feature-num">0{i + 1}</span>
                <h3>{t}</h3><p>{d}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="how" className="lp-section alt">
          <Reveal><h2>How it works</h2><p className="lp-sub">From idea to result in four moves.</p></Reveal>
          <ol className="lp-flow">
            {FLOW.map(([t, d], i) => (
              <Reveal key={t} delay={i * 80} className="lp-flow-item">
                <li><span className="lp-flow-n">{i + 1}</span><h3>{t}</h3><p>{d}</p></li>
              </Reveal>
            ))}
          </ol>
        </section>

        <Reveal className="lp-cta">
          <h2>Ready to run your first pipeline?</h2>
          <Link to="/login" className="lp-btn lg light">Get started</Link>
        </Reveal>
      </main>

      <footer className="lp-footer">
        <div className="lp-foot-brand">
          <a href="#top" className="lp-brand"><span className="lp-logo">O</span>Orchestrix</a>
          <p>Pipeline orchestration, made visible.</p>
        </div>
        <div><h4>Product</h4><Link to="/dashboard">Dashboard</Link><Link to="/pipeline">New run</Link><Link to="/executions">Executions</Link></div>
        <div><h4>Explore</h4><a href="#features">Features</a><a href="#how">How it works</a><Link to="/login">Sign in</Link></div>
        <p className="lp-copy">© 2026 Orchestrix. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Landing;
