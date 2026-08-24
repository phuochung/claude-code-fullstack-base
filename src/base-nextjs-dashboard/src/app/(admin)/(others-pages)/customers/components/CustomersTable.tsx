"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Customer } from "@/types/customer";
import { useI18n } from "@/context/I18nContext";
import { useSearchKeyword } from "@/hooks/useSearchKeyword";
import { GetCustomersParams } from "@/api/services/customer";
import { TABLE_PARAMS } from "@/constants/common";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import Pagination from "@/components/tables/Pagination";
import ButtonsAction from "@/components/common/buttons/ButtonsAction";
import ButtonSearch from "@/components/common/buttons/ButtonSearch";
import ResponsiveTable, { ResponsiveColumn } from "@/components/tables/ResponsiveTable";
import { formatDateTime } from "@/utils/dateTime";

interface Props {
    customers: Customer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    filters: GetCustomersParams;
    isLoading: boolean;
    editHref: (customer: Customer) => string;
    onDelete: (id: string) => void;
    /** Row destinations, as URLs — the row actions are links, openable in a new tab. */
    viewHref: (customer: Customer) => string;
    onFilterChange: (filters: Partial<GetCustomersParams>) => void;
}

export default function CustomersTable({
    customers, total, page, limit, totalPages, filters, isLoading,
    viewHref, editHref, onDelete, onFilterChange,
}: Props) {
    const { t } = useI18n();
    const router = useRouter();
    const [keyword, setKeyword] = useSearchKeyword(filters.keyword);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; customerId: string }>({
        isOpen: false,
        customerId: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onFilterChange({ keyword, page: TABLE_PARAMS.DEFAULT_PAGE });
    };

    const handleDeleteClick = (customer: Customer) => {
        setDeleteConfirmation({ isOpen: true, customerId: customer._id });
    };

    const handleConfirmDelete = () => {
        onDelete(deleteConfirmation.customerId);
        setDeleteConfirmation({ isOpen: false, customerId: '' });
    };

    // Card face: who they are and how to reach them — the phone number is the
    // key the business actually works with.
    const columns: ResponsiveColumn<Customer>[] = [
        {
            key: 'name',
            header: t("customers.table.name"),
            card: 'title',
            cellClassName: "px-4 py-3 text-left text-sm font-medium",
            // No prefetch: one per row adds up on a long list.
            cell: (customer) => (
                <Link href={viewHref(customer)} prefetch={false} className="text-left text-brand-500 hover:underline">
                    {customer.name}
                </Link>
            ),
        },
        {
            key: 'phone',
            header: t("customers.table.phone"),
            card: 'subtitle',
            cell: (customer) => customer.phoneNumber,
        },
        {
            key: 'email',
            header: t("customers.table.email"),
            cell: (customer) => customer.email || '-',
        },
        {
            key: 'gender',
            header: t("customers.table.gender"),
            cell: (customer) => customer.gender ? t(`customers.gender.${customer.gender}`) : '-',
        },
        {
            key: 'createdAt',
            header: t("common.table.createdAt"),
            card: 'none',
            cell: (customer) => formatDateTime(customer.createdAt),
        },
        {
            key: 'actions',
            header: t("common.table.actions"),
            card: 'actions',
            align: 'right',
            cell: (customer) => (
                <ButtonsAction
                    viewHref={viewHref(customer)}
                    editHref={editHref(customer)}
                    onDelete={() => handleDeleteClick(customer)}
                />
            ),
        },
    ];

    return (
        <>
            <div>
                <div className="mb-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                            placeholder={t("customers.searchPlaceholder")}
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
                        />
                        <ButtonSearch />
                    </form>
                </div>

                <ResponsiveTable
                    rows={customers}
                    columns={columns}
                    rowKey={(customer) => customer._id}
                    onRowClick={(customer) => router.push(viewHref(customer))}
                    isLoading={isLoading}
                    emptyText={t("customers.table.empty")}
                    minWidthClass="min-w-[700px]"
                    indexOffset={(page - 1) * limit}
                />

                {totalPages >= 1 && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={newPage => onFilterChange({ page: newPage })}
                        previousLabel={t("common.button.previous")}
                        nextLabel={t("common.button.next")}
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
                title={t("customers.confirmDelete.title")}
                message={t("customers.confirmDelete.message")}
                confirmText={t("common.button.delete")}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteConfirmation({ isOpen: false, customerId: '' })}
            />
        </>
    );
}
