import { formatHex, parse } from "culori";

/**
 * Color token value in W3C Design Tokens Format
 */
interface ColorValue {
  colorSpace: "srgb";
  components: [number, number, number];
  hex: string;
}

/**
 * Design token in W3C Design Tokens Format
 */
interface ColorToken {
  $type: "color";
  $value: ColorValue;
}

/**
 * Spacing token in W3C Design Tokens Format
 */
interface SpacingToken {
  $type: "number";
  $value: number;
}

/**
 * Design tokens output format
 */
interface DesignTokens {
  Color: Record<string, ColorToken>;
  Spacing: Record<string, SpacingToken>;
}

/**
 * Convert oklch color to hex format
 */
function oklchToHex(oklchString: string): string | null {
  try {
    const color = parse(oklchString);
    if (!color) return null;

    // Use formatHex to convert to hex
    return formatHex(color);
  } catch {
    return null;
  }
}

/**
 * Convert hex color to sRGB components array (0-1 range)
 */
function hexToComponents(hex: string): [number, number, number] {
  // Expand shorthand hex (#fff -> #ffffff)
  let expandedHex = hex;
  if (hex.length === 4) {
    expandedHex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }

  const r = parseInt(expandedHex.slice(1, 3), 16) / 255;
  const g = parseInt(expandedHex.slice(3, 5), 16) / 255;
  const b = parseInt(expandedHex.slice(5, 7), 16) / 255;

  // Round to 3 decimal places
  return [
    Math.round(r * 1000) / 1000,
    Math.round(g * 1000) / 1000,
    Math.round(b * 1000) / 1000,
  ];
}

/**
 * Parse CSS file and extract color variables
 */
function parseColorVariables(cssContent: string): Map<string, string> {
  const colorMap = new Map<string, string>();
  const colorRegex = /--color-([a-z0-9-]+):\s*([^;]+);/g;

  let match;
  while ((match = colorRegex.exec(cssContent)) !== null) {
    const name = match[1];
    const value = match[2].trim();
    colorMap.set(name, value);
  }

  return colorMap;
}

/**
 * Spacing scale multipliers used in Tailwind CSS
 */
const SPACING_MULTIPLIERS = [
  0,
  0.5,
  1,
  1.5,
  2,
  2.5,
  3,
  3.5,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  14,
  16,
  20,
  24,
  28,
  32,
  36,
  40,
  44,
  48,
  52,
  56,
  60,
  64,
  72,
  80,
  96,
];

/**
 * Parse rem value to number (in rem units)
 */
function parseRemValue(value: string): number | null {
  const match = value.match(/^([\d.]+)rem$/);
  if (!match) return null;
  return parseFloat(match[1]);
}

/**
 * Convert rem to px (1rem = 16px)
 */
function remToPx(rem: number): number {
  return rem * 16;
}

/**
 * Parse CSS file and extract spacing base value
 */
function parseSpacingBase(cssContent: string): number | null {
  const spacingRegex = /--spacing:\s*([^;]+);/;
  const match = cssContent.match(spacingRegex);

  if (!match) return null;

  const value = match[1].trim();
  return parseRemValue(value);
}

/**
 * Generate spacing tokens from base value
 */
function generateSpacingTokens(baseRem: number): Record<string, SpacingToken> {
  const tokens: Record<string, SpacingToken> = {};

  // Generate tokens for each multiplier
  for (const multiplier of SPACING_MULTIPLIERS) {
    const key = `spacing-${
      Number.isInteger(multiplier) ? String(multiplier) : String(multiplier)
    }`;
    const remValue = baseRem * multiplier;
    const pxValue = remToPx(remValue);

    tokens[key] = {
      $type: "number",
      $value: pxValue,
    };
  }

  // Special case: "spacing-px" is always 1px
  tokens["spacing-px"] = {
    $type: "number",
    $value: 1,
  };

  return tokens;
}

/**
 * Convert Tailwind CSS theme to Figma variables format
 */
export async function convertThemeToFigmaVariables(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  // Read input CSS file
  const cssContent = await Deno.readTextFile(inputPath);

  // Parse color variables
  const colorVariables = parseColorVariables(cssContent);

  // Convert to design tokens format
  const tokens: DesignTokens = { Color: {}, Spacing: {} };

  for (const [name, value] of colorVariables) {
    let hex: string | null = null;

    // Check if the value is already in hex format
    if (value.startsWith("#")) {
      hex = value;
    } else if (value.startsWith("oklch(")) {
      // Convert oklch to hex
      hex = oklchToHex(value);
    }

    if (!hex) {
      console.warn(`Could not convert color: ${name} = ${value}`);
      continue;
    }

    const components = hexToComponents(hex);

    tokens.Color[`color-${name}`] = {
      $type: "color",
      $value: {
        colorSpace: "srgb",
        components,
        hex,
      },
    };
  }

  // Parse and generate spacing tokens
  const spacingBase = parseSpacingBase(cssContent);
  if (spacingBase !== null) {
    tokens.Spacing = generateSpacingTokens(spacingBase);
    console.log(`Generated spacing tokens with base ${spacingBase}rem`);
  } else {
    console.warn("No --spacing variable found in CSS");
  }

  // Write output JSON file
  await Deno.writeTextFile(
    outputPath,
    JSON.stringify(tokens, null, 2),
  );

  console.log(`Converted ${colorVariables.size} colors to ${outputPath}`);
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const inputPath = "input.css";
  const outputPath = "output.json";

  try {
    await convertThemeToFigmaVariables(inputPath, outputPath);
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error),
    );
    Deno.exit(1);
  }
}
