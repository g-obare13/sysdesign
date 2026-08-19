import type { Template } from "../templates";

export const RIDEHAILING_C4_TEMPLATE: Template = {
  id: "ridehailing-c4-system",
  name: "Ride-Hailing & Dynamic Dispatch (C4 Model)",
  category: "c4",
  description:
    "C4 Model representing a global ride-hailing dispatch system with rider/driver personas, real-time geospatial location tracking, matching engine, and external payment & mapping providers.",
  nodes: [
    // ── Person 1: Rider ──────────────────────────────────────────────
    {
      id: "c4-rh-rider",
      type: "diagram",
      position: { x: 60, y: 140 },
      data: {
        label: "Rider Commuter",
        category: "c4",
        subtype: "c4-person",
        icon: "IconUser",
        c4Level: "context",
        description: "Commuter requesting on-demand transportation, viewing ETAs & fares",
      },
    },

    // ── Person 2: Driver ─────────────────────────────────────────────
    {
      id: "c4-rh-driver",
      type: "diagram",
      position: { x: 60, y: 380 },
      data: {
        label: "Driver Partner",
        category: "c4",
        subtype: "c4-person",
        icon: "IconCar",
        c4Level: "context",
        description: "Registered driver accepting dispatches & streaming live GPS coordinates",
      },
    },

    // ── System Boundary: Ride-Hailing Platform ───────────────────────
    {
      id: "grp-ridehail-system",
      type: "group",
      position: { x: 420, y: 60 },
      data: {
        label: "Ride-Hailing & Dispatch System",
        category: "c4",
      },
      style: {
        width: 680,
        height: 560,
        backgroundColor: "oklch(0.5 0 0 / 0.02)",
        border: "2px dashed oklch(0.5 0 0 / 0.35)",
        borderRadius: 18,
      },
    },
    {
      id: "c4-rh-rider-app",
      type: "diagram",
      parentId: "grp-ridehail-system",
      position: { x: 30, y: 80 },
      data: {
        label: "Rider Mobile App",
        category: "c4",
        subtype: "c4-container",
        icon: "IconDeviceMobile",
        technology: "Flutter, Dart, WebSocket",
        c4Level: "container",
        description: "Mobile app for destination search, ride request, live driver map & payments",
      },
    },
    {
      id: "c4-rh-driver-app",
      type: "diagram",
      parentId: "grp-ridehail-system",
      position: { x: 30, y: 280 },
      data: {
        label: "Driver Mobile App",
        category: "c4",
        subtype: "c4-container",
        icon: "IconDeviceMobileMessage",
        technology: "Native Android/iOS, CoreLocation",
        c4Level: "container",
        description: "Driver app providing turn-by-turn routing and high-frequency GPS beaconing",
      },
    },
    {
      id: "c4-rh-telemetry-svc",
      type: "diagram",
      parentId: "grp-ridehail-system",
      position: { x: 370, y: 60 },
      data: {
        label: "Location Ingestion Service",
        category: "c4",
        subtype: "c4-container",
        icon: "IconLocation",
        technology: "Rust, Actix, Netty",
        c4Level: "container",
        description: "Ingests hundreds of thousands of concurrent driver GPS telemetry pings per second",
      },
    },
    {
      id: "c4-rh-spatial-cache",
      type: "diagram",
      parentId: "grp-ridehail-system",
      position: { x: 370, y: 190 },
      data: {
        label: "Geospatial Index Cache",
        category: "c4",
        subtype: "c4-container",
        icon: "IconWorldPin",
        technology: "Redis Geo, Uber H3 Spatial Grid",
        c4Level: "container",
        description: "In-memory spatial index partitioning live drivers into hexagonal geospatial bins",
      },
    },
    {
      id: "c4-rh-dispatch-engine",
      type: "diagram",
      parentId: "grp-ridehail-system",
      position: { x: 370, y: 310 },
      data: {
        label: "Dynamic Dispatch & Match Engine",
        category: "c4",
        subtype: "c4-container",
        icon: "IconArrowsSplit2",
        technology: "Go, gRPC",
        c4Level: "container",
        description: "Optimizes supply-demand bipartite matching and surge pricing algorithm",
      },
    },
    {
      id: "c4-rh-trip-db",
      type: "diagram",
      parentId: "grp-ridehail-system",
      position: { x: 370, y: 430 },
      data: {
        label: "Trip Ledger & Accounts DB",
        category: "c4",
        subtype: "c4-container",
        icon: "IconDatabase",
        technology: "CockroachDB",
        c4Level: "container",
        description: "ACID transactional database storing completed trips, driver earnings & fares",
      },
    },

    // ── External System 1: Maps & Routing Platform ───────────────────
    {
      id: "c4-rh-ext-maps",
      type: "diagram",
      position: { x: 1200, y: 140 },
      data: {
        label: "Google Maps Platform",
        category: "c4",
        subtype: "c4-system",
        icon: "IconMap2",
        isExternal: true,
        c4Level: "context",
        description: "External provider for map tiles, turn-by-turn routing matrix, and traffic ETA",
      },
    },

    // ── External System 2: Payment Gateway ───────────────────────────
    {
      id: "c4-rh-ext-payments",
      type: "diagram",
      position: { x: 1200, y: 340 },
      data: {
        label: "Stripe Payment Gateway",
        category: "c4",
        subtype: "c4-system",
        icon: "IconCreditCard",
        isExternal: true,
        c4Level: "context",
        description: "Processes rider credit card charges and executes driver instant payouts",
      },
    },
  ],
  edges: [
    // Person -> Mobile Apps
    {
      id: "e-rh-rider-app",
      source: "c4-rh-rider",
      target: "c4-rh-rider-app",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "Requests ride [HTTPS/WSS]",
      data: { label: "Requests ride [HTTPS/WSS]" },
    },
    {
      id: "e-rh-driver-app",
      source: "c4-rh-driver",
      target: "c4-rh-driver-app",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "Streams GPS & accepts [WSS]",
      data: { label: "Streams GPS & accepts [WSS]" },
    },

    // Driver App -> Location Ingestion Service
    {
      id: "e-rh-driver-telemetry",
      source: "c4-rh-driver-app",
      target: "c4-rh-telemetry-svc",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "GPS telemetry (every 4s)",
      data: { label: "GPS telemetry (every 4s)" },
    },

    // Location Service -> Spatial Cache
    {
      id: "e-rh-telemetry-spatial",
      source: "c4-rh-telemetry-svc",
      target: "c4-rh-spatial-cache",
      sourceHandle: "bottom-s",
      targetHandle: "top-t",
      animated: true,
      label: "Updates H3 Hex cell",
      data: { label: "Updates H3 Hex cell" },
    },

    // Rider App -> Dispatch Engine
    {
      id: "e-rh-rider-dispatch",
      source: "c4-rh-rider-app",
      target: "c4-rh-dispatch-engine",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "Submit ride request",
      data: { label: "Submit ride request" },
    },

    // Dispatch Engine -> Spatial Cache & DB
    {
      id: "e-rh-dispatch-spatial",
      source: "c4-rh-dispatch-engine",
      target: "c4-rh-spatial-cache",
      sourceHandle: "top-s",
      targetHandle: "bottom-t",
      animated: true,
      label: "k-ring driver lookup",
      data: { label: "k-ring driver lookup" },
    },
    {
      id: "e-rh-dispatch-db",
      source: "c4-rh-dispatch-engine",
      target: "c4-rh-trip-db",
      sourceHandle: "bottom-s",
      targetHandle: "top-t",
      animated: true,
      label: "Creates trip transaction",
      data: { label: "Creates trip transaction" },
    },

    // Dispatch Engine -> External Systems
    {
      id: "e-rh-dispatch-maps",
      source: "c4-rh-dispatch-engine",
      target: "c4-rh-ext-maps",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "Fetches route & ETA [REST]",
      data: { label: "Fetches route & ETA [REST]" },
    },
    {
      id: "e-rh-dispatch-pay",
      source: "c4-rh-dispatch-engine",
      target: "c4-rh-ext-payments",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "Captures fare [REST]",
      data: { label: "Captures fare [REST]" },
    },
  ],
};
