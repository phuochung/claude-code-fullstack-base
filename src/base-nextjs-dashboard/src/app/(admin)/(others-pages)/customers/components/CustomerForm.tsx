"use client";

import { useState, useEffect } from "react";
import { Customer, CustomerFormData, CustomFieldValue } from "@/types/customer";
import { CustomFieldDefinition } from "@/types/custom-field";
import { useI18n } from "@/context/I18nContext";
import { customFieldDefinitionService } from "@/api/services/custom-field-definition";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import ButtonCancel from "@/components/common/buttons/ButtonCancel";
import ButtonSave from "@/components/common/buttons/ButtonSave";

const GENDER_OPTIONS = ['male', 'female', 'other'] as const;
const SOURCE_OPTIONS = ['web', 'facebook', 'zalo', 'call'] as const;

interface Props {
    customer: Customer | null;
    onSave: (data: CustomerFormData) => void;
    onCancel: () => void;
}

export default function CustomerForm({ customer, onSave, onCancel }: Props) {
    const { t } = useI18n();
    const [formData, setFormData] = useState<CustomerFormData>({
        name: '',
        phoneNumber: '',
        email: '',
        gender: undefined,
        source: undefined,
        address: '',
        customFields: [],
    });
    const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
    const [customFieldValues, setCustomFieldValues] = useState<Record<string, CustomFieldValue>>({});

    useEffect(() => {
        customFieldDefinitionService.getDefinitionsByModule('customer')
            .then(setDefinitions)
            .catch(() => setDefinitions([]));
    }, []);

    useEffect(() => {
        if (customer) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the async-loaded customer into editable form state (edit-form pattern)
            setFormData({
                name: customer.name,
                phoneNumber: customer.phoneNumber,
                email: customer.email || '',
                gender: customer.gender,
                source: customer.source,
                address: customer.address || '',
                customFields: [],
            });
        }
    }, [customer]);

    useEffect(() => {
        if (customer?.customFields && definitions.length > 0) {
            const valMap: Record<string, CustomFieldValue> = {};
            for (const def of definitions) {
                const found = customer.customFields.find(cf => cf.key === def.key);
                valMap[def._id] = found?.value ?? '';
            }
            // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the async-loaded custom field values into editable form state (edit-form pattern)
            setCustomFieldValues(valMap);
        }
    }, [customer, definitions]);

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof CustomerFormData, string>> = {};
        if (!formData.name.trim()) newErrors.name = t("customers.validation.nameRequired");
        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = t("customers.validation.phoneRequired");
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) setShowConfirmation(true);
    };

    const handleConfirmSave = () => {
        setShowConfirmation(false);
        const customFields = definitions
            .filter(def => customFieldValues[def._id] !== undefined && customFieldValues[def._id] !== '')
            .map(def => ({ definitionId: def._id, value: customFieldValues[def._id] }));
        onSave({ ...formData, customFields });
    };

    const handleChange = (field: keyof CustomerFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const handleCustomFieldChange = (defId: string, value: CustomFieldValue) => {
        setCustomFieldValues(prev => ({ ...prev, [defId]: value }));
    };

    const inputClass = (hasError: boolean) =>
        `w-full rounded-lg border px-4 py-2 ${hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} dark:bg-gray-800`;

    const renderCustomField = (def: CustomFieldDefinition) => {
        const value = customFieldValues[def._id] ?? '';
        const base = "w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800";
        switch (def.fieldType) {
            case 'select':
                return (
                    <select value={value} onChange={e => handleCustomFieldChange(def._id, e.target.value)} className={base}>
                        <option value="">{t("common.dropdown.selectOption")}</option>
                        {(def.options ?? []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                );
            case 'number':
                return <input type="number" value={value} onChange={e => handleCustomFieldChange(def._id, e.target.value)} className={base} />;
            case 'date':
                return <input type="date" value={value} onChange={e => handleCustomFieldChange(def._id, e.target.value)} className={base} />;
            default:
                return <input type="text" value={value} onChange={e => handleCustomFieldChange(def._id, e.target.value)} className={base} />;
        }
    };

    return (
        <>
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            {t("customers.form.name")} <span className="text-red-500">*</span>
                        </label>
                        <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)}
                            className={inputClass(!!errors.name)} placeholder={t("customers.form.namePlaceholder")} />
                        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            {t("customers.form.phone")} <span className="text-red-500">*</span>
                        </label>
                        <input type="text" value={formData.phoneNumber} onChange={e => handleChange('phoneNumber', e.target.value)}
                            className={inputClass(!!errors.phoneNumber)} placeholder={t("customers.form.phonePlaceholder")} />
                        {errors.phoneNumber && <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">{t("customers.form.email")}</label>
                        <input type="email" value={formData.email || ''} onChange={e => handleChange('email', e.target.value)}
                            className={inputClass(false)} placeholder={t("customers.form.emailPlaceholder")} />
                    </div>

                    {/* Gender */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">{t("customers.form.gender")}</label>
                        <select value={formData.gender || ''} onChange={e => handleChange('gender', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
                            <option value="">{t("customers.form.genderPlaceholder")}</option>
                            {GENDER_OPTIONS.map(g => <option key={g} value={g}>{t(`customers.gender.${g}`)}</option>)}
                        </select>
                    </div>

                    {/* Source */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">{t("customers.form.source")}</label>
                        <select value={formData.source || ''} onChange={e => handleChange('source', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
                            <option value="">{t("customers.form.sourcePlaceholder")}</option>
                            {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{t(`customers.source.${s}`)}</option>)}
                        </select>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">{t("customers.form.address")}</label>
                        <textarea value={formData.address || ''} onChange={e => handleChange('address', e.target.value)}
                            rows={3} className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
                            placeholder={t("customers.form.addressPlaceholder")} />
                    </div>

                    {/* Custom Fields */}
                    {definitions.length > 0 && (
                        <div>
                            <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">
                                {t("customers.form.customFieldsSection")}
                            </h3>
                            <div className="space-y-4">
                                {definitions.map(def => (
                                    <div key={def._id}>
                                        <label className="mb-2 block text-sm font-medium">
                                            {def.label}
                                            {def.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        {renderCustomField(def)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-3">
                        <ButtonCancel onClick={onCancel} />
                        <ButtonSave />
                    </div>
                </form>
            </div>

            <ConfirmationModal
                isOpen={showConfirmation}
                type="warning"
                title={t(customer ? "customers.confirmUpdate.title" : "customers.confirmCreate.title")}
                message={t(customer ? "customers.confirmUpdate.message" : "customers.confirmCreate.message")}
                confirmText={t("common.button.save")}
                onConfirm={handleConfirmSave}
                onCancel={() => setShowConfirmation(false)}
            />
        </>
    );
}
