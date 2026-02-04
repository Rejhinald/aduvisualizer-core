import type { Context } from "hono"
import { db } from "../../../config/db"
import { finishes } from "../../../schema"
import type { CameraPlacement } from "../../../schema/finishes"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { CameraPlacementSchema } from "../../../types/finish"
import { eq, and } from "drizzle-orm"
import { sql } from "drizzle-orm"

export async function updateCameraHandler(c: Context) {
  try {
    const finishId = c.req.param("finishId")

    if (!finishId) {
      return c.json(
        failedResponse(c, {
          message: "Finish ID is required",
        }),
        400
      )
    }

    const body = await c.req.json()

    // Extract camera data - frontend sends { cameraPlacement: data }
    const cameraData = body?.cameraPlacement !== undefined ? body.cameraPlacement : body

    // Allow null to clear camera placement
    if (cameraData === null) {
      const [finish] = await db
        .update(finishes)
        .set({
          cameraPlacement: null,
          updatedAt: sql`now()`,
        })
        .where(and(eq(finishes.id, finishId), eq(finishes.isDeleted, false)))
        .returning()

      if (!finish) {
        return c.json(
          failedResponse(c, {
            message: "Finishes not found",
          }),
          404
        )
      }

      return c.json(
        successResponse(c, {
          data: { finish },
          message: "Camera placement cleared",
        }),
        200
      )
    }

    const parsed = CameraPlacementSchema.safeParse(cameraData)

    if (!parsed.success) {
      return c.json(
        failedResponse(c, {
          message: "Validation failed",
          error: formatZodErrors(parsed.error),
        }),
        400
      )
    }

    // Get existing finish
    const [existingFinish] = await db
      .select({ id: finishes.id, cameraPlacement: finishes.cameraPlacement })
      .from(finishes)
      .where(and(eq(finishes.id, finishId), eq(finishes.isDeleted, false)))
      .limit(1)

    if (!existingFinish) {
      return c.json(
        failedResponse(c, {
          message: "Finishes not found",
        }),
        404
      )
    }

    // Merge with existing camera placement or create new
    const existingCamera = existingFinish.cameraPlacement as CameraPlacement | null
    const newCamera: CameraPlacement = {
      position: parsed.data.position ?? existingCamera?.position ?? { x: 0, y: 0 },
      rotation: parsed.data.rotation ?? existingCamera?.rotation ?? 0,
      fov: parsed.data.fov ?? existingCamera?.fov ?? 60,
      height: parsed.data.height ?? existingCamera?.height ?? 5,
    }

    const [finish] = await db
      .update(finishes)
      .set({
        cameraPlacement: newCamera,
        updatedAt: sql`now()`,
      })
      .where(eq(finishes.id, finishId))
      .returning()

    return c.json(
      successResponse(c, {
        data: { finish, camera: newCamera },
        message: "Camera placement updated successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Update camera error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to update camera placement",
        error: { message: String(e) },
      }),
      500
    )
  }
}
