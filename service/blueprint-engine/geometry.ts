/**
 * Geometry utilities for Blueprint Engine
 * All units in feet
 */

import type { Point } from "../../types/blueprint-v2"

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate midpoint between two points
 */
export function midpoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  }
}

/**
 * Calculate angle between two points (radians)
 */
export function angle(p1: Point, p2: Point): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x)
}

/**
 * Calculate angle in degrees
 */
export function angleDegrees(p1: Point, p2: Point): number {
  return (angle(p1, p2) * 180) / Math.PI
}

/**
 * Calculate perpendicular distance from point to line segment
 */
export function pointToLineDistance(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): number {
  const lineLengthSq = distanceSquared(lineStart, lineEnd)

  if (lineLengthSq === 0) {
    return distance(point, lineStart)
  }

  // Calculate projection parameter
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - lineStart.x) * (lineEnd.x - lineStart.x) +
        (point.y - lineStart.y) * (lineEnd.y - lineStart.y)) /
        lineLengthSq
    )
  )

  // Find nearest point on line
  const nearest: Point = {
    x: lineStart.x + t * (lineEnd.x - lineStart.x),
    y: lineStart.y + t * (lineEnd.y - lineStart.y),
  }

  return distance(point, nearest)
}

/**
 * Calculate squared distance (faster, for comparisons)
 */
export function distanceSquared(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return dx * dx + dy * dy
}

/**
 * Check if point is near another point (within tolerance)
 */
export function isNear(p1: Point, p2: Point, tolerance: number = 0.25): boolean {
  return distanceSquared(p1, p2) < tolerance * tolerance
}

/**
 * Check if point is near a line segment
 */
export function isNearLine(
  point: Point,
  lineStart: Point,
  lineEnd: Point,
  tolerance: number = 0.25
): boolean {
  return pointToLineDistance(point, lineStart, lineEnd) < tolerance
}

/**
 * Find closest point on line segment to a point
 */
export function closestPointOnLine(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): Point {
  const lineLengthSq = distanceSquared(lineStart, lineEnd)

  if (lineLengthSq === 0) {
    return { ...lineStart }
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - lineStart.x) * (lineEnd.x - lineStart.x) +
        (point.y - lineStart.y) * (lineEnd.y - lineStart.y)) /
        lineLengthSq
    )
  )

  return {
    x: lineStart.x + t * (lineEnd.x - lineStart.x),
    y: lineStart.y + t * (lineEnd.y - lineStart.y),
  }
}

/**
 * Calculate area of polygon using shoelace formula
 */
export function polygonArea(vertices: Point[]): number {
  if (vertices.length < 3) return 0

  let area = 0
  const n = vertices.length

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += vertices[i].x * vertices[j].y
    area -= vertices[j].x * vertices[i].y
  }

  return Math.abs(area) / 2
}

/**
 * Calculate centroid of polygon
 */
export function polygonCentroid(vertices: Point[]): Point {
  if (vertices.length === 0) return { x: 0, y: 0 }

  let cx = 0
  let cy = 0
  const n = vertices.length

  for (const v of vertices) {
    cx += v.x
    cy += v.y
  }

  return {
    x: cx / n,
    y: cy / n,
  }
}

/**
 * Check if polygon is wound counter-clockwise
 */
export function isCounterClockwise(vertices: Point[]): boolean {
  if (vertices.length < 3) return false

  let sum = 0
  const n = vertices.length

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    sum += (vertices[j].x - vertices[i].x) * (vertices[j].y + vertices[i].y)
  }

  return sum < 0
}

/**
 * Ensure polygon is wound counter-clockwise
 */
export function ensureCounterClockwise<T extends Point>(vertices: T[]): T[] {
  if (isCounterClockwise(vertices)) {
    return vertices
  }
  return [...vertices].reverse()
}

/**
 * Check if two line segments intersect
 */
export function lineSegmentsIntersect(
  a1: Point, a2: Point,
  b1: Point, b2: Point
): boolean {
  const d1 = direction(b1, b2, a1)
  const d2 = direction(b1, b2, a2)
  const d3 = direction(a1, a2, b1)
  const d4 = direction(a1, a2, b2)

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true
  }

  if (d1 === 0 && onSegment(b1, b2, a1)) return true
  if (d2 === 0 && onSegment(b1, b2, a2)) return true
  if (d3 === 0 && onSegment(a1, a2, b1)) return true
  if (d4 === 0 && onSegment(a1, a2, b2)) return true

  return false
}

function direction(p1: Point, p2: Point, p3: Point): number {
  return (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y)
}

function onSegment(p1: Point, p2: Point, p: Point): boolean {
  return (
    Math.min(p1.x, p2.x) <= p.x &&
    p.x <= Math.max(p1.x, p2.x) &&
    Math.min(p1.y, p2.y) <= p.y &&
    p.y <= Math.max(p1.y, p2.y)
  )
}

/**
 * Snap value to grid
 */
export function snapToGrid(value: number, gridSize: number = 0.5): number {
  return Math.round(value / gridSize) * gridSize
}

/**
 * Snap point to grid
 */
export function snapPointToGrid(point: Point, gridSize: number = 0.5): Point {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize),
  }
}

/**
 * Point in polygon test (ray casting)
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false
  const n = polygon.length

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y

    if (yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }

  return inside
}
