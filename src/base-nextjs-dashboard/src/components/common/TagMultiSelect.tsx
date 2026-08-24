"use client";

import { useState, useEffect, useCallback } from "react";
import Select, { MultiValue } from "react-select";
import { tagService } from "@/api/services/tag";
import { useI18n } from "@/context/I18nContext";

interface TagMultiSelectProps {
    value: string[];
    onChange: (value: string[]) => void;
    disabled?: boolean;
}

interface TagOption {
    value: string;
    label: string;
}

export default function TagMultiSelect({
    value,
    onChange,
    disabled = false,
}: TagMultiSelectProps) {
    const { t } = useI18n();
    const [options, setOptions] = useState<TagOption[]>([]);
    const [loading, setLoading] = useState(true);

    // Stable identity (reads only module-level services and state setters), so
    // the effect below still fires exactly once on mount.
    const loadTags = useCallback(async () => {
        try {
            const response = await tagService.getAllTags();
            if (response) {
                const tagOptions = response.map((tag) => ({
                    value: tag._id,
                    label: tag.nameEn ? `${tag.nameVi} (${tag.nameEn})` : tag.nameVi,
                }));
                setOptions(tagOptions);
            }
        } catch (error) {
            console.error("Failed to load tags:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; state updates land after the awaited response
        loadTags();
    }, [loadTags]);

    const handleChange = (selectedOptions: MultiValue<TagOption>) => {
        onChange(selectedOptions.map((option) => option.value));
    };

    // Filter available options to find the selected ones
    const selectedValues = options.filter((option) => value.includes(option.value));

    return (
        <div>
            <Select
                isMulti
                options={options}
                closeMenuOnSelect={false}
                value={selectedValues}
                onChange={handleChange}
                isDisabled={disabled || loading}
                isLoading={loading}
                placeholder={t("common.dropdown.selectMultipleOption")}
                classNamePrefix="react-select"
                className="my-react-select-container"
            />
        </div>
    );
}
