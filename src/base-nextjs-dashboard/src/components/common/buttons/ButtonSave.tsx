"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/button/Button";
import { useI18n } from "@/context/I18nContext";

type ButtonSaveProps = {
    label?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    size?: "sm" | "md";
    type?: "button" | "submit" | "reset";
    showIcon?: boolean;
};

export default function ButtonSave({
    label,
    onClick,
    disabled,
    className = "",
    size = "sm",
    type = "submit",
    showIcon = true,
}: ButtonSaveProps) {
    const { t } = useI18n();
    return (
        <Button
            type={type}
            onClick={onClick}
            disabled={disabled}
            size={size}
            variant="primary"
            className={className}
            startIcon={
                showIcon ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : undefined
            }
        >
            {label ?? t("common.button.save")}
        </Button>
    );
}
