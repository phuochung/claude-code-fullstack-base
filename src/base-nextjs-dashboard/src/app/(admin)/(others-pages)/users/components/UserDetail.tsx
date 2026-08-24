"use client";

import { useI18n } from "@/context/I18nContext";
import { formatDateTime } from "@/utils/dateTime";
import ButtonEdit from "@/components/common/buttons/ButtonEdit";
import ButtonBack from "@/components/common/buttons/ButtonBack";
import { User } from "@/types/user";
import { USER_ROLE } from "@/constants/common";

interface UserDetailProps {
    user: User;
    onEdit?: () => void;
    onBack?: () => void;
}

export default function UserDetail({ user, onEdit, onBack }: UserDetailProps) {
    const { t } = useI18n();
    if (!user) return null;

    const getRoleName = (roleValue: number) => {
        return Object.values(USER_ROLE).find((r) => r.value === roleValue)?.name || t("users.table.unknown");
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("users.form.name")}
                        </label>
                        <p className="text-gray-900 dark:text-white">{user.name}</p>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("users.form.email")}
                        </label>
                        <p className="text-gray-900 dark:text-white">{user.email}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("users.form.phoneNumber")}
                        </label>
                        <p className="text-gray-900 dark:text-white">{user.phoneNumber}</p>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("users.form.role")}
                        </label>
                        <p className="text-gray-900 dark:text-white">{getRoleName(user.role)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("common.table.createdAt")}
                        </label>
                        <p className="text-gray-900 dark:text-white">
                            {formatDateTime(user.createdAt)}
                        </p>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("common.table.updatedAt")}
                        </label>
                        <p className="text-gray-900 dark:text-white">
                            {formatDateTime(user.updatedAt)}
                        </p>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("common.table.lastActive")}
                        </label>
                        <p className="text-gray-900 dark:text-white">
                            {user.lastActiveAt ? formatDateTime(user.lastActiveAt) : '-'}
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
