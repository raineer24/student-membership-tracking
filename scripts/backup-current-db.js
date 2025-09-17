// File: scripts/backup-current-db.js
// Backup script that only backs up tables that actually exist
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function backupCurrentDatabase() {
  console.log('🔄 Starting backup of current database structure...');
  
  try {
    // Create backup directory
    const backupDir = path.join(__dirname, '..', 'backup');
    await fs.mkdir(backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `current-database-backup-${timestamp}.json`);
    
    // 1. Backup Users (without new relationships)
    console.log('📋 Backing up Users...');
    const users = await prisma.user.findMany();
    console.log(`✅ Found ${users.length} users`);
    
    // 2. Backup Students (without new relationships) 
    console.log('📋 Backing up Students...');
    const students = await prisma.student.findMany();
    console.log(`✅ Found ${students.length} students`);
    
    // 3. Backup Memberships
    console.log('📋 Backing up Memberships...');
    const memberships = await prisma.membership.findMany();
    console.log(`✅ Found ${memberships.length} memberships`);
    
    // 4. Backup Payments
    console.log('📋 Backing up Payments...');
    const payments = await prisma.payment.findMany();
    console.log(`✅ Found ${payments.length} payments`);
    
    // 5. Try to backup Reminders if table exists
    console.log('📋 Checking for Reminders...');
    let reminders = [];
    try {
      reminders = await prisma.reminder.findMany();
      console.log(`✅ Found ${reminders.length} reminders`);
    } catch (error) {
      console.log(`⚠️  Reminder table doesn't exist: ${error.code}`);
    }
    
    // 6. Try to backup WeekendEvents if table exists
    console.log('📋 Checking for WeekendEvents...');
    let weekendEvents = [];
    try {
      weekendEvents = await prisma.weekendEvent.findMany();
      console.log(`✅ Found ${weekendEvents.length} weekend events`);
    } catch (error) {
      console.log(`⚠️  WeekendEvent table doesn't exist: ${error.code}`);
    }
    
    // 7. Get relationships separately to build complete data structure
    console.log('📋 Building relationships...');
    
    // Get student-user relationships
    const studentUserRelations = [];
    for (const student of students) {
      if (student.userId) {
        const user = users.find(u => u.id === student.userId);
        if (user) {
          studentUserRelations.push({
            studentId: student.id,
            userId: student.userId,
            userData: user
          });
        }
      }
    }
    
    // Get student-membership relationships
    const studentMembershipRelations = [];
    for (const membership of memberships) {
      const student = students.find(s => s.id === membership.studentId);
      if (student) {
        studentMembershipRelations.push({
          membershipId: membership.id,
          studentId: membership.studentId,
          studentData: student
        });
      }
    }
    
    // Get student-payment relationships
    const studentPaymentRelations = [];
    for (const payment of payments) {
      const student = students.find(s => s.id === payment.studentId);
      if (student) {
        studentPaymentRelations.push({
          paymentId: payment.id,
          studentId: payment.studentId,
          studentData: student
        });
      }
    }
    
    // 8. Create complete backup object
    const backupData = {
      timestamp: new Date().toISOString(),
      databaseUrl: process.env.DATABASE_URL ? 'REDACTED' : 'Not set',
      schemaNote: 'Backup from current database before TrainingSession migration',
      metadata: {
        usersCount: users.length,
        studentsCount: students.length,
        membershipsCount: memberships.length,
        paymentsCount: payments.length,
        remindersCount: reminders.length,
        weekendEventsCount: weekendEvents.length,
        relationshipsCount: {
          studentUser: studentUserRelations.length,
          studentMembership: studentMembershipRelations.length,
          studentPayment: studentPaymentRelations.length
        }
      },
      rawData: {
        users,
        students,
        memberships,
        payments,
        reminders,
        weekendEvents
      },
      relationships: {
        studentUser: studentUserRelations,
        studentMembership: studentMembershipRelations,
        studentPayment: studentPaymentRelations
      }
    };
    
    // 9. Write backup file
    await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log('\n🎉 BACKUP COMPLETED SUCCESSFULLY!');
    console.log(`📁 Backup saved to: ${backupFile}`);
    console.log('📊 Backup Summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Students: ${students.length}`);
    console.log(`   - Memberships: ${memberships.length}`);
    console.log(`   - Payments: ${payments.length}`);
    console.log(`   - Reminders: ${reminders.length}`);
    console.log(`   - Weekend Events: ${weekendEvents.length}`);
    console.log('\n🔗 Relationships preserved:');
    console.log(`   - Student ↔ User: ${studentUserRelations.length}`);
    console.log(`   - Student ↔ Membership: ${studentMembershipRelations.length}`);
    console.log(`   - Student ↔ Payment: ${studentPaymentRelations.length}`);
    
    console.log('\n✅ Ready for schema migration!');
    
    return backupFile;
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run backup if script is called directly
if (require.main === module) {
  backupCurrentDatabase()
    .then((backupFile) => {
      console.log(`\n✅ Current database backup completed: ${backupFile}`);
      console.log('\n🚀 Next steps:');
      console.log('1. Run the pre-migration SQL to add defaults');
      console.log('2. Apply your new schema with: npx prisma db push');
      console.log('3. Generate new client with: npx prisma generate');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Backup failed:', error);
      process.exit(1);
    });
}

module.exports = { backupCurrentDatabase };