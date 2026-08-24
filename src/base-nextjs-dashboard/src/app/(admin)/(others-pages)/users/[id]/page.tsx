"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loading from "@/components/common/Loading";
import { useI18n } from "@/context/I18nContext";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import userService from "@/api/services/user";
import { User } from "@/types/user";
import UserDetail from "../components/UserDetail";

export default function UserDetailPage() {
    const { t } = useI18n();
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;
    const { isLoading, execute } = useAsyncAction();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            await execute(
                () => userService.getUserById(userId),
                {
                    showSuccessToast: false,
                    onSuccess: (data) => setUser(data),
                    onError: () => {
                        router.push("/users");
                    },
                }
            );
        };

        fetchUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const handleEdit = () => {
        router.push(`/users/${userId}/edit`);
    };

    const handleBack = () => {
        router.push("/users");
    };

    if (isLoading || !user) {
        return <Loading text={t("common.message.loading")} />;
    }

    return (
        <div>
            <div className="mb-6">
                <PageBreadcrumb />
            </div>

            <UserDetail user={user} onEdit={handleEdit} onBack={handleBack} />
        </div>
    );
}
