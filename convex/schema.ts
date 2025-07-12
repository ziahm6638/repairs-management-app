import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  properties: defineTable({
    address: v.string(),
    landlordId: v.id("users"),
    agentId: v.optional(v.id("users")),
    type: v.string(), // "apartment", "house", "commercial"
    units: v.optional(v.number()),
  }).index("by_landlord", ["landlordId"])
    .index("by_agent", ["agentId"]),

  tenants: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    propertyId: v.id("properties"),
    unit: v.optional(v.string()),
    leaseStart: v.number(),
    leaseEnd: v.number(),
  }).index("by_property", ["propertyId"])
    .index("by_email", ["email"]),

  contractors: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    specialties: v.array(v.string()), // ["plumbing", "electrical", "hvac", "general"]
    rating: v.optional(v.number()),
    hourlyRate: v.optional(v.number()),
    isActive: v.boolean(),
  }).index("by_specialty", ["specialties"])
    .index("by_active", ["isActive"]),

  repairRequests: defineTable({
    propertyId: v.id("properties"),
    tenantId: v.optional(v.id("tenants")),
    title: v.string(),
    description: v.string(),
    category: v.string(), // "plumbing", "electrical", "hvac", "appliance", "structural", "other"
    priority: v.string(), // "low", "medium", "high", "emergency"
    status: v.string(), // "pending", "assigned", "in_progress", "completed", "cancelled"
    reportedBy: v.string(), // "tenant", "landlord", "agent", "inspection"
    contractorId: v.optional(v.id("contractors")),
    assignedBy: v.optional(v.id("users")),
    estimatedCost: v.optional(v.number()),
    actualCost: v.optional(v.number()),
    scheduledDate: v.optional(v.number()),
    completedDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    images: v.optional(v.array(v.id("_storage"))),
  }).index("by_property", ["propertyId"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_contractor", ["contractorId"])
    .index("by_category", ["category"]),

  repairUpdates: defineTable({
    repairRequestId: v.id("repairRequests"),
    updatedBy: v.id("users"),
    updateType: v.string(), // "status_change", "assignment", "note", "cost_update"
    oldValue: v.optional(v.string()),
    newValue: v.optional(v.string()),
    notes: v.optional(v.string()),
  }).index("by_repair", ["repairRequestId"]),

  userProfiles: defineTable({
    userId: v.id("users"),
    role: v.string(), // "landlord", "agent", "admin"
    companyName: v.optional(v.string()),
    phone: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_role", ["role"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
