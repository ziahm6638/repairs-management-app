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

export const listContractors = query({
  args: {
    specialty: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    
    let contractors;
    
    if (args.isActive !== undefined) {
      contractors = await ctx.db
        .query("contractors")
        .withIndex("by_active", (q) => q.eq("isActive", args.isActive!))
        .collect();
    } else {
      contractors = await ctx.db.query("contractors").collect();
    }
    
    // Filter by specialty if provided
    const filteredContractors = args.specialty
      ? contractors.filter(c => c.specialties.includes(args.specialty!))
      : contractors;
    
    // Get repair counts for each contractor
    const contractorsWithStats = await Promise.all(
      filteredContractors.map(async (contractor) => {
        const repairs = await ctx.db
          .query("repairRequests")
          .withIndex("by_contractor", (q) => q.eq("contractorId", contractor._id))
          .collect();
        
        const activeRepairs = repairs.filter(r => ["assigned", "in_progress"].includes(r.status)).length;
        const completedRepairs = repairs.filter(r => r.status === "completed").length;
        
        return {
          ...contractor,
          activeRepairs,
          completedRepairs,
          totalRepairs: repairs.length,
        };
      })
    );
    
    return contractorsWithStats;
  },
});

export const createContractor = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    specialties: v.array(v.string()),
    hourlyRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    
    return await ctx.db.insert("contractors", {
      ...args,
      rating: undefined,
      isActive: true,
    });
  },
});

export const updateContractor = mutation({
  args: {
    contractorId: v.id("contractors"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    specialties: v.optional(v.array(v.string())),
    hourlyRate: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    
    const { contractorId, ...updates } = args;
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    await ctx.db.patch(contractorId, cleanUpdates);
    
    return contractorId;
  },
});
