"use client";
import React, { useState } from "react";
import { Modal } from "../ui/modal";
import Label from "./Label";
import Input from "./input/InputField";
import Button from "../ui/button/Button";
import FileInput from "./input/FileInput";
import Switch from "./switch/Switch";

interface AddMenuFormProps {
  isOpen: boolean;
  closeModal: () => void;
  handleSave: (data: any) => void;
}

const AddMenuForm = ({
  isOpen,
  closeModal,
  handleSave,
}: AddMenuFormProps) => {
  const [formData, setFormData] = useState({
   id: '',
  slug: "",
  title: "",
  description: "",
  logo: "",
  status: "",
  isActive: true,
  sortOrder: 1,
  });

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave(formData);
    closeModal();
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
      <div className="relative w-full max-w-[700px] rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h4 className="mb-6 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Add Menu Category
        </h4>

        <form onSubmit={onSubmit} className="flex flex-col">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

            {/* Menu Name */}
            <div className="col-span-2">
              <Label>Menu Name</Label>
              <Input
                type="text"
                defaultValue={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Paneer Butter Masala"
              />
            </div>

            {/* Category */}
            <div>
              <Label>Category</Label>
              <select
                className="w-full rounded-lg border p-2 dark:bg-gray-800"
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
              >
                <option value="">Select Category</option>
                <option value="main-course-veg">Main Course - Veg</option>
                <option value="main-course-non-veg">Main Course - Non Veg</option>
                <option value="biryani">Rice & Biryani</option>
                <option value="desserts">Desserts</option>
              </select>
            </div>

            {/* Food Type */}
            <div>
              <Label>Food Type</Label>
              <select
                className="w-full rounded-lg border p-2 dark:bg-gray-800"
                value={formData.foodType}
                onChange={(e) => handleChange("foodType", e.target.value)}
              >
                <option value="veg">Veg</option>
                <option value="non-veg">Non Veg</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <Label>Price</Label>
              <Input
                type="number"
                defaultValue={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
                placeholder="250"
              />
            </div>

            {/* Discount Price */}
            <div>
              <Label>Discount Price</Label>
              <Input
                type="number"
                defaultValue={formData.discountPrice}
                onChange={(e) => handleChange("discountPrice", e.target.value)}
                placeholder="200"
              />
            </div>

            {/* Sort Order */}
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                defaultValue={formData.sortOrder+''}
                onChange={(e) => handleChange("sortOrder", e.target.value)}
              />
            </div>

            {/* Image Upload */}
            <div className="col-span-2">
              <Label>Upload Image</Label>
              <FileInput
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange("image", e.target.files?.[0] || null)
                }
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <Label>Description</Label>
              <textarea
                className="w-full rounded-lg border p-3 dark:bg-gray-800"
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Delicious creamy tomato-based curry..."
              />
            </div>

            {/* Toggles */}
            <div className="flex gap-6 col-span-2 mt-2">
              <Switch
                label="Available"
                defaultChecked={formData.isAvailable}
                onChange={(checked:any) =>
                  handleChange("isAvailable", checked)
                }
              />

              <Switch
                label="Chef Special"
                defaultChecked={formData.isSpecial}
                onChange={(checked:any) =>
                  handleChange("isSpecial", checked)
                }
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 mt-6 justify-end">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button size="sm">
              Save Menu
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddMenuForm;