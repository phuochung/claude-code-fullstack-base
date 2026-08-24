"use client";

import { useRouter, useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loading from "@/components/common/Loading";
import { TagFormData } from "@/types/tag";
import { useI18n } from "@/context/I18nContext";
import { tagService } from "@/api/services/tag";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import TagForm from "../components/TagForm";

export default function CreateTagPage() {
    const { t } = useI18n();
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultModule = searchParams.get('module') || undefined;
    const { isLoading, execute } = useAsyncAction();

    const handleSaveTag = async (data: TagFormData) => {
        await execute(
            () => tagService.createTag(data),
            {
                successMessage: t("tags.messages.createSuccess"),
                onSuccess: () => {
                    router.push("/tags");
                },
            }
        );
    };

    const handleCancel = () => {
        router.push("/tags");
    };

    return (
        <div>
            <div className="mb-6">
                <PageBreadcrumb />
            </div>

            {isLoading && <Loading fullScreen text={t("common.message.saving")} />}
            <TagForm
                tag={null}
                defaultModule={defaultModule}
                onSave={handleSaveTag}
                onCancel={handleCancel}
            />
        </div>
    );
}
