"use client";

import Link from "next/link";
import {
  defaultDashboardPathForRole,
  validateAuthSessionWithBackend,
} from "@/lib/authSession";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let cancelled = false;

    if ([...params].length === 0) {
      void (async () => {
        const session = await validateAuthSessionWithBackend({ force: true });
        if (cancelled || !session) return;
        const path =
          session.redirectTo ??
          defaultDashboardPathForRole(session.user.role);
        router.replace(path);
      })();
    }

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
      { threshold: 0.1 },
    );

    document
      .querySelectorAll(
        ".recipe-landing .feature-card, .recipe-landing .step, .recipe-landing .dashboard-content, .recipe-landing .dashboard-img",
      )
      .forEach((el) => {
        (el as HTMLElement).style.opacity = "0";
        observer.observe(el);
      });

    if ([...params].length) {
      const appRedirectUrl = `recipebook://qr?${params.toString()}`;
      window.location.replace(appRedirectUrl);
      setTimeout(() => {
        window.location.href =
          "https://play.google.com/store/apps/details?id=com.cgjobschool&hl=en_IN";
      }, 1500);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [router]);

  return (
    <div className="recipe-landing">
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
            <Link href="/signin" className="btn-register">
              Get Started
            </Link>
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
          <Link href="/signin" className="btn btn-primary dashboard-link-btn">
            Explore Dashboard
          </Link>
        </div>
        <div className="dashboard-img">
          <div className="mock-card">
            <div className="mock-stats-row">
              <div className="mock-stat-box">
                <span className="mock-label">Daily Sales</span>
                <div className="mock-value primary">{"\u20B9"}12,450</div>
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
              <Link href="/about">About Us</Link>
            </li>
            <li>
              <Link href="/signin">Sign in</Link>
            </li>
            <li>
              <Link href="/privacy-policy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/signup">Register</Link>
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
    </div>
  );
}
