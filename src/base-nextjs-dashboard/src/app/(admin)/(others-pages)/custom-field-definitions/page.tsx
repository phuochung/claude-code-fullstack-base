"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ButtonAdd from "@/components/common/buttons/ButtonAdd";
import CustomFieldDefinitionsTable from "./components/CustomFieldDefinitionsTable";
import { CustomFieldDefinition } from "@/types/custom-field";
import { useI18n } from "@/context/I18nContext";
import { customFieldDefinitionService } from "@/api/services/custom-field-definition";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { CUSTOM_FIELD_MODULES } from "@/constants/common";

export default function CustomFieldDefinitionsPage() {
    const { t } = useI18n();
    const router = useRouter();
    const { isLoading, execute } = useAsyncAction();
    const [selectedModule, setSelectedModule] = useState<string>('customer');
    const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);

    const fetchDefinitions = useCallback(async (module: string) => {
        await execute(
            () => customFieldDefinitionService.getDefinitionsByModule(module),
            {
                showSuccessToast: false,
                errorMessage: t("customFieldDefinitions.messages.fetchFailed"),
                onSuccess: (data) => setDefinitions(data),
            }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchDefinitions(selectedModule);
    }, [fetchDefinitions, selectedModule]);

    const handleModuleChange = (module: string) => {
        setSelectedModule(module);
    };

    const definitionEditHref = (definition: CustomFieldDefinition) =>
        `/custom-field-definitions/${definition._id}/edit`;

    const handleDelete = async (id: string) => {
        await execute(
            () => customFieldDefinitionService.deleteDefinition(id),
            {
                successMessage: t("customFieldDefinitions.messages.deleteSuccess"),
                onSuccess: () => fetchDefinitions(selectedModule),
            }
        );
    };

    return (
        <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <PageBreadcrumb />
                <ButtonAdd onClick={() => router.push(`/custom-field-definitions/create?module=${selectedModule}`)} />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
                {/* Module selector */}
                <div className="mb-6">
                    <select
                        value={selectedModule}
                        onChange={e => handleModuleChange(e.target.value)}
                        className="rounded-lg border border-gray-300 px-2 py-2 dark:border-gray-700 dark:bg-gray-800"
                    >
                        {CUSTOM_FIELD_MODULES.map(m => (
                            <option key={m} value={m}>{t(`customFieldDefinitions.modules.${m}`)}</option>
                        ))}
                    </select>
                </div>

                <CustomFieldDefinitionsTable
                    definitions={definitions}
                    isLoading={isLoading}
                    editHref={definitionEditHref}
                    onDelete={handleDelete}
                />
            </div>
        </div>
    );
}
