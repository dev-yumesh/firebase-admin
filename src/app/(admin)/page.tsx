"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  ArrowRight,
  CheckCircle,
  LayoutDashboard,
  Layers,
  QrCode,
  Star,
  Ticket,
  Users,
  UtensilsCrossed,
} from "lucide-react";

export default function HomeHeroPage() {
  useEffect(() => {
    const onScroll = () => {
      const nav = document.getElementById("navbar");
      if (!nav) return;
      if (window.scrollY > 50) {
        nav.classList.add("scrolled");
      } else {
        nav.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", onScroll);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document
      .querySelectorAll(
        ".feature-card, .step, .dashboard-content, .dashboard-img"
      )
      .forEach((el) => {
        (el as HTMLElement).style.opacity = "0";
        observer.observe(el);
      });

    const params = new URLSearchParams(window.location.search);
    if ([...params].length) {
      const appRedirectUrl = `recipebook://qr?${params.toString()}`;
      window.location.replace(appRedirectUrl);
      setTimeout(() => {
        window.location.href =
          "https://play.google.com/store/apps/details?id=com.cgjobschool&hl=en_IN";
      }, 1500);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <nav id="navbar">
        <div className="logo">
          <UtensilsCrossed size={24} />
          Recipe Book
        </div>
        <ul className="nav-links">
          <li>
            <a href="#features">Features</a>
          </li>
          <li>
            <a href="#how-it-works">How it Works</a>
          </li>
          <li>
            <a href="#dashboard">Dashboard</a>
          </li>
          <li>
            <a href="/dashboard" className="btn-register">
              Get Started
            </a>
          </li>
        </ul>
      </nav>

      <section className="hero">
        <h1 className="fade-in">Modern Token Ordering for Busy Food Stalls</h1>
        <p className="fade-in" style={{ animationDelay: "0.2s" }}>
          Transform your restaurant with digital menu management, QR ordering,
          and automated token generation. Save time and boost sales.
        </p>
        <div className="hero-btns fade-in" style={{ animationDelay: "0.4s" }}>
          <Link href="/signup" className="btn btn-primary">
            Register as Shop Owner
            <ArrowRight size={18} />
          </Link>
          <a href="#features" className="btn btn-outline">
            Explore Features
          </a>
        </div>
      </section>

      <section className="features" id="features">
        <span className="section-tag">Powerful Features</span>
        <h2 className="section-title">Everything you need to manage your shop</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <QrCode />
            </div>
            <h3>QR Code Ordering</h3>
            <p>
              Allow customers to scan and order directly from their table. No
              more long queues at the counter.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Ticket />
            </div>
            <h3>Token Generation</h3>
            <p>
              Automated token slips for customers. Integrated with thermal
              printers for professional receipts.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <LayoutDashboard />
            </div>
            <h3>Sales Dashboard</h3>
            <p>
              Track your daily, weekly, and monthly sales with detailed
              analytics and performance reports.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Layers />
            </div>
            <h3>Floor Management</h3>
            <p>
              Manage multiple floors and seating arrangements effortlessly with
              unique table identifiers.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Users />
            </div>
            <h3>Staff Authority</h3>
            <p>
              Add managers and assign specific roles to keep your operations
              secure and organized.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Star />
            </div>
            <h3>Customer Feedback</h3>
            <p>
              Direct communication with your customers through ratings and
              reviews for items and service.
            </p>
          </div>
        </div>
      </section>

      <section className="how-it-works" id="how-it-works">
        <span className="section-tag">Seamless Flow</span>
        <h2 className="section-title">How it works for your customers</h2>

        <div className="step-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Scan QR</h3>
            <p>
              Customer scans the unique Shop or Table QR code using their
              smartphone.
            </p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Place Order</h3>
            <p>
              Browses your digital menu, selects items, and confirms the order
              instantly.
            </p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Get Token</h3>
            <p>
              System generates a digital token. Owner prints it and hands it to
              the customer.
            </p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Enjoy Food</h3>
            <p>
              Customer collects food when their token is called. Smooth and
              efficient!
            </p>
          </div>
        </div>
      </section>

      <section className="dashboard-preview" id="dashboard">
        <div className="dashboard-content">
          <span className="section-tag">Admin Power</span>
          <h2 style={{ fontSize: "2.8rem", marginBottom: "25px" }}>
            Stay on top of your business with our Dashboard
          </h2>
          <p
            style={{
              color: "var(--text-light)",
              marginBottom: "30px",
              fontSize: "1.1rem",
            }}
          >
            Monitor your restaurant&apos;s health in real-time. View active
            orders, peak hours, and top-selling items all from one beautiful
            interface.
          </p>
          <ul style={{ listStyle: "none", marginBottom: "40px" }}>
            <li
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                marginBottom: "15px",
              }}
            >
              <CheckCircle size={18} style={{ color: "var(--indigo)" }} />
              Real-time sales tracking
            </li>
            <li
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                marginBottom: "15px",
              }}
            >
              <CheckCircle size={18} style={{ color: "var(--indigo)" }} />
              Inventory &amp; Menu control
            </li>
            <li
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                marginBottom: "15px",
              }}
            >
              <CheckCircle size={18} style={{ color: "var(--indigo)" }} />
              Customer insight analytics
            </li>
          </ul>
          <Link href="/dashboard" className="btn btn-primary dashboard-link-btn">
            Explore Dashboard
          </Link>
        </div>
        <div className="dashboard-img">
          <div className="mock-card">
            <div className="mock-stats-row">
              <div className="mock-stat-box">
                <span className="mock-label">Daily Sales</span>
                <div className="mock-value primary">₹12,450</div>
              </div>
              <div className="mock-stat-box">
                <span className="mock-label">Orders</span>
                <div className="mock-value">42</div>
              </div>
              <div className="mock-stat-box">
                <span className="mock-label">Customers</span>
                <div className="mock-value">128</div>
              </div>
            </div>
            <div className="mock-chart">
              <div style={{ height: "40%" }} />
              <div style={{ height: "60%" }} />
              <div style={{ height: "85%" }} />
              <div style={{ height: "50%" }} />
              <div style={{ height: "70%" }} />
              <div style={{ height: "95%" }} />
              <div style={{ height: "40%" }} />
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <h2>Ready to grow your shop?</h2>
        <p>
          Join hundreds of food stall owners using Recipe Book to simplify their
          business.
        </p>
        <Link href="/signup" className="btn cta-btn">
          Get Started for Free
        </Link>
      </section>

      <footer>
        <div>
          <div className="footer-logo">Recipe Book</div>
          <p className="footer-desc">
            Empowering small food vendors with modern digital solutions.
          </p>
        </div>
        <div className="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li>
              <a href="#">About Us</a>
            </li>
            <li>
              <a href="#">Pricing</a>
            </li>
            <li>
              <a href="#">Support</a>
            </li>
            <li>
              <a href="#">Terms</a>
            </li>
          </ul>
        </div>
        <div className="footer-links">
          <h4>Contact</h4>
          <ul>
            <li>
              <a href="mailto:support@recipebook.com">support@recipebook.com</a>
            </li>
            <li>
              <a href="tel:+919876543210">+91 98765 43210</a>
            </li>
          </ul>
        </div>
      </footer>

      <style jsx global>{`
        :root {
          --primary: #ff4d00;
          --primary-dark: #e64500;
          --primary-light: #ff7033;
          --secondary: #1a1a1a;
          --indigo: #4f46e5;
          --indigo-light: #6366f1;
          --accent: #ff9500;
          --bg-light: #f8f9fa;
          --text-main: #2d3436;
          --text-light: #636e72;
          --glass: rgba(255, 255, 255, 0.8);
          --transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        .section-tag,
        .section-title {
          color: inherit;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .fade-in {
          animation: fadeInUp 0.8s forwards;
        }

        nav#navbar {
          position: fixed;
          top: 0;
          width: 100%;
          padding: 20px 5%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 1000;
          background: transparent;
          transition: var(--transition);
        }

        nav#navbar.scrolled {
          background: var(--glass);
          backdrop-filter: blur(10px);
          padding: 15px 5%;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        }

        .logo {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--primary);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .nav-links {
          display: flex;
          gap: 30px;
          list-style: none;
        }

        .nav-links a {
          text-decoration: none;
          color: white;
          font-weight: 500;
          transition: var(--transition);
        }

        nav#navbar.scrolled .nav-links a {
          color: var(--secondary);
        }

        .nav-links a:hover {
          color: var(--indigo);
        }

        .btn-register {
          background: linear-gradient(135deg, var(--primary), var(--indigo));
          color: white !important;
          padding: 10px 25px;
          border-radius: 50px;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
        }

        .hero {
          min-height: 100vh;
          background: linear-gradient(
              135deg,
              rgba(0, 0, 0, 0.7) 0%,
              rgba(79, 70, 229, 0.4) 100%
            ),
            url("/hero_background.png");
          background-size: cover;
          background-position: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          color: white;
          padding: 0 10%;
        }

        .hero h1 {
          font-size: 4rem;
          margin-bottom: 20px;
          letter-spacing: -1px;
          max-width: 900px;
          background: linear-gradient(to right, #fff, #ddd);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero p {
          font-size: 1.25rem;
          max-width: 600px;
          margin-bottom: 40px;
          opacity: 0.9;
        }

        .hero-btns {
          display: flex;
          gap: 20px;
        }

        .btn {
          padding: 15px 35px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 700;
          font-size: 1rem;
          transition: var(--transition);
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--indigo));
          color: white;
          box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
          border: none;
        }

        .btn-primary:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(79, 70, 229, 0.4);
          filter: brightness(1.1);
        }

        .btn-outline {
          background: transparent;
          color: white;
          border: 2px solid white;
        }

        .btn-outline:hover {
          background: white;
          color: var(--secondary);
        }

        .features {
          padding: 100px 10%;
          background: white;
        }

        .section-tag {
          color: var(--indigo);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          display: block;
          margin-bottom: 10px;
          text-align: center;
        }

        .section-title {
          font-size: 2.5rem;
          text-align: center;
          margin-bottom: 60px;
          color: var(--secondary);
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 30px;
        }

        .feature-card {
          background: var(--bg-light);
          padding: 40px;
          border-radius: 24px;
          transition: var(--transition);
          border: 1px solid transparent;
        }

        .feature-card:hover {
          transform: translateY(-10px);
          background: white;
          border-color: rgba(255, 77, 0, 0.1);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
        }

        .feature-icon {
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--indigo);
          margin-bottom: 25px;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
        }

        .feature-card h3 {
          margin-bottom: 15px;
          font-size: 1.5rem;
        }

        .feature-card p {
          color: var(--text-light);
        }

        .how-it-works {
          padding: 100px 10%;
          background: var(--secondary);
          color: white;
        }

        .step-container {
          display: flex;
          justify-content: space-between;
          margin-top: 60px;
          position: relative;
        }

        .step-container::before {
          content: "";
          position: absolute;
          top: 40px;
          left: 0;
          width: 100%;
          height: 2px;
          background: rgba(255, 255, 255, 0.1);
          z-index: 1;
        }

        .step {
          flex: 1;
          text-align: center;
          position: relative;
          z-index: 2;
          padding: 0 20px;
        }

        .step-number {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, var(--primary), var(--indigo));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 800;
          margin: 0 auto 30px;
          box-shadow: 0 0 30px rgba(79, 70, 229, 0.4);
          border: 8px solid var(--secondary);
        }

        .step h3 {
          margin-bottom: 10px;
        }

        .step p {
          opacity: 0.7;
          font-size: 0.95rem;
        }

        .dashboard-preview {
          padding: 100px 10%;
          background: #f0f2f5;
          display: flex;
          align-items: center;
          gap: 60px;
        }

        .dashboard-content {
          flex: 1;
        }

        .dashboard-img {
          flex: 1.2;
          background: white;
          border-radius: 30px;
          padding: 20px;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .dashboard-link-btn {
          width: fit-content;
        }

        .mock-card {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 20px;
          border: 1px solid #eee;
        }

        .mock-stats-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .mock-stat-box {
          height: 100px;
          width: 30%;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
          padding: 15px;
        }

        .mock-label {
          font-size: 0.8rem;
          color: #999;
        }

        .mock-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2d3436;
        }

        .mock-value.primary {
          color: var(--primary);
        }

        .mock-chart {
          height: 200px;
          width: 100%;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
          padding: 15px;
          display: flex;
          align-items: flex-end;
          gap: 10px;
        }

        .mock-chart > div {
          width: 10%;
          border-radius: 4px;
          background: #e0e7ff;
        }

        .mock-chart > div:nth-child(2),
        .mock-chart > div:nth-child(5) {
          background: #c7d2fe;
        }

        .mock-chart > div:nth-child(3),
        .mock-chart > div:nth-child(6) {
          background: var(--indigo);
        }

        .cta {
          padding: 100px 10%;
          text-align: center;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
        }

        .cta h2 {
          font-size: 3rem;
          margin-bottom: 20px;
        }

        .cta p {
          font-size: 1.2rem;
          margin-bottom: 40px;
          opacity: 0.9;
        }

        .cta-btn {
          background: white;
          color: var(--primary);
          border: none;
          font-size: 1.2rem;
          padding: 20px 50px;
        }

        footer {
          padding: 60px 10%;
          background: var(--secondary);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
        }

        .footer-logo {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--primary);
          margin-bottom: 20px;
        }

        .footer-desc {
          color: rgba(255, 255, 255, 0.6);
          max-width: 300px;
        }

        .footer-links h4 {
          margin-bottom: 20px;
          font-size: 1.1rem;
        }

        .footer-links ul {
          list-style: none;
        }

        .footer-links li {
          margin-bottom: 10px;
        }

        .footer-links a {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          transition: var(--transition);
        }

        .footer-links a:hover {
          color: var(--primary);
        }

        @media (max-width: 768px) {
          .hero h1 {
            font-size: 2.5rem;
          }

          .nav-links {
            display: none;
          }

          .feature-grid {
            grid-template-columns: 1fr;
          }

          .step-container {
            flex-direction: column;
            gap: 40px;
          }

          .step-container::before {
            display: none;
          }

          .dashboard-preview {
            flex-direction: column;
            text-align: center;
          }

          .hero-btns {
            flex-direction: column;
            width: 100%;
          }

          .btn {
            justify-content: center;
          }

          footer {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
