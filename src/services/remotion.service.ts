import path from "path";
import { bundle } from "@remotion/bundler";
import {
  renderMedia,
  selectComposition,
} from "@remotion/renderer";

import { TemplateDefinition } from "../types/template";

export async function renderVideo(
  jobId: string,
  template: TemplateDefinition,
  props: Record<string, unknown>
){
  console.log("📦 Bundling project...");

  const bundleLocation = await bundle({
    entryPoint: path.resolve("./src/remotion/index.ts"),
  });

  console.log("✅ Bundle completed");

  console.log("🎬 Selecting composition...");

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: template.compositionId,
    inputProps: props,
  });

  console.log("🎥 Rendering video...");

  const output = path.resolve("./outputs", `${jobId}.mp4`);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: output,
    inputProps: props,
  });

  console.log("🎉 Video rendered!");

  return output;
}