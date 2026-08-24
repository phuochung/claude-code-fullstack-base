"use client";

import { useState, useEffect, useCallback } from "react";
import { categoryService } from "@/api/services/category";
import { Category } from "@/types/category";
import { useI18n } from "@/context/I18nContext";

interface CategoryDropdownProps {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
}

export default function CategoryDropdown({
    value,
    onChange,
    required = false,
    disabled = false,
}: CategoryDropdownProps) {
    const { t } = useI18n();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Stable identity (reads only module-level services and state setters), so
    // the effect below still fires exactly once on mount.
    const loadCategories = useCallback(async () => {
        try {
            // Using getCategories with no pagination to get all
            const response = await categoryService.getAllCategories();
            setCategories(response || []);
        } catch (error) {
            console.error("Failed to load categories:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; state updates land after the awaited response
        loadCategories();
    }, [loadCategories]);

    return (
        <div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled || loading}
                required={required}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
            >
                <option value="">{loading ? t("common.message.loading") : t("common.dropdown.selectOption")}</option>
                {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                        {category.nameVi}{category.nameEn ? ` (${category.nameEn})` : ''}
                    </option>
                ))}
            </select>
        </div>
    );
}
