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

// Helper function to generate VIN number
function generateVIN() {
  return faker.vehicle.vin()
}

// Enhanced policy type definitions with rich data
const POLICY_TYPES = {
  auto: {
    name: 'auto',
    descriptions: [
      'Comprehensive Auto Insurance with Collision Coverage',
      'Full Coverage Auto Insurance with Roadside Assistance',
      'Standard Auto Insurance with Liability Protection'
    ],
    limits: ['$50,000', '$100,000', '$250,000', '$500,000'],
    deductibles: ['$500', '$1,000', '$2,500'],
    additionalCoverages: [
      'Roadside Assistance',
      'Rental Car Coverage',
      'Gap Insurance',
      'Personal Injury Protection'
    ],
    vehicles: [
      { make: 'Toyota', model: 'Camry', yearRange: [2018, 2024] },
      { make: 'Honda', model: 'CR-V', yearRange: [2019, 2024] },
      { make: 'Ford', model: 'F-150', yearRange: [2017, 2024] },
      { make: 'Tesla', model: 'Model 3', yearRange: [2020, 2024] }
    ],
    discounts: [
      'Safe Driver',
      'Multi-Car',
      'Anti-Theft Device',
      'Good Student',
      'Defensive Driving Course'
    ]
  },
  home: {
    name: 'home',
    descriptions: [
      'Premium Homeowners Insurance with Natural Disaster Coverage',
      'Standard Homeowners Insurance with Personal Property Protection',
      'Basic Homeowners Insurance with Liability Coverage'
    ],
    limits: ['$200,000', '$350,000', '$500,000', '$1,000,000'],
    deductibles: ['$1,000', '$2,500', '$5,000'],
    propertyTypes: [
      'Single Family Home',
      'Townhouse',
      'Condominium',
      'Multi-Family Home'
    ],
    constructionTypes: [
      'Wood Frame',
      'Masonry',
      'Steel Frame',
      'Concrete'
    ],
    securityFeatures: [
      'Security System',
      'Fire Sprinklers',
      'Smoke Detectors',
      'Deadbolt Locks',
      'Security Cameras'
    ],
    discounts: [
      'Security System',
      'Fire Safety',
      'New Home',
      'Bundle Discount',
      'Claims Free'
    ]
  },
  life: {
    name: 'life',
    descriptions: [
      'Term Life Insurance - 20 Year Fixed Rate',
      'Whole Life Insurance with Investment Component',
      'Universal Life Insurance with Flexible Premiums'
    ],
    limits: ['$100,000', '$250,000', '$500,000', '$1,000,000'],
    deductibles: ['$0'],
    beneficiaryTypes: [
      'Spouse',
      'Child',
      'Parent',
      'Trust',
      'Estate'
    ],
    discounts: [
      'Non-Smoker',
      'Preferred Health',
      'Bundle Discount'
    ]
  }
}

// Helper function to generate random premium details
function generatePremiumDetails(coverageLimit, policyType) {
  const baseRate = {
    auto: 0.05,
    home: 0.003,
    life: 0.004
  }[policyType]

  const annualPremium = Math.round(parseFloat(coverageLimit.replace(/[^0-9.]/g, '')) * baseRate)
  const frequencies = ['monthly', 'quarterly', 'semi-annual', 'annual']
  const frequency = faker.helpers.arrayElement(frequencies)
  
  const nextPaymentDate = faker.date.future()
  
  return {
    annualPremium,
    paymentFrequency: frequency,
    nextPaymentDue: nextPaymentDate.toISOString(),
    discount: Math.round(annualPremium * faker.number.float({ min: 0, max: 0.2 })),
    paymentHistory: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
      date: faker.date.past().toISOString(),
      amount: Math.round(annualPremium / (frequency === 'monthly' ? 12 : frequency === 'quarterly' ? 4 : 2)),
      status: 'paid'
    }))
  }
}

// Helper function to generate coverage details based on policy type
function generateCoverageDetails(type, policyTypeData) {
  switch (type) {
    case 'auto': {
      const vehicle = faker.helpers.arrayElement(policyTypeData.vehicles)
      const year = faker.number.int({ 
        min: vehicle.yearRange[0], 
        max: vehicle.yearRange[1] 
      })
      
      return {
        description: faker.helpers.arrayElement(policyTypeData.descriptions),
        additionalCoverages: faker.helpers.arrayElements(
          policyTypeData.additionalCoverages,
          faker.number.int({ min: 1, max: 3 })
        ),
        discounts: faker.helpers.arrayElements(
          policyTypeData.discounts,
          faker.number.int({ min: 1, max: 3 })
        ),
        vehicleInfo: {
          make: vehicle.make,
          model: vehicle.model,
          year: year,
          vin: generateVIN()
        }
      }
    }
    
    case 'home': {
      return {
        description: faker.helpers.arrayElement(policyTypeData.descriptions),
        propertyInfo: {
          constructionYear: faker.number.int({ min: 1950, max: 2023 }),
          squareFeet: faker.number.int({ min: 1000, max: 5000 }),
          constructionType: faker.helpers.arrayElement(policyTypeData.constructionTypes),
          securityFeatures: faker.helpers.arrayElements(
            policyTypeData.securityFeatures,
            faker.number.int({ min: 2, max: 4 })
          )
        },
        discounts: faker.helpers.arrayElements(
          policyTypeData.discounts,
          faker.number.int({ min: 1, max: 3 })
        )
      }
    }
    
    case 'life': {
      return {
        description: faker.helpers.arrayElement(policyTypeData.descriptions),
        healthInfo: {
          smokerStatus: faker.datatype.boolean(),
          beneficiaries: faker.helpers.arrayElements(
            policyTypeData.beneficiaryTypes,
            faker.number.int({ min: 1, max: 3 })
          ).map(type => ({
            type,
            name: faker.person.fullName()
          }))
        }
      }
    }
  }
}

async function main() {
  // First, clear existing data
  console.log('Cleaning up existing data...')
  await prisma.$executeRaw`TRUNCATE TABLE "Document" CASCADE;`
  await prisma.$executeRaw`TRUNCATE TABLE "Policy" CASCADE;`
  await prisma.$executeRaw`TRUNCATE TABLE "Address" CASCADE;`
  await prisma.$executeRaw`TRUNCATE TABLE "Client" CASCADE;`

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
          isDefault: j === 0
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
      const effectiveDate = new Date(issueDate)
      const expirationDate = new Date(effectiveDate)
      expirationDate.setFullYear(effectiveDate.getFullYear() + 1)

      // Select coverage limit and generate other details
      const coverageLimit = faker.helpers.arrayElement(policyType.limits)
      const coverageDetails = generateCoverageDetails(policyType.name, policyType)
      const premiumDetails = generatePremiumDetails(coverageLimit, policyType.name)

      await prisma.policy.create({
        data: {
          clientId: client.id,
          policyNumber: generatePolicyNumber(policyType.name),
          type: policyType.name,
          issueDate,
          effectiveDate,
          expirationDate,
          status: faker.helpers.arrayElement(['active', 'active', 'active', 'pending', 'expired']),
          coverageDetails,
          premiumDetails,
          underwritingStatus: faker.helpers.arrayElement(['approved', 'pending_review', 'declined']),
          lastReviewDate: faker.date.recent(),
          renewalStatus: faker.helpers.arrayElement(['auto_renewal', 'manual_renewal', 'non_renewable']),
          claimHistory: Array.from(
            { length: faker.number.int({ min: 0, max: 3 }) },
            () => ({
              date: faker.date.past().toISOString(),
              type: faker.helpers.arrayElement(['accident', 'theft', 'damage', 'injury']),
              status: faker.helpers.arrayElement(['pending', 'approved', 'denied']),
              amount: faker.number.int({ min: 1000, max: 50000 })
            })
          )
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