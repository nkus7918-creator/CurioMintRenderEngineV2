import type { RenderRequest } from "../types/render";

import { normalizeDocumentarySections } from "../templates/curiomint-documentary/normalizeDocumentarySections";

export type ValidationResult =
    | {
          valid: true;
      }
    | {
          valid: false;
          message: string;
      };

export const validateRenderRequest = (
    body: RenderRequest,
): ValidationResult => {
    if (!body.templateId?.trim()) {
        return {
            valid: false,
            message: "templateId is required",
        };
    }

    if (!body.props) {
        return {
            valid: false,
            message: "props is required",
        };
    }

    if (!body.props.title?.trim()) {
        return {
            valid: false,
            message: "props.title is required",
        };
    }

    if (body.templateId === "curiomint-documentary") {
       
        const hasSections =
            Array.isArray(body.props.sections) &&
            body.props.sections.length > 0;

        const hasChapters =
            Array.isArray(body.props.chapters) &&
            body.props.chapters.length > 0;

        if (!hasSections && !hasChapters) {
            return {
                valid: false,
                message:
                    "Documentary must include at least one section or one chapter",
            };
        }

        if (hasChapters) {
            for (
                let chapterIndex = 0;
                chapterIndex < body.props.chapters!.length;
                chapterIndex++
            ) {
                const chapter =
                    body.props.chapters![chapterIndex];

                if (!chapter.id?.trim()) {
                    return {
                        valid: false,
                        message:
                            `props.chapters[${chapterIndex}].id is required`,
                    };
                }

                if (!chapter.title?.trim()) {
                    return {
                        valid: false,
                        message:
                            `props.chapters[${chapterIndex}].title is required`,
                    };
                }

                if (
                    !Array.isArray(chapter.sections) ||
                    chapter.sections.length === 0
                ) {
                    return {
                        valid: false,
                        message:
                            `props.chapters[${chapterIndex}].sections must contain at least one section`,
                    };
                }
            }
        }

        const sections = normalizeDocumentarySections({
            chapters: body.props.chapters,
            sections: body.props.sections,
        });

        for (
            let sectionIndex = 0;
            sectionIndex < sections.length;
            sectionIndex++
        ) {
            const section = sections[sectionIndex];

            if (!section.id?.trim()) {
                return {
                    valid: false,
                    message:
                        `documentary section at index ${sectionIndex}.id is required`,
                };
            }

            if (!section.title?.trim()) {
                return {
                    valid: false,
                    message:
                        `documentary section at index ${sectionIndex}.title is required`,
                };
            }

            if (
                !Number.isFinite(
                    section.durationInSeconds,
                ) ||
                section.durationInSeconds <= 0
            ) {
                return {
                    valid: false,
                    message:
                        `documentary section at index ${sectionIndex}.durationInSeconds must be greater than 0`,
                };
            }

            if (
                !Array.isArray(section.media) ||
                section.media.length === 0
            ) {
                return {
                    valid: false,
                    message:
                        `documentary section at index ${sectionIndex}.media must contain at least one item`,
                };
            }

            for (
                let mediaIndex = 0;
                mediaIndex < section.media.length;
                mediaIndex++
            ) {
                const media =
                    section.media[mediaIndex];

                if (!media.id?.trim()) {
                    return {
                        valid: false,
                        message:
                            `documentary section at index ${sectionIndex}, media index ${mediaIndex}.id is required`,
                    };
                }

                if (
                    media.type !== "image" &&
                    media.type !== "video"
                ) {
                    return {
                        valid: false,
                        message:
                            `documentary section at index ${sectionIndex}, media index ${mediaIndex}.type must be image or video`,
                    };
                }

                if (!media.url?.trim()) {
                    return {
                        valid: false,
                        message:
                            `documentary section at index ${sectionIndex}, media index ${mediaIndex}.url is required`,
                    };
                }

                if (
                    media.durationInSeconds !== undefined &&
                    (
                        !Number.isFinite(
                            media.durationInSeconds,
                        ) ||
                        media.durationInSeconds <= 0
                    )
                ) {
                    return {
                        valid: false,
                        message:
                            `documentary section at index ${sectionIndex}, media index ${mediaIndex}.durationInSeconds must be greater than 0`,
                    };
                }

                if (
                    media.startFromSeconds !== undefined &&
                    (
                        !Number.isFinite(
                            media.startFromSeconds,
                        ) ||
                        media.startFromSeconds < 0
                    )
                ) {
                    return {
                        valid: false,
                        message:
                            `documentary section at index ${sectionIndex}, media index ${mediaIndex}.startFromSeconds cannot be negative`,
                    };
                }
            }
        }
    }

    return {
        valid: true,
    };
};