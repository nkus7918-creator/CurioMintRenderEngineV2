import { template as curiomintScenes } from "../templates/curiomint-scenes/template";
import { template as curiomintDocumentary } from "../templates/curiomint-documentary/template";
import { TemplateDefinition } from "../types/template";
import { template as thumbnailTemplate } from "../templates/thumbnail/template";

const templates = new Map<string, TemplateDefinition>([
  [curiomintScenes.id, curiomintScenes],
  [curiomintDocumentary.id, curiomintDocumentary],
  [thumbnailTemplate.id, thumbnailTemplate],
]);

export function templateExists(templateId: string) {
  return templates.has(templateId);
}

export function getTemplate(templateId: string) {
  return templates.get(templateId);
}
