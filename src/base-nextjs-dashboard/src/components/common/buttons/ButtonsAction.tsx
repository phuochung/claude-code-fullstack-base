"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useI18n } from "@/context/I18nContext";
import { CopyIcon, MoreDotIcon } from "@/icons";

/**
 * A row's actions, collapsed into one `⋮` menu.
 *
 * They used to be three-to-five loose icon buttons, which cost 124–172px of a
 * table that already did not fit — the actions column was the part that scrolled
 * off-screen. One trigger costs ~40px, and the menu can afford real labels
 * instead of tooltips.
 *
 * **Navigational items are real links, not buttons.** An item given an `*Href`
 * renders as `<Link>`, so the browser offers "Open Link in New Tab", cmd-click
 * and middle-click on it — a `<button>` that calls `router.push` offers none of
 * that, which is why every row action that just goes somewhere passes an href
 * instead of a callback. Only the items that open a modal (delete, change
 * password) stay buttons.
 *
 * **The menu is portalled to `<body>` on purpose.** It lives inside the tables'
 * `overflow-x-auto` wrapper, and setting `overflow-x` to anything but `visible`
 * forces `overflow-y` to compute to `auto` as well — so an absolutely-positioned
 * menu would be clipped on *both* axes. Fixed coordinates measured from the
 * trigger are the way out; `reposition` keeps them honest while anything
 * scrolls underneath.
 */

type ButtonsActionProps = {
    /**
     * Destination of "View" / "Edit" / "Duplicate". Pass these — not the `on*`
     * callbacks — whenever the action only navigates: the item becomes an
     * anchor the browser can open in a new tab. An href wins over the matching
     * callback if both are given.
     */
    viewHref?: string;
    editHref?: string;
    cloneHref?: string;

    onView?: () => void;
    onEdit?: () => void;
    onClone?: () => void;
    onChangePassword?: () => void;
    onDelete?: () => void;

    showView?: boolean;
    showEdit?: boolean;
    /** Off by default — only tables whose rows can seed a create form pass it. */
    showClone?: boolean;
    showChangePassword?: boolean;
    showDelete?: boolean;

    disabledView?: boolean;
    disabledEdit?: boolean;
    disabledClone?: boolean;
    disabledChangePassword?: boolean;
    disabledDelete?: boolean;

    className?: string;
};

interface MenuItem {
    key: string;
    label: string;
    icon: React.ReactNode;
    /** Renders the item as a link. Takes precedence over `onClick`. */
    href?: string;
    onClick?: () => void;
    disabled: boolean;
    /** Rendered below a divider, in the error colour. */
    destructive?: boolean;
}

const MENU_WIDTH = 200;
/** Gap between the trigger and the menu, and the margin kept off the viewport edge. */
const OFFSET = 6;

const EyeIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const PencilIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const KeyIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export default function ButtonsAction({
    viewHref,
    editHref,
    cloneHref,
    onView,
    onEdit,
    onClone,
    onChangePassword,
    onDelete,
    showView = true,
    showEdit = true,
    showClone = false,
    showChangePassword = false,
    showDelete = true,
    disabledView = false,
    disabledEdit = false,
    disabledClone = false,
    disabledChangePassword = false,
    disabledDelete = false,
    className = "",
}: ButtonsActionProps) {
    const { t } = useI18n();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

    const items: MenuItem[] = [
        showView && {
            key: "view", label: t("common.button.view"), icon: <EyeIcon />,
            href: viewHref, onClick: onView, disabled: (!viewHref && !onView) || disabledView,
        },
        showEdit && {
            key: "edit", label: t("common.button.edit"), icon: <PencilIcon />,
            href: editHref, onClick: onEdit, disabled: (!editHref && !onEdit) || disabledEdit,
        },
        showClone && {
            key: "clone", label: t("common.button.clone"), icon: <CopyIcon className="h-4 w-4" />,
            href: cloneHref, onClick: onClone, disabled: (!cloneHref && !onClone) || disabledClone,
        },
        showChangePassword && {
            key: "changePassword", label: t("common.button.changePassword"), icon: <KeyIcon />,
            onClick: onChangePassword, disabled: !onChangePassword || disabledChangePassword,
        },
        showDelete && {
            key: "delete", label: t("common.button.delete"), icon: <TrashIcon />,
            onClick: onDelete, disabled: !onDelete || disabledDelete, destructive: true,
        },
    ].filter(Boolean) as MenuItem[];

    const reposition = useCallback(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        const height = menuRef.current?.offsetHeight ?? 0;
        // Right-aligned to the trigger, because the actions column is the last
        // one — a left-aligned menu would hang off the window.
        const left = Math.max(OFFSET, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - OFFSET));
        // Flip above when the menu would not clear the bottom of the window.
        const below = rect.bottom + OFFSET;
        const flip = height > 0 && below + height > window.innerHeight - OFFSET && rect.top - OFFSET - height > 0;
        setPosition({ top: flip ? rect.top - OFFSET - height : below, left });
    }, []);

    // Before paint, so the menu never shows at a stale position for a frame.
    useLayoutEffect(() => {
        if (open) reposition();
    }, [open, reposition]);

    useEffect(() => {
        if (!open) return;
        const close = () => setOpen(false);
        const onPointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
            close();
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") close();
        };
        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        // Capture, so scrolling the *table* (not just the page) is caught too.
        window.addEventListener("scroll", reposition, true);
        window.addEventListener("resize", reposition);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("scroll", reposition, true);
            window.removeEventListener("resize", reposition);
        };
    }, [open, reposition]);

    if (items.length === 0) return null;

    const run = (item: MenuItem) => {
        if (item.disabled) return;
        setOpen(false);
        item.onClick?.();
    };

    // Shared by both renderings of an item, so a link and a button look identical.
    const itemClassOf = (item: MenuItem) =>
        `flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${
            item.destructive
                ? "text-error-500 hover:bg-error-50 dark:hover:bg-error-500/20"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        }`;

    return (
        <div className={`flex items-center justify-end ${className}`}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((was) => !was)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={t("common.table.actions")}
                title={t("common.table.actions")}
                className={`rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white ${
                    open ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-white" : ""
                }`}
            >
                <MoreDotIcon className="h-5 w-5" />
            </button>

            {open && position &&
                createPortal(
                    <div
                        ref={menuRef}
                        role="menu"
                        style={{ position: "fixed", top: position.top, left: position.left, width: MENU_WIDTH }}
                        className="z-[99999] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
                    >
                        {items.map((item) => (
                            <div key={item.key}>
                                {item.destructive && items.length > 1 && (
                                    <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                                )}
                                {item.href && !item.disabled ? (
                                    <Link
                                        href={item.href}
                                        role="menuitem"
                                        // Only closes the menu — the link itself does the
                                        // navigating, so cmd/middle-click stays a new tab.
                                        onClick={() => setOpen(false)}
                                        className={itemClassOf(item)}
                                    >
                                        <span className="shrink-0">{item.icon}</span>
                                        {item.label}
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        role="menuitem"
                                        disabled={item.disabled}
                                        onClick={() => run(item)}
                                        className={`${itemClassOf(item)} disabled:cursor-not-allowed disabled:opacity-40`}
                                    >
                                        <span className="shrink-0">{item.icon}</span>
                                        {item.label}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>,
                    document.body,
                )}
        </div>
    );
}
