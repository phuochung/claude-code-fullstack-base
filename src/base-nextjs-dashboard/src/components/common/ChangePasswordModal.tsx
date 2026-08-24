"use client";

import { useState } from "react";
import { useI18n } from "@/context/I18nContext";
import { MIN_PASSWORD_LENGTH } from "@/constants/auth";
import Spinner from "@/components/common/Spinner";

interface ChangePasswordModalProps {
    title: string;
    subtitle?: string;
    /** Ask for the current password (self-service flow) or not (admin reset). */
    requireOldPassword?: boolean;
    onClose: () => void;
    /**
     * Called with the validated passwords. The parent owns success/error
     * messaging and closing the modal; a rejected promise keeps it open.
     */
    onSave: (newPassword: string, oldPassword?: string) => Promise<void>;
}

export default function ChangePasswordModal({
    title,
    subtitle,
    requireOldPassword = false,
    onClose,
    onSave,
}: ChangePasswordModalProps) {
    const { t } = useI18n();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<{
        oldPassword?: string;
        newPassword?: string;
        confirmPassword?: string;
    }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validate = () => {
        const newErrors: typeof errors = {};

        if (requireOldPassword && !oldPassword) {
            newErrors.oldPassword = t("common.changePasswordModal.validation.oldPasswordRequired");
        }

        if (!newPassword) {
            newErrors.newPassword = t("common.changePasswordModal.validation.newPasswordRequired");
        } else if (newPassword.length < MIN_PASSWORD_LENGTH) {
            newErrors.newPassword = t("common.changePasswordModal.validation.newPasswordMinLength");
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = t("common.changePasswordModal.validation.confirmPasswordRequired");
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = t("common.changePasswordModal.validation.passwordsNotMatch");
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave(newPassword, requireOldPassword ? oldPassword : undefined);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = (hasError: boolean) =>
        `h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs ${hasError
            ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
            : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10"
        } focus:outline-hidden focus:ring-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90`;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {title}
                </h2>
                {subtitle && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {subtitle}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    {/* Old Password */}
                    {requireOldPassword && (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t("common.changePasswordModal.oldPassword")} <span className="text-error-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                placeholder={t("common.changePasswordModal.oldPasswordPlaceholder")}
                                disabled={isSubmitting}
                                className={inputClass(!!errors.oldPassword)}
                            />
                            {errors.oldPassword && (
                                <p className="mt-1 text-xs text-error-500">{errors.oldPassword}</p>
                            )}
                        </div>
                    )}

                    {/* New Password */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("common.changePasswordModal.newPassword")} <span className="text-error-500">*</span>
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder={t("common.changePasswordModal.newPasswordPlaceholder")}
                            disabled={isSubmitting}
                            className={inputClass(!!errors.newPassword)}
                        />
                        {errors.newPassword && (
                            <p className="mt-1 text-xs text-error-500">{errors.newPassword}</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("common.changePasswordModal.confirmPassword")} <span className="text-error-500">*</span>
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t("common.changePasswordModal.confirmPasswordPlaceholder")}
                            disabled={isSubmitting}
                            className={inputClass(!!errors.confirmPassword)}
                        />
                        {errors.confirmPassword && (
                            <p className="mt-1 text-xs text-error-500">{errors.confirmPassword}</p>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"
                        >
                            {t("common.changePasswordModal.cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting && <Spinner />}
                            {isSubmitting
                                ? t("common.changePasswordModal.submitting")
                                : t("common.changePasswordModal.submitButton")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
