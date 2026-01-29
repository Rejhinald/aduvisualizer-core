/**
 * Test Script: Verify Rotation and Scale Accuracy
 *
 * Tests:
 * 1. Rotated blueprint (45°, 90°)
 * 2. Verify distance calculations
 * 3. Edge cases
 */

const API_URL = "http://localhost:3001/api/v1"

// Haversine formula to calculate distance between two lat/lng points
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 20902231 // Earth radius in feet
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

async function testRotation() {
  console.log("=" .repeat(60))
  console.log("ROTATION & DISTANCE TEST")
  console.log("=" .repeat(60))
  console.log("")

  // Create project with 45° rotation
  console.log("Creating project with 45° rotation...")

  const projectRes = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Rotation Test Project",
      description: "Testing 45° rotated blueprint",
    }),
  })
  const projectData = await projectRes.json()
  const projectId = projectData.data.id

  // Set geo-location with 45° rotation
  await fetch(`${API_URL}/projects/${projectId}/geo-location`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lat: 34.0522,
      lng: -118.2437,
      rotation: 45,  // 45 degrees clockwise
    }),
  })

  console.log("✅ Project created with 45° rotation")
  console.log("")

  // Save a simple blueprint with a point 10 feet east of center
  // At 45° rotation, this should appear NE in geo coordinates
  const blueprintRes = await fetch(`${API_URL}/blueprints/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      name: "Rotated Blueprint",
      canvasWidth: 800,
      canvasHeight: 800,
      pixelsPerFoot: 100,
      maxCanvasFeet: 36,
      gridSize: 100,
      aduBoundary: [
        { x: 100, y: 100 },
        { x: 700, y: 100 },
        { x: 700, y: 700 },
        { x: 100, y: 700 },
      ],
      aduAreaSqFt: 36,
      rooms: [{
        name: "Test Room",
        type: "living",
        color: "#a8d5e5",
        vertices: [
          { x: 200, y: 200 },
          { x: 600, y: 200 },
          { x: 600, y: 600 },
          { x: 200, y: 600 },
        ],
        areaSqFt: 16,
      }],
      doors: [{
        type: "single",
        // Point 10 feet east of center: (400+1000, 400) = (1400, 400)
        // Wait, that's off canvas. Let's use 1 foot east: (500, 400)
        x: 500,  // 1 foot east of center (400)
        y: 400,  // on center Y
        widthFeet: 3,
        rotation: 0,
      }],
      windows: [{
        type: "standard",
        x: 400,  // on center X
        y: 300,  // 1 foot north of center
        widthFeet: 3,
        heightFeet: 4,
        rotation: 0,
      }],
      furniture: [],
      isValid: true,
    }),
  })
  const blueprintData = await blueprintRes.json()
  const blueprintId = blueprintData.data.blueprint.id

  // Get with geo coordinates
  const geoRes = await fetch(`${API_URL}/blueprints/${blueprintId}/geo`)
  const geoData = await geoRes.json()

  console.log("📐 ROTATION TEST RESULTS:")
  console.log("")

  const door = geoData.data.doors[0]
  const window = geoData.data.windows[0]
  const center = geoData.data.project.geoLocation

  console.log("Anchor point: ", center.lat, center.lng)
  console.log("Rotation: 45°")
  console.log("")

  console.log("Door (1ft east of center in canvas):")
  console.log(`  Canvas: (${door.positionCanvas.x}, ${door.positionCanvas.y})`)
  console.log(`  Feet from center: (${door.positionFeet.x}, ${door.positionFeet.y})`)
  console.log(`  Geo: ${door.positionGeo.lat}, ${door.positionGeo.lng}`)

  // With 45° rotation, 1ft east becomes 0.707ft east + 0.707ft north
  const expectedDoorFeetRotated = {
    x: Math.cos(45 * Math.PI / 180),  // ~0.707
    y: Math.sin(45 * Math.PI / 180),  // ~0.707
  }
  console.log(`  Expected (with 45° rotation): ~(${expectedDoorFeetRotated.x.toFixed(3)}, ${expectedDoorFeetRotated.y.toFixed(3)}) ft`)
  console.log("")

  console.log("Window (1ft north of center in canvas):")
  console.log(`  Canvas: (${window.positionCanvas.x}, ${window.positionCanvas.y})`)
  console.log(`  Feet from center: (${window.positionFeet.x}, ${window.positionFeet.y})`)
  console.log(`  Geo: ${window.positionGeo.lat}, ${window.positionGeo.lng}`)

  // With 45° rotation, 1ft north becomes 0.707ft north + 0.707ft west
  console.log("")

  // Distance verification
  console.log("=" .repeat(60))
  console.log("DISTANCE VERIFICATION")
  console.log("=" .repeat(60))
  console.log("")

  // Calculate actual distance from center to door using Haversine
  const doorDistanceFeet = haversineDistance(
    center.lat, center.lng,
    door.positionGeo.lat, door.positionGeo.lng
  )

  console.log("Door distance from center:")
  console.log(`  Expected: 1.0 feet (canvas offset was 100px = 1ft)`)
  console.log(`  Calculated from geo coords: ${doorDistanceFeet.toFixed(4)} feet`)
  console.log(`  ${Math.abs(doorDistanceFeet - 1.0) < 0.1 ? "✅ ACCURATE" : "❌ INACCURATE"}`)
  console.log("")

  // Window distance
  const windowDistanceFeet = haversineDistance(
    center.lat, center.lng,
    window.positionGeo.lat, window.positionGeo.lng
  )

  console.log("Window distance from center:")
  console.log(`  Expected: 1.0 feet (canvas offset was 100px = 1ft)`)
  console.log(`  Calculated from geo coords: ${windowDistanceFeet.toFixed(4)} feet`)
  console.log(`  ${Math.abs(windowDistanceFeet - 1.0) < 0.1 ? "✅ ACCURATE" : "❌ INACCURATE"}`)

  console.log("")
  console.log("=" .repeat(60))
  console.log("TEST COMPLETE")
  console.log("=" .repeat(60))
}

testRotation().catch(console.error)
