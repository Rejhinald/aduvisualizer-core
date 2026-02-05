/**
 * Blueprint Engine v2
 *
 * Core business logic for floor plan manipulation.
 * All coordinates are in FEET (decimal).
 */

// Geometry utilities
export {
  distance,
  distanceSquared,
  midpoint,
  angle,
  angleDegrees,
  pointToLineDistance,
  isNear,
  isNearLine,
  closestPointOnLine,
  polygonArea,
  polygonCentroid,
  isCounterClockwise,
  ensureCounterClockwise,
  lineSegmentsIntersect,
  snapToGrid,
  snapPointToGrid,
  isPointInPolygon,
} from "./geometry"

// Dimensioning utilities
export {
  feetToFeetInches,
  feetInchesToFeet,
  formatArea,
  formatFeet,
  formatDimension,
  parseUserInput,
  roundToFraction,
} from "./dimensioning"

// Room detection
export {
  detectRooms,
  isPointInRoom,
  findRoomAtPoint,
  suggestRoomType,
  getFurnitureInRoom,
} from "./room-detector"
