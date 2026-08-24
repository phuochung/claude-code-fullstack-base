"use client";

import { Customer } from "@/types/customer";
import { useI18n } from "@/context/I18nContext";
import { formatDateTime } from "@/utils/dateTime";
import ButtonEdit from "@/components/common/buttons/ButtonEdit";
import ButtonBack from "@/components/common/buttons/ButtonBack";

interface Props {
    customer: Customer;
    onEdit?: () => void;
    onBack?: () => void;
}

export default function CustomerDetail({ customer, onEdit, onBack }: Props) {
    const { t } = useI18n();

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("customers.form.name")}</label>
                        <p className="text-gray-900 dark:text-white">{customer.name}</p>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("customers.form.phone")}</label>
                        <p className="text-gray-900 dark:text-white">{customer.phoneNumber}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("customers.form.email")}</label>
                        <p className="text-gray-900 dark:text-white">{customer.email || '-'}</p>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("customers.form.gender")}</label>
                        <p className="text-gray-900 dark:text-white">
                            {customer.gender ? t(`customers.gender.${customer.gender}`) : '-'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("customers.form.source")}</label>
                        <p className="text-gray-900 dark:text-white">
                            {customer.source ? t(`customers.source.${customer.source}`) : '-'}
                        </p>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("customers.form.address")}</label>
                        <p className="text-gray-900 dark:text-white">{customer.address || '-'}</p>
                    </div>
                </div>

                {customer.customFields && customer.customFields.length > 0 && (
                    <div>
                        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">
                            {t("customers.form.customFieldsSection")}
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {customer.customFields.map(cf => (
                                <div key={cf.key}>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{cf.label}</label>
                                    <p className="text-gray-900 dark:text-white">{cf.value ?? '-'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("common.table.createdAt")}</label>
                        <p className="text-gray-900 dark:text-white">{formatDateTime(customer.createdAt)}</p>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("common.table.updatedAt")}</label>
                        <p className="text-gray-900 dark:text-white">{formatDateTime(customer.updatedAt)}</p>
                    </div>
                </div>
            </div>

            {(onEdit || onBack) && (
                <div className="mt-6 flex justify-end gap-3">
                    {onBack && <ButtonBack onBack={onBack} />}
                    {onEdit && <ButtonEdit onEdit={onEdit} />}
                </div>
            )}
        </div>
    );
}
