"use client";

import { useRouter, useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loading from "@/components/common/Loading";
import { useI18n } from "@/context/I18nContext";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { CustomFieldDefinitionFormData } from "@/types/custom-field";
import { customFieldDefinitionService } from "@/api/services/custom-field-definition";
import CustomFieldDefinitionForm from "../components/CustomFieldDefinitionForm";

export default function CreateCustomFieldDefinitionPage() {
    const { t } = useI18n();
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultModule = searchParams.get('module') || 'customer';
    const { isLoading, execute } = useAsyncAction();

    const handleSave = async (data: CustomFieldDefinitionFormData) => {
        await execute(
            () => customFieldDefinitionService.createDefinition(data),
            {
                successMessage: t("customFieldDefinitions.messages.createSuccess"),
                onSuccess: () => router.push('/custom-field-definitions'),
            }
        );
    };

    return (
        <div>
            <div className="mb-6">
                <PageBreadcrumb />
            </div>
            {isLoading && <Loading fullScreen text={t("common.message.saving")} />}
            <CustomFieldDefinitionForm
                definition={null}
                defaultModule={defaultModule}
                onSave={handleSave}
                onCancel={() => router.push('/custom-field-definitions')}
            />
        </div>
    );
}
