import { v4 as uuidv4 } from 'uuid';

// Types
export type Status = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
export type Result = 'pending' | 'pass' | 'fail' | 'conditional';
export type Priority = 'low' | 'medium' | 'high';
export type InspectionType = 'source' | 'incoming' | 'in-process' | 'final' | 'audit';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Contact {
  name: string;
  email: string;
  phone: string;
}

export interface Customer {
  _id: string;
  name: string;
  code: string;
  logo?: string;
  industry?: string;
  location?: string;
  contact: Contact;
  coordinates?: Coordinates;
}

export interface Supplier {
  _id: string;
  name: string;
  code: string;
  logo?: string;
  category?: string;
  location?: string;
  contact: Contact;
  coordinates?: Coordinates;
  tier?: 'tier1' | 'tier2' | 'tier3';
  customers?: { _id: string; name: string; code: string }[];
  industry?: string;
  qualification?: string;
}

export interface ChecklistItem {
  id: string;
  description: string;
  required: boolean;
  completed: boolean;
  result: 'pass' | 'fail' | 'pending';
  notes: string;
}

export interface Defect {
  id: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  status: 'open' | 'in-progress' | 'resolved';
  notes: string;
}

export interface Inspection {
  _id: string;
  inspectionNumber: string;
  title: string;
  description: string;
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
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  result: 'pass' | 'fail' | 'conditional' | 'pending';
  priority: 'low' | 'medium' | 'high';
  purchaseOrderNumber?: string;
  partNumber?: string;
  revision?: string;
  quantity?: number;
  checklistItems: ChecklistItem[];
  defects: Defect[];
}

// Mock data
let customers: Customer[] = [];
let suppliers: Supplier[] = [];
let inspections: Inspection[] = [];

// Initialize mock data
const initialize = (): void => {
  // Only initialize once
  if (inspections.length > 0) return;

  // Create customers
  customers = [
    {
      _id: '1',
      name: 'Aerospace Dynamics',
      code: 'AD-001',
      industry: 'Aerospace',
      location: 'Los Angeles, CA',
      contact: {
        name: 'John Smith',
        email: 'john@aerospacedynamics.example.com',
        phone: '(555) 123-4567'
      },
      coordinates: {
        lat: 34.0522,
        lng: -118.2437
      }
    },
    {
      _id: '2',
      name: 'Jetstream Industries',
      code: 'JI-002',
      industry: 'Aviation',
      location: 'Seattle, WA',
      contact: {
        name: 'Sarah Johnson',
        email: 'sarah@jetstream.example.com',
        phone: '(555) 234-5678'
      },
      coordinates: {
        lat: 47.6062,
        lng: -122.3321
      }
    },
    {
      _id: '3',
      name: 'Global Aero Systems',
      code: 'GAS-003',
      industry: 'Defense',
      location: 'Dallas, TX',
      contact: {
        name: 'Michael Chen',
        email: 'michael@globalaero.example.com',
        phone: '(555) 345-6789'
      },
      coordinates: {
        lat: 32.7767,
        lng: -96.7970
      }
    }
  ];

  // Create suppliers
  suppliers = [
    {
      _id: '1',
      name: 'Precision Components',
      code: 'PC-001',
      industry: 'Manufacturing',
      location: 'Cleveland, OH',
      qualification: 'AS9100D',
      contact: {
        name: 'Robert Miller',
        email: 'robert@precisioncomp.example.com',
        phone: '(555) 456-7890'
      },
      coordinates: {
        lat: 41.4993,
        lng: -81.6944
      },
      tier: 'tier1',
      customers: [
        { _id: '1', name: 'Aerospace Dynamics', code: 'AD-001' },
        { _id: '2', name: 'Jetstream Industries', code: 'JI-002' }
      ]
    },
    {
      _id: '2',
      name: 'Advanced Materials Corp',
      code: 'AMC-002',
      industry: 'Materials',
      location: 'Phoenix, AZ',
      qualification: 'ISO 9001:2015',
      contact: {
        name: 'Lisa Garcia',
        email: 'lisa@advancedmaterials.example.com',
        phone: '(555) 567-8901'
      },
      coordinates: {
        lat: 33.4484,
        lng: -112.0740
      },
      tier: 'tier2',
      customers: [
        { _id: '1', name: 'Aerospace Dynamics', code: 'AD-001' }
      ]
    },
    {
      _id: '3',
      name: 'Elite Engineering Solutions',
      code: 'EES-003',
      industry: 'Engineering',
      location: 'Boston, MA',
      qualification: 'AS9100D, NADCAP',
      contact: {
        name: 'David Wilson',
        email: 'david@eliteengineering.example.com',
        phone: '(555) 678-9012'
      },
      coordinates: {
        lat: 42.3601,
        lng: -71.0589
      },
      tier: 'tier3',
      customers: [
        { _id: '3', name: 'Global Aero Systems', code: 'GAS-003' }
      ]
    }
  ];

  // Create inspections
  inspections = [
    {
      _id: '1',
      inspectionNumber: 'INSP-2023-001',
      title: 'Engine Component Inspection',
      description: 'Source inspection of jet engine turbine blades for Aerospace Dynamics.',
      inspectionType: 'source',
      customer: {
        _id: customers[0]._id,
        name: customers[0].name,
        code: customers[0].code
      },
      supplier: {
        _id: suppliers[0]._id,
        name: suppliers[0].name,
        code: suppliers[0].code
      },
      scheduledDate: '2023-06-15T10:00:00.000Z',
      status: 'completed',
      result: 'pass',
      checklistItems: [
        {
          id: uuidv4(),
          description: 'Material certification verification',
          required: true,
          completed: true,
          result: 'pass',
          notes: ''
        },
        {
          id: uuidv4(),
          description: 'Dimensional inspection',
          required: true,
          completed: true,
          result: 'pass',
          notes: ''
        },
        {
          id: uuidv4(),
          description: 'Surface finish inspection',
          required: true,
          completed: true,
          result: 'pass',
          notes: ''
        }
      ],
      defects: [],
      notes: 'All components passed inspection requirements. Documentation properly completed.',
      priority: 'high',
      purchaseOrderNumber: 'PO-AD-12345',
      partNumber: 'TB-458-A',
      revision: 'C',
      quantity: 25
    },
    {
      _id: '2',
      inspectionNumber: 'INSP-2023-002',
      title: 'Composite Material Inspection',
      description: 'Incoming inspection of composite materials for Jetstream Industries.',
      inspectionType: 'incoming',
      customer: {
        _id: customers[1]._id,
        name: customers[1].name,
        code: customers[1].code
      },
      supplier: {
        _id: suppliers[1]._id,
        name: suppliers[1].name,
        code: suppliers[1].code
      },
      scheduledDate: '2023-06-20T09:00:00.000Z',
      status: 'scheduled',
      result: 'pending',
      checklistItems: [
        {
          id: uuidv4(),
          description: 'Material certification review',
          required: true,
          completed: false,
          result: 'pending',
          notes: ''
        },
        {
          id: uuidv4(),
          description: 'Visual inspection for defects',
          required: true,
          completed: false,
          result: 'pending',
          notes: ''
        },
        {
          id: uuidv4(),
          description: 'Hardness testing',
          required: true,
          completed: false,
          result: 'pending',
          notes: ''
        }
      ],
      defects: [],
      priority: 'medium',
      purchaseOrderNumber: 'PO-JI-54321',
      partNumber: 'CM-789-B',
      revision: 'A',
      quantity: 100
    },
    {
      _id: '3',
      inspectionNumber: 'INSP-2023-003',
      title: 'Avionics System Audit',
      description: 'Source inspection of avionics systems for Global Aero Systems.',
      inspectionType: 'audit',
      customer: {
        _id: customers[2]._id,
        name: customers[2].name,
        code: customers[2].code
      },
      supplier: {
        _id: suppliers[2]._id,
        name: suppliers[2].name,
        code: suppliers[2].code
      },
      scheduledDate: '2023-06-25T13:00:00.000Z',
      startDate: '2023-06-25T13:15:00.000Z',
      status: 'in-progress',
      result: 'pending',
      checklistItems: [
        {
          id: uuidv4(),
          description: 'Process documentation review',
          required: true,
          completed: true,
          result: 'pass',
          notes: ''
        },
        {
          id: uuidv4(),
          description: 'Quality system compliance check',
          required: true,
          completed: true,
          result: 'pass',
          notes: ''
        },
        {
          id: uuidv4(),
          description: 'Production process verification',
          required: true,
          completed: false,
          result: 'pending',
          notes: ''
        },
        {
          id: uuidv4(),
          description: 'Final testing verification',
          required: true,
          completed: false,
          result: 'pending',
          notes: ''
        }
      ],
      defects: [],
      notes: 'In progress. Quality system documentation is compliant.',
      priority: 'high',
      purchaseOrderNumber: 'PO-GAS-98765',
      partNumber: 'AV-123-C',
      revision: 'B',
      quantity: 10
    }
  ];

  // Add coordinates to the supplier data if they don't exist
  suppliers = suppliers.map(supplier => {
    if (!supplier.coordinates) {
      // Generate random coordinates in continental US
      return {
        ...supplier,
        coordinates: {
          lat: 37.0902 + (Math.random() * 8 - 4),
          lng: -95.7129 + (Math.random() * 10 - 5)
        }
      };
    }
    return supplier;
  });
};

// Get all inspections
const getInspections = (): Inspection[] => {
  return [...inspections];
};

// Get inspection by ID
const getInspectionById = (id: string): Inspection | undefined => {
  return inspections.find(inspection => inspection._id === id);
};

// Get all customers
const getCustomers = (): Customer[] => {
  return [...customers];
};

// Get all suppliers
const getSuppliers = (): Supplier[] => {
  return [...suppliers];
};

// Create a new inspection
const createInspection = (inspection: Partial<Inspection>): Inspection => {
  const newInspection: Inspection = {
    _id: uuidv4(),
    inspectionNumber: `INSP-${new Date().getFullYear()}-${(inspections.length + 1).toString().padStart(3, '0')}`,
    title: inspection.title || '',
    description: inspection.description,
    inspectionType: inspection.inspectionType || 'source',
    customer: inspection.customer || { _id: '', name: '', code: '' },
    supplier: inspection.supplier || { _id: '', name: '', code: '' },
    scheduledDate: inspection.scheduledDate || new Date().toISOString(),
    status: inspection.status || 'scheduled',
    result: inspection.result || 'pending',
    checklistItems: inspection.checklistItems || [],
    defects: inspection.defects || [],
    notes: inspection.notes,
    priority: inspection.priority,
    purchaseOrderNumber: inspection.purchaseOrderNumber,
    partNumber: inspection.partNumber,
    revision: inspection.revision,
    quantity: inspection.quantity
  };

  inspections.push(newInspection);
  return newInspection;
};

// Update an inspection
const updateInspection = (id: string, updates: Partial<Inspection>): Inspection | undefined => {
  const index = inspections.findIndex(inspection => inspection._id === id);
  
  if (index === -1) return undefined;
  
  inspections[index] = { ...inspections[index], ...updates };
  return inspections[index];
};

// Delete an inspection
const deleteInspection = (id: string): boolean => {
  const index = inspections.findIndex(inspection => inspection._id === id);
  
  if (index === -1) return false;
  
  inspections.splice(index, 1);
  return true;
};

// Add a new inspection (used by the scheduler)
const addInspection = (inspection: Inspection): Inspection => {
  inspections.push(inspection);
  return inspection;
};

// Reset all data
const resetData = (): void => {
  customers = [];
  suppliers = [];
  inspections = [];
  initialize();
};

// Export the service
const MockDataService = {
  initialize,
  getInspections,
  getInspectionById,
  getCustomers,
  getSuppliers,
  createInspection,
  updateInspection,
  deleteInspection,
  addInspection,
  resetData
};

export default MockDataService; 