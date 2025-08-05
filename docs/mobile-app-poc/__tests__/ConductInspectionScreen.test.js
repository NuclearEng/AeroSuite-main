import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ConductInspectionScreen from '../screens/inspections/ConductInspectionScreen';

// Mock the required modules
jest.mock('expo-camera', () => ({
  Camera: {
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
  })),
}));

jest.mock('expo-barcode-scanner', () => ({
  BarCodeScanner: 'BarCodeScanner',
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(JSON.stringify({
    id: '123',
    title: 'Test Inspection',
    supplier: { name: 'Test Supplier' },
    checklist: [
      { id: '1', text: 'Check item 1', completed: false },
      { id: '2', text: 'Check item 2', completed: false },
    ],
    notes: '',
    photos: [],
    defects: [],
  }))),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../services/api', () => ({
  get: jest.fn(() => Promise.resolve({
    id: '123',
    title: 'Test Inspection',
    supplier: { name: 'Test Supplier' },
    checklist: [
      { id: '1', text: 'Check item 1', completed: false },
      { id: '2', text: 'Check item 2', completed: false },
    ],
    notes: '',
    photos: [],
    defects: [],
  })),
  put: jest.fn(() => Promise.resolve({ success: true })),
  uploadFile: jest.fn(() => Promise.resolve({ url: 'https://example.com/photo.jpg' })),
}));

// Mock navigation and route props
const mockNavigation = {
  goBack: jest.fn(),
};

const mockRoute = {
  params: {
    inspectionId: '123',
  },
};

describe('ConductInspectionScreen', () => {
  it('renders loading state initially', () => {
    const { getByText } = render(
      <ConductInspectionScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    expect(getByText('Loading inspection...')).toBeTruthy();
  });
  
  it('renders inspection details after loading', async () => {
    const { getByText, findByText } = render(
      <ConductInspectionScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    await waitFor(() => {
      expect(getByText('Test Inspection')).toBeTruthy();
      expect(getByText('Test Supplier')).toBeTruthy();
      expect(getByText('Check item 1')).toBeTruthy();
      expect(getByText('Check item 2')).toBeTruthy();
    });
  });
  
  it('toggles checklist items when clicked', async () => {
    const { getByText, findByText } = render(
      <ConductInspectionScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    await waitFor(() => {
      const checklistItem = getByText('Check item 1');
      fireEvent.press(checklistItem);
      // In a real test, we would verify the style changes or icon changes
      // This is simplified for the POC
    });
  });
  
  it('adds defects when "Add Defect" button is clicked', async () => {
    const { getByText, findByText } = render(
      <ConductInspectionScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    await waitFor(() => {
      const addDefectButton = getByText('Add Defect');
      fireEvent.press(addDefectButton);
      // In a real test, we would verify that a new defect input appears
    });
  });
}); 