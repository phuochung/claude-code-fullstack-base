"use client";

import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loading from "@/components/common/Loading";
import { useI18n } from "@/context/I18nContext";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { UserFormData } from "@/types/user";
import UserForm from "../components/UserForm";
import userService from "../../../../../api/services/user";

export default function CreateUserPage() {
    const { t } = useI18n();
    const router = useRouter();
    const { isLoading, execute } = useAsyncAction();

    const handleSaveUser = async (data: UserFormData) => {
        await execute(
            () => userService.createUser(data),
            {
                successMessage: t("users.messages.createSuccess"),
                onSuccess: () => {
                    router.push("/users");
                },
            }
        );
    };

    const handleCancel = () => {
        router.push("/users");
    };

    return (
        <div>
            <div className="mb-6">
                <PageBreadcrumb />
            </div>

            {isLoading && <Loading fullScreen text={t("common.message.saving")} />}
            <UserForm
                user={null}
                onSave={handleSaveUser}
                onCancel={handleCancel}
            />
        </div>
    );
}
