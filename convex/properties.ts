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

export const listProperties = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUser(ctx);
    
    // Get user's properties (as landlord or agent)
    const asLandlord = await ctx.db
      .query("properties")
      .withIndex("by_landlord", (q) => q.eq("landlordId", userId))
      .collect();
    
    const asAgent = await ctx.db
      .query("properties")
      .withIndex("by_agent", (q) => q.eq("agentId", userId))
      .collect();
    
    const allProperties = [...asLandlord, ...asAgent];
    
    // Get repair counts for each property
    const propertiesWithStats = await Promise.all(
      allProperties.map(async (property) => {
        const repairs = await ctx.db
          .query("repairRequests")
          .withIndex("by_property", (q) => q.eq("propertyId", property._id))
          .collect();
        
        const pendingRepairs = repairs.filter(r => r.status === "pending").length;
        const activeRepairs = repairs.filter(r => ["assigned", "in_progress"].includes(r.status)).length;
        
        return {
          ...property,
          totalRepairs: repairs.length,
          pendingRepairs,
          activeRepairs,
        };
      })
    );
    
    return propertiesWithStats;
  },
});

export const createProperty = mutation({
  args: {
    address: v.string(),
    type: v.string(),
    units: v.optional(v.number()),
    agentId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    
    return await ctx.db.insert("properties", {
      ...args,
      landlordId: userId,
    });
  },
});

export const getProperty = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    
    const property = await ctx.db.get(args.propertyId);
    if (!property) {
      return null;
    }
    
    // Get tenants for this property
    const tenants = await ctx.db
      .query("tenants")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();
    
    return {
      ...property,
      tenants,
    };
  },
});
