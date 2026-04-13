"use client";

import { API_ENDPOINTS } from "@/constants/apiEndpoints";
import { env } from "@/config/env.config";
import { useMedia } from "@/hooks/useMedia";
import { ID } from "@/lib/firebaseMediaClient";
import type { SERVING_UNIT } from "@/models/model";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Switch from "@/components/form/switch/Switch";
import React, { useCallback, useEffect, useState } from "react";

const SERVING_UNIT_OPTIONS: SERVING_UNIT[] = [
  "piece",
  "slice",
  "plate",
  "gram",
  "kilogram",
  "other",
];

type ShopOption = { id: string; shopName?: string };
type CategoryOption = {
  id: string;
  title?: string;
  groupType?: string;
  isMultiSelectable?: boolean;
};

/** Only explicit `true` allows multiple picks from the same groupType. */
function allowsMultiInGroup(c: CategoryOption | undefined): boolean {
  return c?.isMultiSelectable === true;
}

function groupTypeKey(c: CategoryOption | undefined): string {
  const g = c?.groupType?.trim();
  return g || "__unknown_group__";
}

/** Enforce: for each groupType with isMultiSelectable !== true, at most one selected id. */
function validateCategorySelection(
  ids: string[],
  allCategories: CategoryOption[],
): string | null {
  if (ids.length <= 1) return null;
  const metas = ids.map((id) => ({
    id,
    cat: allCategories.find((x) => x.id === id),
  }));
  for (const { id, cat } of metas) {
    if (allowsMultiInGroup(cat)) continue;
    const gk = groupTypeKey(cat);
    const sameGroup = metas.filter(
      (m) => groupTypeKey(m.cat) === gk,
    );
    if (sameGroup.length > 1) {
      return `Only one category allowed from this group (${gk === "__unknown_group__" ? "unknown type" : gk}).`;
    }
  }
  return null;
}

/** Create payload aligned with Menu_Item (model); id/timestamps set by API. */
export type MenuItemCreatePayload = {
  name: string;
  description: string;
  categoryIds: string[];
  price: number;
  medias: { url: string; isPrimary: boolean; type: "image" | "video" }[];
  shopId: string;
  isActive: boolean;
  servingQuantity: number;
  servingUnit: SERVING_UNIT;
  isAvailable: boolean;
  isInOffer: boolean;
  offerPrice: number;
  offerStartDate: string;
  offerEndDate: string;
  status: "ACTIVE";
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function AddMenuItemForm({ isOpen, onClose, onCreated }: Props) {
  const { uploadMedia, isUploading } = useMedia();

  const [shops, setShops] = useState<ShopOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadMetaError, setLoadMetaError] = useState<string | null>(null);

  const [shopId, setShopId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [servingQuantity, setServingQuantity] = useState("1");
  const [servingUnit, setServingUnit] = useState<SERVING_UNIT>("piece");
  const [isActive, setIsActive] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isInOffer, setIsInOffer] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerStartDate, setOfferStartDate] = useState("");
  const [offerEndDate, setOfferEndDate] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadShopsAndCategories = useCallback(async () => {
    setLoadMetaError(null);
    try {
      const [shopRes, catRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.shops.list}?page=1&limit=200`),
        fetch(`${API_ENDPOINTS.menuCategories.list}?page=1&limit=500`),
      ]);
      const shopJson = (await shopRes.json()) as {
        success?: boolean;
        data?: { items?: ShopOption[] };
      };
      const catJson = (await catRes.json()) as {
        success?: boolean;
        data?: { items?: CategoryOption[] };
      };
      if (shopRes.ok && shopJson.success && shopJson.data?.items) {
        setShops(shopJson.data.items);
      } else {
        setShops([]);
      }
      if (catRes.ok && catJson.success && catJson.data?.items) {
        setCategories(catJson.data.items);
      } else {
        setCategories([]);
      }
      const failed: string[] = [];
      if (!shopRes.ok || !shopJson.success) failed.push("shops");
      if (!catRes.ok || !catJson.success) failed.push("categories");
      if (failed.length) {
        setLoadMetaError(`Could not load ${failed.join(" and ")}.`);
      }
    } catch {
      setLoadMetaError("Could not load shops or categories.");
      setShops([]);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void loadShopsAndCategories();
    setSubmitError(null);
    setShopId("");
    setName("");
    setDescription("");
    setCategoryIds([]);
    setPrice("");
    setServingQuantity("1");
    setServingUnit("piece");
    setIsActive(true);
    setIsAvailable(true);
    setIsInOffer(false);
    setOfferPrice("");
    setOfferStartDate("");
    setOfferEndDate("");
    setImageUrl(null);
  }, [isOpen, loadShopsAndCategories]);

  function toggleCategory(id: string) {
    setSubmitError(null);
    setCategoryIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      const cat = categories.find((c) => c.id === id);
      if (!cat) {
        return [...prev, id];
      }
      if (!allowsMultiInGroup(cat)) {
        const gk = groupTypeKey(cat);
        const withoutSameGroup = prev.filter((pid) => {
          const p = categories.find((c) => c.id === pid);
          return groupTypeKey(p) !== gk;
        });
        return [...withoutSameGroup, id];
      }
      return [...prev, id];
    });
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !shopId) {
      setSubmitError(!shopId ? "Select a shop before uploading an image." : null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setSubmitError("Please choose an image file.");
      return;
    }
    setSubmitError(null);
    try {
      const folder = `${env.FIREBASE_STORAGE_MEDIA_FOLDER}/shops/${shopId}/menu-items`;
      const { url } = await uploadMedia(file, {
        bucketId: folder,
        fileId: ID.unique(),
      });
      setImageUrl(url);
    } catch {
      setSubmitError("Image upload failed.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const nameTrim = name.trim();
    if (!nameTrim) {
      setSubmitError("Name is required.");
      return;
    }
    if (!shopId) {
      setSubmitError("Shop is required.");
      return;
    }
    if (!categoryIds.length) {
      setSubmitError("Select at least one category.");
      return;
    }
    const catRuleError = validateCategorySelection(categoryIds, categories);
    if (catRuleError) {
      setSubmitError(catRuleError);
      return;
    }
    const priceNum = Number.parseFloat(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setSubmitError("Enter a valid price.");
      return;
    }
    const sq = Number.parseFloat(servingQuantity);
    if (Number.isNaN(sq) || sq <= 0) {
      setSubmitError("Serving quantity must be greater than 0.");
      return;
    }

    let offerP = 0;
    if (isInOffer) {
      offerP = Number.parseFloat(offerPrice);
      if (Number.isNaN(offerP) || offerP < 0) {
        setSubmitError("Enter a valid offer price.");
        return;
      }
    }

    const medias: MenuItemCreatePayload["medias"] = imageUrl
      ? [{ url: imageUrl, isPrimary: true, type: "image" }]
      : [];

    const payload: MenuItemCreatePayload = {
      name: nameTrim,
      description: description.trim(),
      categoryIds,
      price: priceNum,
      medias,
      shopId,
      isActive,
      servingQuantity: sq,
      servingUnit,
      isAvailable,
      isInOffer,
      offerPrice: offerP,
      offerStartDate: offerStartDate.trim(),
      offerEndDate: offerEndDate.trim(),
      status: "ACTIVE",
    };

    setSaving(true);
    try {
      const res = await fetch("/api/v1/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Create failed");
      }
      onCreated?.();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl p-0 sm:p-2"
      showCloseButton
    >
      <div className="rounded-3xl bg-white p-6 dark:bg-gray-900 sm:p-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Add menu item
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Payload matches <code className="text-xs">Menu_Item</code> (name,
          categories, price, serving, offer, medias, shop).
        </p>

        {loadMetaError && (
          <p className="mt-3 text-sm text-warning-600 dark:text-warning-500">
            {loadMetaError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="mi-shop">Shop</Label>
            <select
              id="mi-shop"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              className="dark:bg-gray-900 mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:text-white/90"
            >
              <option value="">Select shop</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shopName || s.id}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="mi-name">Name</Label>
              <Input
                id="mi-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="mi-price">Price</Label>
              <Input
                id="mi-price"
                type="number"
                min="0"
                step={0.01}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="mi-desc">Description</Label>
            <TextArea
              rows={3}
              value={description}
              onChange={setDescription}
              placeholder="Short description"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Categories</Label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              <code className="text-xs">isMultiSelectable: false</code> means one
              category per <span className="font-medium">group type</span> (e.g.
              one dietary). You can still pick categories from other groups.
              When <code className="text-xs">true</code>, multiple from the same
              group are allowed.
            </p>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500">No categories found.</p>
              ) : (
                categories.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <input
                      type="checkbox"
                      checked={categoryIds.includes(c.id)}
                      onChange={() => toggleCategory(c.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="flex flex-wrap items-center gap-2">
                      {c.title || c.id}
                      {!allowsMultiInGroup(c) ? (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-theme-xs text-gray-600 dark:bg-white/10 dark:text-gray-400">
                          One per group
                        </span>
                      ) : (
                        <span className="rounded bg-brand-50 px-1.5 py-0.5 text-theme-xs text-brand-800 dark:bg-brand-500/15 dark:text-brand-200">
                          Multi in group
                        </span>
                      )}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="mi-serving-qty">Serving quantity</Label>
              <Input
                id="mi-serving-qty"
                type="number"
                min="0.01"
                step="any"
                value={servingQuantity}
                onChange={(e) => setServingQuantity(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="mi-serving-unit">Serving unit</Label>
              <select
                id="mi-serving-unit"
                value={servingUnit}
                onChange={(e) =>
                  setServingUnit(e.target.value as SERVING_UNIT)
                }
                className="dark:bg-gray-900 mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:text-white/90"
              >
                {SERVING_UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <Switch
              checked={isActive}
              onChange={setIsActive}
              label="Active"
            />
            <Switch
              checked={isAvailable}
              onChange={setIsAvailable}
              label="Available"
            />
            <Switch
              checked={isInOffer}
              onChange={setIsInOffer}
              label="On offer"
            />
          </div>

          {isInOffer && (
            <div className="grid gap-4 rounded-xl border border-gray-100 p-4 dark:border-white/10 sm:grid-cols-3">
              <div>
                <Label htmlFor="mi-offer-price">Offer price</Label>
                <Input
                  id="mi-offer-price"
                  type="number"
                  min="0"
                  step={0.01}
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="mi-offer-start">Offer start</Label>
                <Input
                  id="mi-offer-start"
                  type="datetime-local"
                  value={offerStartDate}
                  onChange={(e) => setOfferStartDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="mi-offer-end">Offer end</Label>
                <Input
                  id="mi-offer-end"
                  type="datetime-local"
                  value={offerEndDate}
                  onChange={(e) => setOfferEndDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          )}

          <div>
            <Label>Image (optional)</Label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Select shop first, then upload — stored in Firebase Storage;
              URL goes into <code className="text-xs">medias</code>.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={onPickImage}
                disabled={!shopId || isUploading}
                className="text-sm"
              />
              {imageUrl ? (
                <span className="text-xs text-success-600">Image attached</span>
              ) : null}
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-error-500" role="alert">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || isUploading}>
              {saving ? "Saving…" : "Create item"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
