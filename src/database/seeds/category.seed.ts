import { AppDataSource } from '../data-source';
import { Category } from '../../categories/entities/category.entity';
import slugify from 'slugify';

const CATEGORIES_DATA = [
  {
    name: 'Mobiles',
    children: [
      'Mobile Phones',
      'Mobile Phone accessories',
      'Mobile spare parts',
      'Smart watches and Fitness bands',
    ],
  },
  {
    name: 'Electronics',
    children: [
      'Computers & Tablets',
      'Computer Accessories',
      'TVs',
      'Cameras & Camcorders',
      'Audio',
      'Electronic Home Appliances',
      'Air Conditions & Electrical fittings',
      'Video Games & Consoles',
      'Other Electronics',
    ],
  },
  {
    name: 'Vehicles',
    children: [
      'Cars',
      'Motorbikes',
      'Three Wheelers',
      'Bicycles',
      'Vans',
      'Buses',
      'Lorries & Trucks',
      'Heavy Duty',
      'Tractors',
      'Rentals',
      'Auto Parts & Accessories',
      'Maintenance and Repair',
      'Boats & Water Transport',
    ],
  },
  {
    name: 'Property',
    children: [
      'Land For Sale',
      'Houses For Sale',
      'Apartments For Sale',
      'Commercial Properties For Sale',
      'House Rentals',
      'Apartment Rentals',
      'Commercial Property Rentals',
      'Room & Annex Rentals',
      'Holiday & Short-Term Rental',
      'Land Rentals',
    ],
  },
  {
    name: 'Home & Garden',
    children: [
      'Furniture',
      'Bathroom & Sanitary ware',
      'Garden',
      'Home Decor',
      'Kitchen items',
      'Other Home Items',
    ],
  },
  {
    name: 'Business & Industry',
    children: [
      'Office Equipment, Supplies & Stationery',
      'Generators',
      'Industry Tools & Machinery',
      'Healthcare, Medical Equipment & Supplies',
      'Building Material & Tools',
    ],
  },
  {
    name: 'Hobby, Sport & Kids',
    children: [
      'Musical Instruments',
      'Sports & Fitness',
      'Sports Supplements',
      'Art & Collectibles',
      'Music, Books & Movies',
      'Children\'s Items',
      'Other Hobby, Sport & Kids Items',
    ],
  },
  {
    name: 'Fashion & Beauty',
    children: [
      'Bags & Luggage',
      'Clothing',
      'Shoes & Footwear',
      'Jewelry',
      'Sunglasses & Opticians',
      'Watches',
      'Other Fashion Accessories',
      'Beauty Products',
      'Other personal products',
    ],
  },
  {
    name: 'Essentials',
    children: [
      'Grocery',
      'Fruits & Vegetables',
      'Meat & Seafood',
      'Baby Products',
      'Healthcare',
      'Household',
      'Gas',
      'Other Essentials',
    ],
  },
];

async function seed() {
  console.log('Initializing database connection for seeding...');
  await AppDataSource.initialize();
  console.log('Database connection initialized successfully.');

  const categoryRepository = AppDataSource.getRepository(Category);

  try {
    for (const group of CATEGORIES_DATA) {
      const parentName = group.name;
      const parentSlug = slugify(parentName, { lower: true, strict: true });

      // 1. Check or insert parent category
      let parent = await categoryRepository.findOne({ where: { slug: parentSlug } });
      if (!parent) {
        parent = categoryRepository.create({
          name: parentName,
          slug: parentSlug,
          isActive: true,
          parentId: null,
        });
        parent = await categoryRepository.save(parent);
        console.log(`Created parent category: ${parentName}`);
      } else {
        console.log(`Parent category already exists: ${parentName}`);
      }

      // 2. Check or insert child categories
      for (const childName of group.children) {
        const childSlug = slugify(childName, { lower: true, strict: true });
        let child = await categoryRepository.findOne({ where: { slug: childSlug } });
        if (!child) {
          child = categoryRepository.create({
            name: childName,
            slug: childSlug,
            isActive: true,
            parentId: parent.id,
          });
          await categoryRepository.save(child);
          console.log(`  Created child category: ${childName} (under ${parentName})`);
        } else {
          // Update parent relationship if it's not set
          if (child.parentId !== parent.id) {
            child.parentId = parent.id;
            await categoryRepository.save(child);
            console.log(`  Updated parent of category ${childName} to ${parentName}`);
          } else {
            console.log(`  Child category already exists: ${childName}`);
          }
        }
      }
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    await AppDataSource.destroy();
    console.log('Database connection closed.');
  }
}

seed();
