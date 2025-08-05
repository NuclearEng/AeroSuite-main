# Payment Gateway Integration Documentation

**Task: TS367 - Payment gateway integration**

## Overview

The AeroSuite Payment Gateway Integration provides a secure and flexible solution for processing payments within the application. This feature enables:

- Secure payment processing using Stripe
- Payment history tracking and management
- Refund processing
- Integration with the rest of the application

## Architecture

The payment integration follows a layered architecture:

1. **Frontend**
   - Payment components for initiating payments
   - Payment history and details pages
   - Success and cancel pages

2. **Backend**
   - RESTful API endpoints for payment operations
   - Stripe integration service
   - MongoDB models for storing payment records

3. **Stripe Integration**
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
```

### PaymentHistory

A component that displays a list of payment transactions with filtering and pagination.

```tsx
<PaymentHistory
  limit={10}
  showPagination={true}
  showTitle={true}
  status="completed"
/>
```

### PaymentDetails

A component that displays detailed information about a specific payment, including refund functionality.

```tsx
<PaymentDetails
  paymentId="60d21b4667d0d8992e610c85"
  onRefund={(payment) => console.log('Payment refunded:', payment)}
/>
```

## Pages

- **PaymentPage**: Main page for viewing payment history with tabs for different payment statuses
- **PaymentDetailPage**: Page for viewing detailed information about a specific payment
- **PaymentSuccessPage**: Page displayed after a successful payment
- **PaymentCancelPage**: Page displayed when a payment is cancelled

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
```

## Stripe Integration

### Checkout Sessions

Stripe Checkout is used to securely collect payment information from customers. The integration process involves:

1. Creating a checkout session with product details
2. Redirecting the customer to the Stripe-hosted checkout page
3. Handling the success or cancellation redirect
4. Processing the payment result via webhooks

### Webhooks

Webhooks are used to receive events from Stripe, such as when a payment is completed or fails. The webhook endpoint handles:

- `checkout.session.completed`: When a checkout session is completed successfully
- `payment_intent.succeeded`: When a payment intent is successful
- `payment_intent.payment_failed`: When a payment intent fails

### Refunds

Refunds are processed through the Stripe API and tracked in the local database. The refund process involves:

1. Verifying that the payment exists and is eligible for refund
2. Creating a refund through the Stripe API
3. Updating the payment record in the database

## Configuration

### Environment Variables

The following environment variables are used for configuration:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=http://localhost:3000/payment-success
STRIPE_CANCEL_URL=http://localhost:3000/payment-cancel
```

### Stripe Dashboard Setup

1. Create a Stripe account at https://stripe.com
2. Get API keys from the Stripe Dashboard
3. Configure webhooks in the Stripe Dashboard
4. Set up products and prices (optional)

## Security Considerations

1. **PCI Compliance**: By using Stripe Checkout, the application avoids handling credit card data directly, ensuring PCI compliance.

2. **Webhook Signature Verification**: All webhook events are verified using the Stripe signature to prevent tampering.

3. **Authentication**: All payment endpoints (except webhooks) require authentication.

4. **Authorization**: Users can only access their own payment records.

5. **Data Protection**: Sensitive payment data is stored in Stripe, not in the application database.

## Testing

### Test Cards

For testing payments in the development environment, use Stripe's test cards:

- **Successful payment**: 4242 4242 4242 4242
- **Authentication required**: 4000 0025 0000 3155
- **Payment declined**: 4000 0000 0000 9995

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
```

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
```

## Troubleshooting

### Common Issues

1. **Payment Fails**: Check the payment status and failure reason in the Stripe Dashboard.

2. **Webhook Not Received**: Ensure the webhook URL is correctly configured and accessible.

3. **Refund Fails**: Verify that the payment is eligible for refund and that the Stripe API key has refund permissions.

### Debugging

1. **Check Logs**: Payment-related activities are logged for debugging purposes.

2. **Stripe Dashboard**: Use the Stripe Dashboard to view detailed payment information and logs.

3. **Test Mode**: Use Stripe's test mode for development and testing.

## Future Enhancements

1. **Subscription Management**: Support for recurring subscriptions.

2. **Multiple Payment Methods**: Support for additional payment methods beyond credit cards.

3. **Payment Analytics**: Enhanced reporting and analytics for payment data.

4. **Multi-Currency Support**: Support for multiple currencies.

5. **Invoicing**: Generation and management of invoices.

## Conclusion

The AeroSuite Payment Gateway Integration provides a secure and flexible solution for processing payments within the application. By leveraging Stripe's robust payment infrastructure, the application can offer a seamless payment experience while maintaining high security standards. 