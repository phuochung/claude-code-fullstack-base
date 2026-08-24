import { BLOG_STATUS } from "@/constants/common";

export const getBlogStatusConfig = (status: number) => {
    switch (status) {
        case BLOG_STATUS.DRAFT:
            return {
                labelKey: "blogs.status.draft",
                className: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
            };
        case BLOG_STATUS.PUBLISHED:
            return {
                labelKey: "blogs.status.published",
                className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
            };
        case BLOG_STATUS.TMP_HIDE:
            return {
                labelKey: "blogs.status.tmpHide",
                className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
            };
        default:
            return {
                labelKey: "blogs.status.unknown",
                className: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
            };
    }
};
