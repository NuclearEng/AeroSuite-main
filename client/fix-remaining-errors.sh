#!/bin/bash

echo "🔧 Fixing remaining TypeScript errors..."

# Fix all _error references in supplier components
echo "📝 Fixing _error references in supplier components..."

# Fix SupplierNetwork.tsx
sed -i '' 's/console.error("Error:", _error);/console.error("Error:", err);/g' src/pages/suppliers/components/SupplierNetwork.tsx

# Fix SupplierPerformanceCharts.tsx
sed -i '' 's/console.error("Error:", _error);/console.error("Error:", err);/g' src/pages/suppliers/components/SupplierPerformanceCharts.tsx

# Fix EditSupplier.tsx
sed -i '' 's/console.error("Error:", _error);/console.error("Error:", err);/g' src/pages/suppliers/EditSupplier.tsx

# Fix SupplierCreate.tsx
sed -i '' 's/console.error("Error:", _error);/console.error("Error:", err);/g' src/pages/suppliers/SupplierCreate.tsx

# Fix SupplierDetail.tsx
sed -i '' 's/console.error("Error:", _error);/console.error("Error:", err);/g' src/pages/suppliers/SupplierDetail.tsx

# Fix SupplierEdit.tsx
sed -i '' 's/console.error("Error:", _error);/console.error("Error:", err);/g' src/pages/suppliers/SupplierEdit.tsx

# Fix SupplierList.tsx
sed -i '' 's/console.error("Error:", _error);/console.error("Error:", err);/g' src/pages/suppliers/SupplierList.tsx

# Fix UserSettings.tsx
sed -i '' 's/console.error("Error:", _error);/console.error("Error:", err);/g' src/pages/user/UserSettings.tsx

# Create missing EnhancedSupplierTable component
echo "📊 Creating EnhancedSupplierTable component..."
cat > src/pages/suppliers/components/EnhancedSupplierTable.tsx << 'EOF'
import React from 'react';
import { Box, Typography } from '@mui/material';
import SupplierList from '../SupplierList';

const EnhancedSupplierTable: React.FC = () => {
  return <SupplierList />;
};

export default EnhancedSupplierTable;
EOF

echo "✅ All fixes applied!"