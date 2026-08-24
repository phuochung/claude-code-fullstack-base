"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomFieldDefinition } from "@/types/custom-field";
import { useI18n } from "@/context/I18nContext";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import ButtonsAction from "@/components/common/buttons/ButtonsAction";
import ResponsiveTable, { ResponsiveColumn } from "@/components/tables/ResponsiveTable";

interface Props {
    definitions: CustomFieldDefinition[];
    isLoading: boolean;
    /** Row destination, as a URL — the row actions are links, openable in a new tab. */
    editHref: (definition: CustomFieldDefinition) => string;
    onDelete: (id: string) => void;
}

export default function CustomFieldDefinitionsTable({ definitions, isLoading, editHref, onDelete }: Props) {
    const { t } = useI18n();
    const router = useRouter();
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; id: string }>({
        isOpen: false,
        id: '',
    });

    const handleDeleteClick = (definition: CustomFieldDefinition) => {
        setDeleteConfirmation({ isOpen: true, id: definition._id });
    };

    const handleConfirmDelete = () => {
        onDelete(deleteConfirmation.id);
        setDeleteConfirmation({ isOpen: false, id: '' });
    };

    // Card face: the key an admin types into an import and the label an admin
    // sees on the form — the pair that has to match.
    const columns: ResponsiveColumn<CustomFieldDefinition>[] = [
        {
            key: 'key',
            header: t("customFieldDefinitions.table.key"),
            card: 'title',
            cellClassName: "px-4 py-3 text-left text-sm font-mono",
            cell: (def) => <span className="font-mono">{def.key}</span>,
        },
        {
            key: 'label',
            header: t("customFieldDefinitions.table.label"),
            card: 'subtitle',
            cell: (def) => def.label,
        },
        {
            key: 'fieldType',
            header: t("customFieldDefinitions.table.fieldType"),
            cell: (def) => t(`customFieldDefinitions.fieldTypes.${def.fieldType}`),
        },
        {
            key: 'required',
            header: t("customFieldDefinitions.table.required"),
            cell: (def) => def.required ? '✓' : '-',
        },
        {
            key: 'order',
            header: t("customFieldDefinitions.table.order"),
            cell: (def) => def.order,
        },
        {
            key: 'actions',
            header: t("common.table.actions"),
            card: 'actions',
            align: 'right',
            cell: (def) => (
                <ButtonsAction
                    editHref={editHref(def)}
                    onDelete={() => handleDeleteClick(def)}
                />
            ),
        },
    ];

    return (
        <>
            <ResponsiveTable
                rows={definitions}
                columns={columns}
                rowKey={(def) => def._id}
                // No detail page for field definitions, so edit is "open this row".
                onRowClick={(def) => router.push(editHref(def))}
                isLoading={isLoading}
                emptyText={t("customFieldDefinitions.table.empty")}
                minWidthClass="min-w-[600px]"
                indexOffset={0}
            />

            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                type="danger"
                title={t("customFieldDefinitions.confirmDelete.title")}
                message={t("customFieldDefinitions.confirmDelete.message")}
                confirmText={t("common.button.delete")}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteConfirmation({ isOpen: false, id: '' })}
            />
        </>
    );
}
