"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loading from "@/components/common/Loading";
import { useI18n } from "@/context/I18nContext";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { CustomFieldDefinition, CustomFieldDefinitionFormData } from "@/types/custom-field";
import { customFieldDefinitionService } from "@/api/services/custom-field-definition";
import CustomFieldDefinitionForm from "../../components/CustomFieldDefinitionForm";

export default function EditCustomFieldDefinitionPage() {
    const { t } = useI18n();
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { isLoading, execute } = useAsyncAction();
    const [definition, setDefinition] = useState<CustomFieldDefinition | null>(null);

    useEffect(() => {
        const fetchDefinition = async () => {
            await execute(
                () => customFieldDefinitionService.getDefinitionById(id),
                {
                    showSuccessToast: false,
                    onSuccess: (data) => setDefinition(data),
                    onError: () => router.push('/custom-field-definitions'),
                }
            );
        };
        fetchDefinition();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSave = async (data: CustomFieldDefinitionFormData) => {
        await execute(
            () => customFieldDefinitionService.updateDefinition(id, data),
            {
                successMessage: t("customFieldDefinitions.messages.updateSuccess"),
                onSuccess: () => router.push('/custom-field-definitions'),
            }
        );
    };

    if (isLoading && !definition) return <Loading text={t("common.message.loading")} />;

    return (
        <div>
            <div className="mb-6">
                <PageBreadcrumb />
            </div>
            {isLoading && <Loading fullScreen text={t("common.message.saving")} />}
            {definition && (
                <CustomFieldDefinitionForm
                    definition={definition}
                    onSave={handleSave}
                    onCancel={() => router.push('/custom-field-definitions')}
                />
            )}
        </div>
    );
}
