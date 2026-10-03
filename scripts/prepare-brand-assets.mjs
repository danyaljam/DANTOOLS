import sharp from "sharp";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

async function removeWhiteBackground(
  filePath,
  { crop, neutralMin = 205, neutralSpread = 46 } = {}
) {
  let source = sharp(filePath);
  if (crop) source = source.extract(crop);
  const { data, info } = await source
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let left = info.width;
  let top = info.height;
  let right = 0;
  let bottom = 0;

  for (let offset = 0; offset < data.length; offset += 4) {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const minChannel = Math.min(red, green, blue);
    const maxChannel = Math.max(red, green, blue);
    const whiteness = 765 - red - green - blue;
    let alpha;

    if (minChannel > neutralMin && maxChannel - minChannel < neutralSpread) {
      alpha = 0;
    } else {
      alpha = clamp((whiteness - 25) / 110, 0, 1);
    }

    if (alpha <= 0.025) {
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
      data[offset + 3] = 0;
      continue;
    }

    for (let channel = 0; channel < 3; channel += 1) {
      data[offset + channel] = Math.round(
        clamp((data[offset + channel] - 255 * (1 - alpha)) / alpha, 0, 255)
      );
    }
    data[offset + 3] = Math.round(alpha * 255);

    const x = (offset / 4) % info.width;
    const y = Math.floor(offset / 4 / info.width);
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
  }

  const width = right - left + 1;
  const height = bottom - top + 1;
  const cropped = await sharp(data, { raw: info })
    .extract({ left, top, width, height })
    .extend({ top: 8, bottom: 8, left: 8, right: 8, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return cropped;
}

async function writeSquareIcon(source, size, destination) {
  const resized = await sharp(source)
    .resize({ width: Math.round(size * 0.82), height: Math.round(size * 0.82), fit: "inside" })
    .png()
    .toBuffer({ resolveWithObject: true });
  const left = Math.floor((size - resized.info.width) / 2);
  const top = Math.floor((size - resized.info.height) / 2);

  await sharp(resized.data)
    .extend({
      top,
      bottom: size - resized.info.height - top,
      left,
      right: size - resized.info.width - left,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(destination);
}

const wordmark = await removeWhiteBackground("public/banner.png");
const appMark = await removeWhiteBackground("public/logo.png", {
  crop: { left: 28, top: 34, width: 260, height: 220 },
  neutralMin: 140,
  neutralSpread: 80,
});

await sharp(wordmark).png().toFile("public/brand-logo.png");
await writeSquareIcon(appMark, 64, "public/favicon.png");
await writeSquareIcon(appMark, 180, "public/apple-touch-icon.png");
await writeSquareIcon(appMark, 192, "public/icon-192.png");
await writeSquareIcon(appMark, 512, "public/icon-512.png");