"use client";

import { useI18n } from "@/context/I18nContext";

export type ProgressStepStatus = "pending" | "loading" | "success" | "error";

export interface ProgressStep {
    id: string;
    label: string;
    status: ProgressStepStatus;
    errorMessage?: string;
}

interface ProgressModalProps {
    isOpen: boolean;
    title: string;
    steps: ProgressStep[];
    onClose?: () => void;
}

export default function ProgressModal({
    isOpen,
    title,
    steps,
    onClose,
}: ProgressModalProps) {
    const { t } = useI18n();

    if (!isOpen) return null;

    // Check if any step is in error
    const hasError = steps.some((step) => step.status === "error");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center justify-items-center bg-gray-400/50 p-4 backdrop-blur-[32px]">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
                    {title}
                </h3>

                <div className="space-y-4">
                    {steps.map((step) => (
                        <div key={step.id} className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                {step.status === "pending" && (
                                    <div className="h-6 w-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                                )}
                                {step.status === "loading" && (
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                )}
                                {step.status === "success" && (
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                                {step.status === "error" && (
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className={`font-medium ${step.status === "pending"
                                    ? "text-gray-500 dark:text-gray-400"
                                    : step.status === "error"
                                        ? "text-red-500"
                                        : "text-gray-900 dark:text-white"
                                    }`}>
                                    {step.label}
                                </p>
                                {step.status === "error" && step.errorMessage && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {step.errorMessage}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {hasError && onClose && (
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                            {t("common.button.close")}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
