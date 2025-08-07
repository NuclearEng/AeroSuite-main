import DocumentManager from '../../components/common/DocumentManager';

// ... existing code ...

// Inside the render function, add the DocumentManager component
return (
  <Container maxWidth="lg">
    {/* Existing supplier details content */}
    
    {/* Add Document Manager */}
    <DocumentManager 
      entityType="supplier"
      entityId={supplier._id}
      title="Supplier Documents"
    />
    
    {/* Rest of the existing content */}
  </Container>
); 