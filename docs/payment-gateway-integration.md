# Payment Gateway Integration Documentation

__Task: TS367 - Payment gateway integration__

## Overview

The AeroSuite Payment Gateway Integration provides a secure and flexible solution for processing
payments within the application. This feature enables:

- Secure payment processing using Stripe
- Payment history tracking and management
- Refund processing
- Integration with the rest of the application

## Architecture

The payment integration follows a layered architecture:

1. __Frontend__
   - Payment components for initiating payments
   - Payment history and details pages
   - Success and cancel pages

2. __Backend__
   - RESTful API endpoints for payment operations
   - Stripe integration service
   - MongoDB models for storing payment records

3. __Stripe Integration__
   - Checkout Sessions for payment processing
   - Webhooks for event handling
   - Refund processing

## Frontend Components

### PaymentButton

A reusable button component that initiates a Stripe payment flow when clicked.

```tsx
<PaymentButton
  amount={99.99}
  description="Premium Subscription"
  metadata={{ subscriptionId: '12345' }}
  variant="contained"
  color="primary"
  onSuccess={(sessionId) => console.log(`Payment initiated: ${sessionId}`)}
  onError={(err) => console.error('Payment error:', err)}
/>
```bash

### PaymentHistory

A component that displays a list of payment transactions with filtering and pagination.

```tsx
<PaymentHistory
  limit={10}
  showPagination={true}
  showTitle={true}
  status="completed"
/>
```bash

### PaymentDetails

A component that displays detailed information about a specific payment, including refund
functionality.

```tsx
<PaymentDetails
  paymentId="60d21b4667d0d8992e610c85"
  onRefund={(payment) => console.log('Payment refunded:', payment)}
/>
```bash

## Pages

- __PaymentPage__: Main page for viewing payment history with tabs for different payment statuses
- __PaymentDetailPage__: Page for viewing detailed information about a specific payment
- __PaymentSuccessPage__: Page displayed after a successful payment
- __PaymentCancelPage__: Page displayed when a payment is cancelled

## Backend API

### Endpoints

| Method | Endpoint                     | Description                                 |
|--------|------------------------------|---------------------------------------------|
| POST   | `/api/v1/payments/create-session` | Create a Stripe checkout session           |
| POST   | `/api/v1/payments/webhook`   | Handle Stripe webhooks                      |
| GET    | `/api/v1/payments/history`   | Get payment history for the current user    |
| GET    | `/api/v1/payments/:id`       | Get payment details by ID                   |
| POST   | `/api/v1/payments/:id/refund`| Create a refund for a payment               |

### Models

#### Payment

```javascript
{
  amount: Number,          // Payment amount
  currency: String,        // Currency code (e.g., 'usd')
  description: String,     // Payment description (optional)
  status: String,          // Payment status (pending, completed, failed, refunded, canceled)
  sessionId: String,       // Stripe checkout session ID
  paymentIntentId: String, // Stripe payment intent ID
  chargeId: String,        // Stripe charge ID
  paymentMethod: String,   // Payment method used
  refunded: Boolean,       // Whether the payment has been refunded
  refundId: String,        // Stripe refund ID (if refunded)
  failureReason: String,   // Reason for failure (if failed)
  metadata: Object,        // Additional metadata
  userId: ObjectId,        // User who made the payment
  createdAt: Date,         // Creation timestamp
  updatedAt: Date          // Last update timestamp
}
```bash

## Stripe Integration

### Checkout Sessions

Stripe Checkout is used to securely collect payment information from customers. The integration
process involves:

1. Creating a checkout session with product details
2. Redirecting the customer to the Stripe-hosted checkout page
3. Handling the success or cancellation redirect
4. Processing the payment result via webhooks

### Webhooks

Webhooks are used to receive events from Stripe, such as when a payment is completed or fails. The
webhook endpoint handles:

- `checkout.session.completed`: When a checkout session is completed successfully
- `payment_intent.succeeded`: When a payment intent is successful
- `payment_intent.payment_failed`: When a payment intent fails

### Refunds

Refunds are processed through the Stripe API and tracked in the local database. The refund process
involves:

1. Verifying that the payment exists and is eligible for refund
2. Creating a refund through the Stripe API
3. Updating the payment record in the database

## Configuration

### Environment Variables

The following environment variables are used for configuration:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=http://localhost:3000/payment-success
STRIPE_CANCEL_URL=http://localhost:3000/payment-cancel
```bash

### Stripe Dashboard Setup

1. Create a Stripe account at https://stripe.com
2. Get API keys from the Stripe Dashboard
3. Configure webhooks in the Stripe Dashboard
4. Set up products and prices (optional)

## Security Considerations

1. __PCI Compliance__: By using Stripe Checkout, the application avoids handling credit card data
directly, ensuring PCI compliance.

2. __Webhook Signature Verification__: All webhook events are verified using the Stripe signature
to prevent tampering.

3. __Authentication__: All payment endpoints (except webhooks) require authentication.

4. __Authorization__: Users can only access their own payment records.

5. __Data Protection__: Sensitive payment data is stored in Stripe, not in the application database.

## Testing

### Test Cards

For testing payments in the development environment, use Stripe's test cards:

- __Successful payment__: 4242 4242 4242 4242
- __Authentication required__: 4000 0025 0000 3155
- __Payment declined__: 4000 0000 0000 9995

### Testing Webhooks

For testing webhooks locally:

1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run `stripe listen --forward-to localhost:3000/api/v1/payments/webhook`
3. Use the webhook signing secret provided by the CLI

## Usage Examples

### Creating a Payment

```javascript
// Frontend
const handlePayment = async () => {
  try {
    const session = await PaymentService.createSession(
      99.99,
      'Premium Subscription',
      { subscriptionId: '12345' }
    );
    window.location.href = session.url;
  } catch (error) {
    console.error('Payment error:', error);
  }
};

// Backend API
fetch('/api/v1/payments/create-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    amount: 99.99,
    description: 'Premium Subscription',
    metadata: { subscriptionId: '12345' }
  })
});
```bash

### Processing a Refund

```javascript
// Frontend
const handleRefund = async (paymentId) => {
  try {
    const refundedPayment = await PaymentService.createRefund(
      paymentId,
      'Customer requested'
    );
    console.log('Refund processed:', refundedPayment);
  } catch (error) {
    console.error('Refund error:', error);
  }
};

// Backend API
fetch('/api/v1/payments/60d21b4667d0d8992e610c85/refund', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    reason: 'Customer requested'
  })
});
```bash

## Troubleshooting

### Common Issues

1. __Payment Fails__: Check the payment status and failure reason in the Stripe Dashboard.

2. __Webhook Not Received__: Ensure the webhook URL is correctly configured and accessible.

3. __Refund Fails__: Verify that the payment is eligible for refund and that the Stripe API key has
refund permissions.

### Debugging

1. __Check Logs__: Payment-related activities are logged for debugging purposes.

2. __Stripe Dashboard__: Use the Stripe Dashboard to view detailed payment information and logs.

3. __Test Mode__: Use Stripe's test mode for development and testing.

## Future Enhancements

1. __Subscription Management__: Support for recurring subscriptions.

2. __Multiple Payment Methods__: Support for additional payment methods beyond credit cards.

3. __Payment Analytics__: Enhanced reporting and analytics for payment data.

4. __Multi-Currency Support__: Support for multiple currencies.

5. __Invoicing__: Generation and management of invoices.

## Conclusion

The AeroSuite Payment Gateway Integration provides a secure and flexible solution for processing
payments within the application. By leveraging Stripe's robust payment infrastructure, the
application can offer a seamless payment experience while maintaining high security standards.
