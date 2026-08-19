import type { Template } from "../templates";

export const BANKING_C4_TEMPLATE: Template = {
  id: "banking-c4-system",
  name: "Enterprise Banking System (C4 Model)",
  category: "c4",
  description:
    "C4 Model representing an enterprise digital banking system: customer personas, containerized web & mobile apps, API gateway, core services, and external mainframe integrations.",
  nodes: [
    // ── Person 1: Retail Customer ────────────────────────────────────
    {
      id: "c4-person-customer",
      type: "diagram",
      position: { x: 60, y: 140 },
      data: {
        label: "Retail Customer",
        category: "c4",
        subtype: "c4-person",
        icon: "IconUser",
        c4Level: "context",
        description: "Personal and business banking customer with checking and savings accounts",
      },
    },

    // ── Person 2: Branch Officer ─────────────────────────────────────
    {
      id: "c4-person-teller",
      type: "diagram",
      position: { x: 60, y: 380 },
      data: {
        label: "Branch Officer / Ops",
        category: "c4",
        subtype: "c4-person",
        icon: "IconUserCheck",
        c4Level: "context",
        description: "Bank staff member assisting customers and managing compliance reviews",
      },
    },

    // ── System Boundary: Online Banking System ───────────────────────
    {
      id: "grp-banking-system",
      type: "group",
      position: { x: 420, y: 60 },
      data: {
        label: "Online Banking Software System",
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
      id: "c4-container-spa",
      type: "diagram",
      parentId: "grp-banking-system",
      position: { x: 30, y: 80 },
      data: {
        label: "Internet Banking Web App",
        category: "c4",
        subtype: "c4-container",
        icon: "IconBrowser",
        technology: "React, TypeScript, Tailwind",
        c4Level: "container",
        description: "Delivers banking dashboard and transfer workflows via web browser",
      },
    },
    {
      id: "c4-container-mobile",
      type: "diagram",
      parentId: "grp-banking-system",
      position: { x: 30, y: 280 },
      data: {
        label: "Mobile Banking App",
        category: "c4",
        subtype: "c4-container",
        icon: "IconDeviceMobile",
        technology: "Swift, Kotlin, Biometrics",
        c4Level: "container",
        description: "Native iOS and Android app for biometric authentication and quick transfers",
      },
    },
    {
      id: "c4-container-gateway",
      type: "diagram",
      parentId: "grp-banking-system",
      position: { x: 370, y: 60 },
      data: {
        label: "API Gateway & Security",
        category: "c4",
        subtype: "c4-container",
        icon: "IconShieldLock",
        technology: "Envoy, Go, OAuth2 OIDC",
        c4Level: "container",
        description: "Handles TLS termination, JWT token validation, and rate limiting",
      },
    },
    {
      id: "c4-container-backend",
      type: "diagram",
      parentId: "grp-banking-system",
      position: { x: 370, y: 220 },
      data: {
        label: "Core Accounts & Transfer Service",
        category: "c4",
        subtype: "c4-container",
        icon: "IconCpu",
        technology: "Java, Spring Boot 3",
        c4Level: "container",
        description: "Provides REST/gRPC API for balances, payee management, and funds transfers",
      },
    },
    {
      id: "c4-container-db",
      type: "diagram",
      parentId: "grp-banking-system",
      position: { x: 370, y: 380 },
      data: {
        label: "Relational Ledger DB",
        category: "c4",
        subtype: "c4-container",
        icon: "IconDatabase",
        technology: "PostgreSQL, TimescaleDB",
        c4Level: "container",
        description: "Stores customer profiles, account balances, and double-entry transaction log",
      },
    },

    // ── External System 1: Mainframe Core Banking ────────────────────
    {
      id: "c4-ext-mainframe",
      type: "diagram",
      position: { x: 1200, y: 80 },
      data: {
        label: "Mainframe Core Banking",
        category: "c4",
        subtype: "c4-system",
        icon: "IconServer",
        isExternal: true,
        c4Level: "context",
        description: "Legacy mainframe system storing master account data and overnight batch settlement",
      },
    },

    // ── External System 2: Credit Scoring Bureau ─────────────────────
    {
      id: "c4-ext-credit",
      type: "diagram",
      position: { x: 1200, y: 240 },
      data: {
        label: "Credit Scoring Bureau",
        category: "c4",
        subtype: "c4-system",
        icon: "IconBuildingBank",
        isExternal: true,
        c4Level: "context",
        description: "Third-party credit score provider (Experian / TransUnion)",
      },
    },

    // ── External System 3: Push Notification System ──────────────────
    {
      id: "c4-ext-notification",
      type: "diagram",
      position: { x: 1200, y: 400 },
      data: {
        label: "SMS & Push Notification Gateway",
        category: "c4",
        subtype: "c4-system",
        icon: "IconBell",
        isExternal: true,
        c4Level: "context",
        description: "External notification delivery service (Twilio / AWS SNS)",
      },
    },
  ],
  edges: [
    // Person -> Client Apps
    {
      id: "e-c4-cust-spa",
      source: "c4-person-customer",
      target: "c4-container-spa",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "Visits web portal [HTTPS]",
      data: { label: "Visits web portal [HTTPS]" },
    },
    {
      id: "e-c4-cust-mob",
      source: "c4-person-customer",
      target: "c4-container-mobile",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "Uses mobile app [Biometrics]",
      data: { label: "Uses mobile app [Biometrics]" },
    },
    {
      id: "e-c4-teller-spa",
      source: "c4-person-teller",
      target: "c4-container-spa",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      label: "Reviews audits [HTTPS/SSO]",
      data: { label: "Reviews audits [HTTPS/SSO]" },
    },

    // Client Apps -> API Gateway
    {
      id: "e-c4-spa-gw",
      source: "c4-container-spa",
      target: "c4-container-gateway",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "API Requests [HTTPS]",
      data: { label: "API Requests [HTTPS]" },
    },
    {
      id: "e-c4-mob-gw",
      source: "c4-container-mobile",
      target: "c4-container-gateway",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "API Requests [gRPC-Web]",
      data: { label: "API Requests [gRPC-Web]" },
    },

    // API Gateway -> Core Service -> Database
    {
      id: "e-c4-gw-backend",
      source: "c4-container-gateway",
      target: "c4-container-backend",
      sourceHandle: "bottom-s",
      targetHandle: "top-t",
      animated: true,
      label: "Forwards [mTLS/gRPC]",
      data: { label: "Forwards [mTLS/gRPC]" },
    },
    {
      id: "e-c4-backend-db",
      source: "c4-container-backend",
      target: "c4-container-db",
      sourceHandle: "bottom-s",
      targetHandle: "top-t",
      animated: true,
      label: "Reads & writes [SQL/JDBC]",
      data: { label: "Reads & writes [SQL/JDBC]" },
    },

    // Core Service -> External Systems
    {
      id: "e-c4-backend-main",
      source: "c4-container-backend",
      target: "c4-ext-mainframe",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "Syncs settlement [MQ]",
      data: { label: "Syncs settlement [MQ]" },
    },
    {
      id: "e-c4-backend-credit",
      source: "c4-container-backend",
      target: "c4-ext-credit",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      label: "Credit score checks [REST]",
      data: { label: "Credit score checks [REST]" },
    },
    {
      id: "e-c4-backend-notif",
      source: "c4-container-backend",
      target: "c4-ext-notification",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "Dispatches alerts [HTTPS]",
      data: { label: "Dispatches alerts [HTTPS]" },
    },
  ],
};
