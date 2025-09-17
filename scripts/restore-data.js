// File: scripts/restore-data.js
// Complete data restoration after schema migration
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function restoreAllData(backupFilePath) {
  console.log('🔄 Starting data restoration...');
  console.log(`📁 Reading backup from: ${backupFilePath}`);
  
  try {
    // 1. Read backup file
    const backupContent = await fs.readFile(backupFilePath, 'utf8');
    const backupData = JSON.parse(backupContent);
    
    console.log('📊 Backup Summary:');
    console.log(`   - Backup Date: ${backupData.timestamp}`);
    console.log(`   - Users: ${backupData.metadata.usersCount}`);
    console.log(`   - Students: ${backupData.metadata.studentsCount}`);
    console.log(`   - Memberships: ${backupData.metadata.membershipsCount}`);
    console.log(`   - Payments: ${backupData.metadata.paymentsCount}`);
    console.log(`   - Events: ${backupData.metadata.eventsCount}`);
    console.log(`   - Event Attendees: ${backupData.metadata.eventAttendeesCount}`);
    
    // 2. Restore Users first (they are referenced by other tables)
    console.log('\n🔄 Restoring Users...');
    for (const user of backupData.data.users) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          password: user.password,
          role: user.role,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      });
    }
    console.log(`✅ Restored ${backupData.data.users.length} users`);
    
    // 3. Restore Students (needed before memberships and payments)
    console.log('\n🔄 Restoring Students...');
    for (const student of backupData.data.students) {
      const studentData = {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone || null,
        password: student.password || 'defaultpass123', // Handle missing password
        role: student.role || 'STUDENT',
        monthlyRate: student.monthlyRate || 1400,
        isLegacyStudent: student.isLegacyStudent || false,
        createdAt: new Date(student.createdAt || Date.now()),
        updatedAt: new Date(student.updatedAt || Date.now()),
        createdBy: student.createdBy || null
      };
      
      await prisma.student.create({ data: studentData });
    }
    console.log(`✅ Restored ${backupData.data.students.length} students`);
    
    // 4. Restore Memberships
    console.log('\n🔄 Restoring Memberships...');
    for (const membership of backupData.data.memberships) {
      const membershipData = {
        id: membership.id,
        studentId: membership.studentId,
        type: membership.type || 'MONTHLY',
        startDate: new Date(membership.startDate),
        endDate: new Date(membership.endDate),
        isActive: membership.isActive !== undefined ? membership.isActive : true,
        createdAt: new Date(membership.createdAt || Date.now()),
        updatedAt: new Date(membership.updatedAt || Date.now()),
        createdBy: membership.createdBy || null
      };
      
      await prisma.membership.create({ data: membershipData });
    }
    console.log(`✅ Restored ${backupData.data.memberships.length} memberships`);
    
    // 5. Restore Payments
    console.log('\n🔄 Restoring Payments...');
    for (const payment of backupData.data.payments) {
      const paymentData = {
        id: payment.id,
        studentId: payment.studentId,
        amount: payment.amount,
        description: payment.description || null,
        status: payment.status || 'COMPLETED',
        method: payment.method || null,
        paidAt: payment.paidAt ? new Date(payment.paidAt) : null,
        createdAt: new Date(payment.createdAt || Date.now()),
        updatedAt: new Date(payment.updatedAt || Date.now()),
        createdBy: payment.createdBy || null
      };
      
      await prisma.payment.create({ data: paymentData });
    }
    console.log(`✅ Restored ${backupData.data.payments.length} payments`);
    
    // 6. Restore Events
    console.log('\n🔄 Restoring Events...');
    for (const event of backupData.data.events) {
      const eventData = {
        id: event.id,
        title: event.title,
        description: event.description || null,
        eventDate: new Date(event.eventDate),
        location: event.location || null,
        maxAttendees: event.maxAttendees || null,
        isActive: event.isActive !== undefined ? event.isActive : true,
        createdAt: new Date(event.createdAt || Date.now()),
        updatedAt: new Date(event.updatedAt || Date.now()),
        createdBy: event.createdBy || null
      };
      
      await prisma.event.create({ data: eventData });
    }
    console.log(`✅ Restored ${backupData.data.events.length} events`);
    
    // 7. Restore Event Attendees
    console.log('\n🔄 Restoring Event Attendees...');
    for (const attendee of backupData.data.eventAttendees) {
      const attendeeData = {
        id: attendee.id,
        eventId: attendee.eventId,
        studentId: attendee.studentId,
        status: attendee.status || 'REGISTERED',
        registeredAt: new Date(attendee.registeredAt || Date.now())
      };
      
      await prisma.eventAttendee.create({ data: attendeeData });
    }
    console.log(`✅ Restored ${backupData.data.eventAttendees.length} event attendees`);
    
    // 8. Update sequences to prevent ID conflicts
    console.log('\n🔄 Updating database sequences...');
    
    // Update User sequence
    const maxUserId = Math.max(...backupData.data.users.map(u => u.id), 0);
    await prisma.$executeRaw`SELECT setval('\"User_id_seq\"', ${maxUserId + 1});`;
    
    // Update Student sequence
    const maxStudentId = Math.max(...backupData.data.students.map(s => s.id), 0);
    await prisma.$executeRaw`SELECT setval('\"Student_id_seq\"', ${maxStudentId + 1});`;
    
    // Update Membership sequence
    const maxMembershipId = Math.max(...backupData.data.memberships.map(m => m.id), 0);
    await prisma.$executeRaw`SELECT setval('\"Membership_id_seq\"', ${maxMembershipId + 1});`;
    
    // Update Payment sequence
    const maxPaymentId = Math.max(...backupData.data.payments.map(p => p.id), 0);
    await prisma.$executeRaw`SELECT setval('\"Payment_id_seq\"', ${maxPaymentId + 1});`;
    
    // Update Event sequence
    if (backupData.data.events.length > 0) {
      const maxEventId = Math.max(...backupData.data.events.map(e => e.id), 0);
      await prisma.$executeRaw`SELECT setval('\"Event_id_seq\"', ${maxEventId + 1});`;
    }
    
    // Update EventAttendee sequence
    if (backupData.data.eventAttendees.length > 0) {
      const maxEventAttendeeId = Math.max(...backupData.data.eventAttendees.map(ea => ea.id), 0);
      await prisma.$executeRaw`SELECT setval('\"EventAttendee_id_seq\"', ${maxEventAttendeeId + 1});`;
    }
    
    console.log('✅ Database sequences updated');
    
    console.log('\n🎉 DATA RESTORATION COMPLETED SUCCESSFULLY!');
    console.log('📊 Restoration Summary:');
    console.log(`   - Users: ${backupData.data.users.length} restored`);
    console.log(`   - Students: ${backupData.data.students.length} restored`);
    console.log(`   - Memberships: ${backupData.data.memberships.length} restored`);
    console.log(`   - Payments: ${backupData.data.payments.length} restored`);
    console.log(`   - Events: ${backupData.data.events.length} restored`);
    console.log(`   - Event Attendees: ${backupData.data.eventAttendees.length} restored`);
    
  } catch (error) {
    console.error('❌ Restoration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Function to find the most recent backup file
async function findLatestBackup() {
  const backupDir = path.join(__dirname, '..', 'backup');
  try {
    const files = await fs.readdir(backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('database-backup-') && file.endsWith('.json'))
      .sort()
      .reverse();
    
    if (backupFiles.length === 0) {
      throw new Error('No backup files found in backup directory');
    }
    
    return path.join(backupDir, backupFiles[0]);
  } catch (error) {
    throw new Error(`Could not find backup directory or files: ${error.message}`);
  }
}

// Run restoration if script is called directly
if (require.main === module) {
  const backupFile = process.argv[2];
  
  if (backupFile) {
    // Use specified backup file
    restoreAllData(backupFile)
      .then(() => {
        console.log('\n✅ Restoration completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n❌ Restoration failed:', error);
        process.exit(1);
      });
  } else {
    // Find and use latest backup file
    findLatestBackup()
      .then((latestBackup) => {
        console.log(`🔍 Using latest backup: ${latestBackup}`);
        return restoreAllData(latestBackup);
      })
      .then(() => {
        console.log('\n✅ Restoration completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n❌ Restoration failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { restoreAllData, findLatestBackup };