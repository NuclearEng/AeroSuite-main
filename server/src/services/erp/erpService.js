// ERP Service abstraction for integration
// Part of TS358

/**
 * Fetch supplier data from ERP system
 * @param {string} supplierId
 * @returns {Promise<Object>} Supplier data
 */
async function fetchSupplier(supplierId) {
  // Placeholder: Replace with real ERP API call
  return {
    id: supplierId,
    name: 'Sample Supplier',
    status: 'active',
    erpSynced: true
  };
}

module.exports = {
  fetchSupplier
}; 