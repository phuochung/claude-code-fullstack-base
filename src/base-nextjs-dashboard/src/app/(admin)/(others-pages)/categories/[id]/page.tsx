"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loading from "@/components/common/Loading";
import { useI18n } from "@/context/I18nContext";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { categoryService } from "@/api/services/category";
import { Category } from "@/types/category";
import CategoryDetail from "../components/CategoryDetail";

export default function CategoryDetailPage() {
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
                    },
                }
            );
        };

        fetchCategory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryId]);

    const handleEdit = () => {
        router.push(`/categories/${categoryId}/edit`);
    };

    const handleBack = () => {
        router.push("/categories");
    };

    if (isLoading || !category) {
        return <Loading text={t("common.message.loading")} />;
    }

    return (
        <div>
            <div className="mb-6">
                <PageBreadcrumb />
            </div>

            <CategoryDetail category={category} onEdit={handleEdit} onBack={handleBack} />
        </div>
    );
}
