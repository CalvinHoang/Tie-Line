import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

const DISCRETE_INPUT_P95_MS = 50;
const CONTINUOUS_FRAME_P95_MS = 25;

interface InputPerformanceProbe {
  constructionWrites: number;
  storageDelayMilliseconds: number;
  paintLatencies: number[];
  transformTimes: number[];
  wheelEventTimes: number[];
  wheelLatencies: number[];
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
      wheelEventTimes: [],
      wheelLatencies: [],
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
    window.__inputPerformanceProbe.paintLatencies = [];
    window.__inputPerformanceProbe.transformTimes = [];
    window.__inputPerformanceProbe.wheelEventTimes = [];
    window.__inputPerformanceProbe.wheelLatencies = [];
  });
}

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1))]
    ?? Number.POSITIVE_INFINITY;
}

async function armPaintMeasurement(target: Locator) {
  await target.evaluate((element) => {
    element.addEventListener("pointerup", () => {
      const started = performance.now();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__inputPerformanceProbe.paintLatencies.push(performance.now() - started);
      }));
    }, { once: true });
  });
}

async function waitForPaintSample(page: Page, expectedCount: number) {
  await expect.poll(() => page.evaluate(() => window.__inputPerformanceProbe.paintLatencies.length)).toBe(expectedCount);
}

async function reportMetric(testInfo: TestInfo, name: string, values: number[]) {
  const p95 = percentile(values, .95);
  await testInfo.attach(`${name}.json`, {
    body: JSON.stringify({ project: testInfo.project.name, samples: values, p95Milliseconds: p95 }, null, 2),
    contentType: "application/json",
  });
  console.info(`[latency] ${testInfo.project.name} ${name} p95=${p95.toFixed(1)}ms samples=${values.length}`);
  return p95;
}

test("field taps and undo paint within the seamless discrete-input budget", async ({ page }, testInfo) => {
  await startComplexRound(page);
  const board = page.getByRole("application", { name: /phase diagram board/i });
  const undo = page.getByRole("button", { name: "Undo", exact: true });
  const boardBox = await board.boundingBox();
  if (!boardBox) throw new Error("Generated board is unavailable");

  const fieldLatencies: number[] = [];
  const undoLatencies: number[] = [];
  for (let index = 0; index < 20; index += 1) {
    await armPaintMeasurement(board);
    await page.mouse.click(boardBox.x + boardBox.width * .5, boardBox.y + boardBox.height * .4);
    await waitForPaintSample(page, index * 2 + 1);
    fieldLatencies.push(...await page.evaluate(() => window.__inputPerformanceProbe.paintLatencies.slice(-1)));

    await expect(undo).toBeEnabled();
    await armPaintMeasurement(undo);
    await undo.click();
    await waitForPaintSample(page, index * 2 + 2);
    undoLatencies.push(...await page.evaluate(() => window.__inputPerformanceProbe.paintLatencies.slice(-1)));
  }

  expect(await page.evaluate(() => window.__inputPerformanceProbe.constructionWrites),
    "construction persistence must not block an active input burst").toBe(0);
  expect(await reportMetric(testInfo, "field-tap", fieldLatencies)).toBeLessThan(DISCRETE_INPUT_P95_MS);
  expect(await reportMetric(testInfo, "undo", undoLatencies)).toBeLessThan(DISCRETE_INPUT_P95_MS);
});

test("phase selection paints within the seamless discrete-input budget", async ({ page }, testInfo) => {
  await startComplexRound(page);
  const latencies: number[] = [];

  for (let index = 0; index < 10; index += 1) {
    const chooser = page.getByRole("button", { name: /Choose phase/i });
    await armPaintMeasurement(chooser);
    await chooser.click();
    await waitForPaintSample(page, index * 2 + 1);
    latencies.push(...await page.evaluate(() => window.__inputPerformanceProbe.paintLatencies.slice(-1)));

    const nextPhase = page.locator(".phase-option:not(.is-active)").first();
    await armPaintMeasurement(nextPhase);
    await nextPhase.click();
    await waitForPaintSample(page, index * 2 + 2);
    latencies.push(...await page.evaluate(() => window.__inputPerformanceProbe.paintLatencies.slice(-1)));
  }

  expect(await page.evaluate(() => window.__inputPerformanceProbe.constructionWrites)).toBe(0);
  expect(await reportMetric(testInfo, "phase-selection", latencies)).toBeLessThan(DISCRETE_INPUT_P95_MS);
});

test("zoom controls paint within the seamless discrete-input budget", async ({ page }, testInfo) => {
  await startComplexRound(page);
  const latencies: number[] = [];

  for (let index = 0; index < 10; index += 1) {
    const zoomIn = page.getByRole("button", { name: "Zoom in", exact: true });
    await armPaintMeasurement(zoomIn);
    await zoomIn.click();
    await waitForPaintSample(page, index * 2 + 1);
    latencies.push(...await page.evaluate(() => window.__inputPerformanceProbe.paintLatencies.slice(-1)));

    const reset = page.getByRole("button", { name: "Reset view", exact: true });
    await armPaintMeasurement(reset);
    await reset.click();
    await waitForPaintSample(page, index * 2 + 2);
    latencies.push(...await page.evaluate(() => window.__inputPerformanceProbe.paintLatencies.slice(-1)));
  }

  expect(await page.evaluate(() => window.__inputPerformanceProbe.constructionWrites)).toBe(0);
  expect(await reportMetric(testInfo, "zoom-controls", latencies)).toBeLessThan(DISCRETE_INPUT_P95_MS);
});

test("one-pointer pan remains within a 60 fps frame budget", async ({ page }, testInfo) => {
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
  expect(await reportMetric(testInfo, "one-pointer-pan", intervals)).toBeLessThan(CONTINUOUS_FRAME_P95_MS);
});

test("wheel zoom remains within a 60 fps frame budget", async ({ page }, testInfo) => {
  await startComplexRound(page);
  const board = page.getByRole("application", { name: /phase diagram board/i });
  const box = await board.boundingBox();
  if (!box) throw new Error("Generated board is unavailable");
  await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5);
  await page.evaluate(() => {
    const inkPlate = document.querySelector(".ink-plate");
    const board = document.querySelector(".diagram-canvas");
    const probe = window.__inputPerformanceProbe;
    probe.wheelEventTimes = [];
    probe.wheelLatencies = [];
    if (!inkPlate || !board) throw new Error("Diagram viewport is unavailable");
    board.addEventListener("wheel", () => probe.wheelEventTimes.push(performance.now()), { capture: true });
    new MutationObserver(() => {
      const started = probe.wheelEventTimes.at(-1);
      probe.wheelEventTimes = [];
      if (started !== undefined) probe.wheelLatencies.push(performance.now() - started);
    }).observe(inkPlate, { attributes: true, attributeFilter: ["transform"] });
  });

  for (let index = 0; index < 30; index += 1) {
    await page.mouse.wheel(0, -12);
    await page.waitForTimeout(8);
  }
  expect(await page.evaluate(() => window.__inputPerformanceProbe.constructionWrites)).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__inputPerformanceProbe.wheelLatencies.length)).toBeGreaterThan(8);

  const wheelLatencies = await page.evaluate(() => window.__inputPerformanceProbe.wheelLatencies);
  expect(await reportMetric(testInfo, "wheel-zoom", wheelLatencies)).toBeLessThan(CONTINUOUS_FRAME_P95_MS);
});
