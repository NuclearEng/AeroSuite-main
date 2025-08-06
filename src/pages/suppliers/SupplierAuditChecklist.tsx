import React from 'react';
import { Select, SelectChangeEvent } from '@mui/material';
import { MUISelectChangeHandler } from '../../types/mui';

interface AuditInfo {
  type: 'initial' | 'surveillance' | 'recertification' | 'follow-up' | 'special';
  status: 'in-progress' | 'completed' | 'cancelled' | 'planned' | 'delayed';
}

export const SupplierAuditChecklist: React.FC = () => {
  const [auditInfo, setAuditInfo] = React.useState<AuditInfo>({
    type: 'initial',
    status: 'planned'
  });

  const handleAuditInfoChange: MUISelectChangeHandler<AuditInfo['type'] | AuditInfo['status']> = (
  event: SelectChangeEvent<AuditInfo['type'] | AuditInfo['status']>) =>
  {
    const { name, value } = event.target;
    setAuditInfo((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div>
      <Select
        name="type"
        value={auditInfo.type}
        onChange={handleAuditInfoChange}>

        
      </Select>
      <Select
        name="status"
        value={auditInfo.status}
        onChange={handleAuditInfoChange}>

        
      </Select>
    </div>);

};