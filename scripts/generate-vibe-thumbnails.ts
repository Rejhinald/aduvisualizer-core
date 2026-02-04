/**
 * Generate placeholder thumbnails for vibe options
 * These are simple colored SVG images for each vibe style
 */
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const VIBES = [
  { id: "modern_minimal", label: "Modern Minimal", colors: ["#ffffff", "#f5f5f5", "#e0e0e0"], accent: "#212121" },
  { id: "scandinavian", label: "Scandinavian", colors: ["#fafafa", "#f0ebe3", "#e8dfd5"], accent: "#6b5b4d" },
  { id: "industrial", label: "Industrial", colors: ["#3d3d3d", "#5a5a5a", "#8b8b8b"], accent: "#c75c2e" },
  { id: "bohemian", label: "Bohemian", colors: ["#f4e4d4", "#d4a574", "#8b6b4b"], accent: "#c75c2e" },
  { id: "midcentury", label: "Mid-Century Modern", colors: ["#f5f0eb", "#d4a574", "#2d4739"], accent: "#c75c2e" },
  { id: "coastal", label: "Coastal", colors: ["#e8f4fc", "#b8d4e8", "#7fb3d3"], accent: "#2c5f7c" },
  { id: "farmhouse", label: "Farmhouse", colors: ["#faf8f5", "#e8e2d9", "#d4ccc0"], accent: "#5a4a3a" },
  { id: "luxury", label: "Luxury", colors: ["#1a1a1a", "#2d2d2d", "#c9a961"], accent: "#c9a961" },
];

function generateVibeSVG(vibe: typeof VIBES[0]): string {
  const [c1, c2, c3] = vibe.colors;
  return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1}"/>
      <stop offset="50%" style="stop-color:${c2}"/>
      <stop offset="100%" style="stop-color:${c3}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#bg)"/>
  <!-- Room outline -->
  <rect x="50" y="50" width="300" height="200" fill="none" stroke="${vibe.accent}" stroke-width="3" opacity="0.6"/>
  <!-- Furniture shapes -->
  <rect x="70" y="180" width="80" height="50" fill="${vibe.accent}" opacity="0.3" rx="5"/>
  <rect x="180" y="80" width="60" height="60" fill="${vibe.accent}" opacity="0.25" rx="3"/>
  <rect x="270" y="160" width="50" height="70" fill="${vibe.accent}" opacity="0.35" rx="4"/>
  <!-- Accent line -->
  <line x1="50" y1="260" x2="350" y2="260" stroke="${vibe.accent}" stroke-width="4"/>
  <!-- Label -->
  <text x="200" y="285" font-family="Arial, sans-serif" font-size="14" fill="${vibe.accent}" text-anchor="middle" font-weight="bold">${vibe.label}</text>
</svg>`;
}

async function generateThumbnails() {
  const outputDir = "./storage/vibes";

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log("Generating vibe thumbnails...");

  for (const vibe of VIBES) {
    const svg = generateVibeSVG(vibe);
    const filePath = join(outputDir, `${vibe.id}.svg`);
    writeFileSync(filePath, svg);
    console.log(`  ✓ ${vibe.label} → ${filePath}`);
  }

  console.log("\n✅ All thumbnails generated!");
  console.log(`   Location: ${outputDir}`);
  console.log(`   Access via: http://localhost:3001/vibes/{vibe_id}.svg`);
}

generateThumbnails();
