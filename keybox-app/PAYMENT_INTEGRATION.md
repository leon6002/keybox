# Polar Payment Integration

This document describes the complete Polar payment integration implemented in the KeyBox application.

## Overview

The payment system uses Polar.sh for handling subscriptions and payments, with complete webhook integration for real-time subscription management and premium feature activation.

## Components

### 1. API Routes

#### Checkout (`/api/checkout`)
- Handles payment checkout redirects
- Configured with Polar access token and environment
- Supports query parameters for customer info and product selection

#### Customer Portal (`/api/portal`)
- Provides access to customer billing portal
- Allows customers to manage their subscriptions
- Requires customer ID for access

#### Webhooks (`/api/webhook/polar`)
- Processes all Polar webhook events
- Handles order creation, payment, refunds
- Manages subscription lifecycle events
- Updates user subscription status in database

### 2. Database Schema

#### Subscriptions Table (`keybox_subscriptions`)
- Stores user subscription information
- Links to Polar customer and subscription IDs
- Tracks subscription status and premium features
- Includes billing period information

#### Payment Events Table (`keybox_payment_events`)
- Audit trail for all payment events
- Stores webhook payloads for debugging
- Tracks event processing status

### 3. Services

#### SubscriptionService
- Manages user subscriptions
- Handles premium feature activation/deactivation
- Provides subscription status queries
- Logs payment events

### 4. React Hooks

#### usePremiumFeatures
- Provides subscription status and premium features
- Handles feature access checks
- Generates upgrade and portal URLs
- Refreshes subscription data

### 5. UI Components

#### PremiumBadge
- Shows current subscription status
- Provides upgrade prompts for free users
- Displays plan type (Free/Pro/Enterprise)

#### FeatureLock
- Blocks access to premium features
- Shows upgrade prompts with blur overlay
- Customizable titles and descriptions

#### PremiumTooltip
- Shows tooltips on disabled premium features
- Provides visual feedback for feature restrictions

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# Polar Configuration
POLAR_ACCESS_TOKEN=your_polar_access_token_here
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret_here
POLAR_ENV=sandbox  # or 'production'
SUCCESS_URL=https://your-domain.com/payment/success?checkout_id={CHECKOUT_ID}

# Product IDs
POLAR_PRODUCT_ID_PRO_MONTHLY=your_pro_monthly_product_id
POLAR_PRODUCT_ID_PRO_YEARLY=your_pro_yearly_product_id
POLAR_PRODUCT_ID_ENTERPRISE_MONTHLY=your_enterprise_monthly_product_id
POLAR_PRODUCT_ID_ENTERPRISE_YEARLY=your_enterprise_yearly_product_id

# Public Product IDs (for client-side)
NEXT_PUBLIC_POLAR_PRODUCT_ID_PRO=your_pro_monthly_product_id
NEXT_PUBLIC_POLAR_PRODUCT_ID_ENTERPRISE=your_enterprise_monthly_product_id
```

## Setup Instructions

### 1. Polar Dashboard Setup
1. Create a Polar account and organization
2. Create products for your subscription plans
3. Configure webhook endpoints pointing to `/api/webhook/polar`
4. Get your access token and webhook secret
5. Note down product IDs for each plan

### 2. Database Migration
Run the database migration to create subscription tables:
```sql
-- The migration is in supabase/migrations/001_create_encrypted_schema.sql
-- It includes the subscription and payment events tables
```

### 3. Environment Configuration
1. Copy `.env.example` to `.env.local`
2. Fill in your Polar credentials and product IDs
3. Set `POLAR_ENV` to `sandbox` for testing, `production` for live

### 4. Webhook Configuration
In your Polar dashboard:
1. Go to Webhooks settings
2. Add webhook URL: `https://your-domain.com/api/webhook/polar`
3. Select all relevant events (orders, subscriptions, customers)
4. Copy the webhook secret to your environment variables

## Testing

### Test Page
Visit `/test-payment` to test the integration:
- View current subscription status
- Test checkout flows for different plans
- See premium feature demonstrations
- Access customer portal (if subscribed)

### Webhook Testing
1. Use Polar's webhook testing tools
2. Monitor console logs for webhook events
3. Check database for subscription updates
4. Verify premium features are activated/deactivated

## Premium Features

The system supports the following premium features:

### Pro Plan
- Unlimited passwords
- Advanced encryption
- Cloud sync
- Advanced import/export
- Password strength analysis
- Priority support
- Custom categories
- Two-factor auth

### Enterprise Plan
- All Pro features
- Secure sharing
- Audit logs
- Team management (future)
- SSO integration (future)
- API access (future)

## Usage Examples

### Check Premium Status
```tsx
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';

function MyComponent() {
  const { isPremium, hasFeature } = usePremiumFeatures();
  
  if (hasFeature('cloudSync')) {
    // Show cloud sync feature
  }
}
```

### Feature Gating
```tsx
import { PremiumFeatureGate } from '@/hooks/usePremiumFeatures';

<PremiumFeatureGate 
  feature="advancedEncryption"
  fallback={<UpgradePrompt />}
>
  <AdvancedEncryptionSettings />
</PremiumFeatureGate>
```

### Premium Components
```tsx
import { PremiumBadge, FeatureLock } from '@/components/premium/PremiumBadge';

// Show subscription status
<PremiumBadge />

// Lock premium features
<FeatureLock feature="auditLogs" title="Audit Logs">
  <AuditLogViewer />
</FeatureLock>
```

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is publicly accessible
   - Verify webhook secret matches
   - Check Polar dashboard webhook logs

2. **Subscription not activating**
   - Check user email matches between Google auth and Polar
   - Verify webhook events are being processed
   - Check database subscription records

3. **Premium features not working**
   - Refresh subscription status
   - Check feature flags in database
   - Verify subscription is active

### Debug Tools
- Check `/test-payment` page for current status
- Monitor browser console for errors
- Check server logs for webhook processing
- Use Polar dashboard for payment status

## Security Considerations

1. **Webhook Security**
   - Always verify webhook signatures
   - Use HTTPS for webhook endpoints
   - Store webhook secrets securely

2. **Feature Access**
   - Always verify premium status server-side
   - Don't rely solely on client-side checks
   - Implement proper authorization

3. **Data Protection**
   - Encrypt sensitive subscription data
   - Follow GDPR/privacy regulations
   - Implement proper access controls

## Future Enhancements

1. **Team Management**
   - Multi-user subscriptions
   - Role-based access control
   - Team billing management

2. **Advanced Features**
   - Usage analytics
   - Custom integrations
   - API access management

3. **Billing Improvements**
   - Proration handling
   - Dunning management
   - Invoice customization
