// prisma/seed.ts
const { PrismaClient } = require('@prisma/client')
const { faker } = require('@faker-js/faker')

const prisma = new PrismaClient()

// Helper function to create a random date within a range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper function to generate a policy number
function generatePolicyNumber(type) {
  const prefix = type.substring(0, 2).toUpperCase()
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}-${year}-${random}`
}

// Different types of insurance policies with detailed coverage information
const POLICY_TYPES = {
  auto: {
    name: 'auto',
    descriptions: [
      'Comprehensive Auto Insurance with Collision Coverage',
      'Full Coverage Auto Insurance with Roadside Assistance',
      'Standard Auto Insurance with Liability Protection'
    ],
    limits: ['$50,000', '$100,000', '$250,000', '$500,000'],
    deductibles: ['$500', '$1,000', '$2,500']
  },
  home: {
    name: 'home',
    descriptions: [
      'Premium Homeowners Insurance with Natural Disaster Coverage',
      'Standard Homeowners Insurance with Personal Property Protection',
      'Basic Homeowners Insurance with Liability Coverage'
    ],
    limits: ['$200,000', '$350,000', '$500,000', '$1,000,000'],
    deductibles: ['$1,000', '$2,500', '$5,000']
  },
  life: {
    name: 'life',
    descriptions: [
      'Term Life Insurance - 20 Year Fixed Rate',
      'Whole Life Insurance with Investment Component',
      'Universal Life Insurance with Flexible Premiums'
    ],
    limits: ['$100,000', '$250,000', '$500,000', '$1,000,000'],
    deductibles: ['$0']
  }
}

async function clearDatabase() {
  console.log('Cleaning up existing data...')
  // Delete data in the correct order to respect foreign key constraints
  try {
    // First delete tables with foreign keys
    await prisma.$executeRaw`TRUNCATE TABLE "Document" CASCADE;`
    await prisma.$executeRaw`TRUNCATE TABLE "Policy" CASCADE;`
    await prisma.$executeRaw`TRUNCATE TABLE "Address" CASCADE;`
    // Then delete the parent tables
    await prisma.$executeRaw`TRUNCATE TABLE "Client" CASCADE;`
    await prisma.$executeRaw`TRUNCATE TABLE "Template" CASCADE;`
  } catch {
    console.log('Some tables might not exist yet, continuing with seeding...')
  }
}

async function main() {
  // Clear existing data
  await clearDatabase()

  console.log('Starting to seed the database...')

  // Create 50 clients with varying numbers of policies and addresses
  for (let i = 0; i < 50; i++) {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const email = faker.internet.email({ firstName, lastName }).toLowerCase()

    // Create the client
    const client = await prisma.client.create({
      data: {
        fullName: `${firstName} ${lastName}`,
        email: email,
        phoneNumber: faker.phone.number(),
        dateOfBirth: faker.date.between({ 
          from: '1960-01-01', 
          to: '2000-12-31' 
        }),
      }
    })

    // Add 1-3 addresses for each client
    const addressCount = Math.floor(Math.random() * 3) + 1
    const addressTypes = ['home', 'work', 'mailing']
    
    for (let j = 0; j < addressCount; j++) {
      await prisma.address.create({
        data: {
          clientId: client.id,
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state({ abbreviated: true }),
          zipCode: faker.location.zipCode(),
          type: addressTypes[j],
          isDefault: j === 0  // First address is default
        }
      })
    }

    // Add 1-2 policies for each client
    const policyCount = Math.floor(Math.random() * 2) + 1
    const usedTypes = new Set()
    
    for (let k = 0; k < policyCount; k++) {
      // Select a random policy type that hasn't been used for this client
      let policyType
      do {
        policyType = faker.helpers.arrayElement(Object.values(POLICY_TYPES))
      } while (usedTypes.has(policyType.name))
      usedTypes.add(policyType.name)

      // Generate dates ensuring they make logical sense
      const issueDate = randomDate(
        new Date(2023, 0, 1),
        new Date(2024, 11, 31)
      )
      const effectiveDate = new Date(issueDate) // Coverage starts same day as issue
      const expirationDate = new Date(effectiveDate)
      expirationDate.setFullYear(effectiveDate.getFullYear() + 1) // One year policy

      await prisma.policy.create({
        data: {
          clientId: client.id,
          policyNumber: generatePolicyNumber(policyType.name),
          type: policyType.name,
          issueDate,
          effectiveDate,
          expirationDate,
          status: faker.helpers.arrayElement(['active', 'active', 'active', 'pending', 'expired']), // Weight towards active
          coverageDetails: {
            description: faker.helpers.arrayElement(policyType.descriptions),
            limit: faker.helpers.arrayElement(policyType.limits),
            deductible: faker.helpers.arrayElement(policyType.deductibles)
          }
        }
      })
    }

    if (i > 0 && i % 10 === 0) {
      console.log(`Created ${i} clients with their addresses and policies...`)
    }
  }

  console.log('Database seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })