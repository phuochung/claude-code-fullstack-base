"use client";

import { useState, useRef, useEffect } from "react";
import { ALLOWED_IMAGE_TYPES } from "@/constants/common";
import { useI18n } from "@/context/I18nContext";
import Image from "next/image";

interface UploadImageProps {
    value?: string;
    onChange?: (url: string) => void;
    onFileSelect?: (file: File | null) => void;
    path?: string;
    disabled?: boolean;
}

export default function UploadImage({
    value,
    onChange,
    onFileSelect,
    disabled = false,
}: UploadImageProps) {
    const { t } = useI18n();
    const [error, setError] = useState("");
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Follow the async-loaded `value` prop back down into the local preview.
    useEffect(() => {
        if (value) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the value prop into local preview state
            setPreviewUrl(value);
        } else {
            setPreviewUrl("");
        }
    }, [value]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setError(t("common.invalidImageType"));
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError(t("common.fileTooLarge"));
            return;
        }

        setError("");

        if (onFileSelect) {
            // Deferred upload mode
            const objectUrl = URL.createObjectURL(file);
            console.log('objectUrl', objectUrl);

            setPreviewUrl(objectUrl);
            onFileSelect(file);
        }
    };

    const handleRemove = () => {
        if (onFileSelect) {
            onFileSelect(null);
            setPreviewUrl("");
            if (value && onChange) onChange(""); // clear if there was a previous value (edit mode)
        } else if (onChange) {
            onChange("");
            setPreviewUrl("");
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Cleanup object URL
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    return (
        <div>
            {previewUrl ? (
                <div className="relative inline-block">
                    <Image
                        src={previewUrl}
                        alt="Preview"
                        width={200}
                        height={200}
                        className="rounded-lg object-cover"
                    />
                    {!disabled && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    )}
                </div>
            ) : (
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ALLOWED_IMAGE_TYPES.join(",")}
                        onChange={handleFileChange}
                        disabled={disabled}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled}
                        className="rounded-lg border-2 border-dashed border-gray-300 px-4 py-8 text-center hover:border-brand-500 disabled:opacity-50"
                    >
                        <span>{t("common.uploadImage.clickToUpload")}</span>
                    </button>
                </div>
            )}

            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}
