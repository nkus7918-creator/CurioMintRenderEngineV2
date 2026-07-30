import type { DocumentaryProps } from "../templates/curiomint-documentary/types";

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


    for (
        let sectionIndex = 0;
        sectionIndex < props.sections.length;
        sectionIndex++
    ) {
        const section = props.sections[sectionIndex];
        
        if (sectionIds.has(section.id)) {
            return {
                valid: false,
                message:
                    `Duplicate section id "${section.id}" at ` +
                    `props.sections[${sectionIndex}]`,
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
                    `Invalid narration URL at props.sections[${sectionIndex}]`,
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
                        `Invalid media URL at props.sections[${sectionIndex}].media[${mediaIndex}]`,
                };
            }

            if (
                media.fallbackUrl &&
                !isValidUrl(media.fallbackUrl)
            ) {
                return {
                    valid: false,
                    message:
                        `Invalid fallback URL at props.sections[${sectionIndex}].media[${mediaIndex}]`,
                };
            }

            if (mediaIds.has(media.id)) {
                return {
                    valid: false,
                    message:
                        `Duplicate media id "${media.id}" at props.sections[${sectionIndex}].media[${mediaIndex}]`,
                };
            }

            mediaIds.add(media.id);
        }
    }

    return {
        valid: true,
    };
};