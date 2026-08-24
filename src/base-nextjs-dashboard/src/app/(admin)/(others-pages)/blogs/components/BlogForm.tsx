"use client";

import { useState, useEffect } from "react";
import { Blog, BlogSection, CreateBlogDto } from "@/types/blog";
import { useI18n } from "@/context/I18nContext";
import { MAX_BLOG_SECTIONS, BLOG_STATUS } from "@/constants/common";
import UploadImage from "@/components/common/UploadImage";
import CKEditorField from "@/components/common/CKEditorField";
import CategoryDropdown from "@/components/common/CategoryDropdown";
import TagMultiSelect from "@/components/common/TagMultiSelect";
import ButtonCancel from "@/components/common/buttons/ButtonCancel";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import ButtonSaveAsDraft from "./ButtonAsDraft";

export interface BlogFiles {
    banner: File | null;
    sections: Record<number, File | null>;
}

interface BlogFormProps {
    blog?: Blog;
    onSave: (data: CreateBlogDto, files: BlogFiles) => Promise<void>;
    onCancel: () => void;
}

interface BlogFormState extends Omit<CreateBlogDto, 'bannerFileMetadata'> {
    bannerUrl?: string;
}

export default function BlogForm({
    blog,
    onSave,
    onCancel,
}: BlogFormProps) {
    const { t } = useI18n();
    const [formData, setFormData] = useState<BlogFormState>({
        title: "",
        excerpt: "",
        language: "vi",
        bannerUrl: "",
        sections: [],
        category: "",
        tags: [],
        status: BLOG_STATUS.DRAFT,
    });

    const [files, setFiles] = useState<BlogFiles>({
        banner: null,
        sections: {},
    });

    const [errors, setErrors] = useState<Partial<Record<keyof BlogFormState | 'sections', string>>>({});
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        if (blog) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the async-loaded blog into editable form state (edit-form pattern)
            setFormData({
                title: blog.title,
                excerpt: blog.excerpt || "",
                language: blog.language || "vi",
                bannerUrl: blog.bannerFileMetadata?.url || "",
                sections: blog.sections,
                category: typeof blog.category === "string" ? blog.category : blog.category._id,
                tags: blog.tags?.map((tag) => (typeof tag === "string" ? tag : tag._id)) || [],
                status: blog.status,
            });
        }
    }, [blog]);

    const handleAddSection = (type: "html" | "image") => {
        const newSection: BlogSection = {
            order: formData.sections.length,
            type,
            content: type === "html" ? "" : undefined,
            fileMetadata: undefined,
            caption: type === "image" ? "" : undefined,
        };

        setFormData({
            ...formData,
            sections: [...formData.sections, newSection],
        });
    };

    const handleRemoveSection = (index: number) => {
        const newSections = formData.sections.filter((_, i) => i !== index);
        newSections.forEach((section, i) => {
            section.order = i;
        });

        const newSectionFiles = { ...files.sections };
        delete newSectionFiles[index];

        const reindexedSectionFiles: Record<number, File | null> = {};
        Object.keys(newSectionFiles).forEach(keyStr => {
            const key = parseInt(keyStr);
            if (key < index) reindexedSectionFiles[key] = newSectionFiles[key];
            if (key > index) reindexedSectionFiles[key - 1] = newSectionFiles[key];
        });

        setFiles({ ...files, sections: reindexedSectionFiles });
        setFormData({ ...formData, sections: newSections });
    };

    const handleSectionChange = (index: number, updates: Partial<BlogSection>) => {
        const newSections = [...formData.sections];
        newSections[index] = { ...newSections[index], ...updates };
        setFormData({ ...formData, sections: newSections });
    };

    const handleSectionFileChange = (index: number, file: File | null) => {
        setFiles(prev => ({
            ...prev,
            sections: {
                ...prev.sections,
                [index]: file
            }
        }));
    };

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof BlogFormState | 'sections', string>> = {};

        if (!files.banner && !formData.bannerUrl) {
            newErrors.bannerUrl = t("blogs.validation.bannerRequired");
        }

        if (!formData.category) {
            newErrors.category = t("blogs.validation.categoryRequired");
        }

        if (!formData.title.trim()) {
            newErrors.title = t("blogs.validation.titleRequired");
        }
        // if (formData.title.length > 100) {
        //     newErrors.title = t("blogs.validation.titleMaxLength");
        // }

        if (!formData.excerpt.trim()) {
            newErrors.excerpt = t("blogs.validation.excerptRequired");
        }
        // if (formData.excerpt.length > 100) {
        //     newErrors.excerpt = t("blogs.validation.excerptMaxLength");
        // }

        if (formData.sections.length === 0) {
            newErrors.sections = t("blogs.validation.contentRequired");
        }

        const missingImage = formData.sections.some((s, idx) => {
            if (s.type === 'image') {
                // In form state `fileMetadata` is always the populated object
                // (or unset); the string variant only exists on the wire.
                const existingUrl = typeof s.fileMetadata === 'object' ? s.fileMetadata.url : undefined;
                return !files.sections[idx] && !existingUrl;
            }
            return false;
        });

        if (missingImage) {
            newErrors.sections = t("blogs.validation.sessionsRequired");
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = <K extends keyof BlogFormState>(field: K, value: BlogFormState[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            setShowConfirmation(true);
        }
    };

    const handleConfirmSave = async () => {
        setShowConfirmation(false);
        const dto: CreateBlogDto = {
            title: formData.title?.trim() || "",
            excerpt: formData.excerpt?.trim() || "",
            language: formData.language || "vi",
            category: formData.category,
            tags: formData.tags,
            status: formData.status,
            sections: formData.sections,
            bannerFileMetadata: undefined,
        };
        await onSave(dto, files);
    };

    return (
        <>
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Language selector (only when creating) */}
                    {!blog && (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t("blogs.form.language")} <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleChange("language", "vi")}
                                    className={`px-6 py-2 rounded-lg border font-medium transition-colors ${formData.language === 'vi'
                                        ? 'bg-teal-600 text-white border-teal-600'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    🇻🇳 Tiếng Việt
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleChange("language", "en")}
                                    className={`px-6 py-2 rounded-lg border font-medium transition-colors ${formData.language === 'en'
                                        ? 'bg-teal-600 text-white border-teal-600'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    🇺🇸 English
                                </button>
                            </div>
                        </div>
                    )}
                    {blog && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-medium">{t("blogs.form.language")}:</span>
                            <span>{blog.language === 'en' ? '🇺🇸 English' : '🇻🇳 Tiếng Việt'}</span>
                        </div>
                    )}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("blogs.form.bannerImage")}
                            <span className="text-red-500">*</span>
                        </label>
                        <div className={errors.bannerUrl ? "rounded-lg border-2 border-red-500 p-1" : ""}>
                            <UploadImage
                                value={formData.bannerUrl}
                                onChange={(url) => handleChange("bannerUrl", url)}
                                onFileSelect={(file) => {
                                    setFiles(prev => ({ ...prev, banner: file }));
                                    if (file) {
                                        setErrors(e => ({ ...e, bannerUrl: undefined }));
                                        handleChange("bannerUrl", "");
                                    }
                                }}
                            />
                        </div>
                        {errors.bannerUrl && (
                            <p className="mt-1 text-sm text-red-500">{errors.bannerUrl}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t("blogs.form.category")}
                                <span className="text-red-500">*</span>
                            </label>
                            <CategoryDropdown
                                value={formData.category}
                                onChange={(value) => handleChange("category", value)}
                                required
                            />
                            {errors.category && (
                                <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                            )}
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t("blogs.form.tags")}
                            </label>
                            <TagMultiSelect
                                value={formData.tags || []}
                                onChange={(value) => handleChange("tags", value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("blogs.form.title")}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                            placeholder={t("blogs.form.titlePlaceholder")}
                            className={`w-full rounded-lg border px-4 py-2 ${errors.title
                                ? "border-red-500"
                                : "border-gray-300 dark:border-gray-700"
                                } dark:bg-gray-800`}
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("blogs.form.excerpt")}
                            <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.excerpt}
                            onChange={(e) => handleChange("excerpt", e.target.value)}
                            // maxLength={100}
                            placeholder={t("blogs.form.excerptPlaceholder")}
                            className={`w-full rounded-lg border px-4 py-2 ${errors.excerpt
                                ? "border-red-500"
                                : "border-gray-300 dark:border-gray-700"
                                } dark:bg-gray-800`}
                        />
                        {errors.excerpt && (
                            <p className="mt-1 text-sm text-red-500">{errors.excerpt}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("blogs.form.content")}
                            <span className="text-red-500">*</span>
                        </label>

                        <div className="mb-4 flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    handleAddSection("image");
                                    if (errors.sections) {
                                        setErrors((prev) => ({ ...prev, sections: undefined }));
                                    }
                                }}
                                disabled={formData.sections.length >= MAX_BLOG_SECTIONS}
                                className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                            >
                                + {t("blogs.form.addImage")}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    handleAddSection("html");
                                    if (errors.sections) {
                                        setErrors((prev) => ({ ...prev, sections: undefined }));
                                    }
                                }}
                                disabled={formData.sections.length >= MAX_BLOG_SECTIONS}
                                className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
                            >
                                + {t("blogs.form.addText")}
                            </button>
                        </div>

                        {errors.sections && (
                            <p className="mb-2 text-sm text-red-500">{errors.sections}</p>
                        )}

                        <div className="space-y-4">
                            {formData.sections.map((section, index) => (
                                <div key={index} className="rounded-lg border p-3 sm:p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-medium">
                                            {t(`blogs.form.section${section.type === "html" ? "Text" : "Image"}`)} #{index + 1}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSection(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            {t("common.button.delete")}
                                        </button>
                                    </div>

                                    {section.type === "image" ? (
                                        <div className="space-y-2">
                                            <UploadImage
                                                value={typeof section.fileMetadata === "object" ? section.fileMetadata.url : undefined}
                                                onFileSelect={(file) => handleSectionFileChange(index, file)}
                                            />
                                            <input
                                                type="text"
                                                value={section.caption || ""}
                                                onChange={(e) => handleSectionChange(index, { caption: e.target.value })}
                                                placeholder={t("blogs.form.imageCaption")}
                                                className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
                                            />
                                        </div>
                                    ) : (
                                        <CKEditorField
                                            value={section.content || ""}
                                            onChange={(value) => handleSectionChange(index, { content: value })}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                        <ButtonCancel onClick={onCancel} />
                        <ButtonSaveAsDraft label={!blog || blog.status === BLOG_STATUS.DRAFT ? t("common.button.saveAsDraft") : t("common.button.save")} />
                    </div>
                </form>
            </div>

            <ConfirmationModal
                isOpen={showConfirmation}
                type="warning"
                title={t(blog ? "blogs.confirmUpdate.title" : "blogs.confirmCreate.title")}
                message={t(blog ? "blogs.confirmUpdate.message" : "blogs.confirmCreate.message")}
                confirmText={blog?.status === BLOG_STATUS.DRAFT ? t("common.button.saveAsDraft") : t("common.button.save")}
                onConfirm={handleConfirmSave}
                onCancel={() => setShowConfirmation(false)}
            />
        </>
    );
}
