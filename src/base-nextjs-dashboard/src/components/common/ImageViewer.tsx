"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/context/I18nContext";

/** One image in the viewer. `caption` is shown under the photo when present. */
export interface ViewerImage {
    url: string;
    alt?: string;
    caption?: string;
}

interface ImageViewerProps {
    images: ViewerImage[];
    index: number;
    onIndexChange: (index: number) => void;
    onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;
/** One button press or one +/- keypress. */
const ZOOM_STEP = 0.5;
/** Where a double-click lands — close enough to read a label in one gesture. */
const DOUBLE_CLICK_SCALE = 2.5;
/** Pointer travel that turns a click into a drag, so panning never closes. */
const DRAG_SLOP = 4;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** `translate(x, y) scale(s)` about the image's centre. x/y are px from centre. */
interface Transform {
    scale: number;
    x: number;
    y: number;
}

const IDENTITY: Transform = { scale: MIN_SCALE, x: 0, y: 0 };

/**
 * Full-screen image viewer with zoom and pan.
 *
 * Rendered through a portal into `document.body`: it is opened from inside
 * tables, forms and other modals, and anything that clips or transforms a
 * parent would otherwise clip the viewer too. Its z-index sits above the
 * `z-999999` dialogs (ConfirmationModal, the order cancel dialog) for the same
 * reason — those are legitimate places to click a thumbnail from.
 *
 * Prefer opening this through `useImageViewer()` rather than mounting it
 * directly; see `context/ImageViewerContext.tsx`.
 */
export default function ImageViewer({ images, index, onIndexChange, onClose }: ImageViewerProps) {
    const { t } = useI18n();
    const [mounted, setMounted] = useState(false);
    const [transform, setTransform] = useState<Transform>(IDENTITY);
    /** Discrete zooms animate; wheel and drag must not, or they feel laggy. */
    const [smooth, setSmooth] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const dialogRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const activeThumbRef = useRef<HTMLButtonElement>(null);
    /** Live pointers, so one finger pans and two pinch. */
    const pointersRef = useRef(new Map<number, { x: number; y: number }>());
    const panRef = useRef<{ pointerId: number; startX: number; startY: number; from: Transform } | null>(null);
    const pinchRef = useRef<{ distance: number; scale: number } | null>(null);
    /** Set once a gesture moves past the slop, and read by the click handler. */
    const draggedRef = useRef(false);

    const image = images[index];
    const hasMany = images.length > 1;
    const isZoomed = transform.scale > MIN_SCALE;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- portal mount flag: document.body does not exist during SSR render
    useEffect(() => setMounted(true), []);

    // A new photo starts fresh — keeping the previous pan would show a corner of
    // an image the admin has not seen whole yet.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reset zoom/pan when the shown image changes
        setTransform(IDENTITY);
        // Not a blind `false`: when two entries are the same file (two order lines
        // can pin the same sample) the <img> is not replaced and no load event
        // follows, which would leave the photo stuck at opacity 0.
        setLoaded(imgRef.current?.complete ?? false);
        activeThumbRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
    }, [index]);

    useEffect(() => {
        // Note this is shared state with ui/modal, which locks the same way: a
        // viewer opened from inside one of those would unlock the body when it
        // closes. No surface does that today.
        document.body.style.overflow = "hidden";
        // Announces the viewer to screen readers and gives Tab somewhere to
        // start. Deliberately the container, not the close button, so Enter does
        // not immediately close what was just opened.
        dialogRef.current?.focus();
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    /** Keeps the scaled image overlapping the stage instead of drifting away. */
    const clampPan = useCallback((next: Transform): Transform => {
        const el = imgRef.current;
        if (!el) return next;
        // offsetWidth/Height are the *untransformed* layout size, which is what
        // the scale multiplies — getBoundingClientRect would already include it.
        const maxX = Math.max(0, (el.offsetWidth * (next.scale - 1)) / 2);
        const maxY = Math.max(0, (el.offsetHeight * (next.scale - 1)) / 2);
        return { ...next, x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
    }, []);

    /**
     * Zoom to `nextScale` while holding the point under (px, py) still, so the
     * detail being inspected stays under the cursor. px/py are px from the
     * stage's centre — the origin the transform is written against.
     */
    const zoomAt = useCallback(
        (nextScale: number, px: number, py: number) => {
            setTransform((prev) => {
                const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
                if (scale === MIN_SCALE) return IDENTITY;
                const ratio = scale / prev.scale;
                return clampPan({
                    scale,
                    x: px - (px - prev.x) * ratio,
                    y: py - (py - prev.y) * ratio,
                });
            });
        },
        [clampPan]
    );

    /** Pointer position relative to the stage centre. */
    const toStageCentre = useCallback((clientX: number, clientY: number) => {
        const rect = stageRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return { x: clientX - (rect.left + rect.width / 2), y: clientY - (rect.top + rect.height / 2) };
    }, []);

    /** Zoom about the centre, for the toolbar buttons and the keyboard. */
    const zoomBy = useCallback(
        (delta: number) => {
            setSmooth(true);
            zoomAt(transform.scale + delta, 0, 0);
        },
        [transform.scale, zoomAt]
    );

    const resetZoom = useCallback(() => {
        setSmooth(true);
        setTransform(IDENTITY);
    }, []);

    const step = useCallback(
        (delta: number) => {
            if (!hasMany) return;
            // Wraps: with the counter visible there is no doubt where you are,
            // and wrapping is fewer clicks when checking a set of photos.
            onIndexChange((index + delta + images.length) % images.length);
        },
        [hasMany, index, images.length, onIndexChange]
    );

    useEffect(() => {
        const handleKey = (event: KeyboardEvent) => {
            switch (event.key) {
                case "Escape":
                    onClose();
                    break;
                case "ArrowLeft":
                    step(-1);
                    break;
                case "ArrowRight":
                    step(1);
                    break;
                case "+":
                case "=":
                    zoomBy(ZOOM_STEP);
                    break;
                case "-":
                    zoomBy(-ZOOM_STEP);
                    break;
                case "0":
                    resetZoom();
                    break;
                default:
                    return;
            }
            event.preventDefault();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose, step, zoomBy, resetZoom]);

    // Wheel is bound by hand: React registers its wheel listener as passive, so
    // an onWheel handler cannot preventDefault the browser's page zoom.
    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;
        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            setSmooth(false);
            const point = toStageCentre(event.clientX, event.clientY);
            // Proportional, so each notch feels the same at 1× and at 5×.
            const factor = Math.exp(-event.deltaY * 0.0015);
            setTransform((prev) => {
                const scale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);
                if (scale === MIN_SCALE) return IDENTITY;
                const ratio = scale / prev.scale;
                return clampPan({
                    scale,
                    x: point.x - (point.x - prev.x) * ratio,
                    y: point.y - (point.y - prev.y) * ratio,
                });
            });
        };
        stage.addEventListener("wheel", handleWheel, { passive: false });
        return () => stage.removeEventListener("wheel", handleWheel);
    }, [clampPan, toStageCentre]);

    const midpointOf = (pointers: Map<number, { x: number; y: number }>) => {
        const [a, b] = [...pointers.values()];
        return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    };

    const distanceOf = (pointers: Map<number, { x: number; y: number }>) => {
        const [a, b] = [...pointers.values()];
        return Math.hypot(a.x - b.x, a.y - b.y);
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLImageElement>) => {
        const pointers = pointersRef.current;
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        draggedRef.current = false;

        if (pointers.size === 2) {
            panRef.current = null;
            pinchRef.current = { distance: distanceOf(pointers), scale: transform.scale };
            return;
        }
        if (pointers.size === 1 && isZoomed) {
            event.currentTarget.setPointerCapture(event.pointerId);
            panRef.current = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                from: transform,
            };
        }
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLImageElement>) => {
        const pointers = pointersRef.current;
        if (!pointers.has(event.pointerId)) return;
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

        const pinch = pinchRef.current;
        if (pinch && pointers.size >= 2) {
            const distance = distanceOf(pointers);
            if (pinch.distance > 0) {
                draggedRef.current = true;
                setSmooth(false);
                const centre = midpointOf(pointers);
                const point = toStageCentre(centre.x, centre.y);
                zoomAt((distance / pinch.distance) * pinch.scale, point.x, point.y);
            }
            return;
        }

        const pan = panRef.current;
        if (!pan || pan.pointerId !== event.pointerId) return;
        const dx = event.clientX - pan.startX;
        const dy = event.clientY - pan.startY;
        if (!draggedRef.current && Math.hypot(dx, dy) < DRAG_SLOP) return;
        draggedRef.current = true;
        setSmooth(false);
        setTransform(clampPan({ scale: pan.from.scale, x: pan.from.x + dx, y: pan.from.y + dy }));
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLImageElement>) => {
        const pointers = pointersRef.current;
        pointers.delete(event.pointerId);
        if (pointers.size < 2) pinchRef.current = null;
        if (panRef.current?.pointerId === event.pointerId) panRef.current = null;
    };

    /** Click toggles zoom, but only when the gesture was not a pan. */
    const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
        if (draggedRef.current) return;
        // `detail` counts clicks in the burst: swallowing the rest makes a
        // double-click (a common habit) settle on the same state as a single one
        // instead of zooming in and straight back out.
        if (event.detail > 1) return;
        setSmooth(true);
        if (isZoomed) setTransform(IDENTITY);
        else zoomAt(DOUBLE_CLICK_SCALE, 0, 0);
    };

    if (!mounted || !image) return null;

    const toolbarButton =
        "flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-30";

    return createPortal(
        <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("common.imageViewer.imageAlt")}
            tabIndex={-1}
            className="fixed inset-0 z-[1000000] flex flex-col bg-black/90 outline-none"
        >
            {/* Toolbar */}
            <div className="relative z-10 flex shrink-0 items-center justify-between gap-2 p-3 sm:p-4">
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white">
                    {hasMany ? `${index + 1} / ${images.length}` : `${Math.round(transform.scale * 100)}%`}
                </span>
                <div className="flex items-center gap-2">
                    {hasMany && (
                        <span className="hidden rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white sm:inline">
                            {Math.round(transform.scale * 100)}%
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => zoomBy(-ZOOM_STEP)}
                        disabled={!isZoomed}
                        title={t("common.imageViewer.zoomOut")}
                        aria-label={t("common.imageViewer.zoomOut")}
                        className={toolbarButton}
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h6" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => zoomBy(ZOOM_STEP)}
                        disabled={transform.scale >= MAX_SCALE}
                        title={t("common.imageViewer.zoomIn")}
                        aria-label={t("common.imageViewer.zoomIn")}
                        className={toolbarButton}
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m-3-3h6" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={resetZoom}
                        disabled={!isZoomed}
                        title={t("common.imageViewer.resetZoom")}
                        aria-label={t("common.imageViewer.resetZoom")}
                        className={toolbarButton}
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M20 9A8 8 0 006.3 5.7L4 8m16 8a8 8 0 01-13.7 3.3L4 16" />
                        </svg>
                    </button>
                    <a
                        href={image.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t("common.imageViewer.openOriginal")}
                        aria-label={t("common.imageViewer.openOriginal")}
                        className={toolbarButton}
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                    <button
                        type="button"
                        onClick={onClose}
                        title={t("common.imageViewer.close")}
                        aria-label={t("common.imageViewer.close")}
                        className={toolbarButton}
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Stage */}
            <div ref={stageRef} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
                {/* Backdrop: closing on click is only safe while not zoomed —
                    otherwise releasing a pan outside the photo would close it. */}
                <div className="absolute inset-0" onClick={isZoomed ? undefined : onClose} />

                {!loaded && (
                    <div className="pointer-events-none absolute h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                )}

                {/* A plain <img>, not next/image: zooming to 6× needs the original
                    pixels, and the optimizer would hand back a resized copy.
                    It also lets the same viewer show `blob:` upload previews. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    ref={imgRef}
                    key={image.url}
                    src={image.url}
                    alt={image.alt || t("common.imageViewer.imageAlt")}
                    draggable={false}
                    onLoad={() => setLoaded(true)}
                    onError={() => setLoaded(true)}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onClick={handleImageClick}
                    style={{
                        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                        // Without this the browser pans/zooms the page instead of
                        // handing the gesture to the pointer handlers.
                        touchAction: "none",
                        // Inline rather than utility classes: which of two
                        // conflicting `transition-*` classes wins is not something
                        // to leave to Tailwind's output order.
                        transition: smooth ? "transform 200ms, opacity 150ms" : "opacity 150ms",
                    }}
                    className={`relative max-h-full max-w-full select-none object-contain ${
                        loaded ? "opacity-100" : "opacity-0"
                    } ${isZoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
                />

                {hasMany && (
                    <>
                        <button
                            type="button"
                            onClick={() => step(-1)}
                            title={t("common.imageViewer.previous")}
                            aria-label={t("common.imageViewer.previous")}
                            className="absolute left-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/70 sm:left-4"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={() => step(1)}
                            title={t("common.imageViewer.next")}
                            aria-label={t("common.imageViewer.next")}
                            className="absolute right-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/70 sm:right-4"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </>
                )}
            </div>

            {/* Caption + thumbnails */}
            <div className="relative z-10 shrink-0 space-y-3 p-3 sm:p-4">
                {image.caption && (
                    <p className="mx-auto max-w-3xl text-center text-sm text-white/80">{image.caption}</p>
                )}
                {hasMany && (
                    <div className="overflow-x-auto">
                        {/* `w-max mx-auto` rather than `justify-center` on the
                            scroller: a centred flex row cannot be scrolled back to
                            its first item once it overflows. */}
                        <div className="mx-auto flex w-max gap-2">
                            {images.map((thumb, thumbIndex) => (
                                <button
                                    key={`${thumb.url}-${thumbIndex}`}
                                    ref={thumbIndex === index ? activeThumbRef : undefined}
                                    type="button"
                                    onClick={() => onIndexChange(thumbIndex)}
                                    aria-current={thumbIndex === index}
                                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg transition ${
                                        thumbIndex === index
                                            ? "ring-2 ring-white"
                                            : "opacity-50 hover:opacity-100"
                                    }`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={thumb.url}
                                        alt=""
                                        draggable={false}
                                        className="h-full w-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
