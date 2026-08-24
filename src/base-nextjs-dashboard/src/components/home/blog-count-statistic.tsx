"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatisticService, BlogCountStatistics } from "../../api/services/statistic";
import { useI18n } from "../../context/I18nContext";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { DocsIcon } from "../../icons";
import Loading from "../common/Loading";

export default function BlogCountStatistic() {
    const { t } = useI18n();
    const router = useRouter();
    const { isLoading, execute } = useAsyncAction();
    const [stats, setStats] = useState<BlogCountStatistics | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            await execute(
                () => StatisticService.getBlogCountStatistics(),
                {
                    showSuccessToast: false,
                    onSuccess: (data) => {
                        setStats(data);
                    },
                }
            );
        };

        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const navigateToBlogs = (status?: string) => {
        const url = status ? `/blogs?status=${status}` : '/blogs';
        router.push(url);
    };

    return (
        <>
            {isLoading && <Loading />}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                        <DocsIcon className="text-gray-800 size-6 dark:text-white/90" />
                    </div>
                    <div className="ml-4 flex items-center justify-between">
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                            Blogs
                            <span
                                className="ml-4 cursor-pointer hover:text-blue-600 hover:underline"
                                onClick={() => navigateToBlogs()}
                            >
                                {stats?.total.toLocaleString() || 0}
                            </span>
                        </h4>
                    </div>
                </div>

                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {t("blogs.status.draft")}
                        </span>
                        <h4
                            className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90 cursor-pointer hover:text-blue-600 hover:underline"
                            onClick={() => navigateToBlogs('draft')}
                        >
                            {stats?.draft.toLocaleString() || 0}
                        </h4>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {t("blogs.status.published")}
                        </span>
                        <h4
                            className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90 cursor-pointer hover:text-blue-600 hover:underline"
                            onClick={() => navigateToBlogs('published')}
                        >
                            {stats?.published.toLocaleString() || 0}
                        </h4>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {t("blogs.status.tmpHide")}
                        </span>
                        <h4
                            className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90 cursor-pointer hover:text-blue-600 hover:underline"
                            onClick={() => navigateToBlogs('tmpHide')}
                        >
                            {stats?.tmpHide.toLocaleString() || 0}
                        </h4>
                    </div>
                </div>
            </div>
        </>
    );
}