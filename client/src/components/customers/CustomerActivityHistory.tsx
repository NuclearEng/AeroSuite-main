import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  SelectChangeEvent,
  Divider
} from '@mui/material';
import ActivityTimeline from './ActivityTimeline';
import ActivityFilters, { activityTypeOptions } from './ActivityFilters';
import ActivityHistoryHeader from './ActivityHistoryHeader';
import PaginationFooter from '../common/PaginationFooter';
import useCustomerActivities from '../../hooks/useCustomerActivities';

interface CustomerActivityHistoryProps {
  customerId: string;
}

const ITEMS_PER_PAGE = 10;

const CustomerActivityHistory: React.FC<CustomerActivityHistoryProps> = ({ customerId }) => {
  const [page, setPage] = useState(1);
  const [activityType, setActivityType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    activities,
    loading,
    error,
    pagination,
    fetchActivities
  } = useCustomerActivities({
    customerId,
    page,
    limit: ITEMS_PER_PAGE,
    activityType: activityType || undefined
  });

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleActivityTypeChange = (event: SelectChangeEvent) => {
    setActivityType(event.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const handleClearFilters = () => {
    setActivityType('');
    setPage(1);
  };

  const handleRefresh = () => {
    fetchActivities(page, ITEMS_PER_PAGE, activityType || undefined);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <Card>
      <ActivityHistoryHeader 
        showFilters={showFilters} 
        toggleFilters={toggleFilters} 
      />
      
      {showFilters && (
        <ActivityFilters
          activityType={activityType}
          onActivityTypeChange={handleActivityTypeChange}
          onClearFilters={handleClearFilters}
        />
      )}
      
      <Divider />
      
      <CardContent>
        <ActivityTimeline
          activities={activities}
          loading={loading}
          error={error}
          onRefresh={handleRefresh}
        />
        
        {pagination && (
          <PaginationFooter
            page={page}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerActivityHistory; 