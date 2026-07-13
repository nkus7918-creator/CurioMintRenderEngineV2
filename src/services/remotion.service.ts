import { env } from "../config/env";
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
  props: Record<string, unknown>,
  onProgress?: (progress: number) => void
) {
  try {
    console.log("📦 Bundling project...");
    console.log("Entry:", path.resolve("./src/remotion/index.ts"));

    onProgress?.(10);

    const bundleLocation = await bundle({
      entryPoint: path.resolve("./src/remotion/index.ts"),
    });

    console.log("Bundle location:", bundleLocation);
    console.log("✅ Bundle completed");

    onProgress?.(25);

    console.log("🎬 Selecting composition...");

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: template.compositionId,
      inputProps: props,
    });

    onProgress?.(35);

    console.log("🎥 Rendering video...");

    const output = path.join(env.outputDir, `${jobId}.mp4`);
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: output,
      inputProps: props,

      onProgress: ({ progress }) => {
        // Remotion 0–1 verir.
        // Biz render aşamasını %35–99 arasına yayıyoruz.
        const percentage = Math.min(
          99,
          Math.round(35 + progress * 64)
        );

        onProgress?.(percentage);
      },
    });

    onProgress?.(100);

    console.log("🎉 Video rendered!");

    return output;
  } catch (error) {
    console.error("========== REMOTION ERROR ==========");
    console.error(error);
    throw error;
  }
}