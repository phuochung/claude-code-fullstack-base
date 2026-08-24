"use client";

import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loading from "@/components/common/Loading";
import { useI18n } from "@/context/I18nContext";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { CustomerFormData } from "@/types/customer";
import { customerService } from "@/api/services/customer";
import CustomerForm from "../components/CustomerForm";

export default function CreateCustomerPage() {
    const { t } = useI18n();
    const router = useRouter();
    const { isLoading, execute } = useAsyncAction();

    const handleSave = async (data: CustomerFormData) => {
        await execute(
            () => customerService.createCustomer(data),
            {
                successMessage: t("customers.messages.createSuccess"),
                onSuccess: () => router.push('/customers'),
            }
        );
    };

    return (
        <div>
            <div className="mb-6"><PageBreadcrumb /></div>
            {isLoading && <Loading fullScreen text={t("common.message.saving")} />}
            <CustomerForm customer={null} onSave={handleSave} onCancel={() => router.push('/customers')} />
        </div>
    );
}
