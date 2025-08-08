const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');
const VerificationOrder = require('../models/verificationOrder.model');
const VerificationResult = require('../models/verificationResult.model');
const logger = require('../infrastructure/logger');

function buildHttpsAgentFromEnv() {
  const certPath = process.env.CLIENT_CERT_PATH;
  const keyPath = process.env.CLIENT_KEY_PATH;
  const passphrase = process.env.CLIENT_KEY_PASSPHRASE || undefined;
  const caPath = process.env.CLIENT_CA_PATH;

  let cert;
  let key;
  let ca;

  if (certPath && keyPath) {
    cert = fs.readFileSync(path.resolve(certPath));
    key = fs.readFileSync(path.resolve(keyPath));
  }

  if (caPath) {
    ca = fs.readFileSync(path.resolve(caPath));
  }

  return new https.Agent({
    cert,
    key,
    ca,
    passphrase,
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  });
}

class VerificationService {
  constructor() {
    this.customerBaseUrl = process.env.CUSTOMER_API_BASE_URL || '';
    this.subscriptionHeaderKey = process.env.CUSTOMER_SUBSCRIPTION_HEADER_KEY || 'Ocp-Apim-Subscription-Key';
    this.subscriptionKey = process.env.CUSTOMER_SUBSCRIPTION_KEY || '';
    this.httpsAgent = buildHttpsAgentFromEnv();
  }

  async createOrder(orderPayload) {
    const order = await VerificationOrder.create({
      orderId: orderPayload.orderId,
      customerId: orderPayload.customerId,
      orderDetails: orderPayload,
      status: 'received',
    });
    return order.toObject();
  }

  async processOrder(orderId, processor) {
    const order = await VerificationOrder.findOne({ orderId });
    if (!order) throw new Error('Order not found');
    order.status = 'processing';
    await order.save();

    try {
      const resultPayload = await processor(order.orderDetails);
      const result = await VerificationResult.create({
        resultId: resultPayload.resultId,
        orderId: order.orderId,
        orderRef: order._id,
        status: resultPayload.status,
        details: resultPayload,
      });

      order.status = 'completed';
      order.processedAt = new Date();
      order.resultId = result._id;
      await order.save();

      return result.toObject();
    } catch (err) {
      order.status = 'failed';
      order.error = err.message;
      await order.save();
      throw err;
    }
  }

  buildAxios() {
    const headers = {};
    if (this.subscriptionKey) headers[this.subscriptionHeaderKey] = this.subscriptionKey;
    return axios.create({
      baseURL: this.customerBaseUrl,
      timeout: 15000,
      httpsAgent: this.httpsAgent,
      headers,
      validateStatus: () => true,
    });
  }

  async sendResultToCustomer(endpointPath, resultDoc, maxRetries = 3) {
    const client = this.buildAxios();
    let attempt = 0;
    let lastError = null;

    while (attempt <= maxRetries) {
      try {
        const res = await client.post(endpointPath, resultDoc.details);
        if (res.status >= 200 && res.status < 300) {
          await VerificationResult.findByIdAndUpdate(resultDoc._id, {
            sentToCustomerAt: new Date(),
            lastError: null,
          });
          return { ok: true, status: res.status, data: res.data };
        }
        lastError = new Error(`HTTP ${res.status}: ${JSON.stringify(res.data).slice(0, 500)}`);
      } catch (e) {
        lastError = e;
      }

      attempt += 1;
      await VerificationResult.findByIdAndUpdate(resultDoc._id, { $inc: { retries: 1 }, lastError: lastError?.message });
      if (attempt <= maxRetries) await new Promise((r) => setTimeout(r, Math.min(1000 * attempt, 5000)));
    }

    logger.error('Failed to send verification result', { orderId: resultDoc.orderId, error: lastError?.message });
    return { ok: false, error: lastError };
  }
}

module.exports = new VerificationService();

