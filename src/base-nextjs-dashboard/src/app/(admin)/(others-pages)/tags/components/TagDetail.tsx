"use client";

import { Tag } from "@/types/tag";
import { useI18n } from "@/context/I18nContext";
import { formatDateTime } from "@/utils/dateTime";
import ButtonEdit from "@/components/common/buttons/ButtonEdit";
import ButtonBack from "@/components/common/buttons/ButtonBack";

interface TagDetailProps {
    tag: Tag;
    onEdit?: () => void;
    onBack?: () => void;
}

export default function TagDetail({ tag, onEdit, onBack }: TagDetailProps) {
    const { t } = useI18n();

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("tags.form.name")}
                        </label>
                        <p className="text-gray-900 dark:text-white">{tag.nameVi}</p>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("tags.form.nameEn")}
                        </label>
                        <p className="text-gray-900 dark:text-white">{tag.nameEn || '-'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("tags.form.description")}
                        </label>
                        <p className="text-gray-900 dark:text-white">{tag.descriptionVi || '-'}</p>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("tags.form.descriptionEn")}
                        </label>
                        <p className="text-gray-900 dark:text-white">{tag.descriptionEn || '-'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("common.table.createdAt")}
                        </label>
                        <p className="text-gray-900 dark:text-white">
                            {formatDateTime(tag.createdAt)}
                        </p>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("common.table.updatedAt")}
                        </label>
                        <p className="text-gray-900 dark:text-white">
                            {formatDateTime(tag.updatedAt)}
                        </p>
                    </div>
                </div>
            </div>

            {(onEdit || onBack) && (
                <div className="flex justify-end mt-6 flex gap-3">
                    {onBack && (
                        <ButtonBack onBack={onBack}></ButtonBack>
                    )}
                    {onEdit && (
                        <ButtonEdit onEdit={onEdit}></ButtonEdit>
                    )}
                </div>
            )}
        </div>
    );
}
