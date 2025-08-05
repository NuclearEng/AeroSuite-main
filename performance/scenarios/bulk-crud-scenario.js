/**
 * bulk-crud-scenario.js
 *
 * k6 scenario for bulk CRUD operations on suppliers, customers, and components
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 20,
  duration: '2m',
};

const BASE_URL = 'http://localhost:5000/api/v1';

export default function () {
  // Create supplier
  let supplier = { name: `Supplier ${__VU}-${__ITER}`, email: `sup${__VU}${__ITER}@test.com` };
  let res1 = http.post(`${BASE_URL}/suppliers`, JSON.stringify(supplier), { headers: { 'Content-Type': 'application/json' } });
  check(res1, { 'create supplier 201': r => r.status === 201 });
  let supplierId = res1.json().id;

  // Update supplier
  if (supplierId) {
    let res2 = http.put(`${BASE_URL}/suppliers/${supplierId}`, JSON.stringify({ name: `Updated Supplier ${__VU}-${__ITER}` }), { headers: { 'Content-Type': 'application/json' } });
    check(res2, { 'update supplier 200': r => r.status === 200 });
    // Delete supplier
    let res3 = http.del(`${BASE_URL}/suppliers/${supplierId}`);
    check(res3, { 'delete supplier 200': r => r.status === 200 });
  }

  // Repeat for customer and component as needed...
  sleep(1);
} 