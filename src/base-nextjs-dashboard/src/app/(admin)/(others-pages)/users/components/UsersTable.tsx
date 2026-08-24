"use client";

import { User } from "@/types/user";
import { USER_ROLE } from "@/constants/common";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/api/services/auth";
import { GetUsersParams } from "@/api/services/user";
import Label from "@/components/form/Label";
import { useI18n } from "@/context/I18nContext";
import Pagination from "@/components/tables/Pagination";
import ButtonSearch from "@/components/common/buttons/ButtonSearch";
import { formatDateTime } from "@/utils/dateTime";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import ButtonsAction from "@/components/common/buttons/ButtonsAction";
import ResponsiveTable, { ResponsiveColumn } from "@/components/tables/ResponsiveTable";

interface UsersTableProps {
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    filters: GetUsersParams;
    isLoading: boolean;
    /** Row destinations, as URLs — the row actions are links, openable in a new tab. */
    viewHref: (user: User) => string;
    editHref: (user: User) => string;
    onDelete: (userId: string) => void;
    onChangePassword: (user: { _id: string; name: string }) => void;
    onFilterChange: (filters: Partial<GetUsersParams>) => void;
}

export default function UsersTable({
    users,
    total,
    page,
    limit,
    totalPages,
    filters,
    isLoading,
    viewHref,
    editHref,
    onDelete,
    onChangePassword,
    onFilterChange,
}: UsersTableProps) {
    const { t } = useI18n();
    const router = useRouter();
    // Read once on mount: localStorage is not reactive, and this only decides
    // whether one row's delete button is disabled. The backend refuses a
    // self-delete regardless — this just stops the admin from finding out the
    // hard way.
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount; not available during SSR render
        setCurrentUserId(authService.getCurrentUser()?.userId ?? null);
    }, []);

    const [keyword, setKeyword] = useState(filters.keyword || "");
    const [role, setRole] = useState<number | "">(filters.role || "");
    const [sortBy, setSortBy] = useState(filters.sortBy || "createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">((filters.sortOrder === "asc" || filters.sortOrder === "desc") ? filters.sortOrder : "desc");
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        userId: string;
    }>({
        isOpen: false,
        userId: "",
    });

    // Sync local state with filters from URL
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- follow the committed URL filters back down into the local inputs
        setKeyword(filters.keyword || "");
        setRole(filters.role || "");
        setSortBy(filters.sortBy || "createdAt");
        setSortOrder((filters.sortOrder === "asc" || filters.sortOrder === "desc") ? filters.sortOrder : "desc");
    }, [filters]);

    const getRoleName = (roleValue: number) => {
        return Object.values(USER_ROLE).find((r) => r.value === roleValue)?.name || t("users.table.unknown");
    };

    const handleSearch = () => {
        onFilterChange({
            keyword: keyword || undefined,
            role: role !== "" ? role : undefined,
            sortBy,
            sortOrder,
            page: 1,
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
        }
    };

    const handleRoleChange = (newRole: number | "") => {
        setRole(newRole);
        onFilterChange({
            keyword: keyword || undefined,
            role: newRole !== "" ? newRole : undefined,
            sortBy,
            sortOrder,
            page: 1,
        });
    };

    const handleSortChange = (value: string) => {
        const [newSortBy, newSortOrder] = value.split("-") as [string, "asc" | "desc"];
        setSortBy(newSortBy);
        setSortOrder(newSortOrder);
        onFilterChange({
            keyword: keyword || undefined,
            role: role !== "" ? role : undefined,
            sortBy: newSortBy,
            sortOrder: newSortOrder,
            page: 1,
        });
    };

    const handleDeleteClick = (user: User) => {
        setDeleteConfirmation({
            isOpen: true,
            userId: user._id,
        });
    };

    const handleConfirmDelete = () => {
        onDelete(deleteConfirmation.userId);
        setDeleteConfirmation({
            isOpen: false,
            userId: "",
        });
    };

    const handleCancelDelete = () => {
        setDeleteConfirmation({
            isOpen: false,
            userId: "",
        });
    };

    /**
     * Card face: name, email and the role pill — role is the only field here
     * with consequences, so it stays visible without opening the row.
     */
    const columns: ResponsiveColumn<User>[] = [
        {
            key: 'name',
            header: t("users.table.name"),
            card: 'title',
            cell: (user) => (
                <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
            ),
        },
        {
            key: 'email',
            header: t("users.table.email"),
            card: 'subtitle',
            cell: (user) => user.email,
        },
        {
            key: 'role',
            header: t("users.table.role"),
            card: 'badge',
            cell: (user) => (
                <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${user.role === USER_ROLE.ADMIN.value
                        ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                >
                    {getRoleName(user.role)}
                </span>
            ),
        },
        {
            key: 'phone',
            header: t("users.table.phone"),
            cell: (user) => user.phoneNumber,
        },
        {
            key: 'createdAt',
            header: t("users.table.createdAt"),
            card: 'none',
            cell: (user) => formatDateTime(user.createdAt),
        },
        {
            key: 'lastActive',
            header: t("users.table.lastActive"),
            cell: (user) => formatDateTime(user.lastActiveAt || ""),
        },
        {
            key: 'actions',
            header: t("users.table.actions"),
            card: 'actions',
            align: 'right',
            cell: (user) => (
                <ButtonsAction
                    viewHref={viewHref(user)}
                    editHref={editHref(user)}
                    showChangePassword
                    onChangePassword={() => onChangePassword({ _id: user._id, name: user.name })}
                    onDelete={() => handleDeleteClick(user)}
                    disabledDelete={user._id === currentUserId}
                />
            ),
        },
    ];

    return (
        <>
            <div className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                        <Label>{t("users.search")}</Label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder={t("users.searchPlaceholder")}
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="h-11 flex-1 rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs border-gray-300 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                            />
                            <ButtonSearch onClick={handleSearch} type="button" />
                        </div>
                    </div>
                    <div>
                        <Label>{t("users.table.role")}</Label>
                        <select
                            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                            value={role}
                            onChange={(e) => handleRoleChange(e.target.value ? Number(e.target.value) : "")}
                        >
                            <option value="">{t("users.allRoles")}</option>
                            {Object.values(USER_ROLE).map((r) => (
                                <option key={r.value} value={r.value}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label>{t("users.sortBy")}</Label>
                        <select
                            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => handleSortChange(e.target.value)}
                        >
                            <option value="createdAt-desc">{t("users.sort.newestFirst")}</option>
                            <option value="createdAt-asc">{t("users.sort.oldestFirst")}</option>
                            <option value="name-asc">{t("users.sort.nameAZ")}</option>
                            <option value="name-desc">{t("users.sort.nameZA")}</option>
                            <option value="email-asc">{t("users.sort.emailAZ")}</option>
                            <option value="email-desc">{t("users.sort.emailZA")}</option>
                        </select>
                    </div>
                </div>

                <ResponsiveTable
                    rows={users}
                    columns={columns}
                    rowKey={(user, index) => user._id || `user-${index}`}
                    onRowClick={(user) => router.push(viewHref(user))}
                    isLoading={isLoading}
                    emptyText={t("users.table.empty")}
                    minWidthClass="min-w-[950px]"
                    indexOffset={(page - 1) * limit}
                />

                {/* Pagination */}
                {totalPages > 0 && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={(newPage) => onFilterChange({ page: newPage })}
                        previousLabel={t("common.button.previous")}
                        nextLabel={t("common.button.next")}
                        containerClassName="mt-0"
                        t={t}
                        showSummary
                        totalItems={total}
                        pageSize={limit}
                    />
                )}
            </div>

            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                type="danger"
                title={t("users.confirmDelete.title")}
                message={t("users.confirmDelete.message")}
                confirmText={t("common.button.delete")}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </>
    );
}
