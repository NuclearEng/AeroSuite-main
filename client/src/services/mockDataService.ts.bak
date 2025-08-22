import { v4 as uuidv4 } from 'uuid';

// Types
export interface Customer {
  _id: string;
  name: string;
  code: string;
  description?: string;
  industry?: string;
  status: 'active' | 'inactive' | 'pending';
  logo?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  serviceLevel?: 'basic' | 'standard' | 'premium' | 'enterprise';
}

export interface Supplier {
  _id: string;
  name: string;
  code: string;
  industry?: string;
  status: 'active' | 'inactive' | 'pending';
  logo?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  overallRating?: number;
  customers?: string[];
}

export interface Inspection {
  _id: string;
  inspectionNumber: string;
  title: string;
  description?: string;
  inspectionType: 'incoming' | 'in-process' | 'final' | 'source' | 'audit';
  customer: {
    _id: string;
    name: string;
    code: string;
    logo?: string;
  };
  supplier: {
    _id: string;
    name: string;
    code: string;
    logo?: string;
  };
  component?: {
    _id: string;
    name: string;
    partNumber: string;
    revision: string;
  };
  scheduledDate: string;
  startDate?: string;
  completionDate?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  result: 'pass' | 'fail' | 'conditional' | 'pending';
  purchaseOrderNumber?: string;
  partNumber?: string;
  revision?: string;
  quantity?: number;
  inspectedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  location?: {
    name: string;
    address?: string;
  };
  checklistItems: ChecklistItem[];
  defects: Defect[];
  attachments?: Attachment[];
  notes?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
}

export interface ChecklistItem {
  id: string;
  description: string;
  required: boolean;
  completed: boolean;
  result: 'pass' | 'fail' | 'n/a' | 'pending';
  notes?: string;
}

export interface Defect {
  id: string;
  defectType: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  quantity: number;
  photos?: string[];
  comments?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  uploadedBy: string;
  uploadDate: string;
  description?: string;
  url?: string;
}

// Sample data
export const sampleCustomers: Customer[] = [
  {
    _id: 'cust1',
    name: 'Boeing',
    code: 'BOE',
    description: 'Leading aerospace company and manufacturer of commercial jetliners, defense products, and space systems.',
    industry: 'Aerospace',
    status: 'active',
    logo: 'https://via.placeholder.com/150?text=Boeing',
    primaryContactName: 'John Smith',
    primaryContactEmail: 'jsmith@boeing.example.com',
    primaryContactPhone: '+1 (206) 555-1234',
    serviceLevel: 'premium'
  },
  {
    _id: 'cust2',
    name: 'Airbus',
    code: 'AIR',
    industry: 'Aerospace',
    status: 'active',
    primaryContactName: 'Marie Dubois',
    primaryContactEmail: 'mdubois@airbus.example.com',
    serviceLevel: 'premium',
    logo: 'https://via.placeholder.com/150?text=Airbus'
  },
  {
    _id: 'cust3',
    name: 'Lockheed Martin',
    code: 'LM',
    industry: 'Defense',
    status: 'active',
    primaryContactName: 'Robert Johnson',
    primaryContactEmail: 'rjohnson@lockheed.example.com',
    serviceLevel: 'enterprise',
    logo: 'https://via.placeholder.com/150?text=Lockheed'
  }
];

export const sampleSuppliers: Supplier[] = [
  {
    _id: 'sup1',
    name: 'Aerospace Parts Inc.',
    code: 'API',
    industry: 'Aerospace',
    status: 'active',
    primaryContactName: 'Robert Chen',
    primaryContactEmail: 'rchen@api.example.com',
    overallRating: 4.8,
    logo: 'https://via.placeholder.com/150?text=API',
    customers: ['cust1', 'cust2']
  },
  {
    _id: 'sup2',
    name: 'Global Aerospace',
    code: 'GA',
    industry: 'Aerospace',
    status: 'active',
    primaryContactName: 'Lisa Wong',
    primaryContactEmail: 'lwong@globalaero.example.com',
    overallRating: 4.2,
    logo: 'https://via.placeholder.com/150?text=GA',
    customers: ['cust1']
  },
  {
    _id: 'sup3',
    name: 'Precision Engineering',
    code: 'PE',
    industry: 'Manufacturing',
    status: 'active',
    primaryContactName: 'Michael Johnson',
    primaryContactEmail: 'mjohnson@precision.example.com',
    overallRating: 3.9,
    logo: 'https://via.placeholder.com/150?text=PE',
    customers: ['cust1', 'cust3']
  }
];

const sampleInspections: Inspection[] = [
  {
    _id: 'insp1',
    inspectionNumber: 'INS-23-05-0001',
    title: 'Engine Component Inspection',
    description: 'Inspection of engine component assembly according to specification ABC-123-456 Rev C.',
    inspectionType: 'source',
    customer: {
      _id: 'cust1',
      name: 'Boeing',
      code: 'BOE',
      logo: 'https://via.placeholder.com/150?text=Boeing'
    },
    supplier: {
      _id: 'sup1',
      name: 'Aerospace Parts Inc.',
      code: 'API',
      logo: 'https://via.placeholder.com/150?text=API'
    },
    component: {
      _id: 'comp1',
      name: 'Turbine Blade Assembly',
      partNumber: 'TB-2345-A',
      revision: 'C'
    },
    scheduledDate: '2023-05-12T10:00:00.000Z',
    startDate: '2023-05-12T10:15:00.000Z',
    completionDate: '2023-05-12T14:30:00.000Z',
    status: 'completed',
    result: 'pass',
    purchaseOrderNumber: 'PO-45678',
    partNumber: 'TB-2345-A',
    revision: 'C',
    quantity: 25,
    inspectedBy: {
      _id: 'user1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'jsmith@example.com'
    },
    location: {
      name: 'Building 7, Production Floor',
      address: '123 Manufacturing Way, Seattle, WA 98108'
    },
    checklistItems: [
      {
        id: 'check1',
        description: 'Verify part dimensions against drawing',
        required: true,
        completed: true,
        result: 'pass',
        notes: 'All dimensions within tolerance'
      },
      {
        id: 'check2',
        description: 'Verify material certification',
        required: true,
        completed: true,
        result: 'pass',
        notes: 'Material cert verified and on file'
      },
      {
        id: 'check3',
        description: 'Check surface finish',
        required: true,
        completed: true,
        result: 'pass',
        notes: 'Surface finish meets requirements'
      },
      {
        id: 'check4',
        description: 'Verify packaging',
        required: true,
        completed: true,
        result: 'pass',
        notes: 'Packaging meets requirements'
      },
      {
        id: 'check5',
        description: 'Verify paperwork completion',
        required: true,
        completed: true,
        result: 'pass',
        notes: 'All paperwork complete and accurate'
      }
    ],
    defects: [],
    attachments: [
      {
        id: 'att1',
        fileName: 'inspection_photo_1.jpg',
        fileType: 'image/jpeg',
        uploadedBy: 'John Smith',
        uploadDate: '2023-05-12T11:30:00.000Z',
        description: 'Photo of part measurement'
      },
      {
        id: 'att2',
        fileName: 'material_cert.pdf',
        fileType: 'application/pdf',
        uploadedBy: 'John Smith',
        uploadDate: '2023-05-12T11:45:00.000Z',
        description: 'Material certification document'
      }
    ],
    notes: 'Inspection completed successfully. All items passed inspection. Parts are ready for shipment.',
    tags: ['Engine', 'Turbine', 'Critical'],
    priority: 'high'
  },
  {
    _id: 'insp2',
    inspectionNumber: 'INS-23-06-0002',
    title: 'Avionics Assembly Inspection',
    description: 'First article inspection of avionics assembly for Boeing 737 MAX.',
    inspectionType: 'source',
    customer: {
      _id: 'cust1',
      name: 'Boeing',
      code: 'BOE',
      logo: 'https://via.placeholder.com/150?text=Boeing'
    },
    supplier: {
      _id: 'sup2',
      name: 'Global Aerospace',
      code: 'GA',
      logo: 'https://via.placeholder.com/150?text=GA'
    },
    scheduledDate: '2023-06-14T09:00:00.000Z',
    status: 'scheduled',
    result: 'pending',
    purchaseOrderNumber: 'PO-56789',
    partNumber: 'AV-4567-B',
    revision: 'A',
    quantity: 5,
    inspectedBy: {
      _id: 'user2',
      firstName: 'Maria',
      lastName: 'Johnson',
      email: 'mjohnson@example.com'
    },
    location: {
      name: 'Supplier Facility',
      address: '456 Aviation Blvd, Seattle, WA 98101'
    },
    checklistItems: [
      {
        id: 'check6',
        description: 'Verify circuit board assembly',
        required: true,
        completed: false,
        result: 'pending'
      },
      {
        id: 'check7',
        description: 'Test signal integrity',
        required: true,
        completed: false,
        result: 'pending'
      },
      {
        id: 'check8',
        description: 'Verify environmental sealing',
        required: true,
        completed: false,
        result: 'pending'
      }
    ],
    defects: [],
    notes: 'Initial inspection of avionics assembly.',
    tags: ['Avionics', 'Electronics', 'FAI'],
    priority: 'medium'
  },
  {
    _id: 'insp3',
    inspectionNumber: 'INS-23-06-0003',
    title: 'Fuselage Section Inspection',
    description: 'In-process inspection of fuselage section #45.',
    inspectionType: 'in-process',
    customer: {
      _id: 'cust1',
      name: 'Boeing',
      code: 'BOE',
      logo: 'https://via.placeholder.com/150?text=Boeing'
    },
    supplier: {
      _id: 'sup3',
      name: 'Precision Engineering',
      code: 'PE',
      logo: 'https://via.placeholder.com/150?text=PE'
    },
    scheduledDate: '2023-06-21T13:00:00.000Z',
    startDate: '2023-06-21T13:15:00.000Z',
    status: 'in-progress',
    result: 'pending',
    purchaseOrderNumber: 'PO-67890',
    partNumber: 'FS-7890-C',
    revision: 'B',
    quantity: 1,
    inspectedBy: {
      _id: 'user3',
      firstName: 'David',
      lastName: 'Chen',
      email: 'dchen@example.com'
    },
    location: {
      name: 'Building 12, Assembly Area',
      address: '789 Production Way, Everett, WA 98204'
    },
    checklistItems: [
      {
        id: 'check9',
        description: 'Verify structural integrity',
        required: true,
        completed: true,
        result: 'pass',
        notes: 'Structure meets specifications'
      },
      {
        id: 'check10',
        description: 'Check rivet spacing',
        required: true,
        completed: true,
        result: 'pass',
        notes: 'Rivet spacing within tolerance'
      },
      {
        id: 'check11',
        description: 'Verify surface treatment',
        required: true,
        completed: false,
        result: 'pending'
      }
    ],
    defects: [],
    notes: 'In-progress inspection of fuselage section.',
    tags: ['Fuselage', 'Structural', 'Critical'],
    priority: 'high'
  }
];

// LocalStorage keys
const CUSTOMERS_KEY = 'aerosuite_customers';
const SUPPLIERS_KEY = 'aerosuite_suppliers';
const INSPECTIONS_KEY = 'aerosuite_inspections';

// Initialize localStorage with sample data if empty
const initializeData = () => {
  if (!localStorage.getItem(CUSTOMERS_KEY)) {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(sampleCustomers));
  }
  
  if (!localStorage.getItem(SUPPLIERS_KEY)) {
    localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(sampleSuppliers));
  }
  
  if (!localStorage.getItem(INSPECTIONS_KEY)) {
    localStorage.setItem(INSPECTIONS_KEY, JSON.stringify(sampleInspections));
  }
};

// Data service methods
export const MockDataService = {
  // Initialize
  initialize: () => {
    initializeData();
  },
  
  // Customers
  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(CUSTOMERS_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  getCustomerById: (id: string): Customer | undefined => {
    const customers = MockDataService.getCustomers();
    return customers.find(customer => customer._id === id);
  },
  
  createCustomer: (customer: Omit<Customer, '_id'>): Customer => {
    const newCustomer = { ...customer, _id: uuidv4() };
    const customers = MockDataService.getCustomers();
    const updatedCustomers = [...customers, newCustomer];
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updatedCustomers));
    return newCustomer;
  },
  
  updateCustomer: (id: string, updates: Partial<Customer>): Customer | undefined => {
    const customers = MockDataService.getCustomers();
    const index = customers.findIndex(customer => customer._id === id);
    
    if (index === -1) return undefined;
    
    const updatedCustomer = { ...customers[index], ...updates };
    customers[index] = updatedCustomer;
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
    
    return updatedCustomer;
  },
  
  deleteCustomer: (id: string): boolean => {
    const customers = MockDataService.getCustomers();
    const filteredCustomers = customers.filter(customer => customer._id !== id);
    
    if (filteredCustomers.length === customers.length) return false;
    
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(filteredCustomers));
    return true;
  },
  
  // Suppliers
  getSuppliers: (): Supplier[] => {
    const data = localStorage.getItem(SUPPLIERS_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  getSupplierById: (id: string): Supplier | undefined => {
    const suppliers = MockDataService.getSuppliers();
    return suppliers.find(supplier => supplier._id === id);
  },
  
  createSupplier: (supplier: Omit<Supplier, '_id'>): Supplier => {
    const newSupplier = { ...supplier, _id: uuidv4() };
    const suppliers = MockDataService.getSuppliers();
    const updatedSuppliers = [...suppliers, newSupplier];
    localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(updatedSuppliers));
    return newSupplier;
  },
  
  updateSupplier: (id: string, updates: Partial<Supplier>): Supplier | undefined => {
    const suppliers = MockDataService.getSuppliers();
    const index = suppliers.findIndex(supplier => supplier._id === id);
    
    if (index === -1) return undefined;
    
    const updatedSupplier = { ...suppliers[index], ...updates };
    suppliers[index] = updatedSupplier;
    localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
    
    return updatedSupplier;
  },
  
  deleteSupplier: (id: string): boolean => {
    const suppliers = MockDataService.getSuppliers();
    const filteredSuppliers = suppliers.filter(supplier => supplier._id !== id);
    
    if (filteredSuppliers.length === suppliers.length) return false;
    
    localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(filteredSuppliers));
    return true;
  },
  
  // Inspections
  getInspections: (): Inspection[] => {
    const data = localStorage.getItem(INSPECTIONS_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  getInspectionById: (id: string): Inspection | undefined => {
    const inspections = MockDataService.getInspections();
    return inspections.find(inspection => inspection._id === id);
  },
  
  createInspection: (inspection: Omit<Inspection, '_id' | 'inspectionNumber'>): Inspection => {
    const inspections = MockDataService.getInspections();
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const inspectionCount = inspections.length + 1;
    const inspectionNumber = `INS-${currentYear}-${currentMonth}-${inspectionCount.toString().padStart(4, '0')}`;
    
    const newInspection = { 
      ...inspection, 
      _id: uuidv4(), 
      inspectionNumber,
      status: inspection.status || 'scheduled',
      result: inspection.result || 'pending'
    };
    
    const updatedInspections = [...inspections, newInspection];
    localStorage.setItem(INSPECTIONS_KEY, JSON.stringify(updatedInspections));
    return newInspection;
  },
  
  updateInspection: (id: string, updates: Partial<Inspection>): Inspection | undefined => {
    const inspections = MockDataService.getInspections();
    const index = inspections.findIndex(inspection => inspection._id === id);
    
    if (index === -1) return undefined;
    
    const updatedInspection = { ...inspections[index], ...updates };
    inspections[index] = updatedInspection;
    localStorage.setItem(INSPECTIONS_KEY, JSON.stringify(inspections));
    
    return updatedInspection;
  },
  
  deleteInspection: (id: string): boolean => {
    const inspections = MockDataService.getInspections();
    const filteredInspections = inspections.filter(inspection => inspection._id !== id);
    
    if (filteredInspections.length === inspections.length) return false;
    
    localStorage.setItem(INSPECTIONS_KEY, JSON.stringify(filteredInspections));
    return true;
  },
  
  // Reset all data to initial state
  resetData: () => {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(sampleCustomers));
    localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(sampleSuppliers));
    localStorage.setItem(INSPECTIONS_KEY, JSON.stringify(sampleInspections));
  }
};

export default MockDataService; 