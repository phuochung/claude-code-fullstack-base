"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { blogService } from "@/api/services/blog";
import { storageService } from "@/api/services/storage";
import { CreateBlogDto } from "@/types/blog";
import { useI18n } from "@/context/I18nContext";
import BlogForm, { BlogFiles } from "@/app/(admin)/(others-pages)/blogs/components/BlogForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ProgressModal, { ProgressStep } from "../components/ProgressModal";

export default function CreateBlogPage() {
    const { t } = useI18n();
    const router = useRouter();
    const [progressOpen, setProgressOpen] = useState(false);
    const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([
        { id: "validation", label: t("blogs.progress.validation"), status: "pending" },
        { id: "upload", label: t("blogs.progress.upload"), status: "pending" },
        { id: "saving", label: t("blogs.progress.saving"), status: "pending" },
    ]);

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
        updateStep("validation", { status: "loading" });
        try {
            await blogService.validateBeforeCreate(data);
            updateStep("validation", { status: "success" });
        } catch (error) {
            const message = error instanceof Error ? error.message : "";
            updateStep("validation", {
                status: "error",
                errorMessage: message || t("blogs.messages.validationFailed")
            });
            return;
        }

        // 2. Upload Files
        updateStep("upload", { status: "loading" });
        let bannerId: string | undefined = undefined;
        const uploadedSections = [...data.sections];

        try {
            const uploadPromises: Promise<void>[] = [];

            if (files.banner) {
                uploadPromises.push(
                    storageService.uploadFile(files.banner, "blogs/banners")
                        .then((res) => { bannerId = res._id; })
                );
            }

            const sectionIndices = Object.keys(files.sections).map(Number);
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
                                        fileMetadata: res._id,
                                    };
                                }
                            })
                    );
                }
            });

            await Promise.all(uploadPromises);
            updateStep("upload", { status: "success" });
        } catch (error) {
            const message = error instanceof Error ? error.message : "";
            updateStep("upload", {
                status: "error",
                errorMessage: message || t("common.uploadFailed")
            });
            return;
        }

        // 3. Create Blog
        updateStep("saving", { status: "loading" });
        try {
            const finalDto: CreateBlogDto = {
                ...data,
                bannerFileMetadata: bannerId,
                sections: uploadedSections,
            };

            const createdBlog = await blogService.createBlog(finalDto);
            updateStep("saving", { status: "success" });

            setTimeout(() => {
                router.push(`/blogs/${createdBlog._id}`);
            }, 1000);
        } catch (error) {
            const message = error instanceof Error ? error.message : "";
            updateStep("saving", {
                status: "error",
                errorMessage: message || t("blogs.messages.createFailed")
            });
        }
    };

    const handleCancel = () => {
        router.push("/blogs");
    };

    const handleCloseProgress = () => {
        if (progressSteps.some(s => s.status === 'error')) {
            setProgressOpen(false);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <PageBreadcrumb />
            </div>

            <BlogForm onSave={handleSave} onCancel={handleCancel} />

            <ProgressModal
                isOpen={progressOpen}
                title={t("blogs.progress.title")}
                steps={progressSteps}
                onClose={handleCloseProgress}
            />
        </div>
    );
}
