"use client";

import Image, { type ImageProps } from "next/image";
import { twMerge } from "tailwind-merge";
import { useI18n } from "@/context/I18nContext";
import { useImageViewer } from "@/context/ImageViewerContext";
import type { ViewerImage } from "@/components/common/ImageViewer";

interface ClickableImageProps extends Omit<ImageProps, "onClick"> {
    /**
     * The set this thumbnail belongs to, so the viewer can page through it.
     * Omit for a lone image — the viewer then shows just this one.
     */
    gallery?: ViewerImage[];
    /** Which entry of `gallery` this thumbnail is. Ignored without `gallery`. */
    galleryIndex?: number;
    /** Shown under the photo in the viewer. Ignored when `gallery` is given. */
    caption?: string;
    /**
     * Full-size URL, when `src` is a smaller variant. Defaults to `src`, which is
     * already the original everywhere in this dashboard.
     */
    viewerSrc?: string;
    /**
     * `false` renders the image exactly as before, with no click target — for a
     * placeholder graphic, where opening a viewer on it is only a dead end.
     */
    viewable?: boolean;
    /**
     * Classes for the button that wraps the image, not the image itself. Merged
     * with `tailwind-merge`, so passing a `cursor-*` replaces the default zoom
     * cursor — the product form needs `cursor-grab` to keep advertising reorder.
     */
    wrapperClassName?: string;
}

/**
 * A thumbnail that opens the full-screen viewer when clicked.
 *
 * Drop-in for `next/image`: same props, plus the gallery this image belongs to.
 * The thumbnail itself stays a `next/image` (optimized, sized for the layout) —
 * only the viewer loads the original.
 */
export default function ClickableImage({
    gallery,
    galleryIndex = 0,
    caption,
    viewerSrc,
    viewable = true,
    wrapperClassName = "",
    // `alt` is required by ImageProps; named here so it is visibly forwarded.
    alt,
    ...imageProps
}: ClickableImageProps) {
    const { t } = useI18n();
    const { open } = useImageViewer();

    if (!viewable) return <Image {...imageProps} alt={alt} />;

    const src = viewerSrc ?? (typeof imageProps.src === "string" ? imageProps.src : "");

    return (
        <button
            type="button"
            title={t("common.imageViewer.viewImage")}
            aria-label={t("common.imageViewer.viewImage")}
            onClick={(event) => {
                // Thumbnails sit inside rows and forms that have their own click
                // and submit behaviour; viewing a photo must trigger neither.
                event.preventDefault();
                event.stopPropagation();
                if (gallery && gallery.length > 0) open(gallery, galleryIndex);
                else open([{ url: src, alt, caption }]);
            }}
            className={twMerge("block cursor-zoom-in", wrapperClassName)}
        >
            <Image {...imageProps} alt={alt} />
        </button>
    );
}
