"use client";

import { ReactNode } from "react";
import { useI18n } from "@/context/I18nContext";
import Loading from "@/components/common/Loading";
import Checkbox from "@/components/form/input/Checkbox";

/**
 * One table, two renderings: the desktop `<table>` the dashboard already had,
 * and a stacked card list for phones. Both are driven by the same column
 * definitions, so a page describes its data once and cannot drift between the
 * two — which is the whole point. All nine list pages were copied from one
 * desktop-only template; migrating them means writing columns here, not forking
 * a tenth table.
 *
 * A column says where it belongs on the card via `card`:
 *
 *   media     leading thumbnail
 *   title     the one thing the row is called (order code, product name)
 *   subtitle  the line under it (customer, SKU)
 *   badge     status pills — collected onto one wrapping line
 *   body      label/value rows under the divider (the default)
 *   actions   the row's buttons, pinned to the card footer
 *   none      desktop only (No., "Created At" — noise on a 390px screen)
 *
 * Both renderings are always in the DOM, one hidden by a media query, so the
 * cells render twice. That is deliberate: cells are pure renders, the pages are
 * 10–20 rows, and the alternative (reflowing one `<table>` with CSS) cannot
 * produce a real card — no thumbnail slot, no badge line, no footer.
 */

export type CardSlot =
    | "media"
    | "title"
    | "subtitle"
    | "badge"
    | "body"
    | "actions"
    | "none";

export interface ResponsiveColumn<T> {
    /** React key, and the id used when reporting a bad config. */
    key: string;
    /** Desktop `<th>` content. Omitted for the image / actions columns. */
    header?: ReactNode;
    cell: (row: T, index: number) => ReactNode;
    /** Desktop column alignment. Actions columns are `right`. */
    align?: "left" | "center" | "right";
    /**
     * Full replacements for the default `<th>` / `<td>` classes — not additions.
     * Only for tables that genuinely differ (the order item tables run tighter
     * `py-2` / `text-xs` headers); prefer `align` for the ordinary case.
     */
    headerClassName?: string;
    cellClassName?: string;
    /** Where this column goes on the card. Defaults to `body`. */
    card?: CardSlot;
    /** Label for the card's body row; falls back to `header`. */
    cardLabel?: ReactNode;
}

/**
 * Bulk selection. The parent owns the selected set — this only renders the
 * controls, in both layouts, so card mode is never the crippled one.
 */
export interface ResponsiveTableSelection<T> {
    isSelectable: (row: T) => boolean;
    isSelected: (row: T) => boolean;
    onToggleRow: (row: T, checked: boolean) => void;
    /** True when every selectable row on the page is selected. */
    allSelected: boolean;
    /** False when nothing on the page can be selected (disables select-all). */
    anySelectable: boolean;
    onToggleAll: (checked: boolean) => void;
}

interface Props<T> {
    rows: T[];
    columns: ResponsiveColumn<T>[];
    /** Stable React key. The index is passed for rows with no id of their own. */
    rowKey: (row: T, index: number) => string;
    emptyText: ReactNode;
    isLoading?: boolean;
    selection?: ResponsiveTableSelection<T>;
    /** Desktop-only minimum width, e.g. `min-w-[1000px]`. */
    minWidthClass?: string;
    /**
     * Where the table gives way to cards. `lg` for the big list pages (10+
     * columns); `md` for the narrower item tables, which stay readable longer.
     * Written out in full because Tailwind only sees literal class names.
     */
    breakpoint?: "md" | "lg";
    /** Desktop `<tr>` classes. The list pages hover; the item tables don't. */
    rowClassName?: string;
    /**
     * Renders the leading STT column, adding this to the row index — pass
     * `(page - 1) * limit` on a paginated list, `0` on an unpaginated one.
     * Omit for tables that don't number their rows. Card layout always skips it.
     */
    indexOffset?: number;
    /**
     * Opens the row — the whole row (and the whole card on a phone) becomes a
     * click target for it. Clicks that land on something interactive are left
     * alone, so the actions menu, the select checkbox and the in-row links keep
     * working; so is a click that ends a text selection.
     *
     * Deliberately mouse-only: every one of these tables already puts a real
     * link to the same destination in its first column, so making each row a tab
     * stop as well would only add a duplicate one for keyboard users.
     */
    onRowClick?: (row: T, index: number) => void;
}

/** Anything that handles its own click, and must not also open the row. */
const INTERACTIVE = 'a, button, input, select, textarea, label, [role="menu"], [role="menuitem"]';

/**
 * True when a click inside a row must NOT open it — it landed on something that
 * handles its own click, or it only finished a text selection. Exported for the
 * categories tree table, which hand-rolls its rows and would otherwise keep its
 * own copy of the rule.
 */
export function isRowClickSuppressed(event: React.MouseEvent): boolean {
    if ((event.target as HTMLElement).closest(INTERACTIVE)) return true;
    return !!window.getSelection()?.toString();
}

const LAYOUT = {
    md: { table: "hidden md:block", cards: "md:hidden" },
    lg: { table: "hidden lg:block", cards: "lg:hidden" },
} as const;

const ROW_CLASS = "hover:bg-gray-50 dark:hover:bg-gray-800";

/**
 * The `actions` column is pinned to the right edge of the scroll container.
 *
 * These lists run 9–12 columns. Once the 290px sidebar and the card padding are
 * out, the desktop table needs more width than a laptop viewport leaves it
 * (orders wants ~1180px and gets ~1095px at a 1433px window), so it scrolls
 * inside its card — and the actions column, being last, is exactly the part that
 * goes off-screen. With macOS overlay scrollbars that is indistinguishable from
 * a table whose last column is simply cut off, which is how it got reported.
 *
 * Pinning costs nothing when the table does fit: `right-0` on a table that is
 * not overflowing puts the cell exactly where it already was.
 *
 * A sticky cell must paint its own background — scrolled cells pass *under* it,
 * and table rows are transparent over the card. `bg-white dark:bg-gray-dark`
 * is the card colour every one of these tables sits on.
 *
 * The dividing edge is an **inset shadow, not `border-l`**: preflight puts these
 * tables in `border-collapse: collapse`, where a cell's borders belong to the
 * table's collapsed border grid and do not necessarily travel with the cell as
 * it sticks. A shadow is painted with the element, so it always lands on the
 * pinned edge.
 */
const PINNED_EDGE =
    "shadow-[inset_1px_0_0_0_var(--color-gray-200)] dark:shadow-[inset_1px_0_0_0_var(--color-gray-800)]";
const PINNED = `sticky right-0 z-10 bg-white dark:bg-gray-dark ${PINNED_EDGE}`;
const PINNED_HEADER = `sticky right-0 z-10 bg-gray-50 dark:bg-gray-900 ${PINNED_EDGE}`;
/**
 * Because the pinned cell owns its background it also has to repeat the row's
 * hover colour, or the row tints around a stubbornly white actions column. Only
 * applied for the default row style — a caller passing its own `rowClassName`
 * (the order item tables pass `""` for no hover at all) gets no hover here
 * either, which is right for "" and a deliberate limitation for anything else.
 */
const PINNED_HOVER = "group-hover:bg-gray-50 dark:group-hover:bg-gray-800";

/**
 * The same pinning, for the categories tree table — it hand-rolls its `<table>`
 * (rows carry depth and expand state, which the column model above has no place
 * for) and would otherwise drift from every other list. Its `<tr>` needs `group`
 * for the hover class to reach the cell.
 */
export const pinnedActions = {
    header: PINNED_HEADER,
    cell: `${PINNED} ${PINNED_HOVER}`,
} as const;

// Written out so Tailwind sees each class whole.
const ALIGN = { left: "text-left", center: "text-center", right: "text-right" } as const;

/** A body row with nothing in it would render as a stray label. */
const isEmptyCell = (value: ReactNode) =>
    value === null || value === undefined || value === "" || value === false;

export default function ResponsiveTable<T>({
    rows,
    columns,
    rowKey,
    emptyText,
    isLoading = false,
    selection,
    minWidthClass = "",
    breakpoint = "lg",
    rowClassName = ROW_CLASS,
    indexOffset,
    onRowClick,
}: Props<T>) {
    const { t } = useI18n();
    const layout = LAYOUT[breakpoint];
    const showIndex = indexOffset !== undefined;

    const openRow = onRowClick
        ? (row: T, index: number) => (event: React.MouseEvent) => {
              if (isRowClickSuppressed(event)) return;
              onRowClick(row, index);
          }
        : undefined;
    const clickableClass = onRowClick ? "cursor-pointer" : "";

    const slotOf = (column: ResponsiveColumn<T>): CardSlot => column.card ?? "body";
    /** Pinned to the right edge — see PINNED. Only meaningful for the last column. */
    const isPinned = (column: ResponsiveColumn<T>) => slotOf(column) === "actions";
    const pinnedHover = rowClassName === ROW_CLASS ? PINNED_HOVER : "";

    const headerClassOf = (column: ResponsiveColumn<T>) =>
        [
            column.headerClassName ??
                `px-4 py-3 ${ALIGN[column.align ?? "left"]} text-sm font-medium text-gray-700 dark:text-gray-300`,
            isPinned(column) ? PINNED_HEADER : "",
        ].join(" ");
    const cellClassOf = (column: ResponsiveColumn<T>) =>
        [
            column.cellClassName ?? `px-4 py-3 ${ALIGN[column.align ?? "left"]} text-sm`,
            isPinned(column) ? `${PINNED} ${pinnedHover}` : "",
        ].join(" ");

    const inSlot = (slot: CardSlot) => columns.filter((c) => slotOf(c) === slot);

    const mediaColumns = inSlot("media");
    const titleColumns = inSlot("title");
    const subtitleColumns = inSlot("subtitle");
    const badgeColumns = inSlot("badge");
    const bodyColumns = inSlot("body");
    const actionColumns = inSlot("actions");

    const columnCount = columns.length + (selection ? 1 : 0) + (showIndex ? 1 : 0);

    return (
        <>
            {/* ───────────────────────── desktop ───────────────────────── */}
            <div
                className={`relative overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 ${layout.table}`}
            >
                {isLoading && <Loading text={t("common.message.loading")} />}
                <table
                    className={`w-full ${minWidthClass} ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
                >
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            {selection && (
                                <th className="w-10 px-4 py-3">
                                    <Checkbox
                                        checked={selection.anySelectable && selection.allSelected}
                                        disabled={!selection.anySelectable}
                                        onChange={selection.onToggleAll}
                                    />
                                </th>
                            )}
                            {showIndex && (
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t("common.table.sst")}
                                </th>
                            )}
                            {columns.map((column) => (
                                <th key={column.key} className={headerClassOf(column)}>
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {!isLoading && rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={columnCount}
                                    className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                                >
                                    {emptyText}
                                </td>
                            </tr>
                        )}
                        {rows.map((row, index) => (
                            // `group` so the pinned actions cell can mirror the row hover.
                            <tr
                                key={rowKey(row, index)}
                                onClick={openRow?.(row, index)}
                                className={`group ${rowClassName} ${clickableClass}`}
                            >
                                {selection && (
                                    <td className="px-4 py-3">
                                        <Checkbox
                                            checked={selection.isSelected(row)}
                                            disabled={!selection.isSelectable(row)}
                                            onChange={(checked) => selection.onToggleRow(row, checked)}
                                        />
                                    </td>
                                )}
                                {showIndex && (
                                    <td className="px-4 py-3 text-sm">{(indexOffset ?? 0) + index + 1}</td>
                                )}
                                {columns.map((column) => (
                                    <td key={column.key} className={cellClassOf(column)}>
                                        {column.cell(row, index)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ─────────────────────────── phone ─────────────────────────── */}
            <div className={`relative ${layout.cards}`}>
                {isLoading && <Loading text={t("common.message.loading")} />}
                <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
                    {/* Select-all lives above the list here; there is no header row
                        to hang it off, and bulk actions must work on a phone. */}
                    {selection && selection.anySelectable && rows.length > 0 && (
                        <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                            <Checkbox
                                checked={selection.allSelected}
                                onChange={selection.onToggleAll}
                                label={t("common.table.selectAll")}
                            />
                        </div>
                    )}

                    {!isLoading && rows.length === 0 && (
                        <div className="rounded-lg border border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                            {emptyText}
                        </div>
                    )}

                    <div className="space-y-3">
                        {rows.map((row, index) => {
                            const badges = badgeColumns
                                .map((column) => ({ column, content: column.cell(row, index) }))
                                .filter(({ content }) => !isEmptyCell(content));
                            const bodyCells = bodyColumns
                                .map((column) => ({ column, content: column.cell(row, index) }))
                                .filter(({ content }) => !isEmptyCell(content));

                            return (
                                <div
                                    key={rowKey(row, index)}
                                    onClick={openRow?.(row, index)}
                                    className={`rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] ${clickableClass}`}
                                >
                                    <div className="flex items-start gap-3">
                                        {selection && selection.isSelectable(row) && (
                                            <div className="pt-0.5">
                                                <Checkbox
                                                    checked={selection.isSelected(row)}
                                                    onChange={(checked) => selection.onToggleRow(row, checked)}
                                                />
                                            </div>
                                        )}
                                        {mediaColumns.map((column) => (
                                            <div key={column.key} className="shrink-0">
                                                {column.cell(row, index)}
                                            </div>
                                        ))}
                                        <div className="min-w-0 flex-1">
                                            {titleColumns.map((column) => (
                                                <div
                                                    key={column.key}
                                                    className="text-base font-medium text-gray-900 dark:text-white"
                                                >
                                                    {column.cell(row, index)}
                                                </div>
                                            ))}
                                            {subtitleColumns.map((column) => (
                                                <div
                                                    key={column.key}
                                                    className="mt-0.5 text-sm text-gray-500 dark:text-gray-400"
                                                >
                                                    {column.cell(row, index)}
                                                </div>
                                            ))}
                                            {badges.length > 0 && (
                                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                    {badges.map(({ column, content }) => (
                                                        <span key={column.key}>{content}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {bodyCells.length > 0 && (
                                        <dl className="mt-3 space-y-2 border-t border-gray-100 pt-3 text-sm dark:border-gray-800">
                                            {bodyCells.map(({ column, content }) => (
                                                <div key={column.key} className="flex items-start justify-between gap-3">
                                                    <dt className="shrink-0 text-gray-500 dark:text-gray-400">
                                                        {column.cardLabel ?? column.header}
                                                    </dt>
                                                    <dd className="min-w-0 text-right text-gray-800 dark:text-gray-200">
                                                        {content}
                                                    </dd>
                                                </div>
                                            ))}
                                        </dl>
                                    )}

                                    {actionColumns.length > 0 && (
                                        <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                                            {actionColumns.map((column) => (
                                                <div key={column.key}>{column.cell(row, index)}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
