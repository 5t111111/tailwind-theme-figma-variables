# tailwind-theme-figma-variables AGENTS.md

This project is a tool to export Tailwind CSS themes (described in `.css` files) as Figma variables.

Implemented with Deno.

## Specification

- Parses Tailwind CSS theme settings and converts them to Figma variables format
- Theme settings are described in the `input.css` file
- Conversion results are output to the `output.json` file
- Execute with the `deno run main.ts` command

## Detailed Specification

### Colors

Converts Tailwind CSS color settings to Figma variables.

#### Specification

- Colors are grouped together in the `color` namespace for Figma variables
- All CSS variables in the format `--color-{name}` are converted to color variables
- Figma variable names are `{name}` (the `--color-` prefix is removed)
- Output format conforms to the W3C Design Tokens Format
- In Tailwind CSS default theme, colors are defined in `oklch()` format, so they need to be converted to hexadecimal (hex) format
- sRGB components array (array of numbers in the 0-1 range) is also generated from the converted hex value

#### Example

Input CSS:
```css
--color-blue-500: #3b82f6;
--color-red-500: #ef4444;
```

Output JSON:
```json
{
  "color": {
    "blue-500": {
      "$type": "color",
      "$value": {
        "colorSpace": "srgb",
        "components": [0.231, 0.51, 0.965],
        "hex": "#3b82f6"
      }
    },
    "red-500": {
      "$type": "color",
      "$value": {
        "colorSpace": "srgb",
        "components": [0.937, 0.267, 0.267],
        "hex": "#ef4444"
      }
    }
  }
}
```

## Sample `input.css`

The `tailwindcss-default-theme.css` file contains the [Tailwind CSS default theme](https://tailwindcss.com/docs/theme#default-theme-variable-reference). It can also be copied and used as `input.css`.
