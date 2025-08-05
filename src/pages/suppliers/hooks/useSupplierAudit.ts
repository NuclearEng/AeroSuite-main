import { useState, useCallback } from 'react';
import { SupplierData } from '../../../types/supplier';
import { handleError } from '../../../utils/errorHandling';

interface ChecklistItem {
  id: string;
  category: string;
  requirement: string;
  findings: Array<{
    type: 'observation' | 'minor-nc' | 'major-nc' | 'critical-nc';
    description?: string;
    correctiveAction?: string;
    dueDate?: Date;
  }>;
  evidence?: string[];
  status: 'compliant' | 'non-compliant' | 'not-applicable';
}

interface AuditTemplate {
  id: string;
  name: string;
  description: string;
  items: ChecklistItem[];
}

interface Audit {
  id: string;
  supplierId: string;
  templateId: string;
  date: string;
  auditor: string;
  status: 'draft' | 'in-progress' | 'completed' | 'cancelled';
  items: ChecklistItem[];
  summary?: string;
  attachments?: string[];
}

export function useSupplierAudit() {
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [templates, setTemplates] = useState<AuditTemplate[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/suppliers');
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', handleError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/audit-templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching checklist templates:', handleError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAudits = useCallback(async (supplierId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/suppliers/${supplierId}/audits`);
      const data = await response.json();
      setAudits(data);
    } catch (error) {
      console.error('Error fetching supplier audits:', handleError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const createAudit = useCallback(async (audit: Omit<Audit, 'id'>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(audit),
      });
      const data = await response.json();
      setAudits(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error creating audit:', handleError(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAudit = useCallback(async (auditId: string, updates: Partial<Audit>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/audits/${auditId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      setAudits(prev => prev.map(a => a.id === auditId ? data : a));
      return data;
    } catch (error) {
      console.error('Error updating audit:', handleError(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAudit = useCallback(async (auditId: string) => {
    try {
      setLoading(true);
      await fetch(`/api/audits/${auditId}`, {
        method: 'DELETE',
      });
      setAudits(prev => prev.filter(a => a.id !== auditId));
    } catch (error) {
      console.error('Error deleting audit:', handleError(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAuditDetails = useCallback(async (auditId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/audits/${auditId}`);
      const data = await response.json();
      setAudits(prev => prev.map(a => a.id === auditId ? data : a));
      return data;
    } catch (error) {
      console.error('Error loading audit details:', handleError(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const addFinding = useCallback((itemId: string, finding: ChecklistItem['findings'][number]) => {
    setAudits(prev => prev.map(audit => ({
      ...audit,
      items: audit.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            findings: [...(item.findings || []), finding],
          };
        }
        return item;
      }),
    })));
  }, []);

  return {
    suppliers,
    templates,
    audits,
    loading,
    fetchSuppliers,
    fetchTemplates,
    fetchAudits,
    createAudit,
    updateAudit,
    deleteAudit,
    loadAuditDetails,
    addFinding,
  };
}