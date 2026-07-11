import { template as curiomintScenes } from "../templates/curiomint-scenes/template";
import { TemplateDefinition } from "../types/template";

const templates = new Map<string, TemplateDefinition>([
  [curiomintScenes.id, curiomintScenes],
]);

export function templateExists(templateId: string) {
  return templates.has(templateId);
}

export function getTemplate(templateId: string) {
  return templates.get(templateId);
}