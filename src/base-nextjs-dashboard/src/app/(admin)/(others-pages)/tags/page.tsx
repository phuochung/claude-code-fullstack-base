"use client";

import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import TagsTable from "@/app/(admin)/(others-pages)/tags/components/TagsTable";
import { Tag } from "@/types/tag";
import { useI18n } from "@/context/I18nContext";
import { tagService, GetTagsParams } from "@/api/services/tag";
import ButtonAdd from "@/components/common/buttons/ButtonAdd";
import ButtonClearFilters from "@/components/common/buttons/ButtonClearFilters";
import { DEFAULT_TAG_MODULE, TAG_MODULES } from "@/constants/common";
import { useListPage, readBaseListFilters, appendBaseListParams } from "@/hooks/useListPage";

export default function TagsPage() {
    const { t } = useI18n();
    const router = useRouter();

    const {
        items: tags,
        pagination,
        filters,
        isLoading,
        activeFilterCount,
        clearFilters,
        handleFilterChange,
        runAction,
    } = useListPage({
        getFiltersFromURL: (searchParams): GetTagsParams => ({
            module: searchParams.get("module") || DEFAULT_TAG_MODULE,
            ...readBaseListFilters(searchParams),
        }),
        serializeFilters: (params) => {
            const urlParams = new URLSearchParams();
            if (params.module) urlParams.set("module", params.module);
            appendBaseListParams(urlParams, params);
            return urlParams;
        },
        fetcher: (params) => tagService.getTags(params),
        fetchErrorMessage: t("tags.messages.fetchFailed"),
        // `module` is the section selector above the table, not a filter — it is
        // always set, so counting it would leave the badge permanently at 1 and
        // clearing it would drop the admin into an empty module.
        nonFilterKeys: ["module"],
    });

    // Drive the selector off the fetched filters (seeded from the URL) so a
    // deep link like /tags?module=blog can't show one module and list another.
    const selectedModule = filters.module || DEFAULT_TAG_MODULE;

    const handleModuleChange = (module: string) => {
        handleFilterChange({ module, page: 1 });
    };

    const handleCreateTag = () => {
        router.push(`/tags/create?module=${selectedModule}`);
    };

    const tagEditHref = (tag: Tag) => `/tags/${tag._id}/edit`;

    const handleDeleteTag = async (tagId: string) => {
        await runAction(
            () => tagService.deleteTag(tagId),
            t("tags.messages.deleteSuccess"),
        );
    };

    const tagHref = (tag: Tag) => `/tags/${tag._id}`;

    return (
        <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <PageBreadcrumb />
                <div className="flex flex-wrap items-center gap-2">
                    <ButtonClearFilters onClick={clearFilters} count={activeFilterCount} />
                    <ButtonAdd onClick={handleCreateTag} />
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
                {/* Module selector */}
                <div className="mb-6">
                    <select
                        value={selectedModule}
                        onChange={e => handleModuleChange(e.target.value)}
                        className="rounded-lg border border-gray-300 px-2 py-2 dark:border-gray-700 dark:bg-gray-800"
                    >
                        {TAG_MODULES.map(m => (
                            <option key={m} value={m}>{t(`tags.modules.${m}`)}</option>
                        ))}
                    </select>
                </div>

                <TagsTable
                    tags={tags}
                    {...pagination}
                    filters={filters}
                    isLoading={isLoading}
                    viewHref={tagHref}
                    editHref={tagEditHref}
                    onDelete={handleDeleteTag}
                    onFilterChange={handleFilterChange}
                />
            </div>
        </div>
    );
}
