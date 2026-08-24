"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/button/Button";

type ButtonXProps = {
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    title?: string;
    ariaLabel?: string;
    variant?: "primary" | "outline";
    size?: "sm" | "md";
    labelSrOnly?: ReactNode; // for screen readers if you prefer custom text
};

export default function ButtonX({
    onClick,
    disabled,
    className = "",
    title,
    ariaLabel = "Close",
    variant = "outline",
    size = "sm",
    labelSrOnly,
}: ButtonXProps) {
    return (
        <span title={title}>
            <Button
                type="button"
                onClick={onClick}
                disabled={disabled}
                variant={variant}
                size={size}
                className={`!px-2 !py-2 ${className}`}
                startIcon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                }
            >
                <span className="sr-only" aria-label={ariaLabel}>
                    {labelSrOnly ?? ariaLabel}
                </span>
            </Button>
        </span>
    );
}
