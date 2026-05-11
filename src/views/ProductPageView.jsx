import { useNavigate } from "react-router-dom";
import "../styles/ProductPageView.css";

export default function ProductPageView({ theme = "system", setTheme }) {
    const navigate = useNavigate();

    const features = [
        {
            value: "LED",
            label: "Guided medication reminders",
        },
        {
            value: "24/7",
            label: "Medication routine support",
        },
        {
            value: "Care",
            label: "Optional caregiver access",
        },
    ];

    const productCards = [
        {
            image: "/curadose-product-front.png",
            title: "Clear front interface",
            text: "LED indicators help the user quickly understand which compartment needs attention.",
        },
        {
            image: "/curadose-product-back.png",
            title: "Secure compartment design",
            text: "Separated storage areas support organized medication routines and controlled access.",
        },
    ];

    return (
        <main className="product-page">
            <div className="product-shell">
                <header className="product-navbar">
                    <button className="product-brand" type="button" onClick={() => navigate("/")}>
                        <div className="brand-pill-icon product-brand-icon" aria-hidden>
                            💊
                        </div>
                        <div>
                            <p className="brand-name product-brand-title">CuraDose</p>
                            <p className="product-brand-tagline">Smart Medication, Better Health</p>
                        </div>
                    </button>

                    <div className="product-navbar-actions">
                        <button className="btn-outline product-nav-btn" type="button" onClick={() => navigate("/")}>
                            Home
                        </button>

                        <button className="btn-primary product-nav-btn" type="button" onClick={() => navigate("/create-account")}>
                            Get Started
                        </button>
                    </div>
                </header>

                <div className="product-theme-toggle" role="group" aria-label="Color theme">
                    {["light", "dark", "system"].map((mode) => (
                        <button
                            key={mode}
                            type="button"
                            className={`product-theme-option ${theme === mode ? "product-theme-option--active" : ""}`}
                            onClick={() => setTheme?.(mode)}
                        >
                            {mode === "light" ? "Light" : mode === "dark" ? "Dark" : "System"}
                        </button>
                    ))}
                </div>

                <section className="product-hero">
                    <div className="product-hero-copy">
                        <div className="product-badge">
                            <span className="product-badge-dot" aria-hidden />
                            <span>Smart medication system</span>
                        </div>

                        <h1 className="product-heading">
                            <span>Meet</span>
                            <span>CuraDose.</span>
                        </h1>

                        <p className="product-subtitle">
                            CuraDose is a smart medication box designed to support safer routines,
                            clearer reminders, and better communication between patients and caregivers.
                        </p>

                        <div className="product-cta-row">
                            <button className="btn-primary product-cta-primary" type="button" onClick={() => navigate("/create-account")}>
                                Create Account
                            </button>

                            <button className="btn-outline product-cta-secondary" type="button" onClick={() => navigate("/")}>
                                Back to Home
                            </button>
                        </div>

                        <div className="product-stat-row">
                            {features.map((feature) => (
                                <article className="product-stat-card" key={feature.label}>
                                    <p className="product-stat-value">{feature.value}</p>
                                    <p className="product-stat-label">{feature.label}</p>
                                </article>
                            ))}
                        </div>
                    </div>

                    <div className="product-main-card">
                        <img
                            src="/curadose-product-main.png"
                            alt="CuraDose smart medication box"
                            className="product-main-image"
                        />

                        <div className="product-main-caption">
                            <p className="product-main-title">Connected medication box</p>
                            <p className="product-main-text">
                                Built for daily use with visual feedback and caregiver-ready support.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="product-section">
                    <div className="product-section-header">
                        <p className="product-section-kicker">Device design</p>
                        <h2>Professional, simple and accessible</h2>
                        <p>
                            The product interface focuses on clarity. Instead of overwhelming the user,
                            CuraDose uses simple visual signals, clean compartments, and a calm design language.
                        </p>
                    </div>

                    <div className="product-card-grid">
                        {productCards.map((card) => (
                            <article className="product-detail-card" key={card.title}>
                                <div className="product-detail-image-wrap">
                                    <img src={card.image} alt={card.title} />
                                </div>

                                <div className="product-detail-content">
                                    <h3>{card.title}</h3>
                                    <p>{card.text}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="product-section product-info-section">
                    <article className="product-info-card">
                        <p className="product-section-kicker">How it helps</p>
                        <h2>Designed for safer medication routines</h2>
                        <p>
                            CuraDose combines reminders, visual guidance, medication tracking, and caregiver
                            support in one connected system. The goal is to reduce missed doses and make
                            everyday medication management easier to follow.
                        </p>

                        <div className="product-info-list">
                            <div>
                                <strong>Patient support</strong>
                                <span>Simple reminders and clear compartment guidance.</span>
                            </div>

                            <div>
                                <strong>Caregiver visibility</strong>
                                <span>Caregivers can follow routines and support the patient when needed.</span>
                            </div>

                            <div>
                                <strong>Secure access</strong>
                                <span>Medication access can be organized around schedules and permissions.</span>
                            </div>
                        </div>
                    </article>
                </section>
            </div>
        </main>
    );
}