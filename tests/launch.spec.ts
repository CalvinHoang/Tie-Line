import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("tie-line:labels-1:seed", "123456");
    localStorage.setItem("tie-line:full-1:profile", JSON.stringify({
      version: 1,
      lastDifficulty: "normal",
      onboardingComplete: true,
      settings: { theme: "dark", reducedMotion: false, leftHanded: false },
      history: [],
    }));
  });
  await page.reload();
});

async function startGame(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByRole("application", { name: /phase diagram board/i })).toBeVisible();
}

async function forceGeneratedSeed(page: import("@playwright/test").Page, seed: number) {
  await page.addInitScript((forcedSeed) => {
    const original = window.crypto.getRandomValues.bind(window.crypto);
    Object.defineProperty(window.crypto, "getRandomValues", {
      configurable: true,
      value: <T extends ArrayBufferView | null>(array: T): T => {
        if (array instanceof Uint32Array && array.length === 1) {
          array[0] = forcedSeed;
          return array as T;
        }
        return original(array);
      },
    });
  }, seed);
}

test("opens on a separate centered main menu", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "TIE-LINE" })).toBeVisible();
  for (const name of ["Start", "Rules", "Settings"]) await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Resume", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Practice", exact: true })).toHaveCount(0);
  await expect(page.getByText("Phase equilibrium labelling")).toHaveCount(0);
  await expect(page.getByRole("img", { name: /Tie-Line logo/i })).toHaveCount(0);
  await expect(page.getByRole("application", { name: /phase diagram board/i })).toHaveCount(0);
});

test("only offers Resume after a round has meaningful progress", async ({ page }) => {
  await startGame(page);
  const field = page.locator(".field-target").first();
  const box = await field.boundingBox();
  if (!box) throw new Error("Generated field is unavailable");
  // Liquid is the default active symbol; the Resume test only needs meaningful progress.
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.getByRole("button", { name: "Main menu", exact: true }).click();
  await expect(page.getByRole("button", { name: "Resume", exact: true })).toBeVisible();
});

test("starts directly on the generated labelling board", async ({ page }) => {
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByRole("application", { name: /phase diagram board/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Identify the reaction" })).toHaveCount(0);
  await expect(page.locator(".critical-options")).toHaveCount(0);
});

test("opens a complete generated diagram ready for labels", async ({ page }) => {
  await startGame(page);
  const board = page.getByRole("application", { name: /phase diagram board/i });
  await expect(board).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit labels" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Erase labels" })).toBeVisible();
  expect(await board.locator(".geometry-line").count()).toBeGreaterThan(0);
  expect(await board.locator(".field-target").count()).toBeGreaterThan(1);
  expect(await board.locator(".point-dot").count()).toBeGreaterThan(2);
  await expect(board.locator("line.geometry-hit").first()).toHaveCSS("pointer-events", "none");
  await expect(board.locator(".invariant-line").first().locator("xpath=..").locator(".phase-label")).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
});

test("identifies intermediate compositions on the bottom axis without revealing their phase symbols", async ({ page }) => {
  await forceGeneratedSeed(page, 0);
  await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem("tie-line:full-1:profile") ?? "{}") as { lastDifficulty?: string };
    localStorage.setItem("tie-line:full-1:profile", JSON.stringify({ ...profile, lastDifficulty: "hard" }));
  });
  await page.reload();
  await startGame(page);
  const labels = page.locator(".intermediate-composition-label");
  await expect(labels).toHaveCount(2);
  await expect(page.locator('.intermediate-composition-label[data-composition="gamma"]')).toHaveText("A₂B");
  await expect(page.locator('.intermediate-composition-label[data-composition="delta"]')).toHaveText("AB₂");
  await expect(page.locator(".phase-label")).toHaveCount(0);
});

test("keeps an incongruent compound phase hidden until input while marking AB on the axis", async ({ page }) => {
  await forceGeneratedSeed(page, 1);
  await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem("tie-line:full-1:profile") ?? "{}") as { lastDifficulty?: string };
    localStorage.setItem("tie-line:full-1:profile", JSON.stringify({ ...profile, lastDifficulty: "easy" }));
  });
  await page.reload();
  await startGame(page);
  await expect(page.getByRole("button", { name: "AB intermediate phase", exact: true })).toHaveText(/[γδεζηθκλ]/);
  await expect(page.locator('.intermediate-composition-label[data-composition="gamma"]')).toHaveText("AB");
  await expect(page.locator(".phase-label")).toHaveCount(0);
});

test("embeds a peritectoid below a complete eutectic melting system", async ({ page }) => {
  await forceGeneratedSeed(page, 3);
  await page.reload();
  await startGame(page);
  const board = page.getByRole("application", { name: /phase diagram board/i });
  await expect(page.getByRole("button", { name: "Liquid phase", exact: true })).toContainText("L");
  await expect(page.getByRole("button", { name: "AB intermediate phase", exact: true })).toHaveText(/[γδεζηθκλ]/);
  await expect(board.locator(".invariant-line")).toHaveCount(2);
  await expect(board.locator(".field-target")).toHaveCount(6);
  await expect(board.locator('.intermediate-composition-label[data-composition="gamma"]')).toHaveText("AB");
});

test("lets the player label a generated phase field", async ({ page }) => {
  await startGame(page);
  const board = page.getByRole("application", { name: /phase diagram board/i });
  const field = board.locator(".field-target").first();
  const box = await field.boundingBox();
  if (!box) throw new Error("Generated field is unavailable");
  // Use whichever first inventory phase the generated family activates by default.
  const activePhase = page.getByRole("toolbar", { name: "Phase symbols" }).locator('button[aria-pressed="true"]');
  const activeSymbol = (await activePhase.textContent())?.trim();
  if (!activeSymbol) throw new Error("Active phase symbol is unavailable");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(board.locator(".phase-label")).toHaveCount(1);
  const anchor = board.locator(".phase-label-position").first();
  await expect(anchor).toHaveAttribute("data-fits-field", "true");
  const centreBefore = [await anchor.getAttribute("data-anchor-x"), await anchor.getAttribute("data-anchor-y")];
  await page.getByRole("button", { name: "Beta phase", exact: true }).click();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(anchor).toContainText(`${activeSymbol}+β`);
  expect([await anchor.getAttribute("data-anchor-x"), await anchor.getAttribute("data-anchor-y")]).toEqual(centreBefore);
});

test("toggles the selected phase off with a second direct tap", async ({ page }) => {
  await startGame(page);
  const board = page.getByRole("application", { name: /phase diagram board/i });
  const field = board.locator(".field-target").first();
  const box = await field.boundingBox();
  if (!box) throw new Error("Generated field is unavailable");

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(board.locator(".phase-label")).toHaveCount(1);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(board.locator(".phase-label")).toHaveCount(0);

  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(board.locator(".phase-label")).toHaveCount(1);
});

test("preserves elapsed time when the scored attempt ends", async ({ page }) => {
  await startGame(page);
  await page.waitForTimeout(1100);
  const submit = page.getByRole("button", { name: "Submit labels", exact: true });

  await submit.click();
  await expect(page.getByLabel("2 submissions remaining")).toBeVisible();
  await submit.click();
  await expect(page.getByLabel("1 submissions remaining")).toBeVisible();
  await submit.click();
  await expect(page.getByLabel("Scored attempt ended")).toBeVisible();
  await expect(page.locator("time")).not.toHaveText("00:00");
});

test("keeps primary mobile controls at least 44 pixels", async ({ page }) => {
  await startGame(page);
  if (await page.evaluate(() => window.innerWidth > 420)) return;
  const controls = page.locator("footer button");
  const count = await controls.count();
  for (let index = 0; index < count; index += 1) {
    const box = await controls.nth(index).boundingBox();
    if (!box) throw new Error(`Control ${index} is unavailable`);
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});

test("new generated diagram changes the seed and keeps geometry locked", async ({ page }) => {
  await startGame(page);
  const before = await page.evaluate(() => localStorage.getItem("tie-line:full-1:seed:normal"));
  await page.getByRole("button", { name: "Main menu", exact: true }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  const after = await page.evaluate(() => localStorage.getItem("tie-line:full-1:seed:normal"));
  expect(after).not.toBe(before);
  await expect(page.getByRole("button", { name: "Erase labels" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Point mode" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Curve mode" })).toHaveCount(0);
});

test("switches to a valid generated hard diagram", async ({ page }) => {
  await startGame(page);
  await page.getByRole("button", { name: "Main menu", exact: true }).click();
  await page.getByRole("button", { name: "Next difficulty", exact: true }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  const board = page.getByRole("application", { name: /phase diagram board/i });
  expect(await board.locator(".field-target").count()).toBeGreaterThan(1);
  expect(await page.getByRole("toolbar", { name: "Phase symbols" }).locator("button").count()).toBeGreaterThanOrEqual(3);
});

test("offers complete reference rules without search or practice", async ({ page }) => {
  await page.getByRole("button", { name: "Rules", exact: true }).click();
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Read, classify, then label" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Compatibility triangles" })).toBeVisible();
  await expect(page.getByText(/complete high-temperature edge must belong to one connected single-liquid field/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Processing definitions" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Practice", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Eutectic point", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Eutectic point", exact: true })).toBeVisible();
  await expect(page.getByText("L → α + β", { exact: true })).toBeVisible();
  await expect(page.getByText(/liquid is consumed/i)).toBeVisible();
});
