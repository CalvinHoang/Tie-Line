import { expect, test, type Page } from "@playwright/test";

interface InputPerformanceProbe {
  constructionWrites: number;
  storageDelayMilliseconds: number;
  paintLatencies: number[];
  transformTimes: number[];
}

declare global {
  interface Window {
    __inputPerformanceProbe: InputPerformanceProbe;
  }
}

async function startComplexRound(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("tie-line:full-1:seed:hard", "0");
    localStorage.setItem("tie-line:full-1:profile", JSON.stringify({
      version: 1,
      lastDifficulty: "hard",
      onboardingComplete: true,
      settings: { theme: "light", reducedMotion: true, leftHanded: false },
      history: [],
    }));
  });
  await page.addInitScript(() => {
    const originalSetItem = Storage.prototype.setItem;
    window.__inputPerformanceProbe = {
      constructionWrites: 0,
      storageDelayMilliseconds: 0,
      paintLatencies: [],
      transformTimes: [],
    };
    Storage.prototype.setItem = function setItem(key: string, value: string) {
      if (key.includes(":construction:")) {
        window.__inputPerformanceProbe.constructionWrites += 1;
        const end = performance.now() + window.__inputPerformanceProbe.storageDelayMilliseconds;
        while (performance.now() < end) {
          // Model slower synchronous flash storage on a mobile device.
        }
      }
      return originalSetItem.call(this, key, value);
    };
  });
  await page.reload();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByRole("application", { name: /phase diagram board/i })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__inputPerformanceProbe.constructionWrites)).toBeGreaterThan(0);
  await page.evaluate(() => {
    window.__inputPerformanceProbe.constructionWrites = 0;
    window.__inputPerformanceProbe.storageDelayMilliseconds = 80;
  });
}

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] ?? Number.POSITIVE_INFINITY;
}

test("field inputs paint before deferred persistence work", async ({ page }) => {
  await startComplexRound(page);
  const board = page.getByRole("application", { name: /phase diagram board/i });
  const boardBox = await board.boundingBox();
  if (!boardBox) throw new Error("Generated board is unavailable");

  for (let index = 0; index < 6; index += 1) {
    await board.evaluate((element) => {
      element.addEventListener("pointerup", () => {
        const started = performance.now();
        requestAnimationFrame(() => requestAnimationFrame(() => {
          window.__inputPerformanceProbe.paintLatencies.push(performance.now() - started);
        }));
      }, { once: true });
    });
    await page.mouse.click(boardBox.x + boardBox.width * .5, boardBox.y + boardBox.height * .4);
    await expect.poll(() => page.evaluate(() => window.__inputPerformanceProbe.paintLatencies.length)).toBe(index + 1);
  }

  const result = await page.evaluate(() => ({
    latencies: window.__inputPerformanceProbe.paintLatencies,
    writes: window.__inputPerformanceProbe.constructionWrites,
  }));
  expect(result.writes, "construction persistence must not block an active input burst").toBe(0);
  expect(percentile(result.latencies, .95), "95th-percentile input-to-paint latency").toBeLessThan(70);
});

test("one-pointer pan updates the viewport without per-frame persistence", async ({ page }) => {
  await startComplexRound(page);
  const board = page.getByRole("application", { name: /phase diagram board/i });
  const ink = board.locator(".ink-plate");
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(ink).toHaveAttribute("transform", /scale\(1\.35\)/);
  await expect.poll(() => page.evaluate(() => window.__inputPerformanceProbe.constructionWrites)).toBeGreaterThan(0);
  await page.evaluate(() => {
    const inkPlate = document.querySelector(".ink-plate");
    window.__inputPerformanceProbe.constructionWrites = 0;
    window.__inputPerformanceProbe.storageDelayMilliseconds = 80;
    window.__inputPerformanceProbe.transformTimes = [];
    if (!inkPlate) throw new Error("Ink plate is unavailable");
    new MutationObserver(() => window.__inputPerformanceProbe.transformTimes.push(performance.now()))
      .observe(inkPlate, { attributes: true, attributeFilter: ["transform"] });
  });

  const box = await board.boundingBox();
  if (!box) throw new Error("Generated board is unavailable");
  await page.mouse.move(box.x + box.width * .65, box.y + box.height * .5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .25, box.y + box.height * .5, { steps: 30 });

  expect(await page.evaluate(() => window.__inputPerformanceProbe.constructionWrites),
    "drag frames must stay out of React persistence").toBe(0);
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.__inputPerformanceProbe.transformTimes.length)).toBeGreaterThan(3);

  const transformTimes = await page.evaluate(() => window.__inputPerformanceProbe.transformTimes);
  const intervals = transformTimes.slice(1).map((time, index) => time - transformTimes[index]);
  expect(percentile(intervals, .95), "95th-percentile viewport update interval").toBeLessThan(70);
});
