"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { blogService } from "@/api/services/blog";
import { storageService } from "@/api/services/storage";
import { Blog, UpdateBlogDto, CreateBlogDto } from "@/types/blog";
import { useI18n } from "@/context/I18nContext";
import { useToast } from "@/context/ToastContext";
import BlogForm, { BlogFiles } from "@/app/(admin)/(others-pages)/blogs/components/BlogForm";
import PageBreadcrumb from "../../../../../../components/common/PageBreadCrumb";
import ProgressModal, { ProgressStep } from "../../components/ProgressModal";

export default function EditBlogPage() {
    const { t } = useI18n();
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const blogId = params.id as string;
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);

    const [progressOpen, setProgressOpen] = useState(false);
    const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([
        { id: "validation", label: t("blogs.progress.validation"), status: "pending" },
        { id: "upload", label: t("blogs.progress.upload"), status: "pending" },
        { id: "saving", label: t("blogs.progress.saving"), status: "pending" },
    ]);

    useEffect(() => {
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

        if (blogId) {
            loadBlog();
        }
    }, [blogId, t, toast]);

    const updateStep = (id: string, updates: Partial<ProgressStep>) => {
        setProgressSteps((prev) =>
            prev.map((step) => (step.id === id ? { ...step, ...updates } : step))
        );
    };

    const handleSave = async (data: CreateBlogDto, files: BlogFiles) => {
        setProgressSteps([
            { id: "validation", label: t("blogs.progress.validation"), status: "pending" },
            { id: "upload", label: t("blogs.progress.upload"), status: "pending" },
            { id: "saving", label: t("blogs.progress.saving"), status: "pending" },
        ]);
        setProgressOpen(true);

        // 1. Validation
        updateStep("validation", { status: "success" });

        // 2. Upload Files
        updateStep("upload", { status: "loading" });
        let bannerId: string | undefined = undefined;


        let uploadedSections = [...data.sections];

        try {
            const uploadPromises: Promise<void>[] = [];

            // Banner
            if (files.banner) {
                uploadPromises.push(
                    storageService.uploadFile(files.banner, "blogs/banners")
                        .then((res) => { bannerId = res._id; })
                );
            } else {
                if (blog?.bannerFileMetadata?._id) {
                    bannerId = blog.bannerFileMetadata._id;
                }
            }

            // Sections
            const sectionIndices = Object.keys(files.sections).map(Number);
            // First, handle uploads
            sectionIndices.forEach((index) => {
                const file = files.sections[index];
                if (file) {
                    uploadPromises.push(
                        storageService.uploadFile(file, "blogs/sections")
                            .then((res) => {
                                const section = uploadedSections[index];
                                if (section) {
                                    uploadedSections[index] = {
                                        ...section,
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        fileMetadata: res._id as any, // ID string
                                    };
                                }
                            })
                    );
                }
            });

            await Promise.all(uploadPromises);

            // Post-process sections
            uploadedSections = uploadedSections.map((s, idx) => {
                const sectionDto = { ...s };

                // Remove _id if present (from existing sections)
                if ('_id' in sectionDto) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    delete (sectionDto as any)._id;
                }

                if (files.sections[idx]) return sectionDto;

                // Existing section?
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (sectionDto.fileMetadata && typeof sectionDto.fileMetadata === 'object' && (sectionDto.fileMetadata as any)._id) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    sectionDto.fileMetadata = (sectionDto.fileMetadata as any)._id;
                }
                return sectionDto;
            });


            updateStep("upload", { status: "success" });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            updateStep("upload", {
                status: "error",
                errorMessage: error.message || t("common.uploadFailed")
            });
            return;
        }

        // 3. Save
        updateStep("saving", { status: "loading" });
        try {
            const finalDto: UpdateBlogDto = {
                ...data,
                bannerFileMetadata: bannerId,
                sections: uploadedSections,
            };

            await blogService.updateBlog(blogId, finalDto);
            updateStep("saving", { status: "success" });

            setTimeout(() => {
                router.push(`/blogs/${blogId}`);
            }, 1000);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Failed to update blog:", error);
            updateStep("saving", {
                status: "error",
                errorMessage: error.message || t("blogs.updateFailed")
            });
        }
    };

    const handleCancel = () => {
        router.push(`/blogs`);
    };

    const handleCloseProgress = () => {
        if (progressSteps.some(s => s.status === 'error')) {
            setProgressOpen(false);
        }
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

            <BlogForm blog={blog} onSave={handleSave} onCancel={handleCancel} />

            <ProgressModal
                isOpen={progressOpen}
                title={t("blogs.progress.title")}
                steps={progressSteps}
                onClose={handleCloseProgress}
            />
        </div>
    );
}
