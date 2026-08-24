"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CategoriesTable from "@/app/(admin)/(others-pages)/categories/components/CategoriesTable";
import { Category } from "@/types/category";
import { useI18n } from "@/context/I18nContext";
import { categoryService, GetCategoriesParams } from "@/api/services/category";
import { TABLE_PARAMS } from "@/constants/common";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import ButtonAdd from "@/components/common/buttons/ButtonAdd";
import { CATEGORY_MODULES } from "@/constants/common";

export default function CategoriesPage() {
    const { t } = useI18n();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isLoading, execute } = useAsyncAction();
    const [categories, setCategories] = useState<Category[]>([]);
    const [pagination, setPagination] = useState({
        total: 0,
        page: Number(TABLE_PARAMS.DEFAULT_PAGE),
        limit: Number(TABLE_PARAMS.DEFAULT_LIMIT),
        totalPages: 0,
    });

    const [selectedModule, setSelectedModule] = useState<string>(CATEGORY_MODULES[0]);

    // Get filters from URL params
    const getFiltersFromURL = (): GetCategoriesParams => {
        const sortOrderParam = searchParams.get("sortOrder");
        return {
            module: searchParams.get("module") || CATEGORY_MODULES[0],
            page: Number(searchParams.get("page")) || Number(TABLE_PARAMS.DEFAULT_PAGE),
            limit: Number(TABLE_PARAMS.DEFAULT_LIMIT),
            sortBy: searchParams.get("sortBy") || TABLE_PARAMS.SORT_BY,
            sortOrder: (sortOrderParam === "asc" || sortOrderParam === "desc") ? sortOrderParam : TABLE_PARAMS.SORT_ORDER,
            keyword: searchParams.get("keyword") || "",
        };
    };
    const [filters, setFilters] = useState<GetCategoriesParams>(() => getFiltersFromURL());

    // Update URL params
    const updateURLParams = (params: GetCategoriesParams) => {
        const urlParams = new URLSearchParams();
        if (params.module) urlParams.set("module", params.module);
        if (params.keyword) urlParams.set("keyword", params.keyword);
        if (params.sortBy) urlParams.set("sortBy", params.sortBy);
        if (params.sortOrder) urlParams.set("sortOrder", params.sortOrder);
        if (params.page && params.page > 1) urlParams.set("page", String(params.page));

        router.push(`?${urlParams.toString()}`, { scroll: false });
    };

    const handleModuleChange = (module: string) => {
        setSelectedModule(module);
        handleFilterChange({ module, page: 1 });
    };

    // Fetch categories from API
    const fetchCategories = useCallback(async (params: GetCategoriesParams) => {
        await execute(
            () => categoryService.getCategories(params),
            {
                showSuccessToast: false,
                errorMessage: t("categories.messages.fetchFailed"),
                onSuccess: (response) => {
                    setCategories(response.docs);
                    setPagination({
                        total: response.totalDocs,
                        page: response.page,
                        limit: response.limit,
                        totalPages: response.totalPages,
                    });
                },
            }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchCategories(filters);
    }, [fetchCategories, filters]);

    const handleFilterChange = (newFilters: Partial<GetCategoriesParams>) => {
        const updatedFilters = { ...filters, ...newFilters };
        setFilters(updatedFilters);
        updateURLParams(updatedFilters);
        // fetchCategories triggered by effect
    };

    const handleCreateCategory = () => {
        router.push(`/categories/create?module=${selectedModule}`);
    };

    const handleEditCategory = (category: Category) => {
        router.push(`/categories/${category._id}/edit`);
    };

    const handleDeleteCategory = async (categoryId: string) => {
        await execute(
            () => categoryService.deleteCategory(categoryId),
            {
                successMessage: t("categories.messages.deleteSuccess"),
                onSuccess: () => fetchCategories(filters),
            }
        );
    };

    const handleViewDetails = (category: Category) => {
        router.push(`/categories/${category._id}`);
    };

    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <PageBreadcrumb />
                <ButtonAdd onClick={handleCreateCategory} />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
                {/* Module selector */}
                <div className="mb-6">
                    <select
                        value={selectedModule}
                        onChange={e => handleModuleChange(e.target.value)}
                        className="rounded-lg border border-gray-300 px-2 py-2 dark:border-gray-700 dark:bg-gray-800"
                    >
                        {CATEGORY_MODULES.map(m => (
                            <option key={m} value={m}>{t(`categories.modules.${m}`)}</option>
                        ))}
                    </select>
                </div>

                <CategoriesTable
                    categories={categories}
                    total={pagination.total}
                    page={pagination.page}
                    limit={pagination.limit}
                    totalPages={pagination.totalPages}
                    isLoading={isLoading}
                    onEdit={handleEditCategory}
                    onDelete={handleDeleteCategory}
                    onViewDetails={handleViewDetails}
                    onFilterChange={handleFilterChange}
                />
            </div>
        </div>
    );
}
