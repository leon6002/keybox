import { Webhooks } from "@polar-sh/nextjs";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  
  // Catch-all handler for any webhook event
  onPayload: async (payload) => {
    console.log("Polar webhook received:", payload);
  },

  // Order events
  onOrderCreated: async (payload) => {
    console.log("Order created:", payload);
    // Handle new order creation
  },

  onOrderPaid: async (payload) => {
    console.log("Order paid:", payload);
    // Handle successful payment
    // This is where you'd unlock premium features for the user
  },

  onOrderRefunded: async (payload) => {
    console.log("Order refunded:", payload);
    // Handle refund
  },

  // Subscription events
  onSubscriptionCreated: async (payload) => {
    console.log("Subscription created:", payload);
    // Handle new subscription
  },

  onSubscriptionActive: async (payload) => {
    console.log("Subscription active:", payload);
    // Handle active subscription
    // Enable premium features for the user
  },

  onSubscriptionCanceled: async (payload) => {
    console.log("Subscription canceled:", payload);
    // Handle subscription cancellation
    // Disable premium features or set grace period
  },

  onSubscriptionRevoked: async (payload) => {
    console.log("Subscription revoked:", payload);
    // Handle subscription revocation
    // Immediately disable premium features
  },

  // Customer events
  onCustomerCreated: async (payload) => {
    console.log("Customer created:", payload);
    // Handle new customer creation
  },

  onCustomerUpdated: async (payload) => {
    console.log("Customer updated:", payload);
    // Handle customer updates
  },
});
