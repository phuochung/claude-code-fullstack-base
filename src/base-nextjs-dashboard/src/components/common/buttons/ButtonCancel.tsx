"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/button/Button";
import { useI18n } from "@/context/I18nContext";

type ButtonCancelProps = {
    label?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    size?: "sm" | "md";
    type?: "button" | "submit" | "reset";
    showIcon?: boolean;
};

export default function ButtonCancel({
    label,
    onClick,
    disabled,
    className = "",
    size = "sm",
    type = "button",
    showIcon = true,
}: ButtonCancelProps) {
    const { t } = useI18n();
    return (
        <Button
            type={type}
            onClick={onClick}
            disabled={disabled}
            size={size}
            variant="outline"
            className={className}
            startIcon={
                showIcon ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : undefined
            }
        >
            {label ?? t("common.button.cancel")}
        </Button>
    );
}
