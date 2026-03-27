"use client";
import React, { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import Label from "./Label";
import Input from "./input/InputField";
import Button from "../ui/button/Button";
import FileInput from "./input/FileInput";
import Switch from "./switch/Switch";
import Alert from "../ui/alert/Alert";
import Select from "./Select";
import { MENU_CATEGORY_GROUP_TYPE } from "@/constants/enums";

interface AddMenuFormProps {
  isOpen: boolean;
  closeModal: () => void;
  handleSave: (data: any) => Promise<void>;
  mode?: "create" | "edit";
  initialData?: {
    slug?: string;
    title?: string;
    description?: string;
    sortOrder?: number | string;
    isActive?: boolean;
    logo?: string;
    icon?: string;
    color?: string;
    groupType?: string;
    isSystemDefined?: boolean;
    isFilterable?: boolean;
    isMultiSelectable?: boolean;
  } | null;
  handleDelete?: () => Promise<void>;
}

const GROUP_TYPE_OPTIONS = Object.values(MENU_CATEGORY_GROUP_TYPE).map(
  (value) => ({
    value,
    label: value.replace(/_/g, " "),
  }),
);

const DEFAULT_GROUP_TYPE = MENU_CATEGORY_GROUP_TYPE.DIETARY_BASED;

const AddMenuForm = ({
  isOpen,
  closeModal,
  handleSave,
  mode = "create",
  initialData,
  handleDelete,
}: AddMenuFormProps) => {
  const [formData, setFormData] = useState<{
    slug: string;
    title: string;
    description: string;
    sortOrder: number | string;
    isActive: boolean;
    imageFile: File | null;
    icon: string;
    color: string;
    groupType: string;
    isSystemDefined: boolean;
    isFilterable: boolean;
    isMultiSelectable: boolean;
  }>({
    slug: "",
    title: "",
    description: "",
    sortOrder: 1,
    isActive: true,
    imageFile: null,
    icon: "",
    color: "#22c55e",
    groupType: DEFAULT_GROUP_TYPE,
    isSystemDefined: false,
    isFilterable: true,
    isMultiSelectable: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Reset form when opening, populate with initialData in edit mode
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setSaving(false);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    if (mode === "edit" && initialData) {
      setFormData({
        slug: initialData.slug ?? "",
        title: initialData.title ?? "",
        description: initialData.description ?? "",
        sortOrder: initialData.sortOrder ?? 1,
        isActive: initialData.isActive ?? true,
        imageFile: null,
        icon: initialData.icon ?? "",
        color: initialData.color ?? "#22c55e",
        groupType: initialData.groupType ?? DEFAULT_GROUP_TYPE,
        isSystemDefined: initialData.isSystemDefined ?? false,
        isFilterable: initialData.isFilterable ?? true,
        isMultiSelectable: initialData.isMultiSelectable ?? false,
      });
      setPreviewUrl(initialData.logo ?? null);
      return;
    }

    setFormData({
      slug: "",
      title: "",
      description: "",
      sortOrder: 1,
      isActive: true,
      imageFile: null,
      icon: "",
      color: "#22c55e",
      groupType: DEFAULT_GROUP_TYPE,
      isSystemDefined: false,
      isFilterable: true,
      isMultiSelectable: false,
    });

  }, [isOpen, initialData, mode]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));

    if (key === "imageFile") {
      if (value instanceof File) {
        const url = URL.createObjectURL(value);
        setPreviewUrl((prevUrl) => {
          if (prevUrl) {
            URL.revokeObjectURL(prevUrl);
          }
          return url;
        });
      } else {
        setPreviewUrl((prevUrl) => {
          if (prevUrl) {
            URL.revokeObjectURL(prevUrl);
          }
          return null;
        });
      }
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await handleSave(formData);
      closeModal();
    } catch (err: any) {
      const message =
        err?.message || "Failed to save category. Please try again.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
      <div className="relative w-full max-w-[700px] rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-white/90">
          {mode === "edit" ? "Edit Menu Category" : "Add Menu Category"}
        </h4>

        {error && (
          <div className="mb-4">
            <Alert variant="error" title="Error" message={error} />
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Title */}
            <div className="col-span-2">
              <Label>Title</Label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Starters"
              />
            </div>

            {/* Slug */}
            <div>
              <Label>Slug</Label>
              <Input
                type="text"
                value={formData.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                placeholder="starters"
                disabled={mode === "edit"}
              />
            </div>

            {/* Sort Order */}
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => handleChange("sortOrder", e.target.value)}
              />
            </div>

            {/* Group Type */}
            <div>
              <Label>Group Type</Label>
              <Select
                key={`${isOpen}-${formData.groupType}`}
                options={GROUP_TYPE_OPTIONS}
                defaultValue={formData.groupType}
                placeholder="Select group type"
                onChange={(value) => handleChange("groupType", value)}
              />
            </div>

            {/* Icon */}
            <div>
              <Label>Icon</Label>
              <Input
                type="text"
                value={formData.icon}
                onChange={(e) => handleChange("icon", e.target.value)}
                placeholder="veg-icon.png"
              />
            </div>

            {/* Color */}
            <div>
              <Label>Color</Label>
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => handleChange("color", e.target.value)}
                className="h-11 px-2"
              />
            </div>

            {/* Active switch */}
            <div className="col-span-2 mt-2 space-y-3">
              <Switch
                label="System Defined"
                checked={formData.isSystemDefined}
                defaultChecked={formData.isSystemDefined}
                onChange={(checked: boolean) =>
                  handleChange("isSystemDefined", checked)
                }
              />
              <Switch
                label="Filterable"
                checked={formData.isFilterable}
                defaultChecked={formData.isFilterable}
                onChange={(checked: boolean) =>
                  handleChange("isFilterable", checked)
                }
              />
              <Switch
                label="Multi Selectable"
                checked={formData.isMultiSelectable}
                defaultChecked={formData.isMultiSelectable}
                onChange={(checked: boolean) =>
                  handleChange("isMultiSelectable", checked)
                }
              />
              <Switch
                label="Active"
                checked={formData.isActive}
                defaultChecked={formData.isActive}
                onChange={(checked: boolean) =>
                  handleChange("isActive", checked)
                }
              />
            </div>

            {/* Image Upload */}
            <div className="col-span-2">
              <Label>Upload Image</Label>
              <FileInput
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange("imageFile", e.target.files?.[0] || null)
                }
              />
              {previewUrl && (
                <div className="mt-3">
                  <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                    Preview
                  </p>
                  <img
                    src={previewUrl}
                    alt="Selected preview"
                    className="h-16 w-16 rounded object-cover border"
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div className="col-span-2">
              <Label>Description</Label>
              <textarea
                className="w-full rounded-lg border p-3 dark:bg-gray-800"
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Light dishes served before the main course..."
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 mt-6 justify-between">
            {mode === "edit" && handleDelete && (
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={async () => {
                  if (deleting) return;
                  const ok = window.confirm(
                    "Are you sure you want to delete this category?"
                  );
                  if (!ok) return;
                  setDeleting(true);
                  try {
                    await handleDelete();
                    closeModal();
                  } catch (err: any) {
                    const message =
                      err?.message ||
                      "Failed to delete category. Please try again.";
                    setError(message);
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            )}

            <div className="flex items-center gap-3 ml-auto">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={saving}>
                {saving
                  ? mode === "edit"
                    ? "Updating..."
                    : "Saving..."
                  : mode === "edit"
                  ? "Update Category"
                  : "Save Category"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddMenuForm;
