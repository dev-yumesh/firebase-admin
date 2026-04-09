"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import AppTable from "@/components/tables/AppTable";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";
import axiosClient from "@/lib/axiosClient";
import { Pencil, Trash2, X } from "lucide-react";
import React, { useEffect, useState } from "react";

type AppSetting = {
  id: string;
  key: string;
  platform: "ALL" | "ANDROID" | "IOS" | "WEB";
  version: string;
  minSupportedVersion?: string;
  forceUpdate: boolean;
  maintenanceMode: boolean;
  latestBuildNumber?: number;
  title?: string;
  updateMessage?: string;
  downloadUrl?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string | null;
  updatedAt?: string | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const PAGE_SIZE = 10;

const initialForm = {
  key: "",
  platform: "ALL" as AppSetting["platform"],
  version: "",
  minSupportedVersion: "",
  forceUpdate: false,
  maintenanceMode: false,
  latestBuildNumber: "0",
  title: "",
  updateMessage: "",
  downloadUrl: "",
  status: "ACTIVE" as AppSetting["status"],
};

const semverRegex = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const AppSettingsPage = () => {
  const [items, setItems] = useState<AppSetting[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      setSearchQuery(searchInput.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchSettings = async (page: number, search: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search) {
        params.set("search", search);
      }

      const { data } = await axiosClient.get(
        `${API_ENDPOINTS.appSettings.list}?${params.toString()}`
      );

      setItems(data?.items || []);
      setPagination({
        page: Number(data?.pagination?.page || page),
        limit: Number(data?.pagination?.limit || PAGE_SIZE),
        total: Number(data?.pagination?.total || 0),
        totalPages: Math.max(1, Number(data?.pagination?.totalPages || 1)),
      });
    } catch (fetchError: any) {
      setError(fetchError?.response?.data?.error || fetchError.message || "Failed to fetch app settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings(currentPage, searchQuery);
  }, [currentPage, searchQuery]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const validateForm = () => {
    if (!formData.key.trim()) {
      return "Setting key is required";
    }
    if (!formData.version.trim()) {
      return "Version is required";
    }
    if (!semverRegex.test(formData.version.trim())) {
      return "Version must be semver like 1.0.0";
    }
    if (
      formData.minSupportedVersion.trim() &&
      !semverRegex.test(formData.minSupportedVersion.trim())
    ) {
      return "Min supported version must be semver like 1.0.0";
    }
    const buildNumber = Number(formData.latestBuildNumber);
    if (!Number.isFinite(buildNumber) || buildNumber < 0) {
      return "Latest build number must be a positive number";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        key: formData.key.trim().toUpperCase(),
        platform: formData.platform,
        version: formData.version.trim(),
        minSupportedVersion: formData.minSupportedVersion.trim() || undefined,
        forceUpdate: formData.forceUpdate,
        maintenanceMode: formData.maintenanceMode,
        latestBuildNumber: Number(formData.latestBuildNumber),
        title: formData.title.trim() || undefined,
        updateMessage: formData.updateMessage.trim() || undefined,
        downloadUrl: formData.downloadUrl.trim() || undefined,
        status: formData.status,
      };

      if (editingId) {
        await axiosClient.put(API_ENDPOINTS.appSettings.detail(editingId), payload);
      } else {
        await axiosClient.post(API_ENDPOINTS.appSettings.list, payload);
      }

      resetForm();
      await fetchSettings(currentPage, searchQuery);
    } catch (submitError: any) {
      setError(submitError?.response?.data?.error || submitError.message || "Failed to save setting");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (setting: AppSetting) => {
    setEditingId(setting.id);
    setFormData({
      key: setting.key || "",
      platform: setting.platform || "ALL",
      version: setting.version || "",
      minSupportedVersion: setting.minSupportedVersion || "",
      forceUpdate: Boolean(setting.forceUpdate),
      maintenanceMode: Boolean(setting.maintenanceMode),
      latestBuildNumber: String(setting.latestBuildNumber ?? 0),
      title: setting.title || "",
      updateMessage: setting.updateMessage || "",
      downloadUrl: setting.downloadUrl || "",
      status: setting.status || "ACTIVE",
    });
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = window.confirm("Delete this app setting?");
    if (!shouldDelete) return;

    setError(null);
    try {
      await axiosClient.delete(API_ENDPOINTS.appSettings.detail(id));
      await fetchSettings(currentPage, searchQuery);
    } catch (deleteError: any) {
      setError(deleteError?.response?.data?.error || deleteError.message || "Failed to delete setting");
    }
  };

  const columns = [
    {
      header: "Key",
      accessor: "key",
    },
    {
      header: "Platform",
      accessor: "platform",
    },
    {
      header: "Version",
      accessor: "version",
    },
    {
      header: "Force Update",
      accessor: "forceUpdate",
      render: (row: AppSetting) => (
        <Badge size="sm" color={row.forceUpdate ? "warning" : "success"}>
          {row.forceUpdate ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      header: "Maintenance",
      accessor: "maintenanceMode",
      render: (row: AppSetting) => (
        <Badge size="sm" color={row.maintenanceMode ? "error" : "success"}>
          {row.maintenanceMode ? "Enabled" : "Disabled"}
        </Badge>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row: AppSetting) => (
        <Badge size="sm" color={row.status === "ACTIVE" ? "success" : "error"}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Updated At",
      accessor: "updatedAt",
      render: (row: AppSetting) => formatDate(row.updatedAt),
    },
    {
      header: "Actions",
      accessor: "actions",
      className: "whitespace-nowrap",
      render: (row: AppSetting) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row)}
            startIcon={<Pencil className="h-4 w-4" />}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(row.id)}
            startIcon={<Trash2 className="h-4 w-4" />}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageBreadcrumb pageTitle="App Settings" />
      <div className="space-y-6">
        <ComponentCard title={editingId ? "Edit Setting" : "Create Setting"}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <Label>Setting Key</Label>
              <Input
                value={formData.key}
                onChange={(e) => setFormData((prev) => ({ ...prev, key: e.target.value }))}
                placeholder="MOBILE_APP"
              />
            </div>
            <div>
              <Label>Platform</Label>
              <select
                value={formData.platform}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    platform: e.target.value as AppSetting["platform"],
                  }))
                }
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="ALL">ALL</option>
                <option value="ANDROID">ANDROID</option>
                <option value="IOS">IOS</option>
                <option value="WEB">WEB</option>
              </select>
            </div>
            <div>
              <Label>Version</Label>
              <Input
                value={formData.version}
                onChange={(e) => setFormData((prev) => ({ ...prev, version: e.target.value }))}
                placeholder="1.0.0"
              />
            </div>
            <div>
              <Label>Min Supported Version</Label>
              <Input
                value={formData.minSupportedVersion}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minSupportedVersion: e.target.value,
                  }))
                }
                placeholder="0.9.0"
              />
            </div>
            <div>
              <Label>Latest Build Number</Label>
              <Input
                type="number"
                value={formData.latestBuildNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    latestBuildNumber: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Status</Label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as AppSetting["status"],
                  }))
                }
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="New update available"
              />
            </div>
            <div>
              <Label>Download URL</Label>
              <Input
                value={formData.downloadUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, downloadUrl: e.target.value }))
                }
                placeholder="https://example.com/download"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Update Message</Label>
              <textarea
                value={formData.updateMessage}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, updateMessage: e.target.value }))
                }
                rows={3}
                placeholder="Please update your app to continue."
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={formData.forceUpdate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, forceUpdate: e.target.checked }))
                }
              />
              Force Update
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={formData.maintenanceMode}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maintenanceMode: e.target.checked,
                  }))
                }
              />
              Maintenance Mode
            </label>
          </div>

          {error && <p className="mt-3 text-sm text-error-500">{error}</p>}

          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              startIcon={editingId ? <Pencil className="h-4 w-4" /> : undefined}
            >
              {submitting ? "Saving..." : editingId ? "Update Setting" : "Create Setting"}
            </Button>
            {editingId && (
              <Button
                variant="outline"
                onClick={resetForm}
                startIcon={<X className="h-4 w-4" />}
              >
                Cancel Edit
              </Button>
            )}
          </div>
        </ComponentCard>

        <ComponentCard title="Settings List">
          <div className="mb-4">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by key, version, platform or message"
            />
          </div>
          {loading && <p className="mb-2 text-sm text-gray-500">Loading...</p>}
          <div className="w-full max-w-full overflow-x-auto">
            <AppTable<AppSetting>
              data={items}
              columns={columns}
              pageSize={PAGE_SIZE}
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={(nextPage) => setCurrentPage(nextPage)}
            />
          </div>
        </ComponentCard>
      </div>
    </div>
  );
};

export default AppSettingsPage;
