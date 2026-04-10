"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";
import { SHOP_TYPES } from "@/constants/enums";
import {
  ChevronLeft,
  ChefHat,
  CheckCircle2,
  Loader2,
  MapPin,
  QrCode,
  Sparkles,
  Store,
  UtensilsCrossed,
  EyeOff as EyeCloseIcon,
  Eye as EyeIcon,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";

function passwordStrength(pw: string): { label: string; pct: number; color: string } {
  if (!pw) return { label: "", pct: 0, color: "bg-gray-200 dark:bg-gray-700" };
  let score = 0;
  if (pw.length >= 6) score += 34;
  if (pw.length >= 10) score += 33;
  if (/[0-9]/.test(pw)) score += 17;
  if (/[^a-zA-Z0-9]/.test(pw)) score += 16;
  const pct = Math.min(100, score);
  if (pct < 40)
    return { label: "Weak", pct, color: "bg-amber-500" };
  if (pct < 70)
    return { label: "Good", pct, color: "bg-brand-500" };
  return { label: "Strong", pct, color: "bg-emerald-500" };
}

export default function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errorBump, setErrorBump] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const accountRef = useRef<HTMLElement>(null);
  const shopRef = useRef<HTMLElement>(null);
  const locationRef = useRef<HTMLElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [shopName, setShopName] = useState("");
  const [shopType, setShopType] = useState<string>(SHOP_TYPES.STALL);
  const [hasSeating, setHasSeating] = useState(false);
  const [totalFloors, setTotalFloors] = useState("0");

  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [locality, setLocality] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [googleMapLocation, setGoogleMapLocation] = useState("");

  const pwMeta = useMemo(() => passwordStrength(password), [password]);

  const formProgress = useMemo(() => {
    const checks = [
      !!name.trim(),
      !!email.trim(),
      password.length >= 6,
      !!confirmPassword,
      !!shopName.trim(),
      !!city.trim(),
      !!state.trim(),
      !!latitude.trim(),
      !!longitude.trim(),
      isChecked,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [
    name,
    email,
    password,
    confirmPassword,
    shopName,
    city,
    state,
    latitude,
    longitude,
    isChecked,
  ]);

  useEffect(() => {
    const sections = [
      { el: accountRef.current, index: 0 },
      { el: shopRef.current, index: 1 },
      { el: locationRef.current, index: 2 },
    ].filter((s): s is { el: HTMLElement; index: number } => !!s.el);

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target) {
          const idx = sections.find((s) => s.el === visible.target)?.index;
          if (idx !== undefined) setActiveStep(idx);
        }
      },
      { root: null, threshold: [0.25, 0.4, 0.55], rootMargin: "-80px 0px -40% 0px" },
    );

    sections.forEach((s) => obs.observe(s.el));
    return () => obs.disconnect();
  }, []);

  function scrollToSection(ref: React.RefObject<HTMLElement | null>) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function flashError(msg: string) {
    setApiError(msg);
    setErrorBump((k) => k + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    if (!isChecked) {
      flashError("Please accept the terms to continue.");
      return;
    }

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !shopName.trim() ||
      !city.trim() ||
      !state.trim() ||
      !latitude.trim() ||
      !longitude.trim()
    ) {
      flashError("Please fill all required fields.");
      return;
    }

    if (password.length < 6) {
      flashError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      flashError("Passwords do not match.");
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      flashError("Latitude and longitude must be valid numbers.");
      return;
    }

    const floors = Number(totalFloors);
    if (Number.isNaN(floors) || floors < 0) {
      flashError("Total floors must be zero or a positive number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(API_ENDPOINTS.users.shopOwnerRegister, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userData: {
            name: name.trim(),
            email: email.trim(),
            password,
          },
          shopData: {
            shopName: shopName.trim(),
            shopType,
            hasSeating,
            totalFloors: floors,
            location: {
              city: city.trim(),
              state: state.trim(),
              country: "India",
              latitude: lat,
              longitude: lng,
              ...(pincode.trim() ? { pincode: pincode.trim() } : {}),
              ...(locality.trim() ? { locality: locality.trim() } : {}),
              ...(googleMapLocation.trim()
                ? { googleMapLocation: googleMapLocation.trim() }
                : {}),
            },
          },
        }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!res.ok || !data.success) {
        flashError(data.error || "Registration failed. Try again.");
        return;
      }

      router.push("/signin?registered=1");
    } catch {
      flashError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const steps = [
    { id: 0, label: "Account", ref: accountRef, Icon: UserRound },
    { id: 1, label: "Shop", ref: shopRef, Icon: Store },
    { id: 2, label: "Location", ref: locationRef, Icon: MapPin },
  ] as const;

  const sectionCard =
    "rounded-2xl border border-gray-200/90 bg-white/90 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 dark:border-gray-700/80 dark:bg-gray-900/60 dark:shadow-none sm:p-6 " +
    "hover:border-brand-200/80 hover:shadow-md dark:hover:border-brand-500/25";

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Decorative panel — desktop */}
      <aside className="relative hidden overflow-hidden lg:flex lg:w-[42%] xl:w-[38%] lg:shrink-0 lg:flex-col lg:justify-between bg-gradient-to-br from-[#0f1419] via-[#1a2332] to-[#0d3d2e] px-10 py-12 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-90">
          <div className="signup-float-slow absolute -left-20 top-20 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />
          <div className="signup-float-delayed absolute -right-16 bottom-32 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-light-600/10 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            New vendor onboarding
          </div>
          <h2 className="mt-6 font-semibold tracking-tight text-3xl leading-tight xl:text-4xl">
            Your kitchen,
            <br />
            <span className="text-brand-300">digitally open</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">
            Menus, QR orders, and tokens — set up once and run your stall or
            restaurant from one dashboard.
          </p>
        </div>
        <ul className="relative z-10 mt-12 space-y-4 text-sm text-white/75">
          <li className="flex items-start gap-3 transition-transform duration-200 hover:translate-x-1">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <span>Owner account + shop profile in a single flow</span>
          </li>
          <li className="flex items-start gap-3 transition-transform duration-200 hover:translate-x-1">
            <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-brand-300" />
            <span>Shop QR generated automatically after signup</span>
          </li>
          <li className="flex items-start gap-3 transition-transform duration-200 hover:translate-x-1">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-light-300" />
            <span>Precise location for maps and delivery zones</span>
          </li>
        </ul>
      </aside>

      {/* Form column */}
      <div className="relative flex flex-1 flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        {/* Mobile hero */}
        <div className="relative mx-4 mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-brand-900 px-5 py-5 text-white shadow-lg lg:hidden">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-500/30 blur-2xl" />
          <p className="relative text-xs font-medium uppercase tracking-wider text-brand-200">
            Join Recipe Book
          </p>
          <p className="relative mt-1 text-lg font-semibold leading-snug">
            Register your shop in minutes
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-12 pt-6 sm:px-6 lg:max-w-2xl lg:px-10 lg:pt-10">
          <Link
            href="/"
            className="group mb-6 inline-flex w-fit items-center gap-1 text-sm text-gray-500 transition-colors hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to home
          </Link>

          <header className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Three quick steps — you can jump between sections anytime.
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200/80 dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500 ease-out"
                style={{ width: `${formProgress}%` }}
              />
            </div>
            <p className="mt-1.5 text-right text-xs text-gray-500 dark:text-gray-500">
              {formProgress}% complete
            </p>
          </header>

          {/* Step chips */}
          <nav
            className="mb-8 flex flex-wrap gap-2"
            aria-label="Form sections"
          >
            {steps.map((step, i) => {
              const active = activeStep === i;
              const Icon = step.Icon;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => scrollToSection(step.ref)}
                  className={
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-all duration-200 sm:text-sm " +
                    (active
                      ? "border-brand-500 bg-brand-50 text-brand-800 shadow-sm ring-2 ring-brand-500/20 dark:bg-brand-500/15 dark:text-brand-100"
                      : "border-gray-200 bg-white text-gray-600 hover:border-brand-200 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-brand-500/40")
                  }
                >
                  <span
                    className={
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold " +
                      (active
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400")
                    }
                  >
                    {i + 1}
                  </span>
                  <Icon className="hidden h-4 w-4 sm:block" aria-hidden />
                  {step.label}
                </button>
              );
            })}
          </nav>

          {apiError && (
            <div
              key={errorBump}
              className="signup-error-shake mb-6 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-800 dark:border-error-500/35 dark:bg-error-500/10 dark:text-error-300"
              role="alert"
            >
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <section ref={accountRef} className={sectionCard}>
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
                  <UserRound className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Account
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    How we&apos;ll reach you
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="transition-all duration-200 focus-within:translate-y-[-1px]">
                  <Label>
                    Full name<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <Label>
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <Label>
                    Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="At least 6 characters"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 z-30 -translate-y-1/2 rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeIcon className="h-4 w-4 fill-current" />
                      ) : (
                        <EyeCloseIcon className="h-4 w-4 fill-current" />
                      )}
                    </button>
                  </div>
                  {password ? (
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${pwMeta.color}`}
                          style={{ width: `${pwMeta.pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Strength:{" "}
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {pwMeta.label}
                        </span>
                      </p>
                    </div>
                  ) : null}
                </div>
                <div>
                  <Label>
                    Confirm password<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                  />
                  {confirmPassword && password === confirmPassword ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Matches
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            <section ref={shopRef} className={sectionCard}>
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <Store className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Shop
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tell customers what you run
                  </p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <Label>
                    Shop name<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Shop display name"
                  />
                </div>
                <div>
                  <Label>
                    Shop type<span className="text-error-500">*</span>
                  </Label>
                  <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setShopType(SHOP_TYPES.STALL)}
                      className={
                        "flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all duration-200 " +
                        (shopType === SHOP_TYPES.STALL
                          ? "border-brand-500 bg-brand-50/90 shadow-md ring-2 ring-brand-500/20 dark:bg-brand-500/10"
                          : "border-gray-200 bg-white hover:border-brand-200 hover:shadow-sm dark:border-gray-700 dark:bg-gray-950 dark:hover:border-brand-500/40")
                      }
                    >
                      <UtensilsCrossed
                        className={
                          shopType === SHOP_TYPES.STALL
                            ? "h-6 w-6 text-brand-600 dark:text-brand-400"
                            : "h-6 w-6 text-gray-400"
                        }
                      />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Stall
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Quick service, counter-style
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShopType(SHOP_TYPES.RESTAURANT)}
                      className={
                        "flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all duration-200 " +
                        (shopType === SHOP_TYPES.RESTAURANT
                          ? "border-brand-500 bg-brand-50/90 shadow-md ring-2 ring-brand-500/20 dark:bg-brand-500/10"
                          : "border-gray-200 bg-white hover:border-brand-200 hover:shadow-sm dark:border-gray-700 dark:bg-gray-950 dark:hover:border-brand-500/40")
                      }
                    >
                      <ChefHat
                        className={
                          shopType === SHOP_TYPES.RESTAURANT
                            ? "h-6 w-6 text-brand-600 dark:text-brand-400"
                            : "h-6 w-6 text-gray-400"
                        }
                      />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Restaurant
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Dine-in, floors & seating
                      </span>
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHasSeating(!hasSeating)}
                  className={
                    "flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-all duration-200 " +
                    (hasSeating
                      ? "border-emerald-300 bg-emerald-50/80 dark:border-emerald-500/40 dark:bg-emerald-500/10"
                      : "border-gray-200 bg-gray-50/50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:bg-gray-800")
                  }
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Seating / tables
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Enable if customers sit inside
                    </p>
                  </div>
                  <span
                    className={
                      "relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors duration-200 " +
                      (hasSeating ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600")
                    }
                  >
                    <span
                      className={
                        "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 " +
                        (hasSeating ? "left-5" : "left-0.5")
                      }
                    />
                  </span>
                </button>
                <div>
                  <Label>
                    Total floors<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step={1}
                    value={totalFloors}
                    onChange={(e) => setTotalFloors(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section ref={locationRef} className={sectionCard}>
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-light-100 text-blue-light-700 dark:bg-blue-light-500/20 dark:text-blue-light-300">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Location
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pin on the map
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>
                    City<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>
                    State<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Locality / area</Label>
                  <Input
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                  />
                </div>
                <div>
                  <Label>
                    Latitude<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    step={0.000001}
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g. 28.6139"
                  />
                </div>
                <div>
                  <Label>
                    Longitude<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    step={0.000001}
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="e.g. 77.2090"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Google Maps link (optional)</Label>
                  <Input
                    type="url"
                    value={googleMapLocation}
                    onChange={(e) => setGoogleMapLocation(e.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </div>
            </section>

            <div className="rounded-2xl border border-gray-200/90 bg-gray-50/80 px-4 py-4 dark:border-gray-700 dark:bg-gray-900/40">
              <div className="flex items-start gap-3">
                <Checkbox
                  className="mt-0.5 w-5 h-5 shrink-0"
                  checked={isChecked}
                  onChange={setIsChecked}
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  I agree to the{" "}
                  <Link
                    href="/privacy-policy"
                    className="font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
                  >
                    Privacy Policy
                  </Link>{" "}
                  and terms of use.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="group relative w-full overflow-hidden shadow-lg shadow-brand-500/25 transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:hover:scale-100"
              size="sm"
              disabled={submitting}
            >
              {submitting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account…
                </span>
              ) : (
                <span className="inline-flex items-center justify-center gap-2">
                  Create account
                  <Sparkles className="h-4 w-4 opacity-80 transition-transform group-hover:rotate-12" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
