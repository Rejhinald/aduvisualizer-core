import type { Context } from "hono"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { SearchAddressSchema, type AddressResult } from "../../../types/lot"

/**
 * Search for addresses using Nominatim (OpenStreetMap) geocoding API
 *
 * Rate limits: 1 request/second
 * Requires User-Agent header
 *
 * API docs: https://nominatim.org/release-docs/develop/api/Search/
 */

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search"
const USER_AGENT = "ADUVisualizer/1.0 (contact@aduvisualizer.com)"

interface NominatimResult {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  lat: string
  lon: string
  display_name: string
  boundingbox: string[]
  address?: {
    house_number?: string
    road?: string
    city?: string
    town?: string
    village?: string
    state?: string
    postcode?: string
    country?: string
  }
}

export async function searchAddressHandler(c: Context) {
  try {
    const body = await c.req.json()
    const parsed = SearchAddressSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        failedResponse(c, {
          message: "Validation failed",
          error: formatZodErrors(parsed.error),
        }),
        400
      )
    }

    const { query, limit } = parsed.data

    // Build Nominatim request URL
    const params = new URLSearchParams({
      q: query,
      format: "json",
      countrycodes: "us",
      limit: String(limit),
      addressdetails: "1", // Include address breakdown
    })

    const response = await fetch(`${NOMINATIM_BASE_URL}?${params}`, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
      },
    })

    if (!response.ok) {
      console.error("Nominatim API error:", response.status, response.statusText)
      return c.json(
        failedResponse(c, {
          message: "Address search service unavailable",
          error: { status: response.status, statusText: response.statusText },
        }),
        502
      )
    }

    const nominatimResults: NominatimResult[] = await response.json()

    // Transform to our schema
    const results: AddressResult[] = nominatimResults.map((result) => ({
      placeId: String(result.place_id),
      displayName: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      boundingBox: result.boundingbox?.map((v) => parseFloat(v)),
      addressComponents: result.address
        ? {
            houseNumber: result.address.house_number,
            road: result.address.road,
            city: result.address.city || result.address.town || result.address.village,
            state: result.address.state,
            postcode: result.address.postcode,
            country: result.address.country,
          }
        : undefined,
    }))

    return c.json(
      successResponse(c, {
        data: { results },
        message: `Found ${results.length} address${results.length !== 1 ? "es" : ""}`,
      }),
      200
    )
  } catch (e) {
    console.error("Search address error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to search addresses",
        error: { message: String(e) },
      }),
      500
    )
  }
}
