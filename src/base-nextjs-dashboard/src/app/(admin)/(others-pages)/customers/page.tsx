"use client";

import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ButtonAdd from "@/components/common/buttons/ButtonAdd";
import ButtonClearFilters from "@/components/common/buttons/ButtonClearFilters";
import CustomersTable from "./components/CustomersTable";
import { useI18n } from "@/context/I18nContext";
import { customerService, GetCustomersParams } from "@/api/services/customer";
import { useListPage, readBaseListFilters, appendBaseListParams } from "@/hooks/useListPage";

export default function CustomersPage() {
    const { t } = useI18n();
    const router = useRouter();

    const {
        items: customers,
        pagination,
        filters,
        isLoading,
        activeFilterCount,
        clearFilters,
        handleFilterChange,
        runAction,
    } = useListPage({
        getFiltersFromURL: (searchParams): GetCustomersParams => readBaseListFilters(searchParams),
        serializeFilters: (params) => {
            const urlParams = new URLSearchParams();
            appendBaseListParams(urlParams, params);
            return urlParams;
        },
        fetcher: (params) => customerService.getCustomers(params),
        fetchErrorMessage: t("customers.messages.fetchFailed"),
    });

    const handleDelete = async (customerId: string) => {
        await runAction(
            () => customerService.deleteCustomer(customerId),
            t("customers.messages.deleteSuccess"),
        );
    };

    return (
        <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <PageBreadcrumb />
                <div className="flex flex-wrap items-center gap-2">
                    <ButtonClearFilters onClick={clearFilters} count={activeFilterCount} />
                    <ButtonAdd onClick={() => router.push('/customers/create')} />
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
                <CustomersTable
                    customers={customers}
                    total={pagination.total}
                    page={pagination.page}
                    limit={pagination.limit}
                    totalPages={pagination.totalPages}
                    filters={filters}
                    isLoading={isLoading}
                    editHref={(customer) => `/customers/${customer._id}/edit`}
                    onDelete={handleDelete}
                    viewHref={(customer) => `/customers/${customer._id}`}
                    onFilterChange={handleFilterChange}
                />
            </div>
        </div>
    );
}
