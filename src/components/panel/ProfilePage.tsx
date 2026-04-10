"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";
import { env } from "@/config/env.config";
import { usePanelBase } from "@/context/PanelBaseContext";
import { useMedia } from "@/hooks/useMedia";
import { ID } from "@/lib/firebaseMediaClient";
import {
  readAuthSession,
  updateAuthSessionUser,
} from "@/lib/authSession";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type ProfileUser = {
  id: string;
  name?: string;
  email?: string;
  phone?: string | null;
  role?: string;
  language?: string;
  profilePictureURL?: string | null;
  status?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type ProfileShop = {
  id: string;
  shopName?: string;
  shopType?: string;
  hasSeating?: boolean;
  totalFloors?: number;
  logoURL?: string | null;
  bannerImageURL?: string | null;
  shopQR?: string;
};

function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Please choose an image file.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  return null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { basePath } = usePanelBase();
  const { uploadMedia, isUploading } = useMedia();
  const profileFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [shop, setShop] = useState<ProfileShop | null>(null);

  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en");
  const [profilePictureURL, setProfilePictureURL] = useState("");

  const [shopName, setShopName] = useState("");
  const [shopType, setShopType] = useState("RESTAURANT");
  const [hasSeating, setHasSeating] = useState(false);
  const [totalFloors, setTotalFloors] = useState(1);
  const [logoURL, setLogoURL] = useState("");
  const [bannerURL, setBannerURL] = useState("");

  const isOwner =
    String(user?.role || "")
      .toUpperCase()
      .trim() === "OWNER";

  useEffect(() => {
    const s = readAuthSession();
    if (!s?.idToken) {
      router.replace("/signin");
      return;
    }
    const token = s.idToken;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_ENDPOINTS.auth.profile, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const json = (await res.json()) as {
          success?: boolean;
          data?: ProfileUser;
          shop?: ProfileShop | null;
          error?: string;
        };
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error || "Could not load profile");
        }
        if (cancelled) return;
        const u = json.data;
        setUser(u);
        setName(u.name ?? "");
        setLanguage(
          u.language === "hi" || u.language === "en" ? u.language : "en",
        );
        setProfilePictureURL(
          typeof u.profilePictureURL === "string" ? u.profilePictureURL : "",
        );

        const sh = json.shop;
        if (sh?.id) {
          setShop(sh);
          setShopName(sh.shopName ?? "");
          setShopType(
            sh.shopType === "STALL" || sh.shopType === "RESTAURANT"
              ? sh.shopType
              : "RESTAURANT",
          );
          setHasSeating(Boolean(sh.hasSeating));
          setTotalFloors(
            typeof sh.totalFloors === "number" && sh.totalFloors >= 0
              ? sh.totalFloors
              : 1,
          );
          setLogoURL(typeof sh.logoURL === "string" ? sh.logoURL : "");
          setBannerURL(
            typeof sh.bannerImageURL === "string" ? sh.bannerImageURL : "",
          );
        } else {
          setShop(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleProfileImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user?.id) return;
    const msg = validateImageFile(file);
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    try {
      const folder = `${env.FIREBASE_STORAGE_MEDIA_FOLDER}/users/${user.id}/profile`;
      const { url } = await uploadMedia(file, {
        bucketId: folder,
        fileId: ID.unique(),
      });
      setProfilePictureURL(url);
    } catch {
      setError("Could not upload profile photo.");
    }
  }

  async function handleShopImagePick(
    kind: "logo" | "banner",
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !shop?.id) return;
    const msg = validateImageFile(file);
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    try {
      const sub = kind === "logo" ? "logo" : "banner";
      const folder = `${env.FIREBASE_STORAGE_MEDIA_FOLDER}/shops/${shop.id}/${sub}`;
      const { url } = await uploadMedia(file, {
        bucketId: folder,
        fileId: ID.unique(),
      });
      if (kind === "logo") setLogoURL(url);
      else setBannerURL(url);
    } catch {
      setError(`Could not upload shop ${kind}.`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const s = readAuthSession();
    if (!s?.idToken) {
      router.replace("/signin");
      return;
    }
    const auth = { Authorization: `Bearer ${s.idToken}` };

    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload: Record<string, unknown> = {};
    if (name.trim() !== (user?.name ?? "").trim()) {
      payload.name = name.trim();
    }
    if (
      language !==
      (user?.language === "hi" || user?.language === "en"
        ? user.language
        : "en")
    ) {
      payload.language = language;
    }
    const prevPic =
      typeof user?.profilePictureURL === "string"
        ? user.profilePictureURL
        : "";
    const nextPic = profilePictureURL.trim();
    if (nextPic !== prevPic) {
      payload.profilePictureURL = nextPic === "" ? null : nextPic;
    }

    if (isOwner && shop?.id) {
      const shopPayload: Record<string, unknown> = {};
      if (shopName.trim() !== (shop.shopName ?? "").trim()) {
        shopPayload.shopName = shopName.trim();
      }
      const st =
        shopType === "STALL" || shopType === "RESTAURANT" ? shopType : "RESTAURANT";
      if (st !== (shop.shopType ?? "")) {
        shopPayload.shopType = st;
      }
      if (hasSeating !== Boolean(shop.hasSeating)) {
        shopPayload.hasSeating = hasSeating;
      }
      const prevFloors =
        typeof shop.totalFloors === "number" ? shop.totalFloors : 0;
      if (totalFloors !== prevFloors) {
        shopPayload.totalFloors = totalFloors;
      }
      const prevLogo = typeof shop.logoURL === "string" ? shop.logoURL : "";
      if (logoURL.trim() !== prevLogo) {
        shopPayload.logoURL = logoURL.trim() === "" ? null : logoURL.trim();
      }
      const prevBanner =
        typeof shop.bannerImageURL === "string" ? shop.bannerImageURL : "";
      if (bannerURL.trim() !== prevBanner) {
        shopPayload.bannerImageURL =
          bannerURL.trim() === "" ? null : bannerURL.trim();
      }
      if (Object.keys(shopPayload).length > 0) {
        payload.shop = shopPayload;
      }
    }

    if (Object.keys(payload).length === 0) {
      setSaving(false);
      setSuccess("No changes to save.");
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.auth.profile, {
        method: "PATCH",
        headers: {
          ...auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: ProfileUser;
        shop?: ProfileShop | null;
        error?: string;
      };
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || "Update failed");
      }
      setUser(json.data);
      if (json.shop?.id) {
        setShop(json.shop);
        setShopName(json.shop.shopName ?? "");
        setShopType(
          json.shop.shopType === "STALL" || json.shop.shopType === "RESTAURANT"
            ? json.shop.shopType
            : shopType,
        );
        setHasSeating(Boolean(json.shop.hasSeating));
        setTotalFloors(
          typeof json.shop.totalFloors === "number"
            ? json.shop.totalFloors
            : totalFloors,
        );
        setLogoURL(
          typeof json.shop.logoURL === "string" ? json.shop.logoURL : "",
        );
        setBannerURL(
          typeof json.shop.bannerImageURL === "string"
            ? json.shop.bannerImageURL
            : "",
        );
      }
      updateAuthSessionUser({
        name: json.data.name,
      });
      setSuccess("Profile saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="My profile" />
      <div className="mb-4">
        <Link
          href={`${basePath}/dashboard`}
          className="text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          Back to dashboard
        </Link>
      </div>

      {loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading profile…
        </p>
      )}
      {error && (
        <p className="mb-4 text-sm text-error-500" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-4 text-sm text-success-600 dark:text-success-500">
          {success}
        </p>
      )}

      {!loading && user && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <ComponentCard
            title="Account"
            desc="Email and phone are managed by your account provider and cannot be changed here."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Email</Label>
                <p className="mt-1 text-sm text-gray-800 dark:text-white/90">
                  {user.email ?? "—"}
                </p>
              </div>
              <div>
                <Label>Phone</Label>
                <p className="mt-1 text-sm text-gray-800 dark:text-white/90">
                  {user.phone ?? "—"}
                </p>
              </div>
              <div>
                <Label>Role</Label>
                <p className="mt-1 text-sm text-gray-800 dark:text-white/90">
                  {user.role ?? "—"}
                </p>
              </div>
              <div>
                <Label>Status</Label>
                <p className="mt-1 text-sm text-gray-800 dark:text-white/90">
                  {user.status ?? "—"}
                </p>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Your profile">
            <div className="space-y-4">
              <div>
                <Label htmlFor="profile-name">Display name</Label>
                <Input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="profile-language">Language</Label>
                <select
                  id="profile-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="dark:bg-gray-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
              <div>
                <Label>Profile picture (profilePictureURL)</Label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Image uploads to Firebase Storage; the download URL is saved on
                  your user document.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <input
                    ref={profileFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfileImagePick}
                  />
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => profileFileRef.current?.click()}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    {isUploading ? "Uploading…" : "Choose image"}
                  </button>
                  {profilePictureURL ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setProfilePictureURL("")}
                        className="text-sm text-error-500 hover:underline"
                      >
                        Remove photo
                      </button>
                      <div className="relative h-20 w-20 overflow-hidden rounded-full border border-gray-200 dark:border-gray-700">
                        <Image
                          src={profilePictureURL}
                          alt="Profile preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </ComponentCard>

          {isOwner && shop?.id && (
            <ComponentCard
              title="Your shop"
              desc="Update your business details (name, type, seating, floors, logo and banner)."
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="shop-name">Shop name</Label>
                  <Input
                    id="shop-name"
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="shop-type">Shop type</Label>
                  <select
                    id="shop-type"
                    value={shopType}
                    onChange={(e) => setShopType(e.target.value)}
                    className="dark:bg-gray-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
                  >
                    <option value="STALL">Stall</option>
                    <option value="RESTAURANT">Restaurant</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="shop-seating"
                    type="checkbox"
                    checked={hasSeating}
                    onChange={(e) => setHasSeating(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="shop-seating" className="mb-0 cursor-pointer">
                    Has seating
                  </Label>
                </div>
                <div>
                  <Label htmlFor="shop-floors">Total floors</Label>
                  <Input
                    id="shop-floors"
                    type="number"
                    min="0"
                    value={totalFloors}
                    onChange={(e) =>
                      setTotalFloors(
                        Math.max(0, Number.parseInt(e.target.value, 10) || 0),
                      )
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Logo (logoURL)</Label>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <input
                      ref={logoFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(ev) => handleShopImagePick("logo", ev)}
                    />
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => logoFileRef.current?.click()}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      Upload logo
                    </button>
                    {logoURL ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setLogoURL("")}
                          className="text-sm text-error-500 hover:underline"
                        >
                          Remove
                        </button>
                        <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                          <Image
                            src={logoURL}
                            alt="Logo preview"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
                <div>
                  <Label>Banner (bannerImageURL)</Label>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <input
                      ref={bannerFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(ev) => handleShopImagePick("banner", ev)}
                    />
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => bannerFileRef.current?.click()}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      Upload banner
                    </button>
                    {bannerURL ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setBannerURL("")}
                          className="text-sm text-error-500 hover:underline"
                        >
                          Remove
                        </button>
                        <div className="relative h-20 w-36 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                          <Image
                            src={bannerURL}
                            alt="Banner preview"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </ComponentCard>
          )}

          <div>
            <button
              type="submit"
              disabled={saving || isUploading}
              className="bg-brand-500 hover:bg-brand-600 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
