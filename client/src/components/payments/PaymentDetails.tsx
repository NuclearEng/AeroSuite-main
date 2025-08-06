import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField } from
'@mui/material';
import PaymentService, { Payment } from '../../services/PaymentService';
import { format } from 'date-fns';

interface PaymentDetailsProps {
  paymentId: string;
  onRefund?: (payment: Payment) => void;
}

/**
 * Payment Details Component
 * 
 * Displays detailed information about a payment
 * Task: TS367 - Payment gateway integration
 */
const PaymentDetails: React.FC<PaymentDetailsProps> = ({ paymentId, onRefund }) => {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchPaymentDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PaymentService.getPaymentById(paymentId);
      setPayment(data);
    } catch (_err) {
      console.error("Error:", _error);
      setError('Failed to load payment details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paymentId) {
      fetchPaymentDetails();
    }
  }, [paymentId]);

  const handleRefund = async () => {
    if (!payment) return;

    setProcessing(true);
    try {
      const updatedPayment = await PaymentService.createRefund(payment._id, refundReason);
      setPayment(updatedPayment);
      setRefundDialogOpen(false);

      if (onRefund) {
        onRefund(updatedPayment);
      }
    } catch (_err) {
      console.error("Error:", _error);
      setError('Failed to process refund. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm:ss a');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'info';
      case 'canceled':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>);

  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>);

  }

  if (!payment) {
    return (
      <Box p={2} textAlign="center">
        <Typography color="textSecondary">Payment not found</Typography>
      </Box>);

  }

  return (
    <>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box mb={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Typography variant="h5">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: payment.currency.toUpperCase()
                }).format(payment.amount)}
              </Typography>
            </Grid>
            <Grid item>
              <Chip
                label={payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                color={getStatusColor(payment.status) as any} />

            </Grid>
          </Grid>
          <Typography variant="subtitle1" color="textSecondary">
            {payment.description || 'Payment'}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Payment ID
            </Typography>
            <Typography variant="body1" gutterBottom>
              {payment._id}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Date
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatDate(payment.createdAt)}
            </Typography>
          </Grid>
          {payment.paymentIntentId &&
          <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Payment Intent ID
              </Typography>
              <Typography variant="body1" gutterBottom>
                {payment.paymentIntentId}
              </Typography>
            </Grid>
          }
          {payment.chargeId &&
          <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Charge ID
              </Typography>
              <Typography variant="body1" gutterBottom>
                {payment.chargeId}
              </Typography>
            </Grid>
          }
          {payment.paymentMethod &&
          <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Payment Method
              </Typography>
              <Typography variant="body1" gutterBottom>
                {payment.paymentMethod}
              </Typography>
            </Grid>
          }
          {payment.refunded &&
          <>
              <Grid item xs={12}>
                <Alert severity="info">This payment has been refunded</Alert>
              </Grid>
              {payment.refundId &&
            <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Refund ID
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {payment.refundId}
                  </Typography>
                </Grid>
            }
            </>
          }
          {payment.failureReason &&
          <Grid item xs={12}>
              <Alert severity="error">
                <Typography variant="subtitle2">Failure Reason</Typography>
                <Typography variant="body2">{payment.failureReason}</Typography>
              </Alert>
            </Grid>
          }
        </Grid>

        {payment.status === 'completed' && !payment.refunded &&
        <>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" justifyContent="flex-end">
              <Button
              variant="outlined"
              color="error"
              onClick={() => setRefundDialogOpen(true)}>

                Issue Refund
              </Button>
            </Box>
          </>
        }
      </Paper>

      
      <Dialog open={refundDialogOpen} onClose={() => setRefundDialogOpen(false)}>
        <DialogTitle>Issue Refund</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to refund this payment? This action cannot be undone.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="reason"
            label="Reason for Refund (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            disabled={processing} />

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleRefund}
            color="error"
            variant="contained"
            disabled={processing}>

            {processing ? <CircularProgress size={24} /> : 'Issue Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </>);

};

export default PaymentDetails;