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
 * Radius token in W3C Design Tokens Format
 */
interface RadiusToken {
  $type: "number";
  $value: number;
}

/**
 * Shadow token in W3C Design Tokens Format
 */
interface ShadowToken {
  $type: "string";
  $value: string;
}

/**
 * Container token in W3C Design Tokens Format
 */
interface ContainerToken {
  $type: "number";
  $value: number;
}

/**
 * Breakpoint token in W3C Design Tokens Format
 */
interface BreakpointToken {
  $type: "number";
  $value: number;
}

/**
 * Text token in W3C Design Tokens Format
 */
interface TextToken {
  $type: "number";
  $value: number;
}

/**
 * Font Weight token in W3C Design Tokens Format
 */
interface FontWeightToken {
  $type: "number";
  $value: number;
}

/**
 * Tracking token in W3C Design Tokens Format
 */
interface TrackingToken {
  $type: "string";
  $value: string;
}

/**
 * Leading token in W3C Design Tokens Format
 */
interface LeadingToken {
  $type: "number";
  $value: number;
}

/**
 * Design tokens output format
 */
interface DesignTokens {
  Color: Record<string, ColorToken>;
  Spacing: Record<string, SpacingToken>;
  Radius: Record<string, RadiusToken>;
  Shadow: Record<string, ShadowToken>;
  Container: Record<string, ContainerToken>;
  Breakpoint: Record<string, BreakpointToken>;
  Text: Record<string, TextToken>;
  "Font Weight": Record<string, FontWeightToken>;
  Tracking: Record<string, TrackingToken>;
  Leading: Record<string, LeadingToken>;
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
 * Parse CSS file and extract radius variables
 */
function parseRadiusVariables(cssContent: string): Map<string, string> {
  const radiusMap = new Map<string, string>();
  const radiusRegex = /--radius-([a-z0-9]+):\s*([^;]+);/g;

  let match;
  while ((match = radiusRegex.exec(cssContent)) !== null) {
    const name = match[1];
    const value = match[2].trim();
    radiusMap.set(name, value);
  }

  return radiusMap;
}

/**
 * Generate radius tokens from radius variables
 */
function generateRadiusTokens(
  radiusVariables: Map<string, string>,
): Record<string, RadiusToken> {
  const tokens: Record<string, RadiusToken> = {};

  for (const [name, value] of radiusVariables) {
    const remValue = parseRemValue(value);
    if (remValue === null) {
      console.warn(`Could not parse radius value: ${name} = ${value}`);
      continue;
    }

    const pxValue = remToPx(remValue);

    tokens[`radius-${name}`] = {
      $type: "number",
      $value: pxValue,
    };
  }

  return tokens;
}

/**
 * Parse CSS file and extract shadow variables
 */
function parseShadowVariables(cssContent: string): Map<string, string> {
  const shadowMap = new Map<string, string>();
  // Match shadow, inset-shadow, drop-shadow, text-shadow
  const shadowRegex =
    /--((?:inset-)?shadow|(?:drop|text)-shadow)-([a-z0-9]+):\s*([^;]+);/g;

  let match;
  while ((match = shadowRegex.exec(cssContent)) !== null) {
    const prefix = match[1]; // shadow, inset-shadow, drop-shadow, text-shadow
    const size = match[2]; // xs, sm, md, etc.
    const value = match[3].trim();
    const fullName = `${prefix}-${size}`;
    shadowMap.set(fullName, value);
  }

  return shadowMap;
}

/**
 * Generate shadow tokens from shadow variables
 */
function generateShadowTokens(
  shadowVariables: Map<string, string>,
): Record<string, ShadowToken> {
  const tokens: Record<string, ShadowToken> = {};

  for (const [name, value] of shadowVariables) {
    tokens[name] = {
      $type: "string",
      $value: value,
    };
  }

  return tokens;
}

/**
 * Parse CSS file and extract container variables
 */
function parseContainerVariables(cssContent: string): Map<string, string> {
  const containerMap = new Map<string, string>();
  const containerRegex = /--container-([a-z0-9]+):\s*([^;]+);/g;

  let match;
  while ((match = containerRegex.exec(cssContent)) !== null) {
    const name = match[1];
    const value = match[2].trim();
    containerMap.set(name, value);
  }

  return containerMap;
}

/**
 * Generate container tokens from container variables
 */
function generateContainerTokens(
  containerVariables: Map<string, string>,
): Record<string, ContainerToken> {
  const tokens: Record<string, ContainerToken> = {};

  for (const [name, value] of containerVariables) {
    const remValue = parseRemValue(value);
    if (remValue === null) {
      console.warn(`Could not parse container value: ${name} = ${value}`);
      continue;
    }

    const pxValue = remToPx(remValue);

    tokens[`container-${name}`] = {
      $type: "number",
      $value: pxValue,
    };
  }

  return tokens;
}

/**
 * Parse CSS file and extract breakpoint variables
 */
function parseBreakpointVariables(cssContent: string): Map<string, string> {
  const breakpointMap = new Map<string, string>();
  const breakpointRegex = /--breakpoint-([a-z0-9]+):\s*([^;]+);/g;

  let match;
  while ((match = breakpointRegex.exec(cssContent)) !== null) {
    const name = match[1];
    const value = match[2].trim();
    breakpointMap.set(name, value);
  }

  return breakpointMap;
}

/**
 * Generate breakpoint tokens from breakpoint variables
 */
function generateBreakpointTokens(
  breakpointVariables: Map<string, string>,
): Record<string, BreakpointToken> {
  const tokens: Record<string, BreakpointToken> = {};

  for (const [name, value] of breakpointVariables) {
    const remValue = parseRemValue(value);
    if (remValue === null) {
      console.warn(`Could not parse breakpoint value: ${name} = ${value}`);
      continue;
    }

    const pxValue = remToPx(remValue);

    tokens[`breakpoint-${name}`] = {
      $type: "number",
      $value: pxValue,
    };
  }

  return tokens;
}

/**
 * Parse CSS file and extract text variables (font sizes only, not line-height)
 */
function parseTextVariables(cssContent: string): Map<string, string> {
  const textMap = new Map<string, string>();
  // Match --text-{size}: but not --text-{size}--line-height
  const textRegex = /--text-([a-z0-9]+):\s*([^;]+);/g;

  let match;
  while ((match = textRegex.exec(cssContent)) !== null) {
    const name = match[1];
    const value = match[2].trim();

    // Skip if this is a line-height variable
    if (name.includes("--line-height")) continue;

    textMap.set(name, value);
  }

  return textMap;
}

/**
 * Generate text tokens from text variables
 */
function generateTextTokens(
  textVariables: Map<string, string>,
): Record<string, TextToken> {
  const tokens: Record<string, TextToken> = {};

  for (const [name, value] of textVariables) {
    const remValue = parseRemValue(value);
    if (remValue === null) {
      console.warn(`Could not parse text value: ${name} = ${value}`);
      continue;
    }

    const pxValue = remToPx(remValue);

    tokens[`text-${name}`] = {
      $type: "number",
      $value: pxValue,
    };
  }

  return tokens;
}

/**
 * Parse CSS file and extract font-weight variables
 */
function parseFontWeightVariables(cssContent: string): Map<string, string> {
  const fontWeightMap = new Map<string, string>();
  const fontWeightRegex = /--font-weight-([a-z]+):\s*([^;]+);/g;

  let match;
  while ((match = fontWeightRegex.exec(cssContent)) !== null) {
    const name = match[1];
    const value = match[2].trim();
    fontWeightMap.set(name, value);
  }

  return fontWeightMap;
}

/**
 * Generate font-weight tokens from font-weight variables
 */
function generateFontWeightTokens(
  fontWeightVariables: Map<string, string>,
): Record<string, FontWeightToken> {
  const tokens: Record<string, FontWeightToken> = {};

  for (const [name, value] of fontWeightVariables) {
    const numericValue = parseInt(value, 10);
    if (isNaN(numericValue)) {
      console.warn(`Could not parse font-weight value: ${name} = ${value}`);
      continue;
    }

    tokens[`font-weight-${name}`] = {
      $type: "number",
      $value: numericValue,
    };
  }

  return tokens;
}

/**
 * Parse CSS file and extract tracking variables
 */
function parseTrackingVariables(cssContent: string): Map<string, string> {
  const trackingMap = new Map<string, string>();
  const trackingRegex = /--tracking-([a-z]+):\s*([^;]+);/g;

  let match;
  while ((match = trackingRegex.exec(cssContent)) !== null) {
    const name = match[1];
    const value = match[2].trim();
    trackingMap.set(name, value);
  }

  return trackingMap;
}

/**
 * Generate tracking tokens from tracking variables
 */
function generateTrackingTokens(
  trackingVariables: Map<string, string>,
): Record<string, TrackingToken> {
  const tokens: Record<string, TrackingToken> = {};

  for (const [name, value] of trackingVariables) {
    tokens[`tracking-${name}`] = {
      $type: "string",
      $value: value,
    };
  }

  return tokens;
}

/**
 * Evaluate calc() expressions
 */
function evaluateCalc(calcString: string): number | null {
  // Extract the calc() content
  const match = calcString.match(/calc\(([^)]+)\)/);
  if (!match) {
    // Not a calc expression, try parsing as number
    const num = parseFloat(calcString);
    return isNaN(num) ? null : num;
  }

  const expression = match[1].trim();

  try {
    // Simple evaluation for division and multiplication
    if (expression.includes("/")) {
      const [numerator, denominator] = expression.split("/").map((s) =>
        parseFloat(s.trim())
      );
      return numerator / denominator;
    } else if (expression.includes("*")) {
      const [left, right] = expression.split("*").map((s) =>
        parseFloat(s.trim())
      );
      return left * right;
    }

    // Fallback to direct parsing
    const num = parseFloat(expression);
    return isNaN(num) ? null : num;
  } catch {
    return null;
  }
}

/**
 * Parse CSS file and extract leading variables
 */
function parseLeadingVariables(cssContent: string): Map<string, string> {
  const leadingMap = new Map<string, string>();

  // Match both --leading-{name} and --text-{size}--line-height
  const leadingRegex = /--leading-([a-z]+):\s*([^;]+);/g;
  const textLineHeightRegex = /--text-([a-z0-9]+)--line-height:\s*([^;]+);/g;

  let match;

  // Parse --leading-* variables
  while ((match = leadingRegex.exec(cssContent)) !== null) {
    const name = match[1];
    const value = match[2].trim();
    leadingMap.set(`leading-${name}`, value);
  }

  // Parse --text-*--line-height variables
  while ((match = textLineHeightRegex.exec(cssContent)) !== null) {
    const size = match[1];
    const value = match[2].trim();
    leadingMap.set(`text-${size}--line-height`, value);
  }

  return leadingMap;
}

/**
 * Generate leading tokens from leading variables
 */
function generateLeadingTokens(
  leadingVariables: Map<string, string>,
): Record<string, LeadingToken> {
  const tokens: Record<string, LeadingToken> = {};

  for (const [name, value] of leadingVariables) {
    const numericValue = evaluateCalc(value);
    if (numericValue === null) {
      console.warn(`Could not parse leading value: ${name} = ${value}`);
      continue;
    }

    // Round to 3 decimal places
    const roundedValue = Math.round(numericValue * 1000) / 1000;

    tokens[name] = {
      $type: "number",
      $value: roundedValue,
    };
  }

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
  const tokens: DesignTokens = {
    Color: {},
    Spacing: {},
    Radius: {},
    Shadow: {},
    Container: {},
    Breakpoint: {},
    Text: {},
    "Font Weight": {},
    Tracking: {},
    Leading: {},
  };

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

  // Parse and generate radius tokens
  const radiusVariables = parseRadiusVariables(cssContent);
  if (radiusVariables.size > 0) {
    tokens.Radius = generateRadiusTokens(radiusVariables);
    console.log(`Generated ${radiusVariables.size} radius tokens`);
  } else {
    console.warn("No --radius-* variables found in CSS");
  }

  // Parse and generate shadow tokens
  const shadowVariables = parseShadowVariables(cssContent);
  if (shadowVariables.size > 0) {
    tokens.Shadow = generateShadowTokens(shadowVariables);
    console.log(`Generated ${shadowVariables.size} shadow tokens`);
  } else {
    console.warn("No shadow variables found in CSS");
  }

  // Parse and generate container tokens
  const containerVariables = parseContainerVariables(cssContent);
  if (containerVariables.size > 0) {
    tokens.Container = generateContainerTokens(containerVariables);
    console.log(`Generated ${containerVariables.size} container tokens`);
  } else {
    console.warn("No --container-* variables found in CSS");
  }

  // Parse and generate breakpoint tokens
  const breakpointVariables = parseBreakpointVariables(cssContent);
  if (breakpointVariables.size > 0) {
    tokens.Breakpoint = generateBreakpointTokens(breakpointVariables);
    console.log(`Generated ${breakpointVariables.size} breakpoint tokens`);
  } else {
    console.warn("No --breakpoint-* variables found in CSS");
  }

  // Parse and generate text tokens
  const textVariables = parseTextVariables(cssContent);
  if (textVariables.size > 0) {
    tokens.Text = generateTextTokens(textVariables);
    console.log(`Generated ${textVariables.size} text tokens`);
  } else {
    console.warn("No --text-* variables found in CSS");
  }

  // Parse and generate font-weight tokens
  const fontWeightVariables = parseFontWeightVariables(cssContent);
  if (fontWeightVariables.size > 0) {
    tokens["Font Weight"] = generateFontWeightTokens(fontWeightVariables);
    console.log(`Generated ${fontWeightVariables.size} font-weight tokens`);
  } else {
    console.warn("No --font-weight-* variables found in CSS");
  }

  // Parse and generate tracking tokens
  const trackingVariables = parseTrackingVariables(cssContent);
  if (trackingVariables.size > 0) {
    tokens.Tracking = generateTrackingTokens(trackingVariables);
    console.log(`Generated ${trackingVariables.size} tracking tokens`);
  } else {
    console.warn("No --tracking-* variables found in CSS");
  }

  // Parse and generate leading tokens
  const leadingVariables = parseLeadingVariables(cssContent);
  if (leadingVariables.size > 0) {
    tokens.Leading = generateLeadingTokens(leadingVariables);
    console.log(`Generated ${leadingVariables.size} leading tokens`);
  } else {
    console.warn(
      "No --leading-* or --text-*--line-height variables found in CSS",
    );
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
