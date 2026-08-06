export type ThumbnailThemeId =
  | "documentary"
  | "entertainment";

export type ThumbnailProps = {
  title: string;
  subtitle?: string;

  backgroundImageUrl: string;

  theme: ThumbnailThemeId;

  brandName?: string;
  showBrand?: boolean;

  accentColor?: string;

  backgroundPosition?: string;

  darkenBackground?: number;

  titleAlignment?:
    | "left"
    | "center"
    | "right";
};