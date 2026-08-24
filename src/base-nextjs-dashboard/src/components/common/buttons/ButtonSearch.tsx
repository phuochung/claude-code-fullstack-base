"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/button/Button";

type ButtonSearchProps = {
    label?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    size?: "xs" | "sm" | "md";
    type?: "button" | "submit" | "reset";
    showIcon?: boolean;
};

export default function ButtonSearch({
    label,
    onClick,
    disabled,
    className = "",
    size = "xs",
    type = "submit",
    showIcon = true,
}: ButtonSearchProps) {
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
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                ) : undefined
            }
        >
            {label ?? null}
        </Button>
    );
}
