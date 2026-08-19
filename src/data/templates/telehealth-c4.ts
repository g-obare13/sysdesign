/**
 * @fileoverview C4 Model diagram template for a Telehealth & Clinical EHR Platform.
 */

import type { Template } from "@/data/templates";

/**
 * Telehealth & Clinical EHR Platform C4 architecture template.
 */
export const TELEHEALTH_C4_TEMPLATE: Template = {
  id: "telehealth-ehr-c4",
  name: "Telehealth & Clinical EHR Platform (C4 Model)",
  category: "c4",
  description:
    "C4 Model for a HIPAA-compliant telehealth platform with patient portal, physician consultation console, WebRTC streaming gateway, and FHIR clinical records service.",
  nodes: [
    // Person 1: Patient
    {
      id: "c4-th-patient",
      type: "diagram",
      position: { x: 60, y: 140 },
      data: {
        label: "Patient",
        category: "c4",
        subtype: "c4-person",
        icon: "IconUserHeart",
        c4Level: "context",
        description: "Patient seeking remote medical consultation and prescription refills",
      },
    },

    // Person 2: Physician / Specialist
    {
      id: "c4-th-doctor",
      type: "diagram",
      position: { x: 60, y: 380 },
      data: {
        label: "Medical Doctor / Specialist",
        category: "c4",
        subtype: "c4-person",
        icon: "IconStethoscope",
        c4Level: "context",
        description: "Licensed practitioner conducting virtual exams and prescribing treatments",
      },
    },

    // System Boundary: Telehealth & Clinical EHR Platform
    {
      id: "grp-telehealth-system",
      type: "group",
      position: { x: 420, y: 60 },
      data: {
        label: "Telehealth & EHR Software System",
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
      id: "c4-th-portal",
      type: "diagram",
      parentId: "grp-telehealth-system",
      position: { x: 30, y: 80 },
      data: {
        label: "Patient Portal Web App",
        category: "c4",
        subtype: "c4-container",
        icon: "IconBrowser",
        technology: "Next.js 15, React, Tailwind",
        c4Level: "container",
        description: "Responsive portal for appointment scheduling, intake forms, and test results",
      },
    },
    {
      id: "c4-th-doctor-console",
      type: "diagram",
      parentId: "grp-telehealth-system",
      position: { x: 30, y: 280 },
      data: {
        label: "Physician Clinical Workspace",
        category: "c4",
        subtype: "c4-container",
        icon: "IconDeviceDesktop",
        technology: "React, WebRTC client",
        c4Level: "container",
        description: "Secure medical desktop app for video exams, charting, and live vitals",
      },
    },
    {
      id: "c4-th-video-gw",
      type: "diagram",
      parentId: "grp-telehealth-system",
      position: { x: 370, y: 60 },
      data: {
        label: "Video & Media Relay Gateway",
        category: "c4",
        subtype: "c4-container",
        icon: "IconVideo",
        technology: "mediasoup, WebRTC, C++ SFU",
        c4Level: "container",
        description: "End-to-end encrypted selective forwarding unit for clinical video streams",
      },
    },
    {
      id: "c4-th-fhir-service",
      type: "diagram",
      parentId: "grp-telehealth-system",
      position: { x: 370, y: 220 },
      data: {
        label: "FHIR Clinical Records Service",
        category: "c4",
        subtype: "c4-container",
        icon: "IconHeartRateMonitor",
        technology: ".NET 8, C#, HAPI FHIR",
        c4Level: "container",
        description: "HL7 FHIR R4-compliant service handling electronic medical records (EMR)",
      },
    },
    {
      id: "c4-th-db",
      type: "diagram",
      parentId: "grp-telehealth-system",
      position: { x: 370, y: 380 },
      data: {
        label: "Encrypted Health Database",
        category: "c4",
        subtype: "c4-container",
        icon: "IconDatabase",
        technology: "PostgreSQL with TDE & AES-256",
        c4Level: "container",
        description: "HIPAA-compliant encrypted store for clinical history, vitals, and audit trails",
      },
    },

    // External System 1: National Health Insurance
    {
      id: "c4-th-insurance",
      type: "diagram",
      position: { x: 1200, y: 140 },
      data: {
        label: "Insurance Claims Clearinghouse",
        category: "c4",
        subtype: "c4-system",
        icon: "IconBuildingBank",
        isExternal: true,
        c4Level: "context",
        description: "National clearinghouse for real-time eligibility checks & claim adjudication",
      },
    },

    // External System 2: E-Prescription Fulfillment
    {
      id: "c4-th-pharmacy",
      type: "diagram",
      position: { x: 1200, y: 340 },
      data: {
        label: "Surescripts Pharmacy Network",
        category: "c4",
        subtype: "c4-system",
        icon: "IconPill",
        isExternal: true,
        c4Level: "context",
        description: "Electronic prescription routing network connecting retail pharmacies",
      },
    },
  ],
  edges: [
    // Person -> Clients
    {
      id: "e-th-pat-portal",
      source: "c4-th-patient",
      target: "c4-th-portal",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "Visits patient portal [HTTPS]",
      data: { label: "Visits patient portal [HTTPS]" },
    },
    {
      id: "e-th-doc-console",
      source: "c4-th-doctor",
      target: "c4-th-doctor-console",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "Logs into console [HTTPS/MFA]",
      data: { label: "Logs into console [HTTPS/MFA]" },
    },

    // Clients -> Video Gateway (WebRTC)
    {
      id: "e-th-portal-video",
      source: "c4-th-portal",
      target: "c4-th-video-gw",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "Video stream [SRTP/WebRTC]",
      data: { label: "Video stream [SRTP/WebRTC]" },
    },
    {
      id: "e-th-doc-video",
      source: "c4-th-doctor-console",
      target: "c4-th-video-gw",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "Video stream [SRTP/WebRTC]",
      data: { label: "Video stream [SRTP/WebRTC]" },
    },

    // Clients -> FHIR API Service
    {
      id: "e-th-portal-fhir",
      source: "c4-th-portal",
      target: "c4-th-fhir-service",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "Fetches charts [FHIR/REST]",
      data: { label: "Fetches charts [FHIR/REST]" },
    },
    {
      id: "e-th-doc-fhir",
      source: "c4-th-doctor-console",
      target: "c4-th-fhir-service",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "Updates chart [FHIR/REST]",
      data: { label: "Updates chart [FHIR/REST]" },
    },

    // FHIR API Service -> Database
    {
      id: "e-th-fhir-db",
      source: "c4-th-fhir-service",
      target: "c4-th-db",
      sourceHandle: "bottom-s",
      targetHandle: "top-t",
      animated: true,
      label: "Reads & writes [SQL/TDE]",
      data: { label: "Reads & writes [SQL/TDE]" },
    },

    // FHIR API Service -> External Integrations
    {
      id: "e-th-fhir-ins",
      source: "c4-th-fhir-service",
      target: "c4-th-insurance",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      label: "Submits claims [EDI 837]",
      data: { label: "Submits claims [EDI 837]" },
    },
    {
      id: "e-th-fhir-pharm",
      source: "c4-th-fhir-service",
      target: "c4-th-pharmacy",
      sourceHandle: "right-s",
      targetHandle: "left-t",
      animated: true,
      label: "Routes e-prescription [NCPDP]",
      data: { label: "Routes e-prescription [NCPDP]" },
    },
  ],
};
