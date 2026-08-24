"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loading from "@/components/common/Loading";
import { useI18n } from "@/context/I18nContext";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { Customer, CustomerFormData } from "@/types/customer";
import { customerService } from "@/api/services/customer";
import CustomerForm from "../../components/CustomerForm";

export default function EditCustomerPage() {
    const { t } = useI18n();
    const router = useRouter();
    const params = useParams();
    const customerId = params.id as string;
    const { isLoading, execute } = useAsyncAction();
    const [customer, setCustomer] = useState<Customer | null>(null);

    useEffect(() => {
        const fetchCustomer = async () => {
            await execute(
                () => customerService.getCustomerById(customerId),
                {
                    showSuccessToast: false,
                    onSuccess: (data) => setCustomer(data),
                    onError: () => router.push('/customers'),
                }
            );
        };
        fetchCustomer();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerId]);

    const handleSave = async (data: CustomerFormData) => {
        await execute(
            () => customerService.updateCustomer(customerId, data),
            {
                successMessage: t("customers.messages.updateSuccess"),
                onSuccess: () => router.push('/customers'),
            }
        );
    };

    if (isLoading && !customer) return <Loading text={t("common.message.loading")} />;

    return (
        <div>
            <div className="mb-6"><PageBreadcrumb /></div>
            {isLoading && <Loading fullScreen text={t("common.message.saving")} />}
            {customer && (
                <CustomerForm customer={customer} onSave={handleSave} onCancel={() => router.push('/customers')} />
            )}
        </div>
    );
}
