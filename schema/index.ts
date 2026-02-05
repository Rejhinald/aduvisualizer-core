// Schema exports
// Core entities (v2)
export * from "./projects"
export * from "./blueprints"
export * from "./corners"
export * from "./walls"
export * from "./doors"
export * from "./windows"
export * from "./furniture"

// Supporting entities (v2)
export * from "./lots"
export * from "./snapshots"
export * from "./action-logs"
export * from "./exports"

// ADU Boundary (same schema concept as corners/walls, for 2D boundary guide only)
export * from "./boundary-corners"
export * from "./boundary-walls"

// V1 backwards compatibility (rooms stored in DB, finishes, visualizations)
export * from "./rooms"
export * from "./finishes"
export * from "./visualizations"
