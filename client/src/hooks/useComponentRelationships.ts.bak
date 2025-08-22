import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Define types for component relationships
export interface ComponentNode {
  id: string;
  name: string;
  type: string;
  category?: string;
  description?: string;
  version?: string;
}

export interface ComponentLink {
  source: string;
  target: string;
  relationshipType: 'parent-child' | 'dependency' | 'assembly' | 'variant';
  strength?: number;
  description?: string;
}

export interface ComponentRelationshipsData {
  nodes: ComponentNode[];
  links: ComponentLink[];
}

interface UseComponentRelationshipsProps {
  componentId?: string;
  includeIndirect?: boolean;
}

const useComponentRelationships = ({
  componentId,
  includeIndirect = true
}: UseComponentRelationshipsProps = {}) => {
  const [data, setData] = useState<ComponentRelationshipsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch component relationships data
  const fetchRelationships = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `${API_BASE_URL}/api/components/relationships`;
      
      if (componentId) {
        url += `/${componentId}?includeIndirect=${includeIndirect}`;
      }
      
      // For development, generate mock data if API isn't implemented yet
      // In production, this would make an actual API call
      // const response = await axios.get(url);
      // const data = response.data.data;
      
      // Mock data generation for development until API is available
      const mockData = generateMockRelationships(componentId);
      setData(mockData);
    } catch (err: any) {
      console.error('Error fetching component relationships:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load component relationships');
    } finally {
      setLoading(false);
    }
  }, [componentId, includeIndirect]);

  // Initial data fetch
  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  return {
    data,
    loading,
    error,
    refetch: fetchRelationships
  };
};

// Helper function to generate mock data for development
function generateMockRelationships(focusComponentId?: string): ComponentRelationshipsData {
  // Create mock component nodes
  const components: ComponentNode[] = [
    { id: 'comp1', name: 'Avionics Control System', type: 'system', category: 'electronics' },
    { id: 'comp2', name: 'Flight Control Unit', type: 'unit', category: 'electronics' },
    { id: 'comp3', name: 'Navigation Subsystem', type: 'subsystem', category: 'electronics' },
    { id: 'comp4', name: 'Sensor Array', type: 'assembly', category: 'electronics' },
    { id: 'comp5', name: 'Power Distribution Module', type: 'module', category: 'electrical' },
    { id: 'comp6', name: 'Landing Gear Assembly', type: 'assembly', category: 'mechanical' },
    { id: 'comp7', name: 'Hydraulic System', type: 'system', category: 'mechanical' },
    { id: 'comp8', name: 'Fuel Management System', type: 'system', category: 'mechanical' },
    { id: 'comp9', name: 'Environmental Control', type: 'system', category: 'environmental' },
    { id: 'comp10', name: 'Cabin Pressurization', type: 'subsystem', category: 'environmental' },
    { id: 'comp11', name: 'Main Display Panel', type: 'assembly', category: 'electronics' },
    { id: 'comp12', name: 'Radar System', type: 'system', category: 'electronics' }
  ];

  // Create mock relationship links between components
  const links: ComponentLink[] = [
    { source: 'comp1', target: 'comp2', relationshipType: 'parent-child', strength: 0.9 },
    { source: 'comp1', target: 'comp3', relationshipType: 'parent-child', strength: 0.9 },
    { source: 'comp1', target: 'comp11', relationshipType: 'parent-child', strength: 0.8 },
    { source: 'comp3', target: 'comp4', relationshipType: 'parent-child', strength: 0.7 },
    { source: 'comp2', target: 'comp5', relationshipType: 'dependency', strength: 0.6 },
    { source: 'comp2', target: 'comp12', relationshipType: 'dependency', strength: 0.5 },
    { source: 'comp6', target: 'comp7', relationshipType: 'dependency', strength: 0.8 },
    { source: 'comp8', target: 'comp5', relationshipType: 'dependency', strength: 0.4 },
    { source: 'comp9', target: 'comp10', relationshipType: 'parent-child', strength: 0.9 },
    { source: 'comp7', target: 'comp6', relationshipType: 'assembly', strength: 0.7 },
    { source: 'comp11', target: 'comp3', relationshipType: 'dependency', strength: 0.5 }
  ];

  // If a specific component ID is provided, filter to show only relevant relationships
  if (focusComponentId) {
    const relevantNodeIds = new Set<string>();
    relevantNodeIds.add(focusComponentId);
    
    // Add directly connected components
    links.forEach(link => {
      if (link.source === focusComponentId) {
        relevantNodeIds.add(link.target);
      } else if (link.target === focusComponentId) {
        relevantNodeIds.add(link.source);
      }
    });
    
    // Filter links to only include those with relevant nodes
    const filteredLinks = links.filter(link => 
      relevantNodeIds.has(link.source) && relevantNodeIds.has(link.target)
    );
    
    // Filter nodes to only include relevant ones
    const filteredNodes = components.filter(node => relevantNodeIds.has(node.id));
    
    return {
      nodes: filteredNodes,
      links: filteredLinks
    };
  }

  return {
    nodes: components,
    links
  };
}

export default useComponentRelationships; 