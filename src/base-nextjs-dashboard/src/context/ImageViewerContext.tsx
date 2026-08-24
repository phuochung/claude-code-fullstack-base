"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import ImageViewer, { type ViewerImage } from "@/components/common/ImageViewer";

interface ImageViewerContextType {
    /**
     * Show `images` full screen, starting at `startIndex`. Pass the whole set the
     * clicked thumbnail belongs to so the arrows have somewhere to go.
     */
    open: (images: ViewerImage[], startIndex?: number) => void;
    close: () => void;
}

const ImageViewerContext = createContext<ImageViewerContextType | undefined>(undefined);

/**
 * Holds the one image viewer the dashboard has, mounted in the root layout.
 *
 * Central rather than per-page because a thumbnail's own set is often not what
 * should be viewed — a product row shows one photo but opens all of them — and
 * because a viewer owned by a table row or a form field would be trapped inside
 * that subtree's stacking and overflow.
 */
export function ImageViewerProvider({ children }: { children: React.ReactNode }) {
    const [images, setImages] = useState<ViewerImage[]>([]);
    const [index, setIndex] = useState(0);

    const open = useCallback((next: ViewerImage[], startIndex = 0) => {
        const usable = next.filter((image) => !!image?.url);
        if (usable.length === 0) return;
        setImages(usable);
        setIndex(Math.min(Math.max(startIndex, 0), usable.length - 1));
    }, []);

    const close = useCallback(() => setImages([]), []);

    const value = useMemo(() => ({ open, close }), [open, close]);

    return (
        <ImageViewerContext.Provider value={value}>
            {children}
            {images.length > 0 && (
                <ImageViewer images={images} index={index} onIndexChange={setIndex} onClose={close} />
            )}
        </ImageViewerContext.Provider>
    );
}

export function useImageViewer() {
    const context = useContext(ImageViewerContext);
    if (context === undefined) {
        throw new Error("useImageViewer must be used within an ImageViewerProvider");
    }
    return context;
}
