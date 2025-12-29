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
 * Design tokens output format
 */
interface DesignTokens {
  color: Record<string, ColorToken>;
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
  const tokens: DesignTokens = { color: {} };

  for (const [name, value] of colorVariables) {
    let hex: string | null = null;

    // Check if the value is already in hex format
    if (value.startsWith('#')) {
      hex = value;
    } else if (value.startsWith('oklch(')) {
      // Convert oklch to hex
      hex = oklchToHex(value);
    }

    if (!hex) {
      console.warn(`Could not convert color: ${name} = ${value}`);
      continue;
    }

    const components = hexToComponents(hex);

    tokens.color[name] = {
      $type: "color",
      $value: {
        colorSpace: "srgb",
        components,
        hex,
      },
    };
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
    console.error("Error:", error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}
