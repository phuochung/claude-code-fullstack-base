"use client";

import { useI18n } from "@/context/I18nContext";

export type ConfirmationType = "success" | "warning" | "danger";

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    type?: ConfirmationType;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmationModal({
    isOpen,
    title,
    message,
    type = "warning",
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
}: ConfirmationModalProps) {
    const { t } = useI18n();

    if (!isOpen) return null;

    const typeStyles = {
        success: {
            icon: "text-green-600",
            button: "bg-green-600 hover:bg-green-700",
            iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
        },
        warning: {
            icon: "text-yellow-600",
            button: "bg-yellow-600 hover:bg-yellow-700",
            iconPath: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
        },
        danger: {
            icon: "text-red-600",
            button: "bg-red-600 hover:bg-red-700",
            iconPath: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        },
    };

    const currentStyle = typeStyles[type];

    return (
        <div className="fixed inset-0 z-999999 flex items-center justify-center overflow-y-auto">
            <div
                className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px]"
                onClick={onCancel}
            ></div>
            <div className="relative w-full max-w-md rounded-3xl bg-white p-6 dark:bg-gray-900">
                <div className="mb-4 flex items-start gap-4">
                    <div className={`flex-shrink-0 ${currentStyle.icon}`}>
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
                                d={currentStyle.iconPath}
                            />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {title}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                        {cancelText || t("common.button.cancel")}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${currentStyle.button}`}
                    >
                        {confirmText || t("common.button.confirm")}
                    </button>
                </div>
            </div>
        </div>
    );
}
