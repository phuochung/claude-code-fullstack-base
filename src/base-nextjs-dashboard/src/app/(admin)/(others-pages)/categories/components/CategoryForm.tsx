"use client";

import { useState, useEffect } from "react";
import { Category, CategoryFormData } from "@/types/category";
import { useI18n } from "@/context/I18nContext";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import ButtonCancel from "@/components/common/buttons/ButtonCancel";
import ButtonSave from "@/components/common/buttons/ButtonSave";
import { CATEGORY_MODULES } from "@/constants/common";

interface CategoryFormProps {
    category: Category | null;
    defaultModule?: string;
    onSave: (data: CategoryFormData) => void;
    onCancel: () => void;
}

export default function CategoryForm({ category, defaultModule = CATEGORY_MODULES[0], onSave, onCancel }: CategoryFormProps) {
    const { t } = useI18n();
    const [formData, setFormData] = useState<CategoryFormData>({
        module: defaultModule as typeof CATEGORY_MODULES[number],
        nameVi: "",
        nameEn: "",
        descriptionVi: "",
        descriptionEn: "",
    });
    const [errors, setErrors] = useState<Partial<Record<keyof CategoryFormData, string>>>({});
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        if (category) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the async-loaded category into editable form state (edit-form pattern)
            setFormData({
                module: category.module,
                nameVi: category.nameVi,
                nameEn: category.nameEn,
                descriptionVi: category.descriptionVi || "",
                descriptionEn: category.descriptionEn || "",
            });
        }
    }, [category]);

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof CategoryFormData, string>> = {};

        if (!formData.module) {
            newErrors.module = t("categories.validation.moduleRequired");
        }

        if (!formData.nameVi.trim()) {
            newErrors.nameVi = t("categories.validation.nameRequired");
        }

        if (!formData.nameEn.trim()) {
            newErrors.nameEn = t("categories.validation.nameEnRequired");
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            setShowConfirmation(true);
        }
    };

    const handleConfirmSave = () => {
        setShowConfirmation(false);
        onSave(formData);
    };

    const handleChange = (field: keyof CategoryFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <>
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Module */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            {t("categories.form.module")} <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.module}
                            onChange={(e) => handleChange("module", e.target.value)}
                            disabled={!!category}
                            className={`w-full rounded-lg border px-4 py-2 ${errors.module ? "border-red-500" : "border-gray-300 dark:border-gray-700"} dark:bg-gray-800`}
                        >
                            {CATEGORY_MODULES.map(m => (
                                <option key={m} value={m}>{t(`categories.modules.${m}`)}</option>
                            ))}
                        </select>
                        {errors.module && <p className="mt-1 text-sm text-red-500">{errors.module}</p>}
                    </div>

                    {/* Name */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            {t("categories.form.name")} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.nameVi}
                            onChange={(e) => handleChange("nameVi", e.target.value)}
                            className={`w-full rounded-lg border px-4 py-2 ${errors.nameVi
                                ? "border-red-500"
                                : "border-gray-300 dark:border-gray-700"
                                } dark:bg-gray-800`}
                            placeholder={t("categories.form.namePlaceholder")}
                        />
                        {errors.nameVi && (
                            <p className="mt-1 text-sm text-red-500">{errors.nameVi}</p>
                        )}
                    </div>

                    {/* Name (English) */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            {t("categories.form.nameEn")} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.nameEn}
                            onChange={(e) => handleChange("nameEn", e.target.value)}
                            className={`w-full rounded-lg border px-4 py-2 ${errors.nameEn
                                ? "border-red-500"
                                : "border-gray-300 dark:border-gray-700"
                                } dark:bg-gray-800`}
                            placeholder={t("categories.form.nameEnPlaceholder")}
                        />
                        {errors.nameEn && (
                            <p className="mt-1 text-sm text-red-500">{errors.nameEn}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            {t("categories.form.description")}
                        </label>
                        <textarea
                            value={formData.descriptionVi}
                            onChange={(e) => handleChange("descriptionVi", e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
                            placeholder={t("categories.form.descriptionPlaceholder")}
                        />
                    </div>

                    {/* Description (English) */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            {t("categories.form.descriptionEn")}
                        </label>
                        <textarea
                            value={formData.descriptionEn || ""}
                            onChange={(e) => handleChange("descriptionEn", e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
                            placeholder={t("categories.form.descriptionEnPlaceholder")}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap justify-end gap-3">
                        <ButtonCancel onClick={onCancel} />
                        <ButtonSave />
                    </div>
                </form>
            </div>

            <ConfirmationModal
                isOpen={showConfirmation}
                type="warning"
                title={t(category ? "categories.confirmUpdate.title" : "categories.confirmCreate.title")}
                message={t(category ? "categories.confirmUpdate.message" : "categories.confirmCreate.message")}
                confirmText={t("common.button.save")}
                onConfirm={handleConfirmSave}
                onCancel={() => setShowConfirmation(false)}
            />
        </>
    );
}
