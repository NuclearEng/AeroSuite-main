import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the types for dashboard widget configuration
export interface DashboardWidgetConfig {
  id: string;
  visible: boolean;
  position: number;
  size: 'small' | 'medium' | 'large';
}

// Define the type for dashboard layout options
export interface DashboardLayout {
  columnCount: 1 | 2 | 3 | 4;
  compactView: boolean;
  showAnimations: boolean;
  refreshInterval: number;
}

// Define the dashboard state type
export interface DashboardState {
  widgets: {
    [key: string]: DashboardWidgetConfig;
  };
  layout: DashboardLayout;
  isCustomizing: boolean;
  presets: {
    [key: string]: {
      name: string;
      widgets: {
        [key: string]: DashboardWidgetConfig;
      };
      layout: DashboardLayout;
    }
  };
  activePreset: string | null;
}

// Default widget configurations
const defaultWidgets = {
  'inspections-summary': {
    id: 'inspections-summary',
    visible: true,
    position: 0,
    size: 'medium' as const,
  },
  'upcoming-inspections': {
    id: 'upcoming-inspections',
    visible: true,
    position: 1,
    size: 'large' as const,
  },
  'supplier-performance': {
    id: 'supplier-performance',
    visible: true,
    position: 2,
    size: 'medium' as const,
  },
  'inspection-status': {
    id: 'inspection-status',
    visible: true,
    position: 3,
    size: 'medium' as const,
  },
  'quality-metrics': {
    id: 'quality-metrics',
    visible: true,
    position: 4,
    size: 'medium' as const,
  },
  'recent-activity': {
    id: 'recent-activity',
    visible: true,
    position: 5,
    size: 'large' as const,
  },
  'reports-summary': {
    id: 'reports-summary',
    visible: false,
    position: 6,
    size: 'medium' as const,
  },
  'calendar': {
    id: 'calendar',
    visible: true,
    position: 7,
    size: 'large' as const,
  },
};

// Default layout configuration
const defaultLayout: DashboardLayout = {
  columnCount: 2,
  compactView: false,
  showAnimations: true,
  refreshInterval: 300, // 5 minutes in seconds
};

// Default dashboard state
const initialState: DashboardState = {
  widgets: defaultWidgets,
  layout: defaultLayout,
  isCustomizing: false,
  presets: {
    'default': {
      name: 'Default',
      widgets: defaultWidgets,
      layout: defaultLayout,
    },
    'compact': {
      name: 'Compact',
      widgets: {
        ...defaultWidgets,
        'upcoming-inspections': {
          ...defaultWidgets['upcoming-inspections'],
          size: 'medium' as const,
        },
        'recent-activity': {
          ...defaultWidgets['recent-activity'],
          size: 'medium' as const,
        },
      },
      layout: {
        ...defaultLayout,
        compactView: true,
        columnCount: 3,
      },
    },
    'performance': {
      name: 'Performance Focus',
      widgets: {
        ...defaultWidgets,
        'supplier-performance': {
          ...defaultWidgets['supplier-performance'],
          size: 'large' as const,
          position: 0,
        },
        'quality-metrics': {
          ...defaultWidgets['quality-metrics'],
          size: 'large' as const,
          position: 1,
        },
        'inspections-summary': {
          ...defaultWidgets['inspections-summary'],
          position: 2,
        },
        'upcoming-inspections': {
          ...defaultWidgets['upcoming-inspections'],
          position: 3,
        },
      },
      layout: defaultLayout,
    },
  },
  activePreset: 'default',
};

// Load persisted dashboard settings from localStorage if available
try {
  const savedWidgets = localStorage.getItem('dashboardWidgets');
  const savedLayout = localStorage.getItem('dashboardLayout');
  const activePreset = localStorage.getItem('dashboardActivePreset');
  
  if (savedWidgets) {
    initialState.widgets = JSON.parse(savedWidgets);
  }
  
  if (savedLayout) {
    initialState.layout = JSON.parse(savedLayout);
  }
  
  if (activePreset) {
    initialState.activePreset = activePreset;
  }
} catch (_error) {
  console.error('Failed to load dashboard settings from localStorage', error);
}

// Create the dashboard slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    toggleWidgetVisibility: (state, action: PayloadAction<string>) => {
      const widgetId = action.payload;
      if (state.widgets[widgetId]) {
        state.widgets[widgetId].visible = !state.widgets[widgetId].visible;
        localStorage.setItem('dashboardWidgets', JSON.stringify(state.widgets));
      }
    },
    
    updateWidgetSize: (state, action: PayloadAction<{ id: string; size: 'small' | 'medium' | 'large' }>) => {
      const { id, size } = action.payload;
      if (state.widgets[id]) {
        state.widgets[id].size = size;
        localStorage.setItem('dashboardWidgets', JSON.stringify(state.widgets));
      }
    },
    
    updateWidgetPosition: (state, action: PayloadAction<{ id: string; position: number }>) => {
      const { id, position } = action.payload;
      if (state.widgets[id]) {
        state.widgets[id].position = position;
        localStorage.setItem('dashboardWidgets', JSON.stringify(state.widgets));
      }
    },
    
    addWidget: (state, action: PayloadAction<DashboardWidgetConfig>) => {
      const widget = action.payload;
      state.widgets[widget.id] = widget;
      localStorage.setItem('dashboardWidgets', JSON.stringify(state.widgets));
    },
    
    removeWidget: (state, action: PayloadAction<string>) => {
      const widgetId = action.payload;
      if (state.widgets[widgetId]) {
        const { [widgetId]: removed, ...rest } = state.widgets;
        state.widgets = rest;
        localStorage.setItem('dashboardWidgets', JSON.stringify(state.widgets));
      }
    },
    
    updateLayout: (state, action: PayloadAction<Partial<DashboardLayout>>) => {
      state.layout = { ...state.layout, ...action.payload };
      localStorage.setItem('dashboardLayout', JSON.stringify(state.layout));
    },
    
    toggleCustomizationMode: (state) => {
      state.isCustomizing = !state.isCustomizing;
    },
    
    applyPreset: (state, action: PayloadAction<string>) => {
      const presetId = action.payload;
      if (state.presets[presetId]) {
        state.widgets = { ...state.presets[presetId].widgets };
        state.layout = { ...state.presets[presetId].layout };
        state.activePreset = presetId;
        
        // Persist to localStorage
        localStorage.setItem('dashboardWidgets', JSON.stringify(state.widgets));
        localStorage.setItem('dashboardLayout', JSON.stringify(state.layout));
        localStorage.setItem('dashboardActivePreset', presetId);
      }
    },
    
    savePreset: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const { id, name } = action.payload;
      state.presets[id] = {
        name,
        widgets: { ...state.widgets },
        layout: { ...state.layout },
      };
      state.activePreset = id;
      
      // Persist active preset to localStorage
      localStorage.setItem('dashboardActivePreset', id);
    },
    
    resetDashboard: (state) => {
      state.widgets = defaultWidgets;
      state.layout = defaultLayout;
      state.activePreset = 'default';
      
      // Clear localStorage
      localStorage.removeItem('dashboardWidgets');
      localStorage.removeItem('dashboardLayout');
      localStorage.setItem('dashboardActivePreset', 'default');
    },
    
    syncWithServer: (state, action: PayloadAction<{ widgets: { [key: string]: DashboardWidgetConfig }; layout: DashboardLayout }>) => {
      const { widgets, layout } = action.payload;
      state.widgets = widgets;
      state.layout = layout;
      
      // Persist to localStorage
      localStorage.setItem('dashboardWidgets', JSON.stringify(widgets));
      localStorage.setItem('dashboardLayout', JSON.stringify(layout));
    }
  },
});

// Export actions
export const {
  toggleWidgetVisibility,
  updateWidgetSize,
  updateWidgetPosition,
  updateLayout,
  toggleCustomizationMode,
  applyPreset,
  savePreset,
  resetDashboard,
  syncWithServer,
  addWidget,
  removeWidget,
} = dashboardSlice.actions;

// Export reducer
export default dashboardSlice.reducer; 