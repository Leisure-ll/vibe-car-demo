import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const chromePath =
  process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = fileURLToPath(new URL("../verification/", import.meta.url));
const targetUrl = process.env.DEMO_URL ?? "http://localhost:5173";

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
});

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await page.goto(targetUrl, { waitUntil: "networkidle" });
    await page.waitForSelector("canvas", { state: "attached" });
    await page.waitForTimeout(1200);

    const screenshotPath = join(outputDir, `${viewport.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const canvasStats = await page.evaluate(() => {
      const canvas = document.querySelector("canvas");

      if (!(canvas instanceof HTMLCanvasElement)) {
        return { ok: false, reason: "canvas not found" };
      }

      const sampleCanvas = document.createElement("canvas");
      const width = Math.min(canvas.width, 220);
      const height = Math.min(canvas.height, 160);
      sampleCanvas.width = width;
      sampleCanvas.height = height;

      const context = sampleCanvas.getContext("2d");

      if (!context) {
        return { ok: false, reason: "2d context unavailable" };
      }

      context.drawImage(canvas, 0, 0, width, height);
      const pixels = context.getImageData(0, 0, width, height).data;
      let coloredSamples = 0;
      const colors = new Set();

      for (let index = 0; index < pixels.length; index += 4 * 19) {
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        const alpha = pixels[index + 3];
        const colorKey = `${red}-${green}-${blue}-${alpha}`;
        colors.add(colorKey);

        if (alpha > 0 && red + green + blue > 24) {
          coloredSamples += 1;
        }
      }

      return {
        ok: coloredSamples > 25 && colors.size > 8,
        width: canvas.width,
        height: canvas.height,
        coloredSamples,
        uniqueColors: colors.size,
      };
    });

    if (!canvasStats.ok) {
      throw new Error(`${viewport.name} canvas verification failed: ${JSON.stringify(canvasStats)}`);
    }

    await page.getByRole("button", { name: "打开全部" }).click();
    await page.waitForTimeout(500);

    const bodyText = await page.locator("body").innerText();

    if (!bodyText.includes("4/4 车窗打开")) {
      throw new Error(`${viewport.name} click control verification failed`);
    }

    console.log(
      `${viewport.name}: screenshot=${screenshotPath}, canvas=${JSON.stringify(canvasStats)}`,
    );

    await page.close();
  }
} finally {
  await browser.close();
}
