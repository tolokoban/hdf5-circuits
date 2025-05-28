/**
 * This script will read any `*.png` file in the `gfx/images/` folder (and subfolders)
 * and copy it into `src/generated` miroring the folders structure.
 * If the destination already exists or has the same update time, then the file is skipped.
 *
 * Otherwise, for each image `image.png`, the script will create:
 * - 'image.avif`
 * - `image.medium.png`; used inline in a page
 * - `image.medium.avif`; used inline in a page
 * - `image.small.png`: used as vignette
 * - `image.small.avif`: used as vignette
 */

import Sharp from "sharp";
import Path from "node:path";
import FS from "node:fs";

import {
  copyIfNewer,
  getProjectRoot,
  listDir,
  replaceExtension,
} from "./utils/fs.mjs";

const SIZES = {
  medium: 640,
  small: 320,
};

/**
 * Remove the source root folder (gfx/images).
 * @param {string} filename
 * @returns {string}
 */
function getShortName(filename) {
  return filename.substring(`${getProjectRoot()}/src/gfx/`.length);
}

/**
 * Returns a size that will fit in a square of `limit`x`limit`.
 * @param {number} width
 * @param {number} height
 * @param {number|[number,number]} limit
 * @returns {[number, number]}
 */
function resize(width, height, limit) {
  if (Array.isArray(limit)) return limit;

  const max = Math.max(width, height);
  if (max < limit) return [width, height];

  const scale = limit / max;
  return [Math.round(scale * width), Math.round(scale * height)];
}

function cap(text) {
  if (text.trim().length === 0) return "";

  return `${text.charAt(0).toUpperCase()}${text.substring(1)}`;
}

async function start() {
  const images = await listDir(
      "src/gfx",
      (name) =>
          name.endsWith(".png") ||
          name.endsWith(".jpg") ||
          name.endsWith(".webp")
  )
  const maxLength = images.reduce(
    (prv, cur) => Math.max(prv, getShortName(cur).length),
    0,
  );
  console.log("Optimizable images:", images.length);
  for (const srcFile of images) {
    const name = getShortName(srcFile);
    const dstFile = Path.resolve(getProjectRoot(), "src/generated", name);
    let { width, height } = await Sharp(srcFile).metadata();
    width = width ?? 0;
    height = height ?? 0;
    const imageIsOutOfDate = await copyIfNewer(srcFile, dstFile);
    if (imageIsOutOfDate) {
      console.log(
        name,
        `${" ".repeat(maxLength - name.length)}(`,
        width,
        "x",
        height,
        ")",
      );
      if (!dstFile.endsWith(".png")) {
        // We need a PNG file.
        await Sharp(srcFile).png().toFile(replaceExtension(dstFile, ".png"));
      }
      await resizeAndConvert(dstFile, width, height);
      await generateResponsiveImage(dstFile, width, height);
    }
  }
}

async function generateResponsiveImage(dstFile, width, height) {
  const buffer = await Sharp(dstFile)
    .resize({
      width: 1,
      height: 1,
    })
    .raw()
    .toBuffer();
  const arr = Array.from(new Uint8Array(buffer.buffer));
  const color = `#${arr
    .map((item) => item.toString(16))
    .map((item) => (item.length > 1 ? item : `0${item}`))
    .join("")}`;
  let base = Path.basename(dstFile);
  base = base.substring(0, base.length - Path.extname(base).length);
  FS.writeFileSync(
    replaceExtension(dstFile, ".tsx"),
    [
      `import ResponsiveImage, { ResponsiveImageCoreProps } from "@/components/ResponsiveImage"`,
      ...["", "medium", "small"].map((suffix) =>
        ["png", "avif"]
          .map(
            (ext) =>
              `import Image${cap(suffix)}${cap(
                ext,
              )} from "./${concat(base, suffix, ext)}"`,
          )
          .join("\n"),
      ),
      "",
      "export default function Image(props: ResponsiveImageCoreProps) {",
      "  return <ResponsiveImage",
      `    color="${color}"`,
      `    size={[${width}, ${height}]}`,
      "    { ...props }",
      ...["", "Medium", "Small"].map((suffix) =>
        ["png", "avif"]
          .map((ext) => `    ${ext}${suffix}={Image${suffix}${cap(ext)}}`)
          .join("\n"),
      ),
      "  />",
      "}",
    ].join("\n"),
  );
}

async function resizeAndConvert(dstFile, width, height) {
  console.log("    Optimizing image...");
  await Sharp(dstFile)
    .avif({
      quality: 50,
    })
    .toFile(replaceExtension(dstFile, "avif"));
  for (const suffix of Object.keys(SIZES)) {
    const limit = SIZES[suffix];
    const [w, h] = resize(width, height, limit);
    const suffixedFilename = replaceExtension(dstFile, `.${suffix}.png`);
    await Sharp(dstFile)
      .resize({
        width: w,
        height: h,
      })
      .toFile(suffixedFilename);
    await Sharp(dstFile)
      .resize({
        width: w,
        height: h,
      })
      .avif({
        quality: 50,
      })
      .toFile(replaceExtension(suffixedFilename, "avif"));
  }
}

function concat(...parts) {
  return parts
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .join(".");
}

start();
