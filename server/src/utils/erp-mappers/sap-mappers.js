/**
 * SAP ERP Data Mappers
 * 
 * This module provides utility functions for mapping data between
 * AeroSuite models and SAP ERP data structures.
 */

/**
 * Map SAP vendor data to AeroSuite supplier format
 * 
 * @param {Object} sapVendor - Vendor data from SAP
 * @returns {Object} - Supplier data for AeroSuite
 */
function mapSapVendorToSupplier(sapVendor) {
  // Skip if no data
  if (!sapVendor) return null;
  
  return {
    code: sapVendor.CardCode,
    name: sapVendor.CardName,
    email: sapVendor.EmailAddress,
    phone: sapVendor.Phone1,
    mobilePhone: sapVendor.Cellular,
    website: sapVendor.Website,
    address: {
      street: sapVendor.Address,
      city: sapVendor.City,
      zipCode: sapVendor.ZipCode,
      country: sapVendor.Country
    },
    status: mapSapVendorStatus(sapVendor.Frozen),
    contactPerson: sapVendor.ContactPerson,
    paymentTerms: sapVendor.PaymentTerms,
    sourceSystem: 'SAP',
    sourceId: sapVendor.CardCode,
    lastSyncedAt: new Date(),
    erpSynced: true
  };
}

/**
 * Map AeroSuite supplier to SAP vendor format
 * 
 * @param {Object} supplier - Supplier data from AeroSuite
 * @returns {Object} - Vendor data for SAP
 */
function mapSupplierToSapVendor(supplier) {
  // Skip if no data
  if (!supplier) return null;
  
  return {
    CardCode: supplier.code,
    CardName: supplier.name,
    CardType: 'S', // Supplier
    EmailAddress: supplier.email,
    Phone1: supplier.phone,
    Cellular: supplier.mobilePhone,
    Website: supplier.website,
    Address: supplier.address?.street,
    City: supplier.address?.city,
    ZipCode: supplier.address?.zipCode,
    Country: supplier.address?.country,
    ContactPerson: supplier.contactPerson,
    Notes: supplier.notes
  };
}

/**
 * Map SAP inspection data to AeroSuite inspection format
 * 
 * @param {Object} sapInspection - Inspection data from SAP
 * @returns {Object} - Inspection data for AeroSuite
 */
function mapSapInspectionToAeroSuite(sapInspection) {
  // Skip if no data
  if (!sapInspection) return null;
  
  return {
    type: sapInspection.U_InspectionType,
    itemCode: sapInspection.U_ItemCode,
    supplierCode: sapInspection.U_VendorCode,
    inspector: sapInspection.U_Inspector,
    date: sapInspection.U_Date,
    status: sapInspection.U_Status,
    result: sapInspection.U_Result,
    notes: sapInspection.U_Comments,
    sourceSystem: 'SAP',
    sourceId: sapInspection.DocEntry.toString(),
    lastSyncedAt: new Date(),
    erpSynced: true
  };
}

/**
 * Map AeroSuite inspection to SAP format
 * 
 * @param {Object} inspection - Inspection data from AeroSuite
 * @returns {Object} - Inspection data for SAP
 */
function mapAeroSuiteInspectionToSap(inspection) {
  // Skip if no data
  if (!inspection) return null;
  
  // Extract supplier code from populated supplier or use the code directly
  let supplierCode = inspection.supplierCode;
  if (inspection.supplier) {
    supplierCode = typeof inspection.supplier === 'object' ? 
      inspection.supplier.code : inspection.supplier;
  }
  
  return {
    U_InspectionType: inspection.type,
    U_ItemCode: inspection.itemCode,
    U_VendorCode: supplierCode,
    U_Inspector: inspection.inspector,
    U_Date: inspection.date,
    U_Status: inspection.status,
    U_Result: inspection.result,
    U_Comments: inspection.notes
  };
}

/**
 * Map SAP purchase order to AeroSuite format
 * 
 * @param {Object} sapPO - Purchase order data from SAP
 * @returns {Object} - Purchase order data for AeroSuite
 */
function mapSapPurchaseOrderToAeroSuite(sapPO) {
  // Skip if no data
  if (!sapPO) return null;
  
  return {
    orderNumber: sapPO.DocNum.toString(),
    supplier: {
      code: sapPO.CardCode,
      name: sapPO.CardName
    },
    date: sapPO.DocDate,
    dueDate: sapPO.DocDueDate,
    status: mapSapDocumentStatus(sapPO.DocumentStatus),
    total: sapPO.DocTotal,
    items: (sapPO.DocumentLines || []).map(line => ({
      itemCode: line.ItemCode,
      description: line.ItemDescription,
      quantity: line.Quantity,
      unitPrice: line.Price,
      totalPrice: line.LineTotal
    })),
    sourceSystem: 'SAP',
    sourceId: sapPO.DocEntry.toString(),
    lastSyncedAt: new Date(),
    erpSynced: true
  };
}

/**
 * Map AeroSuite purchase order to SAP format
 * 
 * @param {Object} purchaseOrder - Purchase order data from AeroSuite
 * @returns {Object} - Purchase order data for SAP
 */
function mapAeroSuitePurchaseOrderToSap(purchaseOrder) {
  // Skip if no data
  if (!purchaseOrder) return null;
  
  // Extract supplier code from populated supplier or use the code directly
  let supplierCode = purchaseOrder.supplierCode;
  if (purchaseOrder.supplier) {
    supplierCode = typeof purchaseOrder.supplier === 'object' ? 
      purchaseOrder.supplier.code : purchaseOrder.supplier;
  }
  
  return {
    CardCode: supplierCode,
    DocDate: purchaseOrder.date,
    DocDueDate: purchaseOrder.dueDate,
    Comments: purchaseOrder.notes,
    DocumentLines: (purchaseOrder.items || []).map(item => ({
      ItemCode: item.itemCode,
      Quantity: item.quantity,
      Price: item.unitPrice
    }))
  };
}

/**
 * Map SAP document status to AeroSuite status
 * 
 * @param {string} sapStatus - Status from SAP
 * @returns {string} - Status for AeroSuite
 */
function mapSapDocumentStatus(sapStatus) {
  switch (sapStatus) {
    case 'bost_Open':
      return 'open';
    case 'bost_Close':
      return 'closed';
    case 'bost_Paid':
      return 'paid';
    case 'bost_Delivered':
      return 'delivered';
    case 'bost_Cancelled':
      return 'cancelled';
    default:
      return 'draft';
  }
}

/**
 * Map SAP vendor status to AeroSuite status
 * 
 * @param {string} sapFrozen - Frozen status from SAP
 * @returns {string} - Status for AeroSuite
 */
function mapSapVendorStatus(sapFrozen) {
  if (sapFrozen === 'Y') {
    return 'inactive';
  }
  return 'active';
}

module.exports = {
  mapSapVendorToSupplier,
  mapSupplierToSapVendor,
  mapSapInspectionToAeroSuite,
  mapAeroSuiteInspectionToSap,
  mapSapPurchaseOrderToAeroSuite,
  mapAeroSuitePurchaseOrderToSap
}; 