// File: scripts/backup-data.js
// Fixed backup script that matches your current database schema
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function backupAllData() {
  console.log('🔄 Starting complete database backup...');
  
  try {
    // Create backup directory
    const backupDir = path.join(__dirname, '..', 'backup');
    await fs.mkdir(backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `database-backup-${timestamp}.json`);
    
    // 1. Backup Users (with correct relationships)
    console.log('📋 Backing up Users...');
    const users = await prisma.user.findMany({
      include: {
        student: true,
        trainingSessions: true,
        weekendEvents: true
      }
    });
    console.log(`✅ Found ${users.length} users`);
    
    // 2. Backup Students (with correct relationships)
    console.log('📋 Backing up Students...');
    const students = await prisma.student.findMany({
      include: {
        memberships: true,
        payments: true,
        reminders: true,
        trainingSessions: true,
        user: true
      }
    });
    console.log(`✅ Found ${students.length} students`);
    
    // 3. Backup Memberships
    console.log('📋 Backing up Memberships...');
    const memberships = await prisma.membership.findMany({
      include: {
        student: true
      }
    });
    console.log(`✅ Found ${memberships.length} memberships`);
    
    // 4. Backup Payments
    console.log('📋 Backing up Payments...');
    const payments = await prisma.payment.findMany({
      include: {
        student: true
      }
    });
    console.log(`✅ Found ${payments.length} payments`);
    
    // 5. Backup Reminders (if they exist)
    console.log('📋 Backing up Reminders...');
    let reminders = [];
    try {
      reminders = await prisma.reminder.findMany({
        include: {
          student: true
        }
      });
      console.log(`✅ Found ${reminders.length} reminders`);
    } catch (error) {
      console.log(`⚠️  Reminder table doesn't exist yet: ${reminders.length} reminders`);
    }
    
    // 6. Backup WeekendEvents (if they exist)
    console.log('📋 Backing up Weekend Events...');
    let weekendEvents = [];
    try {
      weekendEvents = await prisma.weekendEvent.findMany({
        include: {
          user: true
        }
      });
      console.log(`✅ Found ${weekendEvents.length} weekend events`);
    } catch (error) {
      console.log(`⚠️  WeekendEvent table doesn't exist yet: ${weekendEvents.length} weekend events`);
    }
    
    // 7. Backup Training Sessions (if they exist)
    console.log('📋 Backing up Training Sessions...');
    let trainingSessions = [];
    try {
      trainingSessions = await prisma.trainingSession.findMany({
        include: {
          student: true,
          creator: true
        }
      });
      console.log(`✅ Found ${trainingSessions.length} training sessions`);
    } catch (error) {
      console.log(`⚠️  TrainingSession table doesn't exist yet: ${trainingSessions.length} training sessions`);
    }
    
    // 8. Create complete backup object
    const backupData = {
      timestamp: new Date().toISOString(),
      databaseUrl: process.env.DATABASE_URL ? 'REDACTED' : 'Not set',
      metadata: {
        usersCount: users.length,
        studentsCount: students.length,
        membershipsCount: memberships.length,
        paymentsCount: payments.length,
        remindersCount: reminders.length,
        weekendEventsCount: weekendEvents.length,
        trainingSessionsCount: trainingSessions.length
      },
      data: {
        users,
        students,
        memberships,
        payments,
        reminders,
        weekendEvents,
        trainingSessions
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
    console.log(`   - Training Sessions: ${trainingSessions.length}`);
    
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
  backupAllData()
    .then((backupFile) => {
      console.log(`\n✅ Backup completed: ${backupFile}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Backup failed:', error);
      process.exit(1);
    });
}

module.exports = { backupAllData };