import { Hono } from "hono"
import { createLotHandler } from "./create.handler"
import { getLotHandler } from "./get.handler"
import { updateLotHandler } from "./update.handler"
import { deleteLotHandler } from "./delete.handler"
import { searchAddressHandler } from "./search-address.handler"
import { getParcelHandler } from "./parcel.handler"

export const lotsRouter = new Hono()

// Address search (geocoding via Nominatim)
lotsRouter.post("/search-address", searchAddressHandler)

// Parcel data (from Orange County GIS)
lotsRouter.get("/parcel", getParcelHandler)

// CRUD operations
lotsRouter.post("/", createLotHandler)
lotsRouter.get("/blueprint/:blueprintId", getLotHandler)
lotsRouter.put("/:lotId", updateLotHandler)
lotsRouter.delete("/:lotId", deleteLotHandler)
