"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/button/Button";
import { useI18n } from "@/context/I18nContext";

type ButtonEditProps = {
    onEdit?: () => void;
    label?: ReactNode; // optional; defaults to common.button.add
    disabled?: boolean;
    className?: string;
    size?: "sm" | "md";
    showIcon?: boolean;
};

export default function ButtonEdit({
    onEdit,
    label,
    disabled,
    className = "",
    size = "sm",
    showIcon = true,
}: ButtonEditProps) {
    const { t } = useI18n();

    return (
        <Button
            type="button"
            onClick={onEdit}
            disabled={disabled}
            size={size}
            variant="primary"
            className={className}
            startIcon={
                showIcon ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                ) : undefined
            }
        >
            {label ?? t("common.button.edit")}
        </Button>
    );
}
