"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/button/Button";
import { useI18n } from "@/context/I18nContext";

type ButtonBackProps = {
    onBack?: () => void;
    label?: ReactNode; // optional; defaults to common.button.add
    disabled?: boolean;
    className?: string;
    size?: "sm" | "md";
    showIcon?: boolean;
};

export default function ButtonBack({
    onBack,
    label,
    disabled,
    className = "",
    size = "sm",
    showIcon = true,
}: ButtonBackProps) {
    const { t } = useI18n();

    return (
        <Button
            type="button"
            onClick={onBack}
            disabled={disabled}
            size={size}
            variant="outline"
            className={className}
            startIcon={
                showIcon ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                ) : undefined
            }
        >
            {label ?? t("common.button.back")}
        </Button>
    );
}
