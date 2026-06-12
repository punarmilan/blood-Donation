import cron from 'node-cron';
import BloodUnit from '../models/BloodUnit.js';

const job = cron.schedule('0 0 * * *', async () => {
  console.log('Running expiry checker...');
  const now = new Date();
  
  try {
    const result = await BloodUnit.updateMany(
      {
        currentStatus: 'Available',
        expiryDate: { $lt: now }
      },
      {
        $set: { currentStatus: 'Expired' },
        $push: {
          history: {
            status: 'Expired',
            action: 'Auto-Expired by System',
            note: 'Unit expired — automatically moved to Expired status',
            updatedBy: 'System',
            updatedByRole: 'system',
            updatedAt: now
          }
        }
      }
    );
    
    console.log(`Auto-expired ${result.modifiedCount} units`);
  } catch (err) {
    console.error('Error running expiry checker:', err);
  }
});

export default job;
