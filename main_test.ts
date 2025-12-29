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
    assertEquals(typeof output.color, "object");
    assertEquals(output.color["blue-500"].$type, "color");
    assertEquals(output.color["blue-500"].$value.hex, "#3b82f6");
    assertEquals(output.color["blue-500"].$value.colorSpace, "srgb");
    assertEquals(output.color["blue-500"].$value.components.length, 3);

    assertEquals(output.color["red-500"].$type, "color");
    assertEquals(output.color["red-500"].$value.hex, "#ef4444");
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
    assertEquals(output.color["blue-500"].$type, "color");
    assertEquals(typeof output.color["blue-500"].$value.hex, "string");
    assertEquals(output.color["blue-500"].$value.hex.startsWith("#"), true);
    assertEquals(output.color["blue-500"].$value.components.length, 3);

    // Components should be in 0-1 range
    for (const component of output.color["blue-500"].$value.components) {
      assertEquals(component >= 0 && component <= 1, true);
    }
  } finally {
    await Deno.remove(inputPath);
    await Deno.remove(outputPath);
  }
});
