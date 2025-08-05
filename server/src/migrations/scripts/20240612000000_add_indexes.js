/**
 * Migration: add_indexes
 * Created at: 2024-06-12T00:00:00.000Z
 * 
 * This migration adds important indexes to improve database performance.
 */
module.exports = {
  /**
   * Run the migration
   * @param {Object} db - MongoDB client
   * @param {Object} client - MongoDB native client
   * @returns {Promise<void>}
   */
  async up(db, client) {
    console.log('Adding indexes to improve performance...');
    
    // Add indexes to the users collection
    console.log('Adding indexes to users collection');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    
    // Add indexes to suppliers collection
    console.log('Adding indexes to suppliers collection');
    await db.collection('suppliers').createIndex({ name: 1 }, { unique: true });
    await db.collection('suppliers').createIndex({ code: 1 }, { unique: true });
    await db.collection('suppliers').createIndex({ status: 1 });
    await db.collection('suppliers').createIndex({ 'contacts.email': 1 });
    
    // Add indexes to customers collection
    console.log('Adding indexes to customers collection');
    await db.collection('customers').createIndex({ name: 1 }, { unique: true });
    await db.collection('customers').createIndex({ code: 1 }, { unique: true });
    await db.collection('customers').createIndex({ status: 1 });
    
    // Add indexes to inspections collection
    console.log('Adding indexes to inspections collection');
    await db.collection('inspections').createIndex({ inspectionNumber: 1 }, { unique: true });
    await db.collection('inspections').createIndex({ customerId: 1 });
    await db.collection('inspections').createIndex({ supplierId: 1 });
    await db.collection('inspections').createIndex({ status: 1 });
    await db.collection('inspections').createIndex({ result: 1 });
    await db.collection('inspections').createIndex({ scheduledDate: 1 });
    
    // Add compound indexes for common queries
    await db.collection('inspections').createIndex({ supplierId: 1, status: 1 });
    await db.collection('inspections').createIndex({ customerId: 1, status: 1 });
    
    // Add TTL index for temporary tokens
    console.log('Adding TTL index for tokens');
    await db.collection('tokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    
    // Add text indexes for search functionality
    console.log('Adding text indexes for search');
    await db.collection('suppliers').createIndex({ name: 'text', description: 'text' });
    await db.collection('customers').createIndex({ name: 'text', description: 'text' });
    await db.collection('inspections').createIndex({ title: 'text', description: 'text' });
    
    console.log('All indexes added successfully');
  },

  /**
   * Reverse the migration
   * @param {Object} db - MongoDB client
   * @param {Object} client - MongoDB native client
   * @returns {Promise<void>}
   */
  async down(db, client) {
    console.log('Dropping indexes...');
    
    // Drop indexes from users collection
    await db.collection('users').dropIndex({ email: 1 });
    await db.collection('users').dropIndex({ username: 1 });
    await db.collection('users').dropIndex({ role: 1 });
    
    // Drop indexes from suppliers collection
    await db.collection('suppliers').dropIndex({ name: 1 });
    await db.collection('suppliers').dropIndex({ code: 1 });
    await db.collection('suppliers').dropIndex({ status: 1 });
    await db.collection('suppliers').dropIndex({ 'contacts.email': 1 });
    
    // Drop indexes from customers collection
    await db.collection('customers').dropIndex({ name: 1 });
    await db.collection('customers').dropIndex({ code: 1 });
    await db.collection('customers').dropIndex({ status: 1 });
    
    // Drop indexes from inspections collection
    await db.collection('inspections').dropIndex({ inspectionNumber: 1 });
    await db.collection('inspections').dropIndex({ customerId: 1 });
    await db.collection('inspections').dropIndex({ supplierId: 1 });
    await db.collection('inspections').dropIndex({ status: 1 });
    await db.collection('inspections').dropIndex({ result: 1 });
    await db.collection('inspections').dropIndex({ scheduledDate: 1 });
    
    // Drop compound indexes
    await db.collection('inspections').dropIndex({ supplierId: 1, status: 1 });
    await db.collection('inspections').dropIndex({ customerId: 1, status: 1 });
    
    // Drop TTL index for temporary tokens
    await db.collection('tokens').dropIndex({ expiresAt: 1 });
    
    // Drop text indexes
    await db.collection('suppliers').dropIndex({ name: 'text', description: 'text' });
    await db.collection('customers').dropIndex({ name: 'text', description: 'text' });
    await db.collection('inspections').dropIndex({ title: 'text', description: 'text' });
    
    console.log('All indexes dropped successfully');
  }
}; 