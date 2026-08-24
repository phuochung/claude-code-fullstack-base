"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/button/Button";
import { useI18n } from "@/context/I18nContext";

type ButtonCloseProps = {
    label?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    size?: "sm" | "md";
    type?: "button" | "submit" | "reset";
    showIcon?: boolean;
};

export default function ButtonClose({
    label,
    onClick,
    disabled,
    className = "rounded-lg bg-gray-200 px-6 py-2 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600",
    size = "sm",
    type = "button"
}: ButtonCloseProps) {
    const { t } = useI18n();
    return (
        <Button
            type={type}
            onClick={onClick}
            disabled={disabled}
            size={size}
            variant="outline"
            className={className}
        >
            {label ?? t("common.button.close")}
        </Button>
    );
}
