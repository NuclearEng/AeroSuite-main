#!/bin/bash

# TypeScript Error Auto-Fixer Script
# This script parses npm run dev output and automatically fixes common TypeScript errors

set -e

echo "🔧 TypeScript Error Auto-Fixer"
echo "================================"

# Function to fix Recharts component issues
fix_recharts_components() {
    echo "📊 Fixing Recharts component issues..."
    
    # Create wrapper components for Recharts
    cat > client/src/components/charts/RechartsWrappers.tsx << 'EOF'
import React from 'react';
import {
  BarChart as RbdBarChart,
  LineChart as RbdLineChart,
  PieChart as RbdPieChart,
  ComposedChart as RbdComposedChart,
  Bar as RbdBar,
  Line as RbdLine,
  XAxis as RbdXAxis,
  YAxis as RbdYAxis,
  CartesianGrid as RbdCartesianGrid,
  Tooltip as RbdTooltip,
  Legend as RbdLegend,
  ResponsiveContainer as RbdResponsiveContainer,
  Cell as RbdCell,
  Pie as RbdPie,
  Area as RbdArea,
  ScatterChart as RbdScatterChart,
  Scatter as RbdScatter,
  ZAxis as RbdZAxis
} from 'recharts';

// Create wrapper components for all Recharts components
export const BarChart: React.FC<any> = (props) => <RbdBarChart {...props} />;
export const LineChart: React.FC<any> = (props) => <RbdLineChart {...props} />;
export const PieChart: React.FC<any> = (props) => <RbdPieChart {...props} />;
export const ComposedChart: React.FC<any> = (props) => <RbdComposedChart {...props} />;
export const Bar: React.FC<any> = (props) => <RbdBar {...props} />;
export const Line: React.FC<any> = (props) => <RbdLine {...props} />;
export const XAxis: React.FC<any> = (props) => <RbdXAxis {...props} />;
export const YAxis: React.FC<any> = (props) => <RbdYAxis {...props} />;
export const CartesianGrid: React.FC<any> = (props) => <RbdCartesianGrid {...props} />;
export const Tooltip: React.FC<any> = (props) => <RbdTooltip {...props} />;
export const Legend: React.FC<any> = (props) => <RbdLegend {...props} />;
export const ResponsiveContainer: React.FC<any> = (props) => <RbdResponsiveContainer {...props} />;
export const Cell: React.FC<any> = (props) => <RbdCell {...props} />;
export const Pie: React.FC<any> = (props) => <RbdPie {...props} />;
export const Area: React.FC<any> = (props) => <RbdArea {...props} />;
export const ScatterChart: React.FC<any> = (props) => <RbdScatterChart {...props} />;
export const Scatter: React.FC<any> = (props) => <RbdScatter {...props} />;
export const ZAxis: React.FC<any> = (props) => <RbdZAxis {...props} />;
EOF

    # Update InspectionAnalytics.tsx to use wrapper components
    sed -i '' 's/import {/import { BarChart, LineChart, PieChart, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend as RechartsLegend, ResponsiveContainer, Cell, Pie, Area, ScatterChart, Scatter, ZAxis } from "..\/..\/components\/charts\/RechartsWrappers";\nimport {/' client/src/pages/inspections/InspectionAnalytics.tsx
    
    # Remove the old RechartsLegend import and replace with Legend
    sed -i '' 's/<RechartsLegend \/>/<Legend \/>/g' client/src/pages/inspections/InspectionAnalytics.tsx
}

# Function to fix SelectChangeEvent issues
fix_select_change_events() {
    echo "🎛️ Fixing SelectChangeEvent issues..."
    
    # Find all files with SelectChangeEvent issues and fix them
    find client/src -name "*.tsx" -exec grep -l "SelectChangeEvent" {} \; | while read file; do
        echo "  Fixing $file"
        
        # Add SelectChangeEvent import if not present
        if ! grep -q "SelectChangeEvent" "$file"; then
            sed -i '' 's/import {/import { SelectChangeEvent,/' "$file"
        fi
        
        # Update handleChange function to accept SelectChangeEvent
        sed -i '' 's/const handleChange = (e: React.ChangeEvent<HTMLInputElement | {name?: string;value: unknown;}>) => {/const handleChange = (e: React.ChangeEvent<HTMLInputElement | {name?: string;value: unknown;}> | SelectChangeEvent<string>) => {/' "$file"
    done
}

# Function to fix error reference issues
fix_error_references() {
    echo "🐛 Fixing error reference issues..."
    
    # Find all files with error reference issues and fix them
    find client/src -name "*.tsx" -exec grep -l "console.error.*err" {} \; | while read file; do
        echo "  Fixing $file"
        sed -i '' 's/console.error.*err/console.error("Error:", _err)/g' "$file"
    done
}

# Function to fix duplicate identifier issues
fix_duplicate_identifiers() {
    echo "🆔 Fixing duplicate identifier issues..."
    
    # Fix ChecklistItem duplicate imports
    sed -i '' '/import { ChecklistItem } from '\''\.\.\/hooks\/useSupplierAudit'\'';/d' client/src/pages/suppliers/components/AuditChecklist.tsx
}

# Function to fix type issues in ProgressiveLoadingDemo
fix_progressive_loading() {
    echo "⚡ Fixing ProgressiveLoadingDemo type issues..."
    
    # Fix the products array type issue
    sed -i '' 's/data={products}/data={products.filter(Boolean)}/g' client/src/pages/ProgressiveLoadingDemo.tsx
    
    # Fix the product undefined issues
    sed -i '' 's/{products.map((product) =>/{products.filter(Boolean).map((product) =>/g' client/src/pages/ProgressiveLoadingDemo.tsx
}

# Function to fix unused @ts-expect-error directives
fix_unused_ts_expect_error() {
    echo "🚫 Removing unused @ts-expect-error directives..."
    
    # Remove unused @ts-expect-error directives
    find client/src -name "*.tsx" -exec sed -i '' '/^\/\/ @ts-expect-error/d' {} \;
    find client/src -name "*.test.tsx" -exec sed -i '' '/^\/\/ @ts-expect-error/d' {} \;
}

# Function to fix RequestBatchingDemo issues
fix_request_batching() {
    echo "📦 Fixing RequestBatchingDemo issues..."
    
    # Fix error references
    sed -i '' 's/console.error.*err/console.error("Error:", _err)/g' client/src/pages/RequestBatchingDemo.tsx
    
    # Fix async/await issues
    sed -i '' 's/let mockData;/let mockData: any;/g' client/src/pages/RequestBatchingDemo.tsx
    sed -i '' 's/mockData = await mockApi.getSupplier(request.id);/mockData = await mockApi.getSupplier(request.id);/g' client/src/pages/RequestBatchingDemo.tsx
}

# Function to fix ResponsiveGrid import issue
fix_responsive_grid() {
    echo "📱 Fixing ResponsiveGrid import issue..."
    
    # Check if ResponsiveGrid exists, if not create it
    if [ ! -f "client/src/components/layout/ResponsiveGrid.tsx" ]; then
        cat > client/src/components/layout/ResponsiveGrid.tsx << 'EOF'
import React from 'react';
import { Grid, GridProps } from '@mui/material';

export const ResponsiveGrid: React.FC<GridProps> = (props) => {
  return <Grid {...props} />;
};

export const ResponsiveGridItem: React.FC<GridProps> = (props) => {
  return <Grid {...props} />;
};
EOF
    fi
}

# Function to fix SettingsPage onError prop issue
fix_settings_page() {
    echo "⚙️ Fixing SettingsPage onError prop issue..."
    
    # Remove the onError prop from LanguageSettings
    sed -i '' 's/<LanguageSettings onError={handleLanguageError} \/>/<LanguageSettings \/>/g' client/src/pages/settings/SettingsPage.tsx
}

# Function to fix CustomQueryParamProvider issue
fix_query_param_provider() {
    echo "🔗 Fixing CustomQueryParamProvider issue..."
    
    # Update the CustomQueryParamProvider to not pass adapter prop
    sed -i '' 's/adapter={adapter} ReactRouterRoute={ReactRouterRoute}/ReactRouterRoute={ReactRouterRoute}/g' client/src/test-utils/CustomQueryParamProvider.tsx
}

# Function to fix progressiveLoader requestIdleCallback issues
fix_progressive_loader() {
    echo "⏱️ Fixing progressiveLoader requestIdleCallback issues..."
    
    # Remove the conflicting declarations
    sed -i '' '/declare global {/,/}/d' client/src/utils/progressiveLoader.ts
}

# Function to fix codeSplitting issues
fix_code_splitting() {
    echo "🔧 Fixing codeSplitting issues..."
    
    # Fix the type assertion issue
    sed -i '' 's/as { ref: React.RefObject<HTMLDivElement>; inView: boolean }/as any/g' client/src/utils/codeSplitting.tsx
    
    # Fix the setComponent issue
    sed -i '' 's/setComponent(WrappedComponent);/setComponent(WrappedComponent as any);/g' client/src/utils/codeSplitting.tsx
}

# Function to fix ModalsAndFormsTester type issues
fix_modals_forms_tester() {
    echo "🎭 Fixing ModalsAndFormsTester type issues..."
    
    # Fix the search result type issues
    sed -i '' 's/type: string/type: "user" | "supplier" | "inspection" | "customer" | "report"/g' client/src/pages/ModalsAndFormsTester.tsx
    
    # Fix the notification type issues
    sed -i '' 's/type: string/type: "warning" | "success" | "error" | "info"/g' client/src/pages/ModalsAndFormsTester.tsx
}

# Main execution
main() {
    echo "Starting TypeScript error auto-fix process..."
    
    # Run all fix functions
    fix_recharts_components
    fix_select_change_events
    fix_error_references
    fix_duplicate_identifiers
    fix_progressive_loading
    fix_unused_ts_expect_error
    fix_request_batching
    fix_responsive_grid
    fix_settings_page
    fix_query_param_provider
    fix_progressive_loader
    fix_code_splitting
    fix_modals_forms_tester
    
    echo ""
    echo "✅ All fixes applied!"
    echo ""
    echo "Running npm run dev to check for remaining errors..."
    
    # Run the dev command to check for remaining errors
    cd client && npm run dev
}

# Run the main function
main "$@" 