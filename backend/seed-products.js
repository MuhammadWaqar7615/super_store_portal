const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');
require('dotenv').config();

const productData = [
  // First 8 products with specific generated images
  { name: 'Apple iPhone 14 Pro Max', category: 'Electronics', price: 1099, image: '/images/product_1.jpg' },
  { name: 'Samsung Galaxy S23 Ultra', category: 'Electronics', price: 1199, image: '/images/product_2.jpg' },
  { name: 'Sony WH-1000XM5 Headphones', category: 'Electronics', price: 398, image: '/images/product_3.jpg' },
  { name: 'MacBook Pro 16-inch M2 Max', category: 'Electronics', price: 3499, image: '/images/product_4.jpg' },
  { name: 'Dell XPS 15 Laptop', category: 'Electronics', price: 1899, image: '/images/product_5.jpg' },
  { name: 'iPad Pro 12.9-inch', category: 'Electronics', price: 1099, image: '/images/product_6.jpg' },
  { name: 'Nintendo Switch OLED', category: 'Electronics', price: 349, image: '/images/product_7.jpg' },
  { name: 'PlayStation 5 Console', category: 'Electronics', price: 499, image: '/images/product_8.jpg' },
  
  // Remaining 42 products with picsum.photos URLs based on keywords
  { name: 'Xbox Series X Console', category: 'Electronics', price: 499, keyword: 'xbox' },
  { name: 'GoPro HERO11 Black', category: 'Electronics', price: 399, keyword: 'gopro' },
  { name: 'Organic Extra Virgin Olive Oil', category: 'Groceries', price: 24, keyword: 'oliveoil' },
  { name: 'Artisanal Whole Bean Coffee', category: 'Groceries', price: 18, keyword: 'coffeebeans' },
  { name: 'Himalayan Pink Salt Grinder', category: 'Groceries', price: 8, keyword: 'saltgrinder' },
  { name: 'Manuka Honey UMF 15+', category: 'Groceries', price: 45, keyword: 'honey' },
  { name: 'Aged Balsamic Vinegar of Modena', category: 'Groceries', price: 32, keyword: 'vinegar' },
  { name: 'Organic Quinoa 2lbs', category: 'Groceries', price: 12, keyword: 'quinoa' },
  { name: 'Almond Flour 3lbs', category: 'Groceries', price: 15, keyword: 'almondflour' },
  { name: 'Matcha Green Tea Powder', category: 'Groceries', price: 22, keyword: 'matcha' },
  { name: 'Organic Maple Syrup Grade A', category: 'Groceries', price: 19, keyword: 'maplesyrup' },
  { name: 'Saffron Threads Premium', category: 'Groceries', price: 55, keyword: 'saffron' },
  { name: 'Levi\'s 501 Original Fit Jeans', category: 'Clothing', price: 79, keyword: 'jeans' },
  { name: 'Nike Dri-FIT Running Shirt', category: 'Clothing', price: 35, keyword: 'tshirt' },
  { name: 'Adidas Ultraboost 22 Shoes', category: 'Clothing', price: 190, keyword: 'runningshoes' },
  { name: 'Patagonia Better Sweater Fleece', category: 'Clothing', price: 139, keyword: 'fleece' },
  { name: 'North Face Resolve 2 Jacket', category: 'Clothing', price: 99, keyword: 'jacket' },
  { name: 'Calvin Klein Cotton Boxer Briefs', category: 'Clothing', price: 42, keyword: 'boxers' },
  { name: 'Under Armour Tech 2.0 T-Shirt', category: 'Clothing', price: 25, keyword: 'sportshirt' },
  { name: 'Columbia Steens Mountain Fleece', category: 'Clothing', price: 45, keyword: 'fleecejacket' },
  { name: 'Tommy Hilfiger Classic Polo', category: 'Clothing', price: 59, keyword: 'poloshirt' },
  { name: 'Champion Reverse Weave Hoodie', category: 'Clothing', price: 65, keyword: 'hoodie' },
  { name: 'Dyson V15 Detect Vacuum', category: 'Home Appliances', price: 749, keyword: 'vacuumcleaner' },
  { name: 'Breville Barista Express Espresso', category: 'Home Appliances', price: 699, keyword: 'espressomachine' },
  { name: 'Vitamix 5200 Blender', category: 'Home Appliances', price: 429, keyword: 'blender' },
  { name: 'Instant Pot Duo 7-in-1', category: 'Home Appliances', price: 99, keyword: 'pressurecooker' },
  { name: 'KitchenAid Artisan Stand Mixer', category: 'Home Appliances', price: 449, keyword: 'standmixer' },
  { name: 'Ninja Foodi Air Fryer', category: 'Home Appliances', price: 179, keyword: 'airfryer' },
  { name: 'Roomba j7+ Robot Vacuum', category: 'Home Appliances', price: 599, keyword: 'robotvacuum' },
  { name: 'Nespresso Vertuo Coffee Maker', category: 'Home Appliances', price: 159, keyword: 'coffeemaker' },
  { name: 'Philips Sonicare Electric Toothbrush', category: 'Home Appliances', price: 89, keyword: 'electrictoothbrush' },
  { name: 'Anova Culinary Sous Vide Cooker', category: 'Home Appliances', price: 129, keyword: 'sousvide' },
  { name: 'Estee Lauder Double Wear Foundation', category: 'Cosmetics', price: 48, keyword: 'foundationmakeup' },
  { name: 'MAC Lipstick Matte', category: 'Cosmetics', price: 23, keyword: 'lipstick' },
  { name: 'Chanel No.5 Eau de Parfum', category: 'Cosmetics', price: 145, keyword: 'perfume' },
  { name: 'Dior Addict Lip Glow', category: 'Cosmetics', price: 40, keyword: 'lipgloss' },
  { name: 'Charlotte Tilbury Magic Cream', category: 'Cosmetics', price: 100, keyword: 'facecream' },
  { name: 'Fenty Beauty Pro Filt\'r', category: 'Cosmetics', price: 39, keyword: 'makeupfoundation' },
  { name: 'NARS Radiant Creamy Concealer', category: 'Cosmetics', price: 32, keyword: 'concealer' },
  { name: 'Tarte Shape Tape Contour Concealer', category: 'Cosmetics', price: 31, keyword: 'makeupconcealer' },
  { name: 'Urban Decay Naked Eyeshadow Palette', category: 'Cosmetics', price: 54, keyword: 'eyeshadow' },
  { name: 'Olaplex No. 7 Bonding Oil', category: 'Cosmetics', price: 30, keyword: 'hairoil' }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Remove old seeded products so we don't have duplicates
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Create categories first if they don't exist
    const categoryNames = [...new Set(productData.map(p => p.category))];
    const categoryMap = {};

    for (const catName of categoryNames) {
      let category = await Category.findOne({ name: catName });
      if (!category) {
        category = await Category.create({ name: catName, description: `${catName} products` });
        console.log(`Created category: ${catName}`);
      }
      categoryMap[catName] = category._id;
    }

    // Prepare products
    const productsToInsert = productData.map((p, index) => {
      const purchasePrice = p.price * 0.7; // 30% margin
      let imageUrl = p.image;
      if (!imageUrl) {
        // Use picsum.photos for real photographic placeholders
        imageUrl = `https://picsum.photos/seed/${p.keyword || index}/400/400`;
      }

      return {
        name: p.name,
        description: `Premium ${p.name} for the best experience.`,
        category: categoryMap[p.category],
        purchasePrice: purchasePrice,
        sellingPrice: p.price,
        stockQuantity: 100,
        minimumStock: 10,
        unit: 'pcs',
        image: imageUrl,
        isActive: true
      };
    });

    await Product.insertMany(productsToInsert);
    console.log(`Successfully inserted ${productsToInsert.length} products`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seed();
