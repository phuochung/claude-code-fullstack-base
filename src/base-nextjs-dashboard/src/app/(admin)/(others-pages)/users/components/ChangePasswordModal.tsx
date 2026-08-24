"use client";

import { useState } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useToast } from "@/context/ToastContext";
import { useI18n } from "@/context/I18nContext";

interface ChangePasswordModalProps {
    userId: string;
    userName: string;
    onClose: () => void;
    onSave: (userId: string, newPassword: string) => void;
}

export default function ChangePasswordModal({
    userId,
    userName,
    onClose,
    onSave,
}: ChangePasswordModalProps) {
    const { t } = useI18n();
    const [passwords, setPasswords] = useState({
        newPassword: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!passwords.newPassword) {
            newErrors.newPassword = t("users.changePassword.validation.newPasswordRequired");
        } else if (passwords.newPassword.length < 6) {
            newErrors.newPassword = t("users.changePassword.validation.newPasswordMinLength");
        }

        if (!passwords.confirmPassword) {
            newErrors.confirmPassword = t("users.changePassword.validation.confirmPasswordRequired");
        } else if (passwords.newPassword !== passwords.confirmPassword) {
            newErrors.confirmPassword = t("users.changePassword.validation.passwordsNotMatch");
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            onSave(userId, passwords.newPassword);
            toast.success(t("users.messages.passwordChanged"));
            onClose();
        } catch {
            toast.error(t("users.messages.passwordChangeFailed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswords((prev) => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-theme-xl dark:bg-gray-dark">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {t("users.changePassword.title")}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {userName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:bg-gray-800"
                    >
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>
                            {t("users.changePassword.newPassword")} <span className="text-error-500">*</span>
                        </Label>
                        <Input
                            type="password"
                            name="newPassword"
                            placeholder={t("users.changePassword.newPasswordPlaceholder")}
                            defaultValue={passwords.newPassword}
                            onChange={handleChange}
                            error={!!errors.newPassword}
                            disabled={isSubmitting}
                        />
                        {errors.newPassword && (
                            <p className="mt-1 text-sm text-error-500">{errors.newPassword}</p>
                        )}
                    </div>

                    <div>
                        <Label>
                            {t("users.changePassword.confirmPassword")} <span className="text-error-500">*</span>
                        </Label>
                        <Input
                            type="password"
                            name="confirmPassword"
                            placeholder={t("users.changePassword.confirmPasswordPlaceholder")}
                            defaultValue={passwords.confirmPassword}
                            onChange={handleChange}
                            error={!!errors.confirmPassword}
                            disabled={isSubmitting}
                        />
                        {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-error-500">
                                {errors.confirmPassword}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"
                        >
                            {t("users.changePassword.cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting && (
                                <svg
                                    className="h-4 w-4 animate-spin"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                            )}
                            {t("users.changePassword.submitButton")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
