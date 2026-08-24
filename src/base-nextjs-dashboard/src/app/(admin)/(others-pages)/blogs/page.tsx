"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { blogService, GetBlogsParams } from "@/api/services/blog";
import { categoryService } from "@/api/services/category";
import { tagService } from "@/api/services/tag";
import { Blog } from "@/types/blog";
import { useI18n } from "@/context/I18nContext";
import BlogsTable from "@/app/(admin)/(others-pages)/blogs/components/BlogsTable";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ButtonAdd from "@/components/common/buttons/ButtonAdd";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import ButtonClearFilters from "@/components/common/buttons/ButtonClearFilters";
import { useListPage, readBaseListFilters, appendBaseListParams } from "@/hooks/useListPage";

export default function BlogsPage() {
    const { t } = useI18n();
    const router = useRouter();

    const [categories, setCategories] = useState<{ value: string; text: string }[]>([]);
    const [tags, setTags] = useState<{ value: string; text: string }[]>([]);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [categoriesData, tagsData] = await Promise.all([
                    categoryService.getAllCategories(),
                    tagService.getAllTags(),
                ]);
                // TEMP: VI-only — EN name in () hidden. Restore the two commented lines to re-enable.
                // setCategories(categoriesData.map(c => ({ value: c._id, text: c.nameEn ? `${c.nameVi} (${c.nameEn})` : c.nameVi })));
                // setTags(tagsData.map(t => ({ value: t._id, text: t.nameEn ? `${t.nameVi} (${t.nameEn})` : t.nameVi })));
                setCategories(categoriesData.map(c => ({ value: c._id, text: c.nameVi })));
                setTags(tagsData.map(t => ({ value: t._id, text: t.nameVi })));
            } catch (error) {
                console.error("Failed to fetch filter options", error);
            }
        };
        fetchOptions();
    }, []);

    const {
        items: blogs,
        pagination,
        filters,
        isLoading,
        showFilters,
        setShowFilters,
        activeFilterCount,
        clearFilters,
        handleFilterChange,
        runAction,
    } = useListPage({
        getFiltersFromURL: (searchParams): GetBlogsParams => {
            const statuses = searchParams.getAll("statuses").map(Number);
            const categories = searchParams.getAll("categories");
            const tagIds = searchParams.getAll("tagIds");
            const language = searchParams.get("language") || undefined;
            return {
                ...readBaseListFilters(searchParams),
                statuses: statuses.length > 0 ? statuses : undefined,
                categories: categories.length > 0 ? categories : undefined,
                tagIds: tagIds.length > 0 ? tagIds : undefined,
                language,
            };
        },
        serializeFilters: (params) => {
            const urlParams = new URLSearchParams();
            appendBaseListParams(urlParams, params);
            if (params.statuses) params.statuses.forEach(s => urlParams.append("statuses", String(s)));
            if (params.categories) params.categories.forEach(c => urlParams.append("categories", c));
            if (params.tagIds) params.tagIds.forEach(t => urlParams.append("tagIds", t));
            if (params.language) urlParams.set("language", params.language);
            return urlParams;
        },
        fetcher: (params) => blogService.getBlogs(params),
        fetchErrorMessage: t("blogs.messages.fetchFailed"),
        resetPageOnFilterChange: true,
    });

    const handleCreate = () => {
        router.push("/blogs/create");
    };

    const blogHref = (blog: Blog) => `/blogs/${blog._id}`;
    const blogEditHref = (blog: Blog) => `/blogs/${blog._id}/edit`;

    const handleDelete = async (_id: string) => {
        await runAction(
            () => blogService.deleteBlog(_id),
            t("blogs.messages.deleteSuccess"),
        );
    };

    return (
        <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <PageBreadcrumb />
                <div className="flex flex-wrap items-center gap-2">
                    <ButtonClearFilters onClick={clearFilters} count={activeFilterCount} />
                    <FilterToggleButton
                        show={showFilters}
                        onToggle={() => setShowFilters(!showFilters)}
                        count={activeFilterCount}
                    />
                    <ButtonAdd onClick={handleCreate} />
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
                <BlogsTable
                    blogs={blogs}
                    {...pagination}
                    filters={filters}
                    categories={categories}
                    tags={tags}
                    isLoading={isLoading}
                    showFilters={showFilters}
                    viewHref={blogHref}
                    editHref={blogEditHref}
                    onDelete={handleDelete}
                    onFilterChange={handleFilterChange}
                />
            </div>
        </div>
    );
}
