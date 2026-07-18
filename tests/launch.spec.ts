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
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
});

test("lets the player label a generated phase field", async ({ page }) => {
  await startGame(page);
  const board = page.getByRole("application", { name: /phase diagram board/i });
  const field = board.locator(".field-target").first();
  const box = await field.boundingBox();
  if (!box) throw new Error("Generated field is unavailable");
  await page.getByRole("toolbar", { name: "Phase symbols" }).locator("button").first().click();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(board.locator(".phase-label")).toHaveCount(1);
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

test("switches to a genuinely more complex hard diagram", async ({ page }) => {
  await startGame(page);
  await page.getByRole("button", { name: "Main menu", exact: true }).click();
  await page.getByRole("button", { name: "Next difficulty", exact: true }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  const board = page.getByRole("application", { name: /phase diagram board/i });
  expect(await board.locator(".field-target").count()).toBeGreaterThan(6);
  expect(await board.locator(".invariant-line").count()).toBeGreaterThanOrEqual(2);
  expect(await page.getByRole("toolbar", { name: "Phase symbols" }).locator("button").count()).toBeGreaterThanOrEqual(4);
});

test("offers complete reference rules without search or practice", async ({ page }) => {
  await page.getByRole("button", { name: "Rules", exact: true }).click();
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Read, classify, then label" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Compatibility triangles" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Processing definitions" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Practice", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Eutectic point", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Eutectic point", exact: true })).toBeVisible();
  await expect(page.getByText("L → α + β", { exact: true })).toBeVisible();
  await expect(page.getByText(/liquid is consumed/i)).toBeVisible();
});
