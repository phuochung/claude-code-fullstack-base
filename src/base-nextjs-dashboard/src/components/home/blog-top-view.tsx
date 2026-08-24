"use client";

import ButtonsAction from "../common/buttons/ButtonsAction";
import { useI18n } from "../../context/I18nContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatisticService, TopViewedBlog } from "../../api/services/statistic";
import { getBlogStatusConfig } from "../../utils/blog.util";
import { formatDateTime } from "../../utils/dateTime";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import Loading from "../common/Loading";

export default function BlogTopView() {
    const { t } = useI18n();
    const router = useRouter();
    const { isLoading, execute } = useAsyncAction();
    const [blogs, setBlogs] = useState<TopViewedBlog[]>([]);

    useEffect(() => {
        const fetchTopViewedBlogs = async () => {
            await execute(
                () => StatisticService.getTopViewedBlogs(),
                {
                    showSuccessToast: false,
                    onSuccess: (data) => {
                        setBlogs(data);
                    },
                }
            );
        };

        fetchTopViewedBlogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getStatusBadge = (status: number) => {
        const config = getBlogStatusConfig(status);
        return (
            <span className={`rounded-full px-2 py-1 text-xs ${config.className}`}>
                {config.labelKey ? t(config.labelKey) : '-'}
            </span>
        );
    };

    return (
        <>
            {isLoading && <Loading />}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
                <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            {t("home.blog_top_view")}
                        </h3>
                    </div>
                </div>
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead className="text-left bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-4 py-3 text-sm font-medium text-gray-500 whitespace-nowrap dark:text-gray-400">
                                    STT
                                </th>
                                <th className="px-4 py-3 text-sm font-medium text-gray-500 whitespace-nowrap dark:text-gray-400">
                                    {t("blogs.table.title")}
                                </th>
                                <th className="px-4 py-3 text-sm font-medium text-gray-500 whitespace-nowrap dark:text-gray-400">
                                    {t("blogs.table.category")}
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t("blogs.table.status")}
                                </th>
                                <th className="px-4 py-3 text-sm font-medium text-gray-500 whitespace-nowrap dark:text-gray-400">
                                    {t("blogs.table.viewCount")}
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t("common.table.createdAt")}
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t("common.table.updatedAt")}
                                </th>
                                <th className="px-4 py-3 text-sm font-medium text-gray-500 whitespace-nowrap dark:text-gray-400 text-right">
                                    {t("common.table.actions")}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {blogs.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                                        {t("common.message.noData")}
                                    </td>
                                </tr>
                            ) : (
                                blogs.map((blog, index) => (
                                    <tr key={blog._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                            <div className="max-w-[300px] truncate" title={blog.title}>
                                                {blog.title}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                            {blog.category?.nameVi}
                                        </td>
                                        <td className="px-4 py-3 text-sm">{getStatusBadge(blog.status)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                                                {blog.viewCount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {formatDateTime(blog.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {formatDateTime(blog.updatedAt)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                            <ButtonsAction
                                                showDelete={false}
                                                showEdit={false}
                                                onView={() => router.push(`/blogs/${blog._id}`)}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}