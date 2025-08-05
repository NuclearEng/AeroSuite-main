import React from 'react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SupplierMetricsCard } from '../../components/suppliers/SupplierMetricsCard';
import { StatusBadgeProps } from '../../types/mui';

interface SupplierDetailProps {
  id: string;
  status: StatusBadgeProps['status'];
}

export const SupplierDetail: React.FC<SupplierDetailProps> = ({ id, status }) => {
  if (!id) {
    return null;
  }

  return (
    <div>
      <StatusBadge
        status={status}
        size="medium"
      />
      <SupplierMetricsCard supplierId={id} />
    </div>
  );
};