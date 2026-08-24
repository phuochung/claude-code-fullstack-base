"use client";

import { useState } from "react";
import { Category } from "@/types/category";
import { useI18n } from "@/context/I18nContext";
import { GetCategoriesParams } from "@/api/services/category";
import { TABLE_PARAMS } from "@/constants/common";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { formatDateTime } from "@/utils/dateTime";
import Pagination from "@/components/tables/Pagination";
import ButtonsAction from "../../../../../components/common/buttons/ButtonsAction";
import ButtonSearch from "@/components/common/buttons/ButtonSearch";
import Loading from "@/components/common/Loading";

interface CategoriesTableProps {
    categories: Category[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    isLoading: boolean;
    onEdit: (category: Category) => void;
    onDelete: (id: string) => void;
    onViewDetails: (category: Category) => void;
    onFilterChange: (filters: Partial<GetCategoriesParams>) => void;
}

export default function CategoriesTable({
    categories,
    total,
    page,
    limit,
    totalPages,
    isLoading,
    onEdit,
    onDelete,
    onViewDetails,
    onFilterChange,
}: CategoriesTableProps) {
    const { t } = useI18n();
    const [keyword, setKeyword] = useState("");
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        categoryId: string;
    }>({
        isOpen: false,
        categoryId: "",
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onFilterChange({ keyword, page: TABLE_PARAMS.DEFAULT_PAGE });
    };

    const handlePageChange = (newPage: number) => {
        onFilterChange({ page: newPage });
    };

    const handleDeleteClick = (category: Category) => {
        setDeleteConfirmation({
            isOpen: true,
            categoryId: category._id,
        });
    };

    const handleConfirmDelete = () => {
        onDelete(deleteConfirmation.categoryId);
        setDeleteConfirmation({
            isOpen: false,
            categoryId: "",
        });
    };

    const handleCancelDelete = () => {
        setDeleteConfirmation({
            isOpen: false,
            categoryId: "",
        });
    };

    return (
        <>
            <div>
                {/* Search */}
                <div className="mb-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input id="search-categories"
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder={t("categories.searchPlaceholder")}
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
                        />
                        <ButtonSearch />
                    </form>
                </div>

                {/* Table */}
                <div className="relative overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                    {isLoading && (
                        <Loading text={t("common.message.loading")} />
                    )}
                    <table className={`w-full min-w-[600px] ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                    STT
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t("categories.table.name")}
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t("categories.table.description")}
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t("common.table.createdAt")}
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t("common.table.actions")}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {categories.map((category, index) => (
                                <tr key={category._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-4 py-3 text-sm">
                                        {(page - 1) * limit + index + 1}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <div>{category.nameVi}</div>
                                        {category.nameEn && (
                                            <div className="text-xs text-gray-400 dark:text-gray-500">{category.nameEn}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {category.descriptionVi && category.descriptionVi.length > 50
                                            ? `${category.descriptionVi.substring(0, 50)}...`
                                            : category.descriptionVi || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {formatDateTime(category.createdAt)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm">
                                        <ButtonsAction
                                            onView={() => onViewDetails(category)}
                                            onEdit={() => onEdit(category)}
                                            onDelete={() => handleDeleteClick(category)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages >= 1 && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        previousLabel={t("common.button.previous")}
                        nextLabel={t("common.button.next")}
                        t={t}
                        showSummary
                        totalItems={total}
                        pageSize={limit}
                    />
                )}
            </div>

            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                type="danger"
                title={t("categories.confirmDelete.title")}
                message={t("categories.confirmDelete.message")}
                confirmText={t("common.button.delete")}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </>
    );
}
