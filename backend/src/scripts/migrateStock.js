const mongoose = require('mongoose');
require('dotenv').config();

const migrateStock = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/superstore';
  await mongoose.connect(mongoURI);
  const db = mongoose.connection.db;
  const products = db.collection('products');
  const result = await products.updateMany(
    { stockQuantity: { $exists: true } },
    [{
      $set: {
        inventoryQuantity: { $ifNull: ['$inventoryQuantity', 0] },
        storeQuantity: { $ifNull: ['$stockQuantity', 0] }
      }
    }, { $unset: 'stockQuantity' }]
  );
  console.log(`Migrated ${result.modifiedCount} product(s) from stockQuantity to storeQuantity.`);
  await mongoose.disconnect();
};

migrateStock().catch(async error => {
  console.error('Stock migration failed:', error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
