export type ValidationResult =
  | {
      valid: true;
    }
  | {
      valid: false;
      message: string;
    };

export const validationSuccess =
  (): ValidationResult => ({
    valid: true,
  });

export const validationFailure = (
  message: string,
): ValidationResult => ({
  valid: false,
  message,
});