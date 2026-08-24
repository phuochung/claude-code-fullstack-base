"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Blog } from "@/types/blog";
import { useI18n } from "@/context/I18nContext";
import { useSearchKeyword } from "@/hooks/useSearchKeyword";
import { GetBlogsParams } from "@/api/services/blog";
import { TABLE_PARAMS } from "@/constants/common";
import { getBlogStatusConfig } from "@/utils/blog.util";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { formatDateTime } from "@/utils/dateTime";
import MultiSelect from "@/components/form/MultiSelect";
import { BLOG_STATUS } from "@/constants/common";
import ButtonsAction from "@/components/common/buttons/ButtonsAction";
import ButtonSearch from "@/components/common/buttons/ButtonSearch";
import Pagination from "@/components/tables/Pagination";
import ResponsiveTable, { ResponsiveColumn } from "@/components/tables/ResponsiveTable";

interface BlogsTableProps {
    blogs: Blog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    filters: GetBlogsParams;
    categories: { value: string; text: string }[];
    tags: { value: string; text: string }[];
    isLoading: boolean;
    showFilters: boolean;
    /** Row destinations, as URLs — the row actions are links, openable in a new tab. */
    viewHref: (blog: Blog) => string;
    editHref: (blog: Blog) => string;
    onDelete: (id: string) => void;
    onFilterChange: (filters: Partial<GetBlogsParams>) => void;
}

export default function BlogsTable({
    blogs,
    total,
    page,
    limit,
    totalPages,
    filters,
    categories,
    tags,
    isLoading,
    showFilters,
    viewHref,
    editHref,
    onDelete,
    onFilterChange,
}: BlogsTableProps) {
    const { t } = useI18n();
    const router = useRouter();
    const [keyword, setKeyword] = useSearchKeyword(filters.keyword);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        blogId: string;
    }>({
        isOpen: false,
        blogId: "",
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onFilterChange({ keyword, page: TABLE_PARAMS.DEFAULT_PAGE });
    };

    const handlePageChange = (newPage: number) => {
        onFilterChange({ page: newPage });
    };

    const handleDeleteClick = (blog: Blog) => {
        setDeleteConfirmation({
            isOpen: true,
            blogId: blog._id,
        });
    };

    const handleConfirmDelete = () => {
        onDelete(deleteConfirmation.blogId);
        setDeleteConfirmation({
            isOpen: false,
            blogId: "",
        });
    };

    const handleCancelDelete = () => {
        setDeleteConfirmation({
            isOpen: false,
            blogId: "",
        });
    };

    const getStatusBadge = (status: number) => {
        const config = getBlogStatusConfig(status);
        return (
            <span className={`rounded-full px-2 py-1 text-xs ${config.className}`}>
                {config.labelKey ? t(config.labelKey) : '-'}
            </span>
        );
    };

    const statusOptions = [
        { value: String(BLOG_STATUS.DRAFT), text: t("blogs.status.draft"), selected: false },
        { value: String(BLOG_STATUS.PUBLISHED), text: t("blogs.status.published"), selected: false },
        { value: String(BLOG_STATUS.TMP_HIDE), text: t("blogs.status.tmpHide"), selected: false },
    ];

    // Card face: the title with its VI/EN badge and the publish status — what
    // tells two language variants of one post apart at a glance.
    const columns: ResponsiveColumn<Blog>[] = [
        {
            key: 'title',
            header: t("blogs.table.title"),
            card: 'title',
            cell: (blog) => (
                <div className="flex items-center gap-2">
                    <span className="line-clamp-1">{blog.title}</span>
                    <span className={`shrink-0 px-1.5 py-0.5 text-xs font-bold rounded ${
                        blog.language === 'en'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                    }`}>
                        {blog.language === 'en' ? 'EN' : 'VI'}
                    </span>
                </div>
            ),
        },
        {
            key: 'category',
            header: t("blogs.table.category"),
            cell: (blog) => blog.category?.nameVi || "-",
        },
        {
            key: 'status',
            header: t("blogs.table.status"),
            card: 'badge',
            cell: (blog) => getStatusBadge(blog.status),
        },
        {
            key: 'viewCount',
            header: t("blogs.table.viewCount"),
            cell: (blog) => blog.viewCount,
        },
        {
            key: 'createdAt',
            header: t("common.table.createdAt"),
            card: 'none',
            cell: (blog) => formatDateTime(blog.createdAt),
        },
        {
            key: 'updatedAt',
            header: t("common.table.updatedAt"),
            card: 'none',
            cell: (blog) => formatDateTime(blog.updatedAt),
        },
        {
            key: 'actions',
            header: t("common.table.actions"),
            card: 'actions',
            align: 'right',
            cell: (blog) => (
                <ButtonsAction
                    viewHref={viewHref(blog)}
                    editHref={editHref(blog)}
                    onDelete={() => handleDeleteClick(blog)}
                />
            ),
        },
    ];

    return (
        <>
            <div>
                {/* Search and Filters */}
                {showFilters && (
                    <div className="mb-6 rounded-lg border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                        <div className="flex flex-col gap-4">
                            {/* Row 1: Keyword */}
                            <div className="w-full">
                                {/* <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                                    {t("blogs.searchPlaceholder")}
                                </label> */}
                                <form onSubmit={handleSearch} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        placeholder={t("blogs.searchPlaceholder")}
                                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-900"
                                    />
                                    <ButtonSearch />
                                </form>
                            </div>

                            {/* Row 2: Filters */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                <div className="w-full">
                                    <MultiSelect
                                        label={t("blogs.table.category")}
                                        options={categories.map(c => ({ ...c, selected: filters.categories?.includes(c.value) || false }))}
                                        defaultSelected={filters.categories}
                                        onChange={(selected) => onFilterChange({ categories: selected, page: 1 })}
                                    />
                                </div>

                                <div className="w-full">
                                    <MultiSelect
                                        label={t("blogs.table.status")}
                                        options={statusOptions.map(s => ({ ...s, selected: filters.statuses?.includes(Number(s.value)) || false }))}
                                        defaultSelected={filters.statuses?.map(String)}
                                        onChange={(selected) => onFilterChange({ statuses: selected.map(Number), page: 1 })}
                                    />
                                </div>

                                <div className="w-full">
                                    <MultiSelect
                                        label={t("blogs.table.tags")}
                                        options={tags.map(t => ({ ...t, selected: filters.tagIds?.includes(t.value) || false }))}
                                        defaultSelected={filters.tagIds}
                                        onChange={(selected) => onFilterChange({ tagIds: selected, page: 1 })}
                                    />
                                </div>

                                <div className="w-full">
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                                        {t("blogs.table.language")}
                                    </label>
                                    <select
                                        value={filters.language || ""}
                                        onChange={(e) => onFilterChange({ language: e.target.value || undefined, page: 1 })}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                                    >
                                        <option value="">{t("common.dropdown.all")}</option>
                                        <option value="vi">VI</option>
                                        <option value="en">EN</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <ResponsiveTable
                    rows={blogs}
                    columns={columns}
                    rowKey={(blog) => blog._id}
                    onRowClick={(blog) => router.push(viewHref(blog))}
                    isLoading={isLoading}
                    emptyText={t("blogs.table.empty")}
                    minWidthClass="min-w-[900px]"
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
                title={t("blogs.confirmDelete.title")}
                message={t("blogs.confirmDelete.message")}
                confirmText={t("common.button.delete")}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </>
    );
}
