/**
 * @fileoverview System architecture template for a Global E-Commerce Platform.
 */

import type { Template } from "@/data/templates";

/**
 * Global E-Commerce Platform architecture template.
 */
export const ECOMMERCE_TEMPLATE: Template = {
  id: "ecommerce-platform",
  name: "Global E-Commerce Platform",
  category: "architecture",
  description:
    "High-throughput microservices architecture with edge CDN, Kubernetes API gateway, Kafka event streaming, Redis caching, and Aurora PostgreSQL.",
  nodes: [
    // Group 1: Edge & Ingress
    {
      id: "grp-edge",
      type: "group",
      position: { x: 60, y: 100 },
      data: {
        label: "Edge & Ingress Tier",
        category: "flow",
      },
      style: {
        width: 320,
        height: 520,
        backgroundColor: "oklch(0.5 0 0 / 0.02)",
        border: "1.5px dotted oklch(0.5 0 0 / 0.25)",
        borderRadius: 18,
      },
    },
    {
      id: "node-client",
      type: "diagram",
      parentId: "grp-edge",
      position: { x: 30, y: 60 },
      data: {
        label: "Storefront & Mobile App",
        category: "frontend",
        subtype: "web-app",
        icon: "IconBrowser",
        description: "Next.js web storefront & native mobile clients",
      },
    },
    {
      id: "node-cdn",
      type: "diagram",
      parentId: "grp-edge",
      position: { x: 30, y: 210 },
      data: {
        label: "Cloudflare Edge CDN",
        category: "cloud",
        subtype: "cdn",
        icon: "IconWorld",
        description: "Static caching, DDoS mitigation & WAF",
      },
    },
    {
      id: "node-apigw",
      type: "diagram",
      parentId: "grp-edge",
      position: { x: 30, y: 360 },
      data: {
        label: "Kong API Gateway",
        category: "microservice",
        subtype: "api-gateway",
        icon: "IconApi",
        description: "SSL termination, JWT auth & rate limiting",
      },
    },

    // Group 2: Core Microservices (K8s Cluster)
    {
      id: "grp-services",
      type: "group",
      position: { x: 480, y: 60 },
      data: {
        label: "Kubernetes Core Microservices",
        category: "flow",
      },
      style: {
        width: 320,
        height: 590,
        backgroundColor: "oklch(0.5 0 0 / 0.02)",
        border: "1.5px dotted oklch(0.5 0 0 / 0.25)",
        borderRadius: 18,
      },
    },
    {
      id: "node-auth-svc",
      type: "diagram",
      parentId: "grp-services",
      position: { x: 30, y: 50 },
      data: {
        label: "Auth & Identity Service",
        category: "microservice",
        subtype: "service",
        icon: "IconLock",
        description: "OAuth2 / OIDC token issuance & session validation",
      },
    },
    {
      id: "node-catalog-svc",
      type: "diagram",
      parentId: "grp-services",
      position: { x: 30, y: 180 },
      data: {
        label: "Product Catalog Service",
        category: "microservice",
        subtype: "service",
        icon: "IconBox",
        description: "Product inventory, categories & dynamic pricing",
      },
    },
    {
      id: "node-cart-svc",
      type: "diagram",
      parentId: "grp-services",
      position: { x: 30, y: 310 },
      data: {
        label: "Cart & Checkout Service",
        category: "microservice",
        subtype: "service",
        icon: "IconShoppingCart",
        description: "Active cart sessions & checkout coordination",
      },
    },
    {
      id: "node-order-svc",
      type: "diagram",
      parentId: "grp-services",
      position: { x: 30, y: 440 },
      data: {
        label: "Order Fulfillment Service",
        category: "microservice",
        subtype: "service",
        icon: "IconReceipt2",
        description: "Order lifecycle, invoicing & shipment tracking",
      },
    },

    // Group 3: Event Mesh & Workers
    {
      id: "grp-events",
      type: "group",
      position: { x: 900, y: 100 },
      data: {
        label: "Async Event Processing Tier",
        category: "flow",
      },
      style: {
        width: 320,
        height: 520,
        backgroundColor: "oklch(0.5 0 0 / 0.02)",
        border: "1.5px dotted oklch(0.5 0 0 / 0.25)",
        borderRadius: 18,
      },
    },
    {
      id: "node-kafka",
      type: "diagram",
      parentId: "grp-events",
      position: { x: 30, y: 60 },
      data: {
        label: "Kafka Event Broker",
        category: "microservice",
        subtype: "message-queue",
        icon: "IconStack2",
        description: "Partitioned order, inventory & payment event bus",
      },
    },
    {
      id: "node-payment-worker",
      type: "diagram",
      parentId: "grp-events",
      position: { x: 30, y: 210 },
      data: {
        label: "Payment Processor Worker",
        category: "microservice",
        subtype: "service",
        icon: "IconCreditCard",
        description: "Stripe webhook consumer & payment capture",
      },
    },
    {
      id: "node-notify-worker",
      type: "diagram",
      parentId: "grp-events",
      position: { x: 30, y: 360 },
      data: {
        label: "Notification Dispatcher",
        category: "microservice",
        subtype: "lambda",
        icon: "IconBolt",
        description: "Async transactional email & SMS delivery",
      },
    },

    // Group 4: Data & Persistence
    {
      id: "grp-storage",
      type: "group",
      position: { x: 1320, y: 60 },
      data: {
        label: "Data Persistence & Cache Layer",
        category: "flow",
      },
      style: {
        width: 320,
        height: 590,
        backgroundColor: "oklch(0.5 0 0 / 0.02)",
        border: "1.5px dotted oklch(0.5 0 0 / 0.25)",
        borderRadius: 18,
      },
    },
    {
      id: "node-redis",
      type: "diagram",
      parentId: "grp-storage",
      position: { x: 30, y: 50 },
      data: {
        label: "Redis Cluster Cache",
        category: "database",
        subtype: "redis",
        icon: "IconCpu",
        description: "Sub-millisecond active cart state & token cache",
      },
    },
    {
      id: "node-elastic",
      type: "diagram",
      parentId: "grp-storage",
      position: { x: 30, y: 180 },
      data: {
        label: "Elasticsearch Index",
        category: "database",
        subtype: "elasticsearch",
        icon: "IconZoomCode",
        description: "Full-text search, facets & catalog filtering",
      },
    },
    {
      id: "node-postgres-primary",
      type: "diagram",
      parentId: "grp-storage",
      position: { x: 30, y: 310 },
      data: {
        label: "Aurora PostgreSQL DB",
        category: "database",
        subtype: "postgres",
        icon: "IconDatabase",
        description: "ACID transactional relational order & customer DB",
      },
    },
    {
      id: "node-s3-assets",
      type: "diagram",
      parentId: "grp-storage",
      position: { x: 30, y: 440 },
      data: {
        label: "S3 Product Media Store",
        category: "cloud",
        subtype: "s3",
        icon: "IconBucket",
        description: "Object storage for product photography & invoices",
      },
    },
  ],
  edges: [
    // Ingress Flow (Vertical)
    {
      id: "e-client-cdn",
      source: "node-client",
      target: "node-cdn",
      sourceHandle: "bottom-s",
      targetHandle: "top-t",
      animated: true,
      label: "HTTPS Traffic",
      data: { label: "HTTPS Traffic" },
    },
    {
      id: "e-cdn-apigw",
      source: "node-cdn",
      target: "node-apigw",
      sourceHandle: "bottom-s",
      targetHandle: "top-t",
      animated: true,
      label: "Origin Request",
      data: { label: "Origin Request" },
    },

    // Ingress -> Microservices (Horizontal)
    {
      id: "e-apigw-auth",
      source: "node-apigw",
      target: "node-auth-svc",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "Auth Token Verify",
      data: { label: "Auth Token Verify" },
    },
    {
      id: "e-apigw-catalog",
      source: "node-apigw",
      target: "node-catalog-svc",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "GET /products",
      data: { label: "GET /products" },
    },
    {
      id: "e-apigw-cart",
      source: "node-apigw",
      target: "node-cart-svc",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "POST /cart",
      data: { label: "POST /cart" },
    },
    {
      id: "e-apigw-order",
      source: "node-apigw",
      target: "node-order-svc",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "POST /orders",
      data: { label: "POST /orders" },
    },

    // Services -> Persistence (Horizontal)
    {
      id: "e-cart-redis",
      source: "node-cart-svc",
      target: "node-redis",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "Session Read/Write",
      data: { label: "Session Read/Write" },
    },
    {
      id: "e-catalog-elastic",
      source: "node-catalog-svc",
      target: "node-elastic",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "Search & Filter",
      data: { label: "Search & Filter" },
    },
    {
      id: "e-catalog-s3",
      source: "node-catalog-svc",
      target: "node-s3-assets",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      label: "Static Images",
      data: { label: "Static Images" },
    },

    // Orders -> Event Stream (Horizontal)
    {
      id: "e-order-kafka",
      source: "node-order-svc",
      target: "node-kafka",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "Publish OrderCreated",
      data: { label: "Publish OrderCreated" },
    },
    {
      id: "e-order-db",
      source: "node-order-svc",
      target: "node-postgres-primary",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "ACID Transaction",
      data: { label: "ACID Transaction" },
    },

    // Event Stream -> Workers (Vertical / Lateral)
    {
      id: "e-kafka-payment",
      source: "node-kafka",
      target: "node-payment-worker",
      sourceHandle: "bottom-s",
      targetHandle: "top-t",
      animated: true,
      label: "Consume 'orders.new'",
      data: { label: "Consume 'orders.new'" },
    },
    {
      id: "e-payment-notify",
      source: "node-payment-worker",
      target: "node-notify-worker",
      sourceHandle: "bottom-s",
      targetHandle: "top-t",
      animated: true,
      label: "Trigger 'payment.success'",
      data: { label: "Trigger 'payment.success'" },
    },
  ],
};
