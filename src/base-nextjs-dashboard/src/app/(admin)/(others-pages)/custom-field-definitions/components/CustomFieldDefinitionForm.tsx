"use client";

import { useState, useEffect } from "react";
import { CustomFieldDefinition, CustomFieldDefinitionFormData, CustomFieldType } from "@/types/custom-field";
import { useI18n } from "@/context/I18nContext";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import ButtonCancel from "@/components/common/buttons/ButtonCancel";
import ButtonSave from "@/components/common/buttons/ButtonSave";
import { CUSTOM_FIELD_MODULES } from "@/constants/common";

const FIELD_TYPES: CustomFieldType[] = ['text', 'number', 'date', 'select'];

interface Props {
    definition: CustomFieldDefinition | null;
    defaultModule?: string;
    onSave: (data: CustomFieldDefinitionFormData) => void;
    onCancel: () => void;
}

export default function CustomFieldDefinitionForm({ definition, defaultModule = 'customer', onSave, onCancel }: Props) {
    const { t } = useI18n();
    const [formData, setFormData] = useState<CustomFieldDefinitionFormData>({
        module: defaultModule,
        key: '',
        label: '',
        fieldType: 'text',
        options: [],
        required: false,
        order: 0,
    });
    const [optionsText, setOptionsText] = useState('');
    const [errors, setErrors] = useState<Partial<Record<keyof CustomFieldDefinitionFormData, string>>>({});
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        if (definition) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the async-loaded definition into editable form state (edit-form pattern)
            setFormData({
                module: definition.module,
                key: definition.key,
                label: definition.label,
                fieldType: definition.fieldType,
                options: definition.options ?? [],
                required: definition.required,
                order: definition.order,
            });
            setOptionsText((definition.options ?? []).join(', '));
        }
    }, [definition]);

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof CustomFieldDefinitionFormData, string>> = {};
        if (!formData.module) newErrors.module = t("customFieldDefinitions.validation.moduleRequired");
        if (!formData.key.trim()) newErrors.key = t("customFieldDefinitions.validation.keyRequired");
        if (!formData.label.trim()) newErrors.label = t("customFieldDefinitions.validation.labelRequired");
        if (!formData.fieldType) newErrors.fieldType = t("customFieldDefinitions.validation.fieldTypeRequired");
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) setShowConfirmation(true);
    };

    const handleConfirmSave = () => {
        setShowConfirmation(false);
        const options = formData.fieldType === 'select'
            ? optionsText.split(',').map(s => s.trim()).filter(Boolean)
            : [];
        onSave({ ...formData, options });
    };

    const handleChange = <K extends keyof CustomFieldDefinitionFormData>(field: K, value: CustomFieldDefinitionFormData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const inputClass = (field: keyof CustomFieldDefinitionFormData) =>
        `w-full rounded-lg border px-4 py-2 ${errors[field] ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} dark:bg-gray-800`;

    return (
        <>
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Module */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            {t("customFieldDefinitions.form.module")} <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.module}
                            onChange={e => handleChange('module', e.target.value)}
                            disabled={!!definition}
                            className={inputClass('module')}
                        >
                            {CUSTOM_FIELD_MODULES.map(m => (
                                <option key={m} value={m}>{t(`customFieldDefinitions.modules.${m}`)}</option>
                            ))}
                        </select>
                        {errors.module && <p className="mt-1 text-sm text-red-500">{errors.module}</p>}
                    </div>

                    {/* Key */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            {t("customFieldDefinitions.form.key")} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.key}
                            onChange={e => handleChange('key', e.target.value)}
                            disabled={!!definition}
                            className={inputClass('key')}
                            placeholder={t("customFieldDefinitions.form.keyPlaceholder")}
                        />
                        {errors.key && <p className="mt-1 text-sm text-red-500">{errors.key}</p>}
                    </div>

                    {/* Label */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            {t("customFieldDefinitions.form.label")} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.label}
                            onChange={e => handleChange('label', e.target.value)}
                            className={inputClass('label')}
                            placeholder={t("customFieldDefinitions.form.labelPlaceholder")}
                        />
                        {errors.label && <p className="mt-1 text-sm text-red-500">{errors.label}</p>}
                    </div>

                    {/* Field Type */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            {t("customFieldDefinitions.form.fieldType")} <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.fieldType}
                            onChange={e => handleChange('fieldType', e.target.value as CustomFieldType)}
                            className={inputClass('fieldType')}
                        >
                            {FIELD_TYPES.map(ft => (
                                <option key={ft} value={ft}>{t(`customFieldDefinitions.fieldTypes.${ft}`)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Options (only for select) */}
                    {formData.fieldType === 'select' && (
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                {t("customFieldDefinitions.form.options")}
                            </label>
                            <textarea
                                value={optionsText}
                                onChange={e => setOptionsText(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
                                placeholder={t("customFieldDefinitions.form.optionsPlaceholder")}
                            />
                        </div>
                    )}

                    {/* Required */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="required"
                            checked={formData.required ?? false}
                            onChange={e => handleChange('required', e.target.checked)}
                            className="h-4 w-4"
                        />
                        <label htmlFor="required" className="text-sm font-medium">
                            {t("customFieldDefinitions.form.required")}
                        </label>
                    </div>

                    {/* Order */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            {t("customFieldDefinitions.form.order")}
                        </label>
                        <input
                            type="number"
                            value={formData.order ?? 0}
                            onChange={e => handleChange('order', Number(e.target.value))}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
                        />
                    </div>

                    <div className="flex flex-wrap justify-end gap-3">
                        <ButtonCancel onClick={onCancel} />
                        <ButtonSave />
                    </div>
                </form>
            </div>

            <ConfirmationModal
                isOpen={showConfirmation}
                type="warning"
                title={t(definition ? "customFieldDefinitions.confirmUpdate.title" : "customFieldDefinitions.confirmCreate.title")}
                message={t(definition ? "customFieldDefinitions.confirmUpdate.message" : "customFieldDefinitions.confirmCreate.message")}
                confirmText={t("common.button.save")}
                onConfirm={handleConfirmSave}
                onCancel={() => setShowConfirmation(false)}
            />
        </>
    );
}
