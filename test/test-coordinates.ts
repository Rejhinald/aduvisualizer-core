/**
 * Test Script: Verify Coordinate Conversion System
 *
 * This tests the full flow:
 * 1. Create a project with geo-location (lat/lng anchor point)
 * 2. Save a blueprint with rooms, doors, windows, furniture
 * 3. Retrieve with geo-converted coordinates
 * 4. Verify the math is correct
 */

const API_URL = "http://localhost:3001/api/v1"

// Test data - a simple ADU with known coordinates
const TEST_GEO_LOCATION = {
  lat: 34.0522,  // Los Angeles
  lng: -118.2437,
  rotation: 0,
  address: "123 Test Street",
  city: "Los Angeles",
  state: "CA",
  zipCode: "90001",
}

// Canvas config (matching the frontend editor)
const CANVAS_CONFIG = {
  canvasWidth: 800,
  canvasHeight: 800,
  pixelsPerFoot: 100,  // 100 pixels = 1 foot
  maxCanvasFeet: 36,
}

// ADU Boundary - a 24x24 foot square centered on canvas
// Center of canvas is (400, 400)
// 24 feet = 2400 pixels, so boundary is 1200px on each side from center
const ADU_BOUNDARY = [
  { x: 400 - 1200, y: 400 - 1200 },  // Top-left: (-12ft, +12ft from center)
  { x: 400 + 1200, y: 400 - 1200 },  // Top-right: (+12ft, +12ft)
  { x: 400 + 1200, y: 400 + 1200 },  // Bottom-right: (+12ft, -12ft)
  { x: 400 - 1200, y: 400 + 1200 },  // Bottom-left: (-12ft, -12ft)
]

// Wait, that's too big. Let's make it 24x24 feet which is 2400x2400 pixels
// But canvas is only 800x800. Let me recalculate.

// With 100 pixels per foot, an 800x800 canvas shows 8x8 feet.
// For a 600 sq ft ADU (~24.5x24.5 feet), we need to work within the display.

// Let's use a simpler test: 6x6 foot square in center
// 6 feet = 600 pixels, half = 300
const SIMPLE_ADU_BOUNDARY = [
  { x: 400 - 300, y: 400 - 300 },  // Top-left
  { x: 400 + 300, y: 400 - 300 },  // Top-right
  { x: 400 + 300, y: 400 + 300 },  // Bottom-right
  { x: 400 - 300, y: 400 + 300 },  // Bottom-left
]

// A bedroom in the top-left quadrant: 10x12 feet
// Starting at canvas position (150, 150), size 1000x1200 pixels
// Actually let's make it smaller to fit: 3x4 feet = 300x400 pixels
const TEST_ROOM = {
  name: "Bedroom 1",
  type: "bedroom",
  color: "#a8d5e5",
  vertices: [
    { x: 150, y: 150 },
    { x: 450, y: 150 },
    { x: 450, y: 550 },
    { x: 150, y: 550 },
  ],
  areaSqFt: 12,  // 3x4 = 12 sq ft
}

// A door at position (300, 550) - on the bottom wall of the bedroom
const TEST_DOOR = {
  type: "single",
  x: 300,
  y: 550,
  widthFeet: 3,
  rotation: 0,
}

// A window at position (300, 150) - on the top wall
const TEST_WINDOW = {
  type: "standard",
  x: 300,
  y: 150,
  widthFeet: 3,
  heightFeet: 4,
  rotation: 0,
}

// A bed at position (300, 350) - center of bedroom
const TEST_FURNITURE = {
  type: "queen_bed",
  category: "bedroom",
  x: 300,
  y: 350,
  widthFeet: 5,
  heightFeet: 6.5,
  rotation: 0,
}

async function runTest() {
  console.log("=" .repeat(60))
  console.log("COORDINATE CONVERSION TEST")
  console.log("=" .repeat(60))
  console.log("")

  // Step 1: Create a project
  console.log("Step 1: Creating project...")
  const projectRes = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Coordinate Test Project",
      description: "Testing pixel to lat/lng conversion",
    }),
  })
  const projectData = await projectRes.json()

  if (projectData.status !== "success") {
    console.error("❌ Failed to create project:", projectData)
    return
  }

  const projectId = projectData.data.id
  console.log(`✅ Project created: ${projectId}`)
  console.log("")

  // Step 2: Set geo-location
  console.log("Step 2: Setting geo-location anchor point...")
  console.log(`   Anchor: ${TEST_GEO_LOCATION.lat}, ${TEST_GEO_LOCATION.lng}`)

  const geoRes = await fetch(`${API_URL}/projects/${projectId}/geo-location`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(TEST_GEO_LOCATION),
  })
  const geoData = await geoRes.json()

  if (geoData.status !== "success") {
    console.error("❌ Failed to set geo-location:", geoData)
    return
  }
  console.log("✅ Geo-location set")
  console.log("")

  // Step 3: Save blueprint with test data
  console.log("Step 3: Saving blueprint with test coordinates...")
  console.log("   Canvas: 800x800 pixels, 100 pixels/foot")
  console.log("   ADU Boundary: 6x6 feet square centered")
  console.log("   Room: Bedroom 3x4 feet at top-left")
  console.log("   Door: at (300, 550) pixels")
  console.log("   Window: at (300, 150) pixels")
  console.log("   Furniture: Queen bed at (300, 350) pixels")

  const blueprintRes = await fetch(`${API_URL}/blueprints/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      name: "Test Blueprint v1",
      ...CANVAS_CONFIG,
      gridSize: 100,
      aduBoundary: SIMPLE_ADU_BOUNDARY,
      aduAreaSqFt: 36,  // 6x6 = 36 sq ft
      rooms: [TEST_ROOM],
      doors: [TEST_DOOR],
      windows: [TEST_WINDOW],
      furniture: [TEST_FURNITURE],
      totalRoomAreaSqFt: 12,
      isValid: true,
    }),
  })
  const blueprintData = await blueprintRes.json()

  if (blueprintData.status !== "success") {
    console.error("❌ Failed to save blueprint:", blueprintData)
    return
  }

  const blueprintId = blueprintData.data.blueprint.id
  console.log(`✅ Blueprint saved: ${blueprintId}`)
  console.log(`   Version: ${blueprintData.data.summary.version}`)
  console.log(`   Rooms: ${blueprintData.data.summary.totalRooms}`)
  console.log(`   Doors: ${blueprintData.data.summary.totalDoors}`)
  console.log(`   Windows: ${blueprintData.data.summary.totalWindows}`)
  console.log(`   Furniture: ${blueprintData.data.summary.totalFurniture}`)
  console.log("")

  // Step 4: Retrieve with geo coordinates
  console.log("Step 4: Retrieving blueprint with geo-converted coordinates...")

  const geoBlueprint = await fetch(`${API_URL}/blueprints/${blueprintId}/geo`)
  const geoBlueprintData = await geoBlueprint.json()

  if (geoBlueprintData.status !== "success") {
    console.error("❌ Failed to get geo blueprint:", geoBlueprintData)
    return
  }

  console.log("✅ Blueprint with geo coordinates retrieved")
  console.log("")

  // Step 5: Analyze the conversion
  console.log("=" .repeat(60))
  console.log("COORDINATE CONVERSION RESULTS")
  console.log("=" .repeat(60))
  console.log("")

  const data = geoBlueprintData.data

  // Project geo config
  console.log("📍 GEO ANCHOR POINT:")
  console.log(`   Lat: ${data.project.geoLocation.lat}`)
  console.log(`   Lng: ${data.project.geoLocation.lng}`)
  console.log(`   Rotation: ${data.project.geoLocation.rotation}°`)
  console.log("")

  // Geo bounds
  if (data.geoBounds) {
    console.log("🗺️ ADU GEO BOUNDS:")
    console.log(`   North: ${data.geoBounds.north}`)
    console.log(`   South: ${data.geoBounds.south}`)
    console.log(`   East:  ${data.geoBounds.east}`)
    console.log(`   West:  ${data.geoBounds.west}`)
    console.log(`   Center: ${data.geoBounds.center.lat}, ${data.geoBounds.center.lng}`)
    console.log("")
  }

  // Room coordinates
  console.log("🏠 ROOM COORDINATES:")
  for (const room of data.rooms) {
    console.log(`   ${room.name} (${room.type}):`)
    console.log(`     Canvas pixels: ${JSON.stringify(room.verticesCanvas)}`)
    console.log(`     Feet from center: ${JSON.stringify(room.verticesFeet)}`)
    console.log(`     Geo (lat/lng): ${JSON.stringify(room.verticesGeo)}`)
    console.log("")
  }

  // Door coordinates
  console.log("🚪 DOOR COORDINATES:")
  for (const door of data.doors) {
    console.log(`   ${door.type}:`)
    console.log(`     Canvas: (${door.positionCanvas.x}, ${door.positionCanvas.y})`)
    console.log(`     Feet: (${door.positionFeet.x}, ${door.positionFeet.y})`)
    console.log(`     Geo: (${door.positionGeo.lat}, ${door.positionGeo.lng})`)
    console.log("")
  }

  // Window coordinates
  console.log("🪟 WINDOW COORDINATES:")
  for (const win of data.windows) {
    console.log(`   ${win.type}:`)
    console.log(`     Canvas: (${win.positionCanvas.x}, ${win.positionCanvas.y})`)
    console.log(`     Feet: (${win.positionFeet.x}, ${win.positionFeet.y})`)
    console.log(`     Geo: (${win.positionGeo.lat}, ${win.positionGeo.lng})`)
    console.log("")
  }

  // Furniture coordinates
  console.log("🪑 FURNITURE COORDINATES:")
  for (const item of data.furniture) {
    console.log(`   ${item.type}:`)
    console.log(`     Canvas: (${item.positionCanvas.x}, ${item.positionCanvas.y})`)
    console.log(`     Feet: (${item.positionFeet.x}, ${item.positionFeet.y})`)
    console.log(`     Geo: (${item.positionGeo.lat}, ${item.positionGeo.lng})`)
    console.log("")
  }

  // Verify the math
  console.log("=" .repeat(60))
  console.log("VERIFICATION")
  console.log("=" .repeat(60))
  console.log("")

  // Canvas center is (400, 400)
  // Door is at (300, 550)
  // Offset from center: x = 300-400 = -100px, y = 400-550 = -150px
  // In feet: x = -1ft (west), y = -1.5ft (south, because y increases downward)
  const expectedDoorFeet = { x: -1, y: -1.5 }
  const actualDoorFeet = data.doors[0].positionFeet

  console.log("Door position verification:")
  console.log(`   Canvas position: (300, 550)`)
  console.log(`   Canvas center: (400, 400)`)
  console.log(`   Expected feet from center: (${expectedDoorFeet.x}, ${expectedDoorFeet.y})`)
  console.log(`   Actual feet from center: (${actualDoorFeet.x}, ${actualDoorFeet.y})`)

  const doorFeetMatch =
    Math.abs(actualDoorFeet.x - expectedDoorFeet.x) < 0.01 &&
    Math.abs(actualDoorFeet.y - expectedDoorFeet.y) < 0.01

  console.log(`   ${doorFeetMatch ? "✅ MATCH" : "❌ MISMATCH"}`)
  console.log("")

  // Bed is at (300, 350)
  // Offset from center: x = 300-400 = -100px = -1ft, y = 400-350 = 50px = 0.5ft
  const expectedBedFeet = { x: -1, y: 0.5 }
  const actualBedFeet = data.furniture[0].positionFeet

  console.log("Furniture (bed) position verification:")
  console.log(`   Canvas position: (300, 350)`)
  console.log(`   Expected feet from center: (${expectedBedFeet.x}, ${expectedBedFeet.y})`)
  console.log(`   Actual feet from center: (${actualBedFeet.x}, ${actualBedFeet.y})`)

  const bedFeetMatch =
    Math.abs(actualBedFeet.x - expectedBedFeet.x) < 0.01 &&
    Math.abs(actualBedFeet.y - expectedBedFeet.y) < 0.01

  console.log(`   ${bedFeetMatch ? "✅ MATCH" : "❌ MISMATCH"}`)
  console.log("")

  console.log("=" .repeat(60))
  console.log("TEST COMPLETE")
  console.log("=" .repeat(60))
}

runTest().catch(console.error)
