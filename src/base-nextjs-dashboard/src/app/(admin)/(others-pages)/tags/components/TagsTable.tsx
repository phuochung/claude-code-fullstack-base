"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tag } from "@/types/tag";
import { useI18n } from "@/context/I18nContext";
import { useSearchKeyword } from "@/hooks/useSearchKeyword";
import { GetTagsParams } from "@/api/services/tag";
import { TABLE_PARAMS } from "@/constants/common";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { formatDateTime } from "@/utils/dateTime";
import Pagination from "@/components/tables/Pagination";
import ButtonsAction from "../../../../../components/common/buttons/ButtonsAction";
import ButtonSearch from "@/components/common/buttons/ButtonSearch";
import ResponsiveTable, { ResponsiveColumn } from "@/components/tables/ResponsiveTable";

interface TagsTableProps {
    tags: Tag[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    filters: GetTagsParams;
    isLoading: boolean;
    /** Row destinations, as URLs — the row actions are links, openable in a new tab. */
    viewHref: (tag: Tag) => string;
    editHref: (tag: Tag) => string;
    onDelete: (id: string) => void;
    onFilterChange: (filters: Partial<GetTagsParams>) => void;
}

export default function TagsTable({
    tags,
    total,
    page,
    limit,
    totalPages,
    filters,
    isLoading,
    viewHref,
    editHref,
    onDelete,
    onFilterChange,
}: TagsTableProps) {
    const { t } = useI18n();
    const router = useRouter();
    const [keyword, setKeyword] = useSearchKeyword(filters.keyword);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        tagId: string;
    }>({
        isOpen: false,
        tagId: "",
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onFilterChange({ keyword, page: TABLE_PARAMS.DEFAULT_PAGE });
    };

    const handlePageChange = (newPage: number) => {
        onFilterChange({ page: newPage });
    };

    const handleDeleteClick = (tag: Tag) => {
        setDeleteConfirmation({
            isOpen: true,
            tagId: tag._id,
        });
    };

    const handleConfirmDelete = () => {
        onDelete(deleteConfirmation.tagId);
        setDeleteConfirmation({
            isOpen: false,
            tagId: "",
        });
    };

    const handleCancelDelete = () => {
        setDeleteConfirmation({
            isOpen: false,
            tagId: "",
        });
    };

    // Card face: the tag name plus its "system" badge — the one thing that
    // decides whether the row can be deleted at all.
    const columns: ResponsiveColumn<Tag>[] = [
        {
            key: 'name',
            header: t("tags.table.name"),
            card: 'title',
            cell: (tag) => (
                <>
                    <div className="flex items-center gap-2">
                        <span>{tag.nameVi}</span>
                        {tag.systemKey && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                {t("tags.systemBadge")}
                            </span>
                        )}
                    </div>
                    {/* TEMP: EN name hidden — Vietnamese-only for now (restore this block to re-enable)
                    {tag.nameEn && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">{tag.nameEn}</div>
                    )}
                    */}
                </>
            ),
        },
        {
            key: 'description',
            header: t("tags.table.description"),
            cell: (tag) => tag.descriptionVi && tag.descriptionVi.length > 50
                ? `${tag.descriptionVi.substring(0, 50)}...`
                : tag.descriptionVi || "-",
        },
        {
            key: 'createdAt',
            header: t("common.table.createdAt"),
            card: 'none',
            cell: (tag) => formatDateTime(tag.createdAt),
        },
        {
            key: 'actions',
            header: t("common.table.actions"),
            card: 'actions',
            align: 'right',
            cell: (tag) => (
                <ButtonsAction
                    viewHref={viewHref(tag)}
                    editHref={editHref(tag)}
                    onDelete={() => handleDeleteClick(tag)}
                    showDelete={!tag.systemKey}
                />
            ),
        },
    ];

    return (
        <>
            <div>
                {/* Search */}
                <div className="mb-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input id="search-tags"
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder={t("tags.searchPlaceholder")}
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
                        />
                        <ButtonSearch />
                    </form>
                </div>

                <ResponsiveTable
                    rows={tags}
                    columns={columns}
                    rowKey={(tag) => tag._id}
                    onRowClick={(tag) => router.push(viewHref(tag))}
                    isLoading={isLoading}
                    emptyText={t("tags.table.empty")}
                    minWidthClass="min-w-[600px]"
                    indexOffset={(page - 1) * limit}
                />

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
                title={t("tags.confirmDelete.title")}
                message={t("tags.confirmDelete.message")}
                confirmText={t("common.button.delete")}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </>
    );
}
