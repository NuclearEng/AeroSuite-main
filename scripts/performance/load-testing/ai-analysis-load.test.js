// Performance/load test for AI analysis endpoint using k6
// To run: k6 run ai-analysis-load.test.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10, // number of virtual users
  duration: '30s',
};

export default function () {
  const url = 'http://localhost:3000/api/v1/ai/analysis';
  const payload = JSON.stringify({ data: [{ value: 1 }, { value: 2 }] });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(url, payload, params);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has analysis': (r) => r.json().analysis !== undefined,
  });
  sleep(1);
}

// Example Artillery YAML config or k6 script can be placed here
// See test-automation-improvement.md for details 