"use client";

import React from "react";
import Select, { MultiValue } from "react-select";
import { useI18n } from "@/context/I18nContext";

interface Option {
  value: string;
  text: string;
  selected: boolean;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  defaultSelected?: string[];
  onChange?: (selected: string[]) => void;
  disabled?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  defaultSelected = [],
  onChange,
  disabled = false,
}) => {
  const { t } = useI18n();

  const selectOptions = options.map((opt) => ({
    value: opt.value,
    label: opt.text,
  }));

  const selectedValues = selectOptions.filter((opt) =>
    defaultSelected.includes(opt.value)
  );

  const handleChange = (newValue: MultiValue<{ value: string; label: string }>) => {
    if (onChange) {
      onChange(newValue.map((v) => v.value));
    }
  };

  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
        {label}
      </label>
      <Select
        isMulti
        closeMenuOnSelect={false}
        options={selectOptions}
        value={selectedValues}
        onChange={handleChange}
        isDisabled={disabled}
        classNamePrefix="react-select"
        className="my-react-select-container"
        placeholder={t("common.dropdown.selectMultipleOption")}
      />
    </div>
  );
};

export default MultiSelect;
