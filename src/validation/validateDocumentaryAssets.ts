import type { DocumentaryProps } from "../templates/curiomint-documentary/types";

import { normalizeDocumentarySections } from "../templates/curiomint-documentary/normalizeDocumentarySections";

const isValidUrl = (url: string) =>
    url.startsWith("http://") ||
    url.startsWith("https://");

export type AssetValidationResult =
    | {
        valid: true;
    }
    | {
        valid: false;
        message: string;
    };

export const validateDocumentaryAssets = (
    props: DocumentaryProps,
): AssetValidationResult => {
    const mediaIds = new Set<string>();
    const sectionIds = new Set<string>();

    const sections = normalizeDocumentarySections({
        chapters: props.chapters,
        sections: props.sections,
    });

    for (
        let sectionIndex = 0;
        sectionIndex < sections.length;
        sectionIndex++
    ) {
        const section = sections[sectionIndex];

        if (sectionIds.has(section.id)) {
            return {
                valid: false,
                message:
                    `Duplicate section id "${section.id}" at ` +
                    `documentary section index ${sectionIndex}`,
            };
        }

        sectionIds.add(section.id);

        if (
            section.narrationUrl &&
            !isValidUrl(section.narrationUrl)
        ) {
            return {
                valid: false,
                message:
                    `Invalid narration URL at documentary section index ${sectionIndex}`,
            };
        }

        for (
            let mediaIndex = 0;
            mediaIndex < section.media.length;
            mediaIndex++
        ) {
            const media = section.media[mediaIndex];

            if (!isValidUrl(media.url)) {
                return {
                    valid: false,
                    message:
                        `Invalid media URL at documentary section index ${sectionIndex}, media index ${mediaIndex}`,
                };
            }

            if (
                media.fallbackUrl &&
                !isValidUrl(media.fallbackUrl)
            ) {
                return {
                    valid: false,
                    message:
                        `Invalid fallback URL at documentary section index ${sectionIndex}, media index ${mediaIndex}`,
                };
            }

            if (mediaIds.has(media.id)) {
                return {
                    valid: false,
                    message:
                        `Duplicate media id "${media.id}" at documentary section index ${sectionIndex}, media index ${mediaIndex}`,
                };
            }

            mediaIds.add(media.id);
        }
    }

    return {
        valid: true,
    };
};