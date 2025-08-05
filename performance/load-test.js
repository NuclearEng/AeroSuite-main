/**
 * load-test.js
 *
 * k6 load test script for AeroSuite
 * Tests supplier, customer, and inspection endpoints
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 }
  ]
};

const BASE_URL = 'http://localhost:5000/api/v1';

export default function () {
  // Supplier endpoint
  let res1 = http.get(`${BASE_URL}/suppliers`);
  check(res1, { 'status 200': r => r.status === 200, 'response time < 500ms': r => r.timings.duration < 500 });

  // Customer endpoint
  let res2 = http.get(`${BASE_URL}/customers`);
  check(res2, { 'status 200': r => r.status === 200, 'response time < 500ms': r => r.timings.duration < 500 });

  // Inspection endpoint
  let res3 = http.get(`${BASE_URL}/inspections`);
  check(res3, { 'status 200': r => r.status === 200, 'response time < 500ms': r => r.timings.duration < 500 });

  sleep(1);
} 