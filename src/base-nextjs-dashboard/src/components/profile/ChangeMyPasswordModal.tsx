"use client";

import { useState } from "react";
import { useI18n } from "@/context/I18nContext";

interface ChangeMyPasswordModalProps {
    onClose: () => void;
    onSave: (oldPassword: string, newPassword: string) => Promise<void>;
}

export default function ChangeMyPasswordModal({
    onClose,
    onSave,
}: ChangeMyPasswordModalProps) {
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

        if (!oldPassword) {
            newErrors.oldPassword = t("profile.changePassword.validation.oldPasswordRequired");
        }

        if (!newPassword) {
            newErrors.newPassword = t("profile.changePassword.validation.newPasswordRequired");
        } else if (newPassword.length < 6) {
            newErrors.newPassword = t("profile.changePassword.validation.newPasswordMinLength");
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = t("profile.changePassword.validation.confirmPasswordRequired");
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = t("profile.changePassword.validation.passwordsNotMatch");
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
            await onSave(oldPassword, newPassword);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t("profile.changePassword.title")}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t("profile.changePassword.subtitle")}
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    {/* Old Password */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("profile.changePassword.oldPassword")}
                        </label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            placeholder={t("profile.changePassword.oldPasswordPlaceholder")}
                            className={`h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs ${errors.oldPassword
                                    ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
                                    : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10"
                                } focus:outline-hidden focus:ring-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90`}
                        />
                        {errors.oldPassword && (
                            <p className="mt-1 text-xs text-error-500">{errors.oldPassword}</p>
                        )}
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("profile.changePassword.newPassword")}
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder={t("profile.changePassword.newPasswordPlaceholder")}
                            className={`h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs ${errors.newPassword
                                    ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
                                    : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10"
                                } focus:outline-hidden focus:ring-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90`}
                        />
                        {errors.newPassword && (
                            <p className="mt-1 text-xs text-error-500">{errors.newPassword}</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("profile.changePassword.confirmPassword")}
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t("profile.changePassword.confirmPasswordPlaceholder")}
                            className={`h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs ${errors.confirmPassword
                                    ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
                                    : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10"
                                } focus:outline-hidden focus:ring-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90`}
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
                            {t("profile.changePassword.cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting
                                ? t("profile.changePassword.submitting")
                                : t("profile.changePassword.submitButton")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
