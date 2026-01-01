import { assertEquals } from "@std/assert";
import { convertThemeToFigmaVariables } from "./main.ts";

Deno.test("convertThemeToFigmaVariables - basic conversion", async () => {
  const testInput = `
@theme {
  --color-blue-500: #3b82f6;
  --color-red-500: #ef4444;
}
`;

  // Create temporary test files
  const inputPath = await Deno.makeTempFile({ suffix: ".css" });
  const outputPath = await Deno.makeTempFile({ suffix: ".json" });

  try {
    // Write test input
    await Deno.writeTextFile(inputPath, testInput);

    // Run conversion
    await convertThemeToFigmaVariables(inputPath, outputPath);

    // Read and parse output
    const output = JSON.parse(await Deno.readTextFile(outputPath));

    // Verify structure
    assertEquals(typeof output.Color, "object");
    assertEquals(output.Color["color-blue-500"].$type, "color");
    assertEquals(output.Color["color-blue-500"].$value.hex, "#3b82f6");
    assertEquals(output.Color["color-blue-500"].$value.colorSpace, "srgb");
    assertEquals(output.Color["color-blue-500"].$value.components.length, 3);

    assertEquals(output.Color["color-red-500"].$type, "color");
    assertEquals(output.Color["color-red-500"].$value.hex, "#ef4444");
  } finally {
    // Cleanup
    await Deno.remove(inputPath);
    await Deno.remove(outputPath);
  }
});

Deno.test("convertThemeToFigmaVariables - oklch conversion", async () => {
  const testInput = `
@theme {
  --color-blue-500: oklch(62.3% 0.214 259.815);
}
`;

  const inputPath = await Deno.makeTempFile({ suffix: ".css" });
  const outputPath = await Deno.makeTempFile({ suffix: ".json" });

  try {
    await Deno.writeTextFile(inputPath, testInput);
    await convertThemeToFigmaVariables(inputPath, outputPath);

    const output = JSON.parse(await Deno.readTextFile(outputPath));

    // Should have converted oklch to hex
    assertEquals(output.Color["color-blue-500"].$type, "color");
    assertEquals(typeof output.Color["color-blue-500"].$value.hex, "string");
    assertEquals(
      output.Color["color-blue-500"].$value.hex.startsWith("#"),
      true,
    );
    assertEquals(output.Color["color-blue-500"].$value.components.length, 3);

    // Components should be in 0-1 range
    for (const component of output.Color["color-blue-500"].$value.components) {
      assertEquals(component >= 0 && component <= 1, true);
    }
  } finally {
    await Deno.remove(inputPath);
    await Deno.remove(outputPath);
  }
});

Deno.test("convertThemeToFigmaVariables - spacing conversion", async () => {
  const testInput = `
@theme {
  --spacing: 0.25rem;
}
`;

  const inputPath = await Deno.makeTempFile({ suffix: ".css" });
  const outputPath = await Deno.makeTempFile({ suffix: ".json" });

  try {
    await Deno.writeTextFile(inputPath, testInput);
    await convertThemeToFigmaVariables(inputPath, outputPath);

    const output = JSON.parse(await Deno.readTextFile(outputPath));

    // Verify spacing structure
    assertEquals(typeof output.Spacing, "object");

    // Test specific values
    assertEquals(output.Spacing["spacing-0"].$type, "number");
    assertEquals(output.Spacing["spacing-0"].$value, 0);

    assertEquals(output.Spacing["spacing-px"].$type, "number");
    assertEquals(output.Spacing["spacing-px"].$value, 1);

    assertEquals(output.Spacing["spacing-0.5"].$type, "number");
    assertEquals(output.Spacing["spacing-0.5"].$value, 2); // 0.5 * 0.25rem * 16 = 2px

    assertEquals(output.Spacing["spacing-1"].$type, "number");
    assertEquals(output.Spacing["spacing-1"].$value, 4); // 1 * 0.25rem * 16 = 4px

    assertEquals(output.Spacing["spacing-2"].$type, "number");
    assertEquals(output.Spacing["spacing-2"].$value, 8); // 2 * 0.25rem * 16 = 8px

    assertEquals(output.Spacing["spacing-4"].$type, "number");
    assertEquals(output.Spacing["spacing-4"].$value, 16); // 4 * 0.25rem * 16 = 16px

    assertEquals(output.Spacing["spacing-8"].$type, "number");
    assertEquals(output.Spacing["spacing-8"].$value, 32); // 8 * 0.25rem * 16 = 32px

    assertEquals(output.Spacing["spacing-96"].$type, "number");
    assertEquals(output.Spacing["spacing-96"].$value, 384); // 96 * 0.25rem * 16 = 384px
  } finally {
    await Deno.remove(inputPath);
    await Deno.remove(outputPath);
  }
});

Deno.test("convertThemeToFigmaVariables - spacing with custom base", async () => {
  const testInput = `
@theme {
  --spacing: 0.5rem;
}
`;

  const inputPath = await Deno.makeTempFile({ suffix: ".css" });
  const outputPath = await Deno.makeTempFile({ suffix: ".json" });

  try {
    await Deno.writeTextFile(inputPath, testInput);
    await convertThemeToFigmaVariables(inputPath, outputPath);

    const output = JSON.parse(await Deno.readTextFile(outputPath));

    // With 0.5rem base: 1 * 0.5rem * 16 = 8px
    assertEquals(output.Spacing["spacing-1"].$value, 8);

    // With 0.5rem base: 4 * 0.5rem * 16 = 32px
    assertEquals(output.Spacing["spacing-4"].$value, 32);

    // px is always 1
    assertEquals(output.Spacing["spacing-px"].$value, 1);
  } finally {
    await Deno.remove(inputPath);
    await Deno.remove(outputPath);
  }
});
