"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
    ClassicEditor,
    Essentials,
    Paragraph,
    Heading,
    Bold,
    Italic,
    Link,
    List,
    Indent,
    IndentBlock,
    BlockQuote,
    Table,
    TableToolbar,
    Alignment,
    Autoformat,
    PasteFromOffice,
    TextTransformation,
    GeneralHtmlSupport,
    Image,
    ImageCaption,
    ImageStyle,
    ImageToolbar,
} from "ckeditor5";
import type { EditorConfig, GeneralHtmlSupportConfig } from "ckeditor5";
// The old `@ckeditor/ckeditor5-build-classic` bundle inlined its stylesheet;
// the single `ckeditor5` package ships it separately. These are `.ck-*` rules —
// dashboard chrome only, nothing the storefront ever loads.
import "ckeditor5/ckeditor5.css";

// R31: migrated off the deprecated per-feature v41 distribution (it dragged in
// 59 nested duplicate trees, 2.6 GB, and a 14-minute `npm ci`).
//
// The plugin list must be explicit here, and it is load-bearing: v47 has no
// prebuilt bundle, and CKEditor filters content **on load** — markup no loaded
// plugin claims is dropped from the model, so opening a document and saving it
// rewrites it through this list. Nothing logs that.
//
// Two entries look unnecessary and are not. Both were verified by running v41
// and candidate v47 configs over the same corpus and diffing getData():
//
//  - `Image*` — there is no image button in the toolbar, but without these a
//    stored `<figure class="image"><img><figcaption>` came back as
//    `<p>caption text</p>`: the image silently deleted on the next save.
//  - `GeneralHtmlSupport`, scoped to exactly three entries — it preserves the
//    `<u>`, `<s>` and coloured `<span>` that v41 was *destroying* on every save
//    (all three are permitted by the backend's own allow-list). It must stay
//    narrow: a permissive `attributes/classes/styles: true` also preserved Word
//    paste cruft (`class="MsoNormal"`, `font-family:Calibri`), and product
//    descriptions get no backend sanitisation — the storefront's DOMPurify
//    passes classes and inline styles straight through, so a Word paste would
//    override the site's own typography.
//
// `figure`/`img`/`figcaption` need no GHS entry (the `Image*` plugins claim them)
// and neither does `p[text-align]` (`Alignment` does).
//
// Known, accepted difference: v47's List adds `data-list-item-id` to every
// `<li>`. It cannot be turned off (`list.multiBlock: false` was tested). The
// backend allow-list strips it on the blog path; on the product path DOMPurify
// keeps it, where it is inert.
//
// This list was derived from the *toolbar*, not from the old bundle's plugin
// set — so four of build-classic's plugins are deliberately not here:
// `MediaEmbed`, `ImageUpload`, `CKFinder`, `CloudServices`. Dropping them is
// safe because their output never reached a customer: `<oembed>` is not in the
// backend's blog allow-list and is not standard HTML, so it was already being
// stripped on both the blog and product paths, and no upload adapter was ever
// configured, so the image-upload plugins could not upload anything. The one
// behaviour change is that pasting a bare video URL now yields a plain link
// instead of an embed. Do not "restore" these without re-running the round trip.
const EDITOR_PLUGINS = [
    Essentials,
    Paragraph,
    Heading,
    Bold,
    Italic,
    Link,
    List,
    Indent,
    IndentBlock,
    BlockQuote,
    Table,
    TableToolbar,
    Alignment,
    Autoformat,
    PasteFromOffice,
    TextTransformation,
    GeneralHtmlSupport,
    Image,
    ImageCaption,
    ImageStyle,
    ImageToolbar,
];

/*
 * `htmlSupport` is contributed to `EditorConfig` by a module augmentation inside
 * `@ckeditor/ckeditor5-html-support`, which declares `module
 * '@ckeditor/ckeditor5-core'`. npm hoists html-support to the top level here but
 * nests ckeditor5-core under `ckeditor5/node_modules/`, so that specifier
 * resolves to a path that does not exist — the augmentation lands on a different
 * module identity than the `EditorConfig` this file uses, and the key reads as
 * unknown. Intersecting the type states the same contract explicitly and does
 * not depend on how npm happens to hoist the tree.
 */
const EDITOR_CONFIG: EditorConfig & { htmlSupport?: GeneralHtmlSupportConfig } = {
    // Mandatory since CKEditor 5 v44. 'GPL' is the free option and the licence
    // already in force — v41 was the same dual GPL/commercial licence, it just
    // did not demand the key.
    licenseKey: "GPL",
    plugins: EDITOR_PLUGINS,
    toolbar: [
        "heading",
        "|",
        "bold",
        "italic",
        "link",
        "|",
        "bulletedList",
        "numberedList",
        "indent",
        "outdent",
        "|",
        "blockQuote",
        "insertTable",
        "|",
        "undo",
        "redo",
    ],
    htmlSupport: {
        allow: [
            { name: "u" },
            { name: "s" },
            { name: "span", styles: ["color", "background-color"] },
        ],
    },
    placeholder: "Enter your content here...",
};

interface CKEditorWrapperProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export default function CKEditorWrapper({
    value,
    onChange,
    disabled = false,
}: CKEditorWrapperProps) {
    return (
        <CKEditor
            editor={ClassicEditor}
            data={value}
            disabled={disabled}
            onChange={(_event: unknown, editor: ClassicEditor) => {
                const data = editor.getData();
                onChange(data);
            }}
            config={EDITOR_CONFIG}
        />
    );
}
