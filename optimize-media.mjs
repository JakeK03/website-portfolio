#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";

const ROOT = process.cwd();
const PHOTO_ROOT = path.join(ROOT, "photos");
const OUTPUT_ROOT = path.join(PHOTO_ROOT, "web");

const IMAGE_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp", ".avif"
]);

const VIDEO_EXTENSIONS = new Set([
  ".mp4", ".mov", ".m4v", ".avi", ".mkv", ".webm"
]);

const IMAGE_WIDTHS = [640, 1280, 2000];
const WEBP_QUALITY = 82;
const BLUR_WIDTH = 32;
const BLUR_QUALITY = 35;

// Videos: web-friendly 1080p H.264, with fast-start metadata.
const VIDEO_MAX_WIDTH = 1920;
const VIDEO_CRF = 22;
const VIDEO_PRESET = "medium";

function prettyBytes(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }

  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);

    // Never re-process generated files.
    if (absolute === OUTPUT_ROOT || absolute.startsWith(OUTPUT_ROOT + path.sep)) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...await walk(absolute));
    } else {
      files.push(absolute);
    }
  }

  return files;
}

function outputBase(input) {
  const relative = path.relative(PHOTO_ROOT, input);
  const parsed = path.parse(relative);
  return path.join(OUTPUT_ROOT, parsed.dir, parsed.name);
}

async function optimizeImage(input) {
  const base = outputBase(input);
  await fs.mkdir(path.dirname(base), { recursive: true });

  const inputStat = await fs.stat(input);
  const originalSize = inputStat.size;

  const metadata = await sharp(input, { failOn: "none", limitInputPixels: false }).metadata();
  const sourceWidth = metadata.width || 2000;

  const outputs = [];

  for (const requestedWidth of IMAGE_WIDTHS) {
    const width = Math.min(requestedWidth, sourceWidth);
    const out = `${base}-${requestedWidth}.webp`;

    await sharp(input, { failOn: "none", limitInputPixels: false })
      .rotate()
      .resize({
        width,
        withoutEnlargement: true,
        fit: "inside"
      })
      .webp({
        quality: WEBP_QUALITY,
        effort: 5,
        smartSubsample: true
      })
      .toFile(out);

    outputs.push(out);
  }

  const blurOut = `${base}-blur.webp`;

  await sharp(input, { failOn: "none", limitInputPixels: false })
    .rotate()
    .resize({
      width: Math.min(BLUR_WIDTH, sourceWidth),
      withoutEnlargement: true
    })
    .blur(1.2)
    .webp({
      quality: BLUR_QUALITY,
      effort: 4
    })
    .toFile(blurOut);

  const mainStat = await fs.stat(`${base}-1280.webp`);

  console.log(
    `IMAGE  ${path.relative(ROOT, input)}\n` +
    `       ${prettyBytes(originalSize)} -> ${prettyBytes(mainStat.size)} (1280w)`
  );
}

async function getFfmpegCommand() {
  if (ffmpegPath) {
    try {
      await fs.access(ffmpegPath);
      return ffmpegPath;
    } catch {
      // Bundled ffmpeg-static path is missing; try system ffmpeg instead.
    }
  }

  return "ffmpeg";
}

async function runFfmpeg(args) {
  const command = await getFfmpegCommand();

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "ignore", "inherit"]
    });

    child.on("error", (error) => {
      if (error.code === "ENOENT") {
        reject(
          new Error(
            'FFmpeg was not found. Install it with "brew install ffmpeg", then run the optimizer again.'
          )
        );
      } else {
        reject(error);
      }
    });

    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}

async function optimizeVideo(input) {
  const base = outputBase(input);
  await fs.mkdir(path.dirname(base), { recursive: true });

  const output = `${base}-web.mp4`;
  const poster = `${base}-poster.webp`;

  const inputStat = await fs.stat(input);

  await runFfmpeg([
    "-y",
    "-i", input,
    "-vf", `scale='min(${VIDEO_MAX_WIDTH},iw)':-2`,
    "-c:v", "libx264",
    "-preset", VIDEO_PRESET,
    "-crf", String(VIDEO_CRF),
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "-c:a", "aac",
    "-b:a", "128k",
    output
  ]);

  // Grab a lightweight poster near the beginning.
  await runFfmpeg([
    "-y",
    "-ss", "00:00:01",
    "-i", input,
    "-frames:v", "1",
    "-vf", "scale='min(1280,iw)':-2",
    poster
  ]);

  const outputStat = await fs.stat(output);

  console.log(
    `VIDEO  ${path.relative(ROOT, input)}\n` +
    `       ${prettyBytes(inputStat.size)} -> ${prettyBytes(outputStat.size)}`
  );
}

async function main() {
  if (!(await exists(PHOTO_ROOT))) {
    throw new Error(`Could not find: ${PHOTO_ROOT}`);
  }

  const files = await walk(PHOTO_ROOT);

  const images = files.filter((file) =>
    IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase())
  );

  const videos = files.filter((file) =>
    VIDEO_EXTENSIONS.has(path.extname(file).toLowerCase())
  );

  console.log(`Found ${images.length} images and ${videos.length} videos.`);
  console.log(`Output: ${path.relative(ROOT, OUTPUT_ROOT)}/\n`);

  let failed = 0;

  for (const image of images) {
    try {
      await optimizeImage(image);
    } catch (error) {
      failed++;
      console.error(`FAILED image ${path.relative(ROOT, image)}:`, error.message);
    }
  }

  for (const video of videos) {
    try {
      await optimizeVideo(video);
    } catch (error) {
      failed++;
      console.error(`FAILED video ${path.relative(ROOT, video)}:`, error.message);
    }
  }

  console.log(`\nFinished. ${failed ? `${failed} file(s) failed.` : "No failures."}`);
  console.log("Your original files were not changed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
