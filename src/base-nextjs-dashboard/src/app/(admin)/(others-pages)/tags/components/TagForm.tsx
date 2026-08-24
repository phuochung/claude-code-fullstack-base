"use client";

import { useState, useEffect } from "react";
import { Tag, TagFormData } from "@/types/tag";
import { useI18n } from "@/context/I18nContext";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import ButtonCancel from "@/components/common/buttons/ButtonCancel";
import ButtonSave from "@/components/common/buttons/ButtonSave";
import { TAG_MODULES } from "@/constants/common";

interface TagFormProps {
    tag: Tag | null;
    defaultModule?: string;
    onSave: (data: TagFormData) => void;
    onCancel: () => void;
}

export default function TagForm({ tag, defaultModule = TAG_MODULES[0], onSave, onCancel }: TagFormProps) {
    const { t } = useI18n();
    const [formData, setFormData] = useState<TagFormData>({
        module: defaultModule as typeof TAG_MODULES[number],
        nameVi: "",
        nameEn: "",
        descriptionVi: "",
        descriptionEn: "",
    });
    const [errors, setErrors] = useState<Partial<Record<keyof TagFormData, string>>>({});
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        if (tag) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the async-loaded tag into editable form state (edit-form pattern)
            setFormData({
                module: tag.module,
                nameVi: tag.nameVi,
                nameEn: tag.nameEn,
                descriptionVi: tag.descriptionVi || "",
                descriptionEn: tag.descriptionEn || "",
            });
        }
    }, [tag]);

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof TagFormData, string>> = {};

        if (!formData.module) {
            newErrors.module = t("tags.validation.moduleRequired");
        }

        if (!formData.nameVi.trim()) {
            newErrors.nameVi = t("tags.validation.nameRequired");
        }

        if (!formData.nameEn.trim()) {
            newErrors.nameEn = t("tags.validation.nameEnRequired");
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

    const handleChange = (field: keyof TagFormData, value: string) => {
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
                            {t("tags.form.module")} <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.module}
                            onChange={(e) => handleChange("module", e.target.value)}
                            disabled={!!tag}
                            className={`w-full rounded-lg border px-4 py-2 ${errors.module ? "border-red-500" : "border-gray-300 dark:border-gray-700"} dark:bg-gray-800`}
                        >
                            {TAG_MODULES.map(m => (
                                <option key={m} value={m}>{t(`tags.modules.${m}`)}</option>
                            ))}
                        </select>
                        {errors.module && <p className="mt-1 text-sm text-red-500">{errors.module}</p>}
                    </div>

                    {/* Name (Vietnamese) */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            {t("tags.form.name")} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.nameVi}
                            onChange={(e) => handleChange("nameVi", e.target.value)}
                            className={`w-full rounded-lg border px-4 py-2 ${errors.nameVi
                                ? "border-red-500"
                                : "border-gray-300 dark:border-gray-700"
                                } dark:bg-gray-800`}
                            placeholder={t("tags.form.namePlaceholder")}
                        />
                        {errors.nameVi && (
                            <p className="mt-1 text-sm text-red-500">{errors.nameVi}</p>
                        )}
                    </div>

                    {/* Name (English) */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            {t("tags.form.nameEn")} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.nameEn}
                            onChange={(e) => handleChange("nameEn", e.target.value)}
                            className={`w-full rounded-lg border px-4 py-2 ${errors.nameEn
                                ? "border-red-500"
                                : "border-gray-300 dark:border-gray-700"
                                } dark:bg-gray-800`}
                            placeholder={t("tags.form.nameEnPlaceholder")}
                        />
                        {errors.nameEn && (
                            <p className="mt-1 text-sm text-red-500">{errors.nameEn}</p>
                        )}
                    </div>

                    {/* Description (Vietnamese) */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            {t("tags.form.description")}
                        </label>
                        <textarea
                            value={formData.descriptionVi}
                            onChange={(e) => handleChange("descriptionVi", e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
                            placeholder={t("tags.form.descriptionPlaceholder")}
                        />
                    </div>

                    {/* Description (English) */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            {t("tags.form.descriptionEn")}
                        </label>
                        <textarea
                            value={formData.descriptionEn}
                            onChange={(e) => handleChange("descriptionEn", e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
                            placeholder={t("tags.form.descriptionEnPlaceholder")}
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
                title={t(tag ? "tags.confirmUpdate.title" : "tags.confirmCreate.title")}
                message={t(tag ? "tags.confirmUpdate.message" : "tags.confirmCreate.message")}
                confirmText={t("common.button.save")}
                onConfirm={handleConfirmSave}
                onCancel={() => setShowConfirmation(false)}
            />
        </>
    );
}
