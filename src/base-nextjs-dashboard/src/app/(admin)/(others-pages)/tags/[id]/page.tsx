"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loading from "@/components/common/Loading";
import { Tag } from "@/types/tag";
import { useI18n } from "@/context/I18nContext";
import { tagService } from "@/api/services/tag";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import TagDetail from "../components/TagDetail";

export default function TagDetailPage() {
    const { t } = useI18n();
    const router = useRouter();
    const params = useParams();
    const tagId = params.id as string;
    const { isLoading, execute } = useAsyncAction();
    const [tag, setTag] = useState<Tag | null>(null);

    useEffect(() => {
        const fetchTag = async () => {
            await execute(
                () => tagService.getTagById(tagId),
                {
                    showSuccessToast: false,
                    onSuccess: (data) => setTag(data),
                    onError: () => {
                        router.push("/tags");
                    },
                }
            );
        };

        fetchTag();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tagId]);

    const handleEdit = () => {
        router.push(`/tags/${tagId}/edit`);
    };

    const handleBack = () => {
        router.push("/tags");
    };

    if (isLoading || !tag) {
        return <Loading text={t("common.message.loading")} />;
    }

    return (
        <div>
            <div className="mb-6">
                <PageBreadcrumb />
            </div>

            <TagDetail tag={tag} onEdit={handleEdit} onBack={handleBack} />
        </div>
    );
}
