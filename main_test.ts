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

Deno.test("convertThemeToFigmaVariables - radius conversion", async () => {
  const testInput = `
@theme {
  --radius-xs: 0.125rem;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-3xl: 1.5rem;
  --radius-4xl: 2rem;
}
`;

  const inputPath = await Deno.makeTempFile({ suffix: ".css" });
  const outputPath = await Deno.makeTempFile({ suffix: ".json" });

  try {
    await Deno.writeTextFile(inputPath, testInput);
    await convertThemeToFigmaVariables(inputPath, outputPath);

    const output = JSON.parse(await Deno.readTextFile(outputPath));

    // Verify radius structure
    assertEquals(typeof output.Radius, "object");

    // Test specific values
    assertEquals(output.Radius["radius-xs"].$type, "number");
    assertEquals(output.Radius["radius-xs"].$value, 2); // 0.125rem * 16 = 2px

    assertEquals(output.Radius["radius-sm"].$type, "number");
    assertEquals(output.Radius["radius-sm"].$value, 4); // 0.25rem * 16 = 4px

    assertEquals(output.Radius["radius-md"].$type, "number");
    assertEquals(output.Radius["radius-md"].$value, 6); // 0.375rem * 16 = 6px

    assertEquals(output.Radius["radius-lg"].$type, "number");
    assertEquals(output.Radius["radius-lg"].$value, 8); // 0.5rem * 16 = 8px

    assertEquals(output.Radius["radius-xl"].$type, "number");
    assertEquals(output.Radius["radius-xl"].$value, 12); // 0.75rem * 16 = 12px

    assertEquals(output.Radius["radius-2xl"].$type, "number");
    assertEquals(output.Radius["radius-2xl"].$value, 16); // 1rem * 16 = 16px

    assertEquals(output.Radius["radius-3xl"].$type, "number");
    assertEquals(output.Radius["radius-3xl"].$value, 24); // 1.5rem * 16 = 24px

    assertEquals(output.Radius["radius-4xl"].$type, "number");
    assertEquals(output.Radius["radius-4xl"].$value, 32); // 2rem * 16 = 32px
  } finally {
    await Deno.remove(inputPath);
    await Deno.remove(outputPath);
  }
});

Deno.test("convertThemeToFigmaVariables - shadow conversion", async () => {
  const testInput = `
@theme {
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --inset-shadow-xs: inset 0 1px 1px rgb(0 0 0 / 0.05);
  --drop-shadow-xs: 0 1px 1px rgb(0 0 0 / 0.05);
  --text-shadow-xs: 0px 1px 1px rgb(0 0 0 / 0.2);
}
`;

  const inputPath = await Deno.makeTempFile({ suffix: ".css" });
  const outputPath = await Deno.makeTempFile({ suffix: ".json" });

  try {
    await Deno.writeTextFile(inputPath, testInput);
    await convertThemeToFigmaVariables(inputPath, outputPath);

    const output = JSON.parse(await Deno.readTextFile(outputPath));

    // Verify shadow structure
    assertEquals(typeof output.Shadow, "object");

    // Test shadow values
    assertEquals(output.Shadow["shadow-xs"].$type, "string");
    assertEquals(
      output.Shadow["shadow-xs"].$value,
      "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    );

    assertEquals(output.Shadow["shadow-sm"].$type, "string");
    assertEquals(
      output.Shadow["shadow-sm"].$value,
      "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    );

    // Test inset-shadow
    assertEquals(output.Shadow["inset-shadow-xs"].$type, "string");
    assertEquals(
      output.Shadow["inset-shadow-xs"].$value,
      "inset 0 1px 1px rgb(0 0 0 / 0.05)",
    );

    // Test drop-shadow
    assertEquals(output.Shadow["drop-shadow-xs"].$type, "string");
    assertEquals(
      output.Shadow["drop-shadow-xs"].$value,
      "0 1px 1px rgb(0 0 0 / 0.05)",
    );

    // Test text-shadow
    assertEquals(output.Shadow["text-shadow-xs"].$type, "string");
    assertEquals(
      output.Shadow["text-shadow-xs"].$value,
      "0px 1px 1px rgb(0 0 0 / 0.2)",
    );
  } finally {
    await Deno.remove(inputPath);
    await Deno.remove(outputPath);
  }
});
