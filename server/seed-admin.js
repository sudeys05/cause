
import { getDatabase } from './mongodb-connection.js';
import bcrypt from 'bcryptjs';

export async function seedAdminUser() {
  try {
    const db = getDatabase();
    const usersCollection = db.collection('users');

    // Check if admin user already exists
    const existingAdmin = await usersCollection.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists, skipping seed');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = {
      username: 'admin',
      email: 'admin@police.gov',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      badgeNumber: 'ADMIN001',
      department: 'Administration',
      position: 'System Administrator',
      phone: '+1-555-0100',
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await usersCollection.insertOne(adminUser);
    console.log('✅ Admin user created successfully');
    console.log('📝 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  }
}
