"use client";

import { useState, useEffect } from "react";
import { User, UserFormData } from "@/types/user";
import { USER_ROLE } from "@/constants/common";
import { useI18n } from "@/context/I18nContext";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import ButtonCancel from "@/components/common/buttons/ButtonCancel";
import ButtonSave from "@/components/common/buttons/ButtonSave";

interface UserFormProps {
    user?: User | null;
    onSave: (data: UserFormData) => void;
    onCancel: () => void;
}

const isKnownRole = (role?: number) =>
    Object.values(USER_ROLE).some((r) => r.value === role);

export default function UserForm({ user, onSave, onCancel }: UserFormProps) {
    const { t } = useI18n();
    const [formData, setFormData] = useState<UserFormData>({
        email: "",
        name: "",
        role: USER_ROLE.MANAGER.value,
        phoneNumber: "",
        password: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showConfirmation, setShowConfirmation] = useState(false);
    /**
     * Whether the admin touched the role picker on this edit. Until they do,
     * `role` is left out of the save entirely — see UserFormData.role. Sending
     * back "the role we happened to render" is how a role the dashboard cannot
     * represent gets overwritten.
     */
    const [roleTouched, setRoleTouched] = useState(false);

    // A role the backend has but the dashboard's two-entry list does not. Shown
    // read-only rather than coerced into the nearest known value: the picker has
    // no honest option for it, and this form is not where a role system gets
    // designed.
    const hasUnknownRole = !!user && !isKnownRole(user.role);

    // Load user data if editing
    useEffect(() => {
        if (user) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the async-loaded user into editable form state (edit-form pattern)
            setRoleTouched(false);
            setFormData({
                email: user.email,
                name: user.name,
                role: user.role,
                phoneNumber: user.phoneNumber ?? "",
            });
        }
    }, [user]);

    // Validation
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = t("users.form.validation.emailRequired");
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = t("users.form.validation.emailInvalid");
        }

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = t("users.form.validation.nameRequired");
        } else if (formData.name.trim().length < 2) {
            newErrors.name = t("users.form.validation.nameMinLength");
        }

        // Phone validation (simple regex for international format)
        const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = t("users.form.validation.phoneRequired");
        } else if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ""))) {
            newErrors.phoneNumber = t("users.form.validation.phoneInvalid");
        }

        // Password validation (only for new users)
        if (!user && !formData.password) {
            newErrors.password = t("users.form.validation.passwordRequired");
        } else if (!user && formData.password && formData.password.length < 6) {
            newErrors.password = t("users.form.validation.passwordMinLength");
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            setShowConfirmation(true);
        }
    };

    const handleConfirmSave = () => {
        setShowConfirmation(false);
        // Editing without touching the picker sends no `role` at all.
        const { role, ...rest } = formData;
        onSave(user && !roleTouched ? rest : { ...rest, role });
    };

    const handleChange = (field: keyof UserFormData, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    return (
        <>
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                {t("users.form.name")} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                placeholder={t("users.form.namePlaceholder")}
                                className={`w-full rounded-lg border px-4 py-2 ${errors.name
                                    ? "border-red-500"
                                    : "border-gray-300 dark:border-gray-700"
                                    } dark:bg-gray-800`}
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                {t("users.form.email")} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                placeholder={t("users.form.emailPlaceholder")}
                                className={`w-full rounded-lg border px-4 py-2 ${errors.email
                                    ? "border-red-500"
                                    : "border-gray-300 dark:border-gray-700"
                                    } dark:bg-gray-800`}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                {t("users.form.phoneNumber")} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                                placeholder={t("users.form.phonePlaceholder")}
                                className={`w-full rounded-lg border px-4 py-2 ${errors.phoneNumber
                                    ? "border-red-500"
                                    : "border-gray-300 dark:border-gray-700"
                                    } dark:bg-gray-800`}
                            />
                            {errors.phoneNumber && (
                                <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                {t("users.form.role")} <span className="text-red-500">*</span>
                            </label>
                            {hasUnknownRole ? (
                                <>
                                    <div className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                                        {t("users.form.roleUnknown")} ({user?.role})
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        {t("users.form.roleUnknownHint")}
                                    </p>
                                </>
                            ) : (
                                <select
                                    value={formData.role}
                                    onChange={(e) => {
                                        setRoleTouched(true);
                                        handleChange("role", Number(e.target.value));
                                    }}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800"
                                >
                                    {Object.values(USER_ROLE).map((role) => (
                                        <option key={role.value} value={role.value}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {!user && (
                            <div className="sm:col-span-2">
                                <label className="mb-2 block text-sm font-medium">
                                    {t("users.form.password")} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={formData.password || ""}
                                    onChange={(e) => handleChange("password", e.target.value)}
                                    placeholder={t("users.form.passwordPlaceholder")}
                                    className={`w-full rounded-lg border px-4 py-2 ${errors.password
                                        ? "border-red-500"
                                        : "border-gray-300 dark:border-gray-700"
                                        } dark:bg-gray-800`}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                                )}
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {t("users.form.passwordHint")}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
                        <ButtonCancel onClick={onCancel} />
                        <ButtonSave />
                    </div>
                </form>
            </div>
            <ConfirmationModal
                isOpen={showConfirmation}
                type="warning"
                title={t(user ? "users.confirmUpdate.title" : "users.confirmCreate.title")}
                message={t(user ? "users.confirmUpdate.message" : "users.confirmCreate.message")}
                confirmText={t("common.button.save")}
                onConfirm={handleConfirmSave}
                onCancel={() => setShowConfirmation(false)}
            />
        </>
    );
}
