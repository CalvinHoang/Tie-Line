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

async function openPhaseSelector(page: import("@playwright/test").Page) {
  const chooser = page.getByRole("button", { name: /Choose phase/i });
  if (await chooser.getAttribute("aria-expanded") !== "true") await chooser.click();
  return page.getByRole("toolbar", { name: "Phase symbols" });
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
  await expect(page.getByRole("button", { name: "Clear all labels" })).toBeVisible();
  expect(await board.locator(".geometry-line").count()).toBeGreaterThan(0);
  await expect(board.locator(".geometry-line:not(.is-stability-guide)").first()).toHaveCSS("stroke-dasharray", "none");
  expect(await board.locator(".field-target").count()).toBeGreaterThan(1);
  expect(await board.locator(".point-dot").count()).toBeGreaterThan(2);
  await expect(board.locator(".geometry-hit").first()).toHaveCSS("pointer-events", "none");
  await expect(board.locator(".invariant-line").first().locator("xpath=..").locator(".phase-label")).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
});

test("zooms with controls and pans with a one-pointer drag without placing a label", async ({ page }) => {
  await startGame(page);
  const board = page.getByRole("application", { name: /phase diagram board/i });
  const ink = board.locator(".ink-plate");
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(ink).toHaveAttribute("transform", /scale\(1\.35\)/);
  const beforePan = await ink.getAttribute("transform");
  const box = await board.boundingBox();
  if (!box) throw new Error("Generated board is unavailable");

  await page.mouse.move(box.x + box.width * .55, box.y + box.height * .5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .35, box.y + box.height * .5, { steps: 6 });
  await page.mouse.up();

  expect(await ink.getAttribute("transform")).not.toBe(beforePan);
  await expect(board.locator(".phase-label")).toHaveCount(0);
  await page.getByRole("button", { name: "Reset view" }).click();
  await expect(ink).toHaveAttribute("transform", "translate(0 0) scale(1)");

  const zoomIn = page.getByRole("button", { name: "Zoom in" });
  for (let step = 0; step < 10 && await zoomIn.isEnabled(); step += 1) await zoomIn.click();
  await expect(page.getByRole("button", { name: "Reset view" })).toHaveText("600%");
  await expect(zoomIn).toBeDisabled();
});

test("links intermediate compositions to their phase symbols on the bottom axis", async ({ page }) => {
  await forceGeneratedSeed(page, 0);
  await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem("tie-line:full-1:profile") ?? "{}") as { lastDifficulty?: string };
    localStorage.setItem("tie-line:full-1:profile", JSON.stringify({ ...profile, lastDifficulty: "hard" }));
  });
  await page.reload();
  await startGame(page);
  const labels = page.locator(".intermediate-composition-label");
  expect(await labels.count()).toBeGreaterThanOrEqual(5);
  expect(await labels.count()).toBeLessThanOrEqual(8);
  const formulaLabels = await labels.allTextContents();
  expect(new Set(formulaLabels).size).toBe(formulaLabels.length);
  expect(formulaLabels.every((label) => label.includes("A") && label.includes("B"))).toBe(true);
  expect(await page.locator(".intermediate-phase-symbol").count()).toBeGreaterThanOrEqual(await labels.count());
  await expect(page.locator(".axis-t")).toHaveCount(0);
  await expect(page.locator(".phase-label")).toHaveCount(0);
});

test("shows an incongruent compound association at AB without filling diagram fields", async ({ page }) => {
  await forceGeneratedSeed(page, 1);
  await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem("tie-line:full-1:profile") ?? "{}") as { lastDifficulty?: string };
    localStorage.setItem("tie-line:full-1:profile", JSON.stringify({ ...profile, lastDifficulty: "easy" }));
  });
  await page.reload();
  await startGame(page);
  await openPhaseSelector(page);
  await expect(page.locator(".phase-grid .phase-gamma .phase-option-symbol")).toHaveText(/[γδεζηθκλ]/);
  await expect(page.locator('.intermediate-composition-label[data-composition="gamma"]')).toHaveText("AB");
  await expect(page.locator('.composition-phase-association[data-composition="gamma"] .intermediate-phase-symbol')).toHaveCount(1);
  await expect(page.locator(".phase-label")).toHaveCount(0);
});

test("embeds a peritectoid below a complete eutectic melting system", async ({ page }) => {
  await forceGeneratedSeed(page, 3);
  await page.reload();
  await startGame(page);
  await openPhaseSelector(page);
  const board = page.getByRole("application", { name: /phase diagram board/i });
  await expect(page.locator(".phase-grid .phase-L .phase-option-symbol")).toHaveText("L");
  await expect(page.locator(".phase-grid .phase-gamma .phase-option-symbol")).toHaveText(/[γδεζηθκλ]/);
  await expect(board.locator(".invariant-line")).toHaveCount(2);
  await expect(board.locator(".field-target")).toHaveCount(6);
  await expect(board.locator('.intermediate-composition-label[data-composition="gamma"]')).toHaveText("AB");
});

test("composes a syntectic liquid-immiscibility kernel into a large Hard system", async ({ page }) => {
  await forceGeneratedSeed(page, 7);
  await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem("tie-line:full-1:profile") ?? "{}") as { lastDifficulty?: string };
    localStorage.setItem("tie-line:full-1:profile", JSON.stringify({ ...profile, lastDifficulty: "hard" }));
  });
  await page.reload();
  await startGame(page);
  await openPhaseSelector(page);
  const board = page.getByRole("application", { name: /phase diagram board/i });
  expect(await board.locator(".field-target").count()).toBeGreaterThanOrEqual(16);
  expect(await board.locator(".invariant-line").count()).toBeGreaterThanOrEqual(6);
  await expect(page.getByRole("button", { name: "Liquid 1 phase", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Liquid 2 phase", exact: true })).toBeVisible();
});

test("uses reaction-role liquid notation for a monotectic", async ({ page }) => {
  await forceGeneratedSeed(page, 5);
  await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem("tie-line:full-1:profile") ?? "{}") as { lastDifficulty?: string };
    localStorage.setItem("tie-line:full-1:profile", JSON.stringify({ ...profile, lastDifficulty: "hard" }));
  });
  await page.reload();
  await startGame(page);
  await openPhaseSelector(page);
  await expect(page.getByRole("button", { name: "Homogeneous liquid phase", exact: true }).locator(".phase-option-symbol")).toHaveText("L");
  await expect(page.getByRole("button", { name: "Parent liquid phase", exact: true }).locator(".phase-option-symbol")).toHaveText("L₁");
  const liquidSymbols = await page.getByRole("toolbar", { name: "Phase symbols" }).locator(".phase-option-symbol").allTextContents();
  expect(liquidSymbols).toEqual(expect.arrayContaining(["L", "L₁", "L₂"]));
  expect(await page.getByRole("application", { name: /phase diagram board/i }).locator(".invariant-line").count())
    .toBeGreaterThanOrEqual(2);
});

test("separates global alpha fields from monotectoid branch notation", async ({ page }) => {
  await forceGeneratedSeed(page, 6);
  await page.reload();
  await startGame(page);
  await openPhaseSelector(page);
  const symbols = await page.getByRole("toolbar", { name: "Phase symbols" }).locator(".phase-option-symbol").allTextContents();
  expect(symbols).toEqual(expect.arrayContaining(["L", "α", "α₁", "α₂", "β"]));
  expect(symbols.filter((symbol) => symbol === "α")).toHaveLength(1);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByRole("button", { name: "Submit labels" }).click();
  }
  await page.getByRole("button", { name: "Reveal", exact: true }).click();
  const revealed = await page.locator(".phase-label text:not(.phase-plus)").allTextContents();
  expect(revealed).toEqual(expect.arrayContaining(["α₁", "α₂", "β"]));
});

test("shows finite terminal solid-solution fields for limited solubility", async ({ page }) => {
  await forceGeneratedSeed(page, 2);
  await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem("tie-line:full-1:profile") ?? "{}") as { lastDifficulty?: string };
    localStorage.setItem("tie-line:full-1:profile", JSON.stringify({ ...profile, lastDifficulty: "easy" }));
  });
  await page.reload();
  await startGame(page);
  await openPhaseSelector(page);
  const board = page.getByRole("application", { name: /phase diagram board/i });
  await expect(board.locator(".field-target")).toHaveCount(6);
  await expect(board.locator(".field-texture.texture-partial-solubility")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "A-rich terminal solid solution phase", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "B-rich terminal solid solution phase", exact: true })).toBeVisible();
});

for (const [name, seed, fields, invariants] of [
  ["eutectoid decomposition", 2, 7, 2],
  ["catatectic decomposition", 4, 11, 4],
  ["monotectoid decomposition", 6, 7, 2],
] as const) {
  test(`renders composed ${name} in Normal`, async ({ page }) => {
    await forceGeneratedSeed(page, seed);
  await page.reload();
  await startGame(page);
    await openPhaseSelector(page);
    const board = page.getByRole("application", { name: /phase diagram board/i });
    await expect(board.locator(".field-target")).toHaveCount(fields);
    await expect(board.locator(".invariant-line")).toHaveCount(invariants);
    expect(await page.locator(".intermediate-composition-label").count()).toBeGreaterThanOrEqual(1);
  });
}

test("uses conventional temperature notation for an unanchored complete-solution polymorph", async ({ page }) => {
  await forceGeneratedSeed(page, 11);
  await page.reload();
  await startGame(page);
  await openPhaseSelector(page);
  const symbols = await page.getByRole("toolbar", { name: "Phase symbols" }).locator(".phase-option-symbol").allTextContents();
  expect(symbols).toEqual(expect.arrayContaining(["α", "β"]));
});

test("derives coupled-system symbols from A-side, intermediate, and B-side composition roles", async ({ page }) => {
  await forceGeneratedSeed(page, 12);
  await page.reload();
  await startGame(page);
  await openPhaseSelector(page);
  await expect(page.getByRole("button", { name: "A-rich phase", exact: true }).locator(".phase-option-symbol")).toHaveText("α");
  await expect(page.getByRole("button", { name: "Intermediate solid solution phase", exact: true }).locator(".phase-option-symbol")).toHaveText("γ");
  await expect(page.getByRole("button", { name: "B-rich phase", exact: true }).locator(".phase-option-symbol")).toHaveText("β");
  await expect(page.getByRole("toolbar", { name: "Phase symbols" })).not.toContainText("γ′");
});

test("lets the player label a generated phase field", async ({ page }) => {
  await startGame(page);
  const board = page.getByRole("application", { name: /phase diagram board/i });
  const field = board.locator(".field-target").first();
  const box = await field.boundingBox();
  if (!box) throw new Error("Generated field is unavailable");
  // Use whichever first inventory phase the generated family activates by default.
  const phaseToolbar = await openPhaseSelector(page);
  const activePhase = phaseToolbar.locator('button[aria-pressed="true"]');
  const activeSymbol = (await activePhase.locator(".phase-option-symbol").textContent())?.trim();
  if (!activeSymbol) throw new Error("Active phase symbol is unavailable");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(board.locator(".phase-label")).toHaveCount(1);
  const anchor = board.locator(".phase-label-position").first();
  await expect(anchor).toHaveAttribute("data-fits-field", "true");
  const centreBefore = [await anchor.getAttribute("data-anchor-x"), await anchor.getAttribute("data-anchor-y")];
  const availablePhases = phaseToolbar.locator('button:not([aria-pressed="true"])');
  expect(await availablePhases.count()).toBeGreaterThan(0);
  const addedPhase = availablePhases.first();
  const addedSymbol = (await addedPhase.locator(".phase-option-symbol").textContent())?.trim();
  if (!addedSymbol) throw new Error("Additional phase symbol is unavailable");
  await addedPhase.click();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(anchor).toContainText(`${activeSymbol}+${addedSymbol}`);
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
  const outcome = page.getByRole("dialog", { name: "Choose what happens next" });
  await expect(outcome).toBeVisible();
  for (const name of ["Continue", "Reveal", "New", "Menu"]) {
    await expect(outcome.getByRole("button", { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Submit labels" })).toHaveCount(0);
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
    expect(Math.round(box.width)).toBeGreaterThanOrEqual(44);
    expect(Math.round(box.height)).toBeGreaterThanOrEqual(44);
  }
});

test("new generated diagram changes the seed and keeps geometry locked", async ({ page }) => {
  await startGame(page);
  const before = await page.evaluate(() => localStorage.getItem("tie-line:full-1:seed:normal"));
  await page.getByRole("button", { name: "Main menu", exact: true }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  const after = await page.evaluate(() => localStorage.getItem("tie-line:full-1:seed:normal"));
  expect(after).not.toBe(before);
  await expect(page.getByRole("button", { name: "Clear all labels" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Point mode" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Curve mode" })).toHaveCount(0);
});

test("switches to a valid generated hard diagram", async ({ page }) => {
  await startGame(page);
  const normalFieldCount = await page.locator(".field-target").count();
  await page.getByRole("button", { name: "Main menu", exact: true }).click();
  await page.getByRole("button", { name: "Next difficulty", exact: true }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  const board = page.getByRole("application", { name: /phase diagram board/i });
  expect(normalFieldCount).toBeGreaterThan(0);
  expect(await board.locator(".field-target").count()).toBeGreaterThanOrEqual(12);
  expect(await board.locator(".invariant-line").count()).toBeGreaterThanOrEqual(3);
  // Finite-width intermediate solid solutions are phase choices, not fixed-composition axis sites.
  const palette = await openPhaseSelector(page);
  expect(await palette.getByRole("button").count()).toBeGreaterThanOrEqual(5);
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
