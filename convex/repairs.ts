import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function getCurrentUser(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

export const listRepairRequests = query({
  args: {
    propertyId: v.optional(v.id("properties")),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    
    let repairs;
    
    if (args.propertyId) {
      repairs = await ctx.db
        .query("repairRequests")
        .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId!))
        .collect();
    } else if (args.status) {
      repairs = await ctx.db
        .query("repairRequests")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else if (args.priority) {
      repairs = await ctx.db
        .query("repairRequests")
        .withIndex("by_priority", (q) => q.eq("priority", args.priority!))
        .collect();
    } else {
      repairs = await ctx.db.query("repairRequests").collect();
    }
    
    // Get property and contractor details for each repair
    const repairsWithDetails = await Promise.all(
      repairs.map(async (repair) => {
        const property = await ctx.db.get(repair.propertyId);
        const contractor = repair.contractorId ? await ctx.db.get(repair.contractorId) : null;
        const tenant = repair.tenantId ? await ctx.db.get(repair.tenantId) : null;
        
        return {
          ...repair,
          property,
          contractor,
          tenant,
        };
      })
    );
    
    return repairsWithDetails;
  },
});

export const createRepairRequest = mutation({
  args: {
    propertyId: v.id("properties"),
    tenantId: v.optional(v.id("tenants")),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    priority: v.string(),
    reportedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    
    const repairId = await ctx.db.insert("repairRequests", {
      ...args,
      status: "pending",
      estimatedCost: undefined,
      actualCost: undefined,
      scheduledDate: undefined,
      completedDate: undefined,
      contractorId: undefined,
      assignedBy: undefined,
      notes: undefined,
      images: undefined,
    });
    
    // Log the creation
    await ctx.db.insert("repairUpdates", {
      repairRequestId: repairId,
      updatedBy: userId,
      updateType: "status_change",
      oldValue: undefined,
      newValue: "pending",
      notes: "Repair request created",
    });
    
    return repairId;
  },
});

export const updateRepairStatus = mutation({
  args: {
    repairId: v.id("repairRequests"),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    
    const repair = await ctx.db.get(args.repairId);
    if (!repair) {
      throw new Error("Repair request not found");
    }
    
    const oldStatus = repair.status;
    
    await ctx.db.patch(args.repairId, {
      status: args.status,
      ...(args.status === "completed" && { completedDate: Date.now() }),
    });
    
    // Log the status change
    await ctx.db.insert("repairUpdates", {
      repairRequestId: args.repairId,
      updatedBy: userId,
      updateType: "status_change",
      oldValue: oldStatus,
      newValue: args.status,
      notes: args.notes,
    });
    
    return args.repairId;
  },
});

export const assignContractor = mutation({
  args: {
    repairId: v.id("repairRequests"),
    contractorId: v.id("contractors"),
    scheduledDate: v.optional(v.number()),
    estimatedCost: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    
    const repair = await ctx.db.get(args.repairId);
    if (!repair) {
      throw new Error("Repair request not found");
    }
    
    await ctx.db.patch(args.repairId, {
      contractorId: args.contractorId,
      assignedBy: userId,
      status: "assigned",
      scheduledDate: args.scheduledDate,
      estimatedCost: args.estimatedCost,
    });
    
    // Log the assignment
    await ctx.db.insert("repairUpdates", {
      repairRequestId: args.repairId,
      updatedBy: userId,
      updateType: "assignment",
      newValue: args.contractorId,
      notes: args.notes || "Contractor assigned",
    });
    
    return args.repairId;
  },
});

export const getRepairDetails = query({
  args: { repairId: v.id("repairRequests") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    
    const repair = await ctx.db.get(args.repairId);
    if (!repair) {
      return null;
    }
    
    const property = await ctx.db.get(repair.propertyId);
    const contractor = repair.contractorId ? await ctx.db.get(repair.contractorId) : null;
    const tenant = repair.tenantId ? await ctx.db.get(repair.tenantId) : null;
    const assignedBy = repair.assignedBy ? await ctx.db.get(repair.assignedBy) : null;
    
    // Get repair updates
    const updates = await ctx.db
      .query("repairUpdates")
      .withIndex("by_repair", (q) => q.eq("repairRequestId", args.repairId))
      .collect();
    
    const updatesWithUsers = await Promise.all(
      updates.map(async (update) => {
        const user = await ctx.db.get(update.updatedBy);
        return { ...update, user };
      })
    );
    
    return {
      ...repair,
      property,
      contractor,
      tenant,
      assignedBy,
      updates: updatesWithUsers,
    };
  },
});
