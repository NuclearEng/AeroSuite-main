/**
 * Oracle ERP Data Mappers
 * 
 * @task TS358 - ERP system integration
 * 
 * This module provides utility functions for mapping data between
 * AeroSuite models and Oracle ERP data structures.
 */

/**
 * Map Oracle vendor data to AeroSuite supplier format
 * 
 * @param {Object} oracleVendor - Vendor data from Oracle
 * @returns {Object} - Supplier data for AeroSuite
 */
function mapOracleVendorToSupplier(oracleVendor) {
  // Skip if no data
  if (!oracleVendor) return null;
  
  return {
    code: oracleVendor.supplierNumber || oracleVendor.id,
    name: oracleVendor.supplierName || oracleVendor.name,
    email: oracleVendor.email || (oracleVendor.contacts && oracleVendor.contacts[0] ? oracleVendor.contacts[0].email : null),
    phone: oracleVendor.phoneNumber || (oracleVendor.contacts && oracleVendor.contacts[0] ? oracleVendor.contacts[0].phoneNumber : null),
    mobilePhone: oracleVendor.mobileNumber || (oracleVendor.contacts && oracleVendor.contacts[0] ? oracleVendor.contacts[0].mobileNumber : null),
    website: oracleVendor.url || oracleVendor.website,
    address: {
      street: oracleVendor.address ? oracleVendor.address.addressLine1 : null,
      city: oracleVendor.address ? oracleVendor.address.city : null,
      zipCode: oracleVendor.address ? oracleVendor.address.postalCode : null,
      country: oracleVendor.address ? oracleVendor.address.country : null
    },
    status: mapOracleVendorStatus(oracleVendor.status || oracleVendor.activeFlag),
    contactPerson: oracleVendor.contactName || (oracleVendor.contacts && oracleVendor.contacts[0] ? oracleVendor.contacts[0].name : null),
    paymentTerms: oracleVendor.paymentTerms || oracleVendor.terms,
    sourceSystem: 'Oracle',
    sourceId: oracleVendor.id || oracleVendor.supplierNumber,
    lastSyncedAt: new Date(),
    erpSynced: true
  };
}

/**
 * Map AeroSuite supplier to Oracle vendor format
 * 
 * @param {Object} supplier - Supplier data from AeroSuite
 * @returns {Object} - Vendor data for Oracle
 */
function mapSupplierToOracleVendor(supplier) {
  // Skip if no data
  if (!supplier) return null;
  
  return {
    supplierName: supplier.name,
    supplierNumber: supplier.code,
    email: supplier.email,
    phoneNumber: supplier.phone,
    mobileNumber: supplier.mobilePhone,
    url: supplier.website,
    address: {
      addressLine1: supplier.address?.street,
      city: supplier.address?.city,
      postalCode: supplier.address?.zipCode,
      country: supplier.address?.country
    },
    status: supplier.status === 'active' ? 'ACTIVE' : 'INACTIVE',
    contactName: supplier.contactPerson,
    paymentTerms: supplier.paymentTerms,
    contacts: supplier.email || supplier.contactPerson ? [
      {
        name: supplier.contactPerson || supplier.name,
        email: supplier.email,
        phoneNumber: supplier.phone,
        mobileNumber: supplier.mobilePhone
      }
    ] : []
  };
}

/**
 * Map Oracle inspection data to AeroSuite inspection format
 * 
 * @param {Object} oracleInspection - Inspection data from Oracle
 * @returns {Object} - Inspection data for AeroSuite
 */
function mapOracleInspectionToAeroSuite(oracleInspection) {
  // Skip if no data
  if (!oracleInspection) return null;
  
  return {
    type: oracleInspection.inspectionType,
    itemCode: oracleInspection.itemNumber,
    supplierCode: oracleInspection.supplierNumber,
    inspector: oracleInspection.inspectorName,
    date: oracleInspection.inspectionDate,
    status: mapOracleInspectionStatus(oracleInspection.status),
    result: mapOracleInspectionResult(oracleInspection.result),
    notes: oracleInspection.comments,
    quantity: oracleInspection.quantity,
    sampleSize: oracleInspection.sampleSize,
    sourceSystem: 'Oracle',
    sourceId: oracleInspection.id.toString(),
    lastSyncedAt: new Date(),
    erpSynced: true
  };
}

/**
 * Map AeroSuite inspection to Oracle format
 * 
 * @param {Object} inspection - Inspection data from AeroSuite
 * @returns {Object} - Inspection data for Oracle
 */
function mapAeroSuiteInspectionToOracle(inspection) {
  // Skip if no data
  if (!inspection) return null;
  
  // Extract supplier code from populated supplier or use the code directly
  let supplierCode = inspection.supplierCode;
  if (inspection.supplier) {
    supplierCode = typeof inspection.supplier === 'object' ? 
      inspection.supplier.code : inspection.supplier;
  }
  
  return {
    inspectionType: inspection.type,
    itemNumber: inspection.itemCode,
    supplierNumber: supplierCode,
    inspectorName: inspection.inspector,
    inspectionDate: inspection.date,
    status: mapAeroSuiteInspectionStatus(inspection.status),
    result: mapAeroSuiteInspectionResult(inspection.result),
    comments: inspection.notes,
    quantity: inspection.quantity,
    sampleSize: inspection.sampleSize
  };
}

/**
 * Map Oracle purchase order to AeroSuite format
 * 
 * @param {Object} oraclePO - Purchase order data from Oracle
 * @returns {Object} - Purchase order data for AeroSuite
 */
function mapOraclePurchaseOrderToAeroSuite(oraclePO) {
  // Skip if no data
  if (!oraclePO) return null;
  
  return {
    orderNumber: oraclePO.orderNumber || oraclePO.id.toString(),
    supplier: {
      code: oraclePO.supplierId || oraclePO.supplierNumber,
      name: oraclePO.supplierName
    },
    date: oraclePO.orderDate,
    dueDate: oraclePO.scheduledDate,
    status: mapOraclePOStatus(oraclePO.status),
    total: calculateTotal(oraclePO.lines),
    items: (oraclePO.lines || []).map(line => ({
      itemCode: line.itemId || line.itemNumber,
      description: line.description || line.itemDescription,
      quantity: line.quantity,
      unitPrice: line.price || line.unitPrice,
      totalPrice: (line.quantity || 0) * (line.price || line.unitPrice || 0)
    })),
    sourceSystem: 'Oracle',
    sourceId: oraclePO.id.toString(),
    lastSyncedAt: new Date(),
    erpSynced: true
  };
}

/**
 * Map AeroSuite purchase order to Oracle format
 * 
 * @param {Object} purchaseOrder - Purchase order data from AeroSuite
 * @returns {Object} - Purchase order data for Oracle
 */
function mapAeroSuitePurchaseOrderToOracle(purchaseOrder) {
  // Skip if no data
  if (!purchaseOrder) return null;
  
  // Extract supplier code from populated supplier or use the code directly
  let supplierCode = purchaseOrder.supplierCode;
  if (purchaseOrder.supplier) {
    supplierCode = typeof purchaseOrder.supplier === 'object' ? 
      purchaseOrder.supplier.code : purchaseOrder.supplier;
  }
  
  return {
    supplierId: supplierCode,
    orderDate: purchaseOrder.date,
    scheduledDate: purchaseOrder.dueDate,
    notes: purchaseOrder.notes,
    status: mapAeroSuitePOStatus(purchaseOrder.status),
    lines: (purchaseOrder.items || []).map(item => ({
      itemId: item.itemCode,
      description: item.description,
      quantity: item.quantity,
      price: item.unitPrice
    }))
  };
}

/**
 * Calculate total price from order lines
 * 
 * @param {Array} lines - Order lines
 * @returns {number} - Total price
 * @private
 */
function calculateTotal(lines) {
  if (!lines || !Array.isArray(lines)) return 0;
  
  return lines.reduce((sum, line) => {
    const quantity = line.quantity || 0;
    const price = line.price || line.unitPrice || 0;
    return sum + (quantity * price);
  }, 0);
}

/**
 * Map Oracle vendor status to AeroSuite status
 * 
 * @param {string} oracleStatus - Status from Oracle
 * @returns {string} - Status for AeroSuite
 * @private
 */
function mapOracleVendorStatus(oracleStatus) {
  if (!oracleStatus) return 'active';
  
  const status = oracleStatus.toString().toUpperCase();
  
  if (status === 'ACTIVE' || status === 'Y' || status === 'TRUE' || status === '1') {
    return 'active';
  }
  
  if (status === 'INACTIVE' || status === 'N' || status === 'FALSE' || status === '0') {
    return 'inactive';
  }
  
  return 'pending';
}

/**
 * Map Oracle inspection status to AeroSuite status
 * 
 * @param {string} oracleStatus - Status from Oracle
 * @returns {string} - Status for AeroSuite
 * @private
 */
function mapOracleInspectionStatus(oracleStatus) {
  if (!oracleStatus) return 'draft';
  
  const status = oracleStatus.toString().toUpperCase();
  
  switch (status) {
    case 'DRAFT':
      return 'draft';
    case 'IN_PROGRESS':
    case 'INPROGRESS':
      return 'in_progress';
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'draft';
  }
}

/**
 * Map AeroSuite inspection status to Oracle status
 * 
 * @param {string} aerosuiteStatus - Status from AeroSuite
 * @returns {string} - Status for Oracle
 * @private
 */
function mapAeroSuiteInspectionStatus(aerosuiteStatus) {
  if (!aerosuiteStatus) return 'DRAFT';
  
  const status = aerosuiteStatus.toString().toLowerCase();
  
  switch (status) {
    case 'draft':
      return 'DRAFT';
    case 'in_progress':
      return 'IN_PROGRESS';
    case 'completed':
      return 'COMPLETED';
    case 'cancelled':
      return 'CANCELLED';
    default:
      return 'DRAFT';
  }
}

/**
 * Map Oracle inspection result to AeroSuite result
 * 
 * @param {string} oracleResult - Result from Oracle
 * @returns {string} - Result for AeroSuite
 * @private
 */
function mapOracleInspectionResult(oracleResult) {
  if (!oracleResult) return 'pending';
  
  const result = oracleResult.toString().toUpperCase();
  
  switch (result) {
    case 'PASS':
    case 'PASSED':
      return 'passed';
    case 'FAIL':
    case 'FAILED':
      return 'failed';
    case 'PENDING':
      return 'pending';
    default:
      return 'pending';
  }
}

/**
 * Map AeroSuite inspection result to Oracle result
 * 
 * @param {string} aerosuiteResult - Result from AeroSuite
 * @returns {string} - Result for Oracle
 * @private
 */
function mapAeroSuiteInspectionResult(aerosuiteResult) {
  if (!aerosuiteResult) return 'PENDING';
  
  const result = aerosuiteResult.toString().toLowerCase();
  
  switch (result) {
    case 'passed':
      return 'PASSED';
    case 'failed':
      return 'FAILED';
    case 'pending':
      return 'PENDING';
    default:
      return 'PENDING';
  }
}

/**
 * Map Oracle purchase order status to AeroSuite status
 * 
 * @param {string} oracleStatus - Status from Oracle
 * @returns {string} - Status for AeroSuite
 * @private
 */
function mapOraclePOStatus(oracleStatus) {
  if (!oracleStatus) return 'draft';
  
  const status = oracleStatus.toString().toUpperCase();
  
  switch (status) {
    case 'DRAFT':
      return 'draft';
    case 'OPEN':
      return 'open';
    case 'APPROVED':
      return 'approved';
    case 'CLOSED':
      return 'closed';
    case 'CANCELLED':
      return 'cancelled';
    case 'RECEIVED':
      return 'received';
    default:
      return 'draft';
  }
}

/**
 * Map AeroSuite purchase order status to Oracle status
 * 
 * @param {string} aerosuiteStatus - Status from AeroSuite
 * @returns {string} - Status for Oracle
 * @private
 */
function mapAeroSuitePOStatus(aerosuiteStatus) {
  if (!aerosuiteStatus) return 'DRAFT';
  
  const status = aerosuiteStatus.toString().toLowerCase();
  
  switch (status) {
    case 'draft':
      return 'DRAFT';
    case 'open':
      return 'OPEN';
    case 'approved':
      return 'APPROVED';
    case 'closed':
      return 'CLOSED';
    case 'cancelled':
      return 'CANCELLED';
    case 'received':
      return 'RECEIVED';
    default:
      return 'DRAFT';
  }
}

module.exports = {
  mapOracleVendorToSupplier,
  mapSupplierToOracleVendor,
  mapOracleInspectionToAeroSuite,
  mapAeroSuiteInspectionToOracle,
  mapOraclePurchaseOrderToAeroSuite,
  mapAeroSuitePurchaseOrderToOracle
}; 