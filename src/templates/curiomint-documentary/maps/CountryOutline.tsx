import type {
  CSSProperties,
} from "react";

import {
  Img,
  staticFile,
} from "remotion";

import {
  resolveCountryMapAsset,
} from "./countryMapManifest.generated";

type CountryOutlineProps = {
  code: string;
  style?: CSSProperties;
  alt?: string;
};

export const CountryOutline = ({
  code,
  style,
  alt,
}: CountryOutlineProps) => {
  const asset =
    resolveCountryMapAsset(
      code,
    );

  if (!asset) {
    return null;
  }

  return (
    <Img
      src={staticFile(
        asset.file,
      )}
      alt={
        alt ??
        `${asset.name} map outline`
      }
      style={{
        objectFit: "contain",
        ...style,
      }}
    />
  );
};