"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loading from "@/components/common/Loading";
import { useI18n } from "@/context/I18nContext";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { categoryService } from "@/api/services/category";
import { Category, CategoryFormData } from "@/types/category";
import CategoryForm from "../../components/CategoryForm";

export default function EditCategoryPage() {
    const { t } = useI18n();
    const router = useRouter();
    const params = useParams();
    const categoryId = params.id as string;
    const { isLoading, execute } = useAsyncAction();
    const [category, setCategory] = useState<Category | null>(null);

    useEffect(() => {
        const fetchCategory = async () => {
            await execute(
                () => categoryService.getCategoryById(categoryId),
                {
                    showSuccessToast: false,
                    onSuccess: (data) => setCategory(data),
                    onError: () => {
                        router.push("/categories");
                    }
                }
            );
        };

        fetchCategory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryId]);

    const handleSaveCategory = async (data: CategoryFormData) => {
        await execute(
            () => categoryService.updateCategory(categoryId, data),
            {
                successMessage: t("categories.messages.updateSuccess"),
                onSuccess: () => {
                    router.push("/categories");
                },
            }
        );
    };

    const handleCancel = () => {
        router.push("/categories");
    };

    if (isLoading && !category) {
        return <Loading text={t("common.message.loading")} />;
    }

    return (
        <div>
            <div className="mb-6">
                <PageBreadcrumb />
            </div>

            {isLoading && <Loading fullScreen text={t("common.message.saving")} />}
            {category && (
                <CategoryForm
                    category={category}
                    onSave={handleSaveCategory}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
}
