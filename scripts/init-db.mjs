// Initialize the database and seed test data with Prisma
// Run with: node scripts/init-db.mjs
// Requires: DATABASE_URL environment variable pointing to PostgreSQL database

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking for existing seed data...');
    const existingEmployees = await prisma.employee.count();
    if (existingEmployees > 0) {
      console.log('Database already seeded, skipping.');
      return;
    }

    console.log('Seeding test data...');
    const now = new Date();

    // Hash PINs
    const pin1234 = await hash('1234', 10);
    const pin5678 = await hash('5678', 10);
    const pin9999 = await hash('9999', 10);

    // Create employees
    const johnDoe = await prisma.employee.create({
      data: {
        name: 'John Doe',
        pinHash: pin1234,
        email: 'john@airx.llc',
        phone: '555-0001',
        role: 'field',
        hourlyRate: 45.0,
        isActive: true,
      },
    });

    const janeSmith = await prisma.employee.create({
      data: {
        name: 'Jane Smith',
        pinHash: pin5678,
        email: 'jane@airx.llc',
        phone: '555-0002',
        role: 'pm',
        hourlyRate: 65.0,
        isActive: true,
      },
    });

    const alexAdmin = await prisma.employee.create({
      data: {
        name: 'Alex Admin',
        pinHash: pin9999,
        email: 'admin@airx.llc',
        phone: '555-0003',
        role: 'admin',
        isActive: true,
      },
    });

    console.log('✓ Created 3 employees');

    // Create cost codes - 10 typical HVAC work codes
    const costCodes = await Promise.all([
      prisma.costCode.create({
        data: {
          code: '2301',
          description: 'General Conditions',
          category: 'hvac',
          acceptsLabor: true,
          acceptsMaterial: false,
          acceptsSub: false,
        },
      }),
      prisma.costCode.create({
        data: {
          code: '2323',
          description: 'Refrigeration Piping',
          category: 'hvac',
          acceptsLabor: true,
          acceptsMaterial: false,
          acceptsSub: false,
        },
      }),
      prisma.costCode.create({
        data: {
          code: '2331',
          description: 'Ductwork',
          category: 'hvac',
          acceptsLabor: true,
          acceptsMaterial: true,
          acceptsSub: false,
        },
      }),
      prisma.costCode.create({
        data: {
          code: '2350',
          description: 'HVAC Unit Installation',
          category: 'hvac',
          acceptsLabor: true,
          acceptsMaterial: true,
          acceptsSub: true,
        },
      }),
      prisma.costCode.create({
        data: {
          code: '2365',
          description: 'Insulation & Sealing',
          category: 'hvac',
          acceptsLabor: true,
          acceptsMaterial: true,
          acceptsSub: false,
        },
      }),
      prisma.costCode.create({
        data: {
          code: '2380',
          description: 'Controls & Testing',
          category: 'hvac',
          acceptsLabor: true,
          acceptsMaterial: false,
          acceptsSub: false,
        },
      }),
      prisma.costCode.create({
        data: {
          code: '5500',
          description: 'WA Drive Time (PW)',
          category: 'drive_time',
          acceptsLabor: true,
          acceptsMaterial: false,
          acceptsSub: false,
        },
      }),
      prisma.costCode.create({
        data: {
          code: '5501',
          description: 'Equipment Rental',
          category: 'equipment',
          acceptsLabor: false,
          acceptsMaterial: true,
          acceptsSub: false,
        },
      }),
      prisma.costCode.create({
        data: {
          code: '5502',
          description: 'Permits & Inspections',
          category: 'admin',
          acceptsLabor: true,
          acceptsMaterial: false,
          acceptsSub: true,
        },
      }),
      prisma.costCode.create({
        data: {
          code: '5503',
          description: 'Safety & Cleanup',
          category: 'safety',
          acceptsLabor: true,
          acceptsMaterial: true,
          acceptsSub: false,
        },
      }),
    ]);

    console.log('✓ Created 10 cost codes');

    // Create 5 sample jobs
    const job1 = await prisma.job.create({
      data: {
        foundationJobId: '25107',
        name: 'Echo Glen Medical Center',
        shortName: 'Echo Glen',
        status: 'active',
        isPrevailingWage: true,
        state: 'WA',
        address: '123 Healthcare Dr, Seattle, WA',
        pmId: janeSmith.id,
      },
    });

    const job2 = await prisma.job.create({
      data: {
        foundationJobId: '25108',
        name: 'Downtown Office Plaza',
        shortName: 'Office Plaza',
        status: 'active',
        isPrevailingWage: false,
        state: 'WA',
        address: '456 Business Ave, Bellevue, WA',
        pmId: janeSmith.id,
      },
    });

    const job3 = await prisma.job.create({
      data: {
        foundationJobId: '25109',
        name: 'Tech Campus HVAC Retrofit',
        shortName: 'Tech Campus',
        status: 'active',
        isPrevailingWage: false,
        state: 'WA',
        address: '789 Innovation Way, Redmond, WA',
        pmId: janeSmith.id,
      },
    });

    const job4 = await prisma.job.create({
      data: {
        foundationJobId: '25110',
        name: 'Spring Valley School District',
        shortName: 'Spring Valley',
        status: 'active',
        isPrevailingWage: true,
        state: 'WA',
        address: '321 Education Blvd, Spokane, WA',
        pmId: janeSmith.id,
      },
    });

    const job5 = await prisma.job.create({
      data: {
        foundationJobId: '25111',
        name: 'Hospital Expansion Phase 2',
        shortName: 'Hospital Expansion',
        status: 'active',
        isPrevailingWage: true,
        state: 'WA',
        address: '555 Medical Center Dr, Tacoma, WA',
        pmId: janeSmith.id,
      },
    });

    console.log('✓ Created 5 jobs');

    // Link cost codes to jobs
    const jobCostLinks = [
      { job: job1, costCode: costCodes[0], budgetedLabor: 3000, budgetedHours: 60 }, // General Conditions
      { job: job1, costCode: costCodes[1], budgetedLabor: 5000, budgetedHours: 100 }, // Refrigeration Piping
      { job: job1, costCode: costCodes[2], budgetedLabor: 8000, budgetedHours: 160 }, // Ductwork
      { job: job1, costCode: costCodes[3], budgetedLabor: 15000, budgetedHours: 200 }, // Unit Installation
      { job: job2, costCode: costCodes[2], budgetedLabor: 3000, budgetedHours: 60 }, // Ductwork
      { job: job2, costCode: costCodes[4], budgetedLabor: 2000, budgetedHours: 40 }, // Insulation
      { job: job3, costCode: costCodes[3], budgetedLabor: 12000, budgetedHours: 150 }, // Unit Installation
      { job: job3, costCode: costCodes[5], budgetedLabor: 2000, budgetedHours: 40 }, // Controls
    ];

    for (const link of jobCostLinks) {
      await prisma.jobCostCode.create({
        data: {
          jobId: link.job.id,
          costCodeId: link.costCode.id,
          budgetedLabor: link.budgetedLabor,
          budgetedHours: link.budgetedHours,
          syncedAt: now,
        },
      });
    }

    console.log('✓ Created JobCostCode links');

    // Add sample submission with time entries
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const submission = await prisma.submission.create({
      data: {
        employeeId: johnDoe.id,
        workDate: today,
        transcript: 'Spent 4 hours on ductwork at Echo Glen and 3 hours on refrigeration piping. Also 1 hour drive time.',
        totalHours: 8.0,
        status: 'submitted',
        submittedAt: now,
      },
    });

    await prisma.timeEntry.create({
      data: {
        employeeId: johnDoe.id,
        workDate: today,
        jobId: job1.id,
        costCodeId: costCodes[2].id, // Ductwork
        hours: 4.0,
        description: 'Ductwork installation - main trunk run 2nd floor',
        crewMembers: JSON.stringify([]),
        aiConfidence: 0.95,
        isFlagged: false,
        status: 'submitted',
        submissionId: submission.id,
      },
    });

    await prisma.timeEntry.create({
      data: {
        employeeId: johnDoe.id,
        workDate: today,
        jobId: job1.id,
        costCodeId: costCodes[1].id, // Refrigeration Piping
        hours: 3.0,
        description: 'Refrigeration piping - compressor room',
        crewMembers: JSON.stringify([]),
        aiConfidence: 0.92,
        isFlagged: false,
        status: 'submitted',
        submissionId: submission.id,
      },
    });

    await prisma.timeEntry.create({
      data: {
        employeeId: johnDoe.id,
        workDate: today,
        jobId: job1.id,
        costCodeId: costCodes[6].id, // Drive Time
        hours: 1.0,
        description: 'Drive time to Echo Glen',
        crewMembers: JSON.stringify([]),
        aiConfidence: 0.75,
        isFlagged: true,
        flagReason: 'Low confidence on drive time classification',
        status: 'submitted',
        submissionId: submission.id,
      },
    });

    console.log('✓ Created sample submission with time entries');

    console.log('\n✓ Database seeded successfully!');
    console.log('\nTest credentials:');
    console.log('  Field worker (John Doe): PIN 1234');
    console.log('  PM (Jane Smith): PIN 5678');
    console.log('  Admin (Alex Admin): PIN 9999');
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
