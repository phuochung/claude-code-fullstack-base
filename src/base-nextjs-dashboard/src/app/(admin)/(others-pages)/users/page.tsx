"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ChangePasswordModal from "@/components/common/ChangePasswordModal";
import { User } from "@/types/user";
import { useI18n } from "@/context/I18nContext";
import { userService, GetUsersParams } from "@/api/services/user";
import ButtonAdd from "@/components/common/buttons/ButtonAdd";
import ButtonClearFilters from "@/components/common/buttons/ButtonClearFilters";
import UsersTable from "./components/UsersTable";
import { useListPage, readBaseListFilters, appendBaseListParams } from "@/hooks/useListPage";

export default function UsersPage() {
    const { t } = useI18n();
    const router = useRouter();

    const [changePasswordUser, setChangePasswordUser] = useState<{ _id: string; name: string } | null>(null);

    const {
        items: users,
        pagination,
        filters,
        isLoading,
        activeFilterCount,
        clearFilters,
        handleFilterChange,
        runAction,
        execute,
    } = useListPage({
        getFiltersFromURL: (searchParams): GetUsersParams => ({
            ...readBaseListFilters(searchParams),
            role: searchParams.get("role") ? Number(searchParams.get("role")) : undefined,
        }),
        serializeFilters: (params) => {
            const urlParams = new URLSearchParams();
            appendBaseListParams(urlParams, params);
            if (params.role) urlParams.set("role", String(params.role));
            return urlParams;
        },
        fetcher: (params) => userService.getUsers(params),
        fetchErrorMessage: t("users.messages.fetchFailed"),
    });

    const handleCreateUser = () => {
        router.push("/users/create");
    }

    const userEditHref = (user: User) => `/users/${user._id}/edit`;

    const handleDeleteUser = async (userId: string) => {
        await runAction(
            () => userService.deleteUser(userId),
            t("users.messages.deleteSuccess"),
        );
    };

    const userHref = (user: User) => `/users/${user._id}`;

    // The modal awaits this; useAsyncAction is the single source of the
    // success/error toast and the modal only closes on success.
    const handleChangePassword = async (newPassword: string) => {
        if (!changePasswordUser) return;
        await execute(
            () => userService.resetPassword(changePasswordUser._id, newPassword),
            {
                successMessage: t("users.messages.passwordChanged"),
                onSuccess: () => setChangePasswordUser(null),
            }
        );
    };

    return (
        <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <PageBreadcrumb />
                <div className="flex flex-wrap items-center gap-2">
                    <ButtonClearFilters onClick={clearFilters} count={activeFilterCount} />
                    <ButtonAdd onClick={handleCreateUser} />
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
                <UsersTable
                    users={users}
                    {...pagination}
                    filters={filters}
                    isLoading={isLoading}
                    viewHref={userHref}
                    editHref={userEditHref}
                    onDelete={handleDeleteUser}
                    onChangePassword={setChangePasswordUser}
                    onFilterChange={handleFilterChange}
                />
            </div>

            {changePasswordUser && (
                <ChangePasswordModal
                    title={t("users.changePassword.title")}
                    subtitle={changePasswordUser.name}
                    onClose={() => setChangePasswordUser(null)}
                    onSave={handleChangePassword}
                />
            )}
        </div>
    );
}
