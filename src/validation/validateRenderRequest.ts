import type { RenderRequest } from "../types/render";

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
        if (
            !Number.isFinite(body.props.durationInSeconds) ||
            body.props.durationInSeconds <= 0
        ) {
            return {
                valid: false,
                message:
                    "props.durationInSeconds must be greater than 0",
            };
        }

        if (
            !Array.isArray(body.props.sections) ||
            body.props.sections.length === 0
        ) {
            return {
                valid: false,
                message:
                    "props.sections must contain at least one section",
            };
        }

        for (
            let sectionIndex = 0;
            sectionIndex < body.props.sections.length;
            sectionIndex++
        ) {
            const section =
                body.props.sections[sectionIndex];

            if (!section.id?.trim()) {
                return {
                    valid: false,
                    message:
                        `props.sections[${sectionIndex}].id is required`,
                };
            }

            if (!section.title?.trim()) {
                return {
                    valid: false,
                    message:
                        `props.sections[${sectionIndex}].title is required`,
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
                        `props.sections[${sectionIndex}].durationInSeconds must be greater than 0`,
                };
            }

            if (
                !Array.isArray(section.media) ||
                section.media.length === 0
            ) {
                return {
                    valid: false,
                    message:
                        `props.sections[${sectionIndex}].media must contain at least one item`,
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
                            `props.sections[${sectionIndex}].media[${mediaIndex}].id is required`,
                    };
                }

                if (
                    media.type !== "image" &&
                    media.type !== "video"
                ) {
                    return {
                        valid: false,
                        message:
                            `props.sections[${sectionIndex}].media[${mediaIndex}].type must be image or video`,
                    };
                }

                if (!media.url?.trim()) {
                    return {
                        valid: false,
                        message:
                            `props.sections[${sectionIndex}].media[${mediaIndex}].url is required`,
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
                            `props.sections[${sectionIndex}].media[${mediaIndex}].durationInSeconds must be greater than 0`,
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
                            `props.sections[${sectionIndex}].media[${mediaIndex}].startFromSeconds cannot be negative`,
                    };
                }
            }
        }
    }

    return {
        valid: true,
    };
};