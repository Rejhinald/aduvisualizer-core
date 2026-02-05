import { Hono } from "hono"
import { createLotHandler } from "./create.handler"
import { getLotHandler } from "./get.handler"
import { updateLotHandler } from "./update.handler"
import { deleteLotHandler } from "./delete.handler"
import { searchAddressHandler } from "../../v1/lots/search-address.handler"
import { getParcelHandler } from "../../v1/lots/parcel.handler"

export const lotsRouterV2 = new Hono()

// Utility endpoints (reuse from v1)
lotsRouterV2.post("/search-address", searchAddressHandler)
lotsRouterV2.get("/parcel", getParcelHandler)

// CRUD operations
lotsRouterV2.post("/", createLotHandler)
lotsRouterV2.get("/blueprint/:blueprintId", getLotHandler)
lotsRouterV2.patch("/:lotId", updateLotHandler)
lotsRouterV2.delete("/:lotId", deleteLotHandler)
