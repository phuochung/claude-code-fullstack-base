"use client";

import { useRouter, useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loading from "@/components/common/Loading";
import { useI18n } from "@/context/I18nContext";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { CategoryFormData } from "@/types/category";
import categoryService from "@/api/services/category";
import CategoryForm from "../components/CategoryForm";

export default function CreateCategoryPage() {
    const { t } = useI18n();
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultModule = searchParams.get('module') || undefined;
    const { isLoading, execute } = useAsyncAction();

    const handleSaveCategory = async (data: CategoryFormData) => {
        await execute(
            () => categoryService.createCategory(data),
            {
                successMessage: t("categories.messages.createSuccess"),
                onSuccess: () => {
                    router.push("/categories");
                },
            }
        );
    };

    const handleCancel = () => {
        router.push("/categories");
    };

    return (
        <div>
            <div className="mb-6">
                <PageBreadcrumb />
            </div>

            {isLoading && <Loading fullScreen text={t("common.message.saving")} />}
            <CategoryForm
                category={null}
                defaultModule={defaultModule}
                onSave={handleSaveCategory}
                onCancel={handleCancel}
            />
        </div>
    );
}
