"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loading from "@/components/common/Loading";
import { useI18n } from "@/context/I18nContext";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { Customer } from "@/types/customer";
import { customerService } from "@/api/services/customer";
import CustomerDetail from "../components/CustomerDetail";

export default function CustomerDetailPage() {
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

    if (isLoading || !customer) return <Loading text={t("common.message.loading")} />;

    return (
        <div>
            <div className="mb-6"><PageBreadcrumb /></div>
            <CustomerDetail
                customer={customer}
                onEdit={() => router.push(`/customers/${customerId}/edit`)}
                onBack={() => router.push('/customers')}
            />
        </div>
    );
}
