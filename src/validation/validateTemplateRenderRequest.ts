import {
    getTemplate,
  } from "../services/template.service";
  
  import type {
    RenderRequest,
  } from "../types/render";
  
  import {
    validateRenderRequest,
  } from "./validateRenderRequest";
  
  export type TemplateRequestValidationResult =
    | {
        valid: true;
        request: RenderRequest;
      }
    | {
        valid: false;
        message: string;
      };
  
  export const validateTemplateRenderRequest =
    (
      body: unknown,
    ): TemplateRequestValidationResult => {
      const requestValidation =
        validateRenderRequest(body);
  
      if (!requestValidation.valid) {
        return requestValidation;
      }
  
      const request =
        requestValidation.request;
  
      const template =
        getTemplate(
          request.templateId,
        );
  
      if (!template) {
        return {
          valid: false,
          message:
            `Unsupported templateId: "${request.templateId}"`,
        };
      }
  
      if (
        !template
          .supportedSchemaVersions
          .includes(
            request.schemaVersion,
          )
      ) {
        return {
          valid: false,
          message:
            `Template "${template.id}" does not support schemaVersion "${request.schemaVersion}". Supported versions: ${template.supportedSchemaVersions.join(
              ", ",
            )}`,
        };
      }
  
      const propsValidation =
        template.validateProps(
          request.props,
        );
  
      if (!propsValidation.valid) {
        return propsValidation;
      }
  
      return {
        valid: true,
        request,
      };
    };