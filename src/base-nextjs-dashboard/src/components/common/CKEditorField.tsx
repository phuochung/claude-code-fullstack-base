"use client";

import { useState, useId } from "react";
import dynamic from "next/dynamic";

// Dynamically import CKEditor to avoid SSR issues
const CKEditorWrapper = dynamic(
    () => import("./CKEditorWrapper"),
    {
        ssr: false,
        loading: () => (
            <div className="w-full rounded-lg border border-gray-300 px-4 py-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Loading editor...</span>
                </div>
            </div>
        )
    }
);

interface CKEditorFieldProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export default function CKEditorField({
    value,
    onChange,
    disabled = false,
}: CKEditorFieldProps) {
    const [customHeight, setCustomHeight] = useState(450);
    const uniqueId = useId().replace(/:/g, '-');

    const increaseHeight = () => {
        setCustomHeight(prev => Math.min(prev + 100, 1000));
    };

    const decreaseHeight = () => {
        setCustomHeight(prev => Math.max(prev - 100, 200));
    };

    return (
        <>
            <style jsx global>{`
                .ckeditor-wrapper-${uniqueId} .ck-editor__editable_inline {
                    min-height: ${customHeight}px;
                }

                /* Fix list styling */
                .ckeditor-wrapper-${uniqueId} .ck-content ul {
                    list-style-type: disc;
                    padding-left: 2.5rem;
                }

                .ckeditor-wrapper-${uniqueId} .ck-content ol {
                    list-style-type: decimal;
                    padding-left: 2.5rem;
                }

                .ckeditor-wrapper-${uniqueId} .ck-content ul ul {
                    list-style-type: circle;
                }

                .ckeditor-wrapper-${uniqueId} .ck-content ul ul ul {
                    list-style-type: square;
                }

                .ckeditor-wrapper-${uniqueId} .ck-content li {
                    margin: 0.25rem 0;
                }
            `}</style>
            <div className={`ckeditor-wrapper ckeditor-wrapper-${uniqueId} relative`}>
                <div className="mb-2 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={decreaseHeight}
                        disabled={customHeight <= 200}
                        className="flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        title="Decrease height"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{customHeight}px</span>
                    <button
                        type="button"
                        onClick={increaseHeight}
                        disabled={customHeight >= 1000}
                        className="flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        title="Increase height"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                </div>
                <CKEditorWrapper
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                />
            </div>
        </>
    );
}
