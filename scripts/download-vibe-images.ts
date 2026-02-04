/**
 * Download curated vibe thumbnail images from Unsplash
 * Uses specific photo IDs for consistent, high-quality images
 */
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// Curated Unsplash photo IDs for each vibe
// These are hand-picked to best represent each interior design style
const VIBE_IMAGES = {
  modern_minimal: {
    // Clean white living room with minimal furniture
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    alt: "Modern minimalist living room",
  },
  scandinavian: {
    // Light wood, white walls, cozy Scandi aesthetic
    url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
    alt: "Scandinavian interior design",
  },
  industrial: {
    // Exposed brick, metal, loft-style
    url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    alt: "Industrial loft interior",
  },
  bohemian: {
    // Layered textiles, plants, warm colors
    url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&h=300&fit=crop",
    alt: "Bohemian interior design",
  },
  midcentury: {
    // Mid-century modern furniture, organic shapes
    url: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=300&fit=crop",
    alt: "Mid-century modern interior",
  },
  coastal: {
    // Light blues, sandy neutrals, beach-inspired
    url: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=400&h=300&fit=crop",
    alt: "Coastal interior design",
  },
  farmhouse: {
    // Rustic wood, shiplap, warm whites
    url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop",
    alt: "Farmhouse interior design",
  },
  luxury: {
    // High-end materials, rich textures
    url: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=400&h=300&fit=crop",
    alt: "Luxury interior design",
  },
};

async function downloadImage(url: string, filepath: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return false;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    writeFileSync(filepath, buffer);
    return true;
  } catch (error) {
    console.error(`Error downloading ${url}:`, error);
    return false;
  }
}

async function downloadVibeImages() {
  const outputDir = "./storage/vibes";

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log("Downloading vibe thumbnail images from Unsplash...\n");

  for (const [vibeId, imageInfo] of Object.entries(VIBE_IMAGES)) {
    const filePath = join(outputDir, `${vibeId}.jpg`);
    console.log(`  Downloading ${vibeId}...`);

    const success = await downloadImage(imageInfo.url, filePath);
    if (success) {
      console.log(`    ✓ Saved to ${filePath}`);
    } else {
      console.log(`    ✗ Failed to download`);
    }
  }

  console.log("\n✅ Download complete!");
  console.log(`   Location: ${outputDir}`);
  console.log(`   Access via: http://localhost:3001/vibes/{vibe_id}.jpg`);
  console.log("\n   Images from Unsplash (free for commercial use)");
}

downloadVibeImages();
