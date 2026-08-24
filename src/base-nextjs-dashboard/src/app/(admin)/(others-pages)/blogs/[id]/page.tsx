"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { blogService } from "@/api/services/blog";
import { Blog } from "@/types/blog";
import { useI18n } from "@/context/I18nContext";
import { useToast } from "@/context/ToastContext";
import BlogDetail from "../components/BlogDetail";
import PageBreadcrumb from "../../../../../components/common/PageBreadCrumb";

export default function BlogDetailPage() {
    const { t } = useI18n();
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const blogId = params.id as string;
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);

    const loadBlog = async () => {
        try {
            const data = await blogService.getBlogById(blogId);
            setBlog(data);
        } catch (error) {
            console.error("Failed to load blog:", error);
            toast.error(t("blogs.loadFailed"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; state updates land after the awaited response
        loadBlog();
        // The fetch is keyed on blogId alone. loadBlog also reads `t` and the
        // toast context value, whose identities change on unrelated renders
        // (every shown toast rebuilds the context object) — keying on them
        // would refetch spuriously, looping on a failed load.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blogId]);

    const handlePreview = async (id: string) => {
        try {
            if (!blog) return;
            const { token } = await blogService.getPreviewToken(id);
            const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL;
            if (websiteUrl && token) {
                const url = `${websiteUrl}/bai-viet/${blog.slug}?previewToken=${token}`;
                window.open(url, '_blank');
            } else {
                toast.error("Missing website URL configuration");
            }
        } catch (error) {
            console.error("Failed to get preview token:", error);
            toast.error(t("common.message.error"));
        }
    };

    const handlePublish = async (id: string) => {
        try {
            await blogService.publishBlog(id);
            toast.success(t("blogs.messages.publishSuccess"));
            loadBlog();
        } catch (error) {
            throw error;
        }
    };

    const handleSetTmpHide = async (id: string) => {
        try {
            await blogService.setTmpHideBlog(id);
            toast.success(t("blogs.messages.setTmpHideSuccess"));
            loadBlog();
        } catch (error) {
            throw error;
        }
    };

    const handleEdit = () => {
        router.push(`/blogs/${blogId}/edit`);
    };

    const handleCancel = () => {
        router.push("/blogs");
    };

    if (loading) {
        return <div>{t("common.message.loading")}</div>;
    }

    if (!blog) {
        return <div>{t("blogs.notFound")}</div>;
    }

    return (
        <div>
            <div className="mb-6">
                <PageBreadcrumb />
            </div>

            <BlogDetail
                blog={blog}
                onPublish={handlePublish}
                onSetTmpHide={handleSetTmpHide}
                onBack={handleCancel}
                onEdit={handleEdit}
                onPreview={handlePreview}
            />
        </div>
    );
}
