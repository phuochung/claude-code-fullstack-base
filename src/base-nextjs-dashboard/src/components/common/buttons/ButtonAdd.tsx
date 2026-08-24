"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/button/Button";
import { useI18n } from "@/context/I18nContext";

type ButtonAddProps = {
    onClick?: () => void;
    label?: ReactNode; // optional; defaults to common.button.add
    disabled?: boolean;
    className?: string;
    size?: "xs" | "sm" | "md";
    showIcon?: boolean;
};

export default function ButtonAdd({
    onClick,
    label,
    disabled,
    className = "",
    size = "xs",
    showIcon = true,
}: ButtonAddProps) {
    const { t } = useI18n();

    return (
        <Button
            type="button"
            onClick={onClick}
            disabled={disabled}
            size={size}
            variant="primary"
            className={className}
            startIcon={
                showIcon ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                ) : undefined
            }
        >
            {label ?? t("common.button.add")}
        </Button>
    );
}
