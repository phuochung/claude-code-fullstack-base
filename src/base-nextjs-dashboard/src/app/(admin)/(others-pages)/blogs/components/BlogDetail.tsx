import { useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { Blog } from "@/types/blog";
import { useI18n } from "@/context/I18nContext";
import { formatDateTime } from "@/utils/dateTime";
import ButtonEdit from "@/components/common/buttons/ButtonEdit";
import ButtonBack from "@/components/common/buttons/ButtonBack";
import Button from "@/components/ui/button/Button";
import { BLOG_STATUS } from "@/constants/common";
import Image from "next/image";
import { getBlogStatusConfig } from "@/utils/blog.util";
import ConfirmationModal, { ConfirmationType } from "@/components/common/ConfirmationModal";
import { EyeIcon } from "@/icons";

interface BlogDetailProps {
    blog: Blog;
    onEdit?: () => void;
    onBack?: () => void;
    onPreview?: (id: string) => Promise<void>;
    onPublish?: (id: string) => Promise<void>;
    onSetTmpHide?: (id: string) => Promise<void>;
}

export default function BlogDetail({ blog, onEdit, onBack, onPreview, onPublish, onSetTmpHide }: BlogDetailProps) {
    const { t } = useI18n();
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        type: ConfirmationType;
        title: string;
        message: string;
        action: () => Promise<void>;
    }>({
        isOpen: false,
        type: "warning",
        title: "",
        message: "",
        action: async () => { },
    });

    const renderStatus = (status: number) => {
        const config = getBlogStatusConfig(status);
        return (
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${config.className}`}>
                {config.labelKey ? t(config.labelKey) : '-'}
            </span>
        );
    };

    const handlePreviewClick = () => {
        if (!onPreview) return;
        onPreview(blog._id);
    };

    const handlePublishClick = () => {
        if (!onPublish) return;
        setConfirmation({
            isOpen: true,
            type: "success",
            title: t("blogs.confirmPublish.title"),
            message: t("blogs.confirmPublish.message"),
            action: async () => onPublish(blog._id),
        });
    };

    const handleTmpHideClick = () => {
        if (!onSetTmpHide) return;
        setConfirmation({
            isOpen: true,
            type: "warning",
            title: t("blogs.confirmTmpHide.title"),
            message: t("blogs.confirmTmpHide.message"),
            action: async () => onSetTmpHide(blog._id),
        });
    };

    const handleConfirm = async () => {
        await confirmation.action();
        setConfirmation((prev) => ({ ...prev, isOpen: false }));
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{blog.title}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{formatDateTime(blog.createdAt)}</span>
                        {renderStatus(blog.status)}
                    </div>
                </div>
            </div>

            {blog.bannerFileMetadata?.url && (
                <div className="mb-8 relative flex justify-center overflow-hidden rounded-lg">
                    <Image
                        src={blog.bannerFileMetadata.url}
                        alt={blog.title}
                        width={400}
                        height={300}
                        className="object-cover"
                    />
                </div>
            )}

            <div className="mb-8 space-y-4">
                <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("blogs.form.excerpt")}</h3>
                    <p className="text-lg text-gray-700 dark:text-gray-300">{blog.excerpt}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("blogs.form.category")}</h3>
                        <p className="font-medium text-gray-900 dark:text-white">{blog.category?.nameVi}</p>
                    </div>
                    {blog.tags && blog.tags.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("blogs.form.tags")}</h3>
                            <div className="flex flex-wrap gap-2">
                                {blog.tags.map(tag => (
                                    <span key={tag._id} className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                        {tag.nameVi}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-8 border-t border-gray-100 pt-8 dark:border-gray-700">
                {blog.sections?.map((section, index) => (
                    <div key={index} className="max-w-none">
                        {section.type === 'html' ? (
                            <div
                                className="prose dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.content || '') }}
                            />
                        ) : (
                            <figure className="text-center">
                                {section.fileMetadata?.url && (
                                    <div className="relative mx-auto h-96 w-full max-w-3xl overflow-hidden rounded-lg">
                                        <Image
                                            src={section.fileMetadata.url}
                                            alt={section.caption || ''}
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                )}
                                {section.caption && (
                                    <figcaption className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
                                        {section.caption}
                                    </figcaption>
                                )}
                            </figure>
                        )}
                    </div>
                ))}
            </div>

            {(onEdit || onBack || (onPublish && blog.status !== BLOG_STATUS.PUBLISHED)) && (
                <div className="flex justify-end mt-8 gap-3 border-t border-gray-100 pt-6 dark:border-gray-700">
                    {onBack && (
                        <ButtonBack onBack={onBack} />
                    )}
                    {onEdit && (
                        <ButtonEdit onEdit={onEdit} />
                    )}
                    {onPreview && blog.status !== BLOG_STATUS.PUBLISHED && (
                        <Button
                            onClick={handlePreviewClick}
                            variant="primary"
                            startIcon={
                                <EyeIcon />
                            }
                        >
                            {t("common.button.preview")}
                        </Button>
                    )}
                    {onPublish && blog.status !== BLOG_STATUS.PUBLISHED && (
                        <Button
                            onClick={handlePublishClick}
                            variant="primary"
                            startIcon={
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            }
                        >
                            {t("common.button.publish")}
                        </Button>
                    )}
                    {onSetTmpHide && blog.status === BLOG_STATUS.PUBLISHED && (
                        <Button
                            onClick={handleTmpHideClick}
                            variant="primary"
                            startIcon={
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            }
                        >
                            {t("common.button.setTmpHide")}
                        </Button>
                    )}
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmation.isOpen}
                type={confirmation.type}
                title={confirmation.title}
                message={confirmation.message}
                onConfirm={handleConfirm}
                onCancel={() => setConfirmation((prev) => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
