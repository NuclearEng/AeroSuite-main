/**
 * Migration: add_last_active_to_users
 * Created at: 2024-06-12T00:00:01.000Z
 * 
 * This migration adds a lastActive field to all users to track user activity.
 */
module.exports = {
  /**
   * Run the migration
   * @param {Object} db - MongoDB client
   * @param {Object} client - MongoDB native client
   * @returns {Promise<void>}
   */
  async up(db, client) {
    console.log('Adding lastActive field to all users...');
    
    const result = await db.collection('users').updateMany(
      { lastActive: { $exists: false } },
      { 
        $set: { 
          lastActive: new Date(),
          activityTracking: {
            enabled: true,
            trackPageViews: true,
            trackActions: true
          }
        } 
      }
    );
    
    console.log(`Updated ${result.modifiedCount} users with lastActive field`);
    
    // Add index for the new field
    await db.collection('users').createIndex({ lastActive: -1 });
    console.log('Added index for lastActive field');
  },

  /**
   * Reverse the migration
   * @param {Object} db - MongoDB client
   * @param {Object} client - MongoDB native client
   * @returns {Promise<void>}
   */
  async down(db, client) {
    console.log('Removing lastActive field from all users...');
    
    const result = await db.collection('users').updateMany(
      {},
      { 
        $unset: { 
          lastActive: "",
          activityTracking: ""
        } 
      }
    );
    
    console.log(`Removed lastActive field from ${result.modifiedCount} users`);
    
    // Remove index for the field
    try {
      await db.collection('users').dropIndex({ lastActive: -1 });
      console.log('Removed index for lastActive field');
    } catch (error) {
      console.log('Index for lastActive field not found or already removed');
    }
  }
}; 