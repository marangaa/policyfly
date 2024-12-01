const { PrismaClient } = require('@prisma/client')
const { faker } = require('@faker-js/faker')

const prisma = new PrismaClient()

// Helper function to create a random date within a range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to generate a policy number with enhanced uniqueness
function generatePolicyNumber(type: string): string {
  const prefix = type.substring(0, 2).toUpperCase()
  const year = new Date().getFullYear()
  const timestamp = Date.now().toString().slice(-6)  // Use last 6 digits of timestamp
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}-${year}-${timestamp}${random}`
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

// Enhanced policy variations with detailed package configurations
const POLICY_VARIATIONS = {
  auto: {
    packages: [
      {
        name: 'Basic',
        coverageLimit: '50000',
        deductible: '1000',
        features: ['Liability', 'Collision'],
        monthlyPremiumRange: { min: 50, max: 150 },
        requirements: ['Valid Driver\'s License', 'Vehicle Registration'],
        restrictions: ['No DUI History', 'Licensed for at least 1 year']
      },
      {
        name: 'Premium',
        coverageLimit: '100000',
        deductible: '500',
        features: ['Liability', 'Collision', 'Comprehensive', 'Roadside'],
        monthlyPremiumRange: { min: 100, max: 300 },
        requirements: ['Valid Driver\'s License', 'Vehicle Registration', 'Clean Driving Record'],
        restrictions: ['No Major Accidents in Past 3 Years']
      },
      {
        name: 'Elite',
        coverageLimit: '250000',
        deductible: '250',
        features: ['Liability', 'Collision', 'Comprehensive', 'Roadside', 'Rental', 'Gap Coverage'],
        monthlyPremiumRange: { min: 200, max: 500 },
        requirements: ['Valid Driver\'s License', 'Vehicle Registration', 'Excellent Driving Record'],
        restrictions: ['No Claims in Past 5 Years']
      }
    ]
  },
  home: {
    packages: [
      {
        name: 'Standard',
        coverageLimit: '250000',
        deductible: '2500',
        features: ['Dwelling', 'Personal Property', 'Liability'],
        monthlyPremiumRange: { min: 75, max: 200 },
        requirements: ['Home Inspection', 'Smoke Detectors'],
        restrictions: ['No Previous Claims in Past 2 Years']
      },
      {
        name: 'Premium',
        coverageLimit: '500000',
        deductible: '1000',
        features: ['Dwelling', 'Personal Property', 'Loss of Use', 'Extended Replacement', 'Personal Liability'],
        monthlyPremiumRange: { min: 150, max: 400 },
        requirements: ['Home Inspection', 'Security System', 'Fire Protection'],
        restrictions: ['No Major Claims in Past 3 Years']
      },
      {
        name: 'Elite',
        coverageLimit: '1000000',
        deductible: '500',
        features: ['Dwelling', 'Personal Property', 'Loss of Use', 'Extended Replacement', 'Personal Liability', 'Natural Disaster', 'High-Value Items'],
        monthlyPremiumRange: { min: 300, max: 800 },
        requirements: ['Professional Home Inspection', 'Advanced Security System', 'Fire Suppression System'],
        restrictions: ['No Claims in Past 5 Years']
      }
    ]
  },
  life: {
    packages: [
      {
        name: 'Term Basic',
        coverageLimit: '100000',
        deductible: '0',
        features: ['Death Benefit', 'Terminal Illness Rider'],
        monthlyPremiumRange: { min: 25, max: 100 },
        requirements: ['Medical Exam', 'Health History'],
        restrictions: ['Age 18-65', 'No Terminal Illnesses']
      },
      {
        name: 'Term Plus',
        coverageLimit: '500000',
        deductible: '0',
        features: ['Death Benefit', 'Terminal Illness Rider', 'Critical Illness Rider', 'Disability Waiver'],
        monthlyPremiumRange: { min: 50, max: 200 },
        requirements: ['Medical Exam', 'Health History', 'Financial Documentation'],
        restrictions: ['Age 18-60', 'No Major Health Issues']
      },
      {
        name: 'Whole Life',
        coverageLimit: '1000000',
        deductible: '0',
        features: ['Death Benefit', 'Cash Value Accumulation', 'Dividend Eligibility', 'Loan Options'],
        monthlyPremiumRange: { min: 200, max: 1000 },
        requirements: ['Comprehensive Medical Exam', 'Health History', 'Financial Documentation', 'Income Verification'],
        restrictions: ['Age 18-55', 'Excellent Health Status']
      }
    ]
  }
}

// Helper function to generate random premium details
function generatePremiumDetails(coverageLimit: string, policyType: keyof typeof POLICY_TYPES) {
  const baseRate = {
    auto: 0.05,
    home: 0.003,
    life: 0.004
  }[policyType];

  const limitValue = parseInt(coverageLimit.replace(/[^0-9]/g, ''));
  const annualPremium = Math.round(limitValue * baseRate);
  const frequencies = ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'];
  
  return {
    annualPremium,
    paymentFrequency: faker.helpers.arrayElement(frequencies),
    nextPaymentDue: faker.date.future().toISOString(),
    discount: Math.round(annualPremium * faker.number.float({ min: 0.05, max: 0.2 }))
  };
}

// Helper function to generate coverage details based on policy type
interface VehicleInfo {
  make: string;
  model: string;
  year: number;
  vin: string;
}

interface PropertyInfo {
  constructionYear: number;
  squareFeet: number;
  constructionType: string;
}

interface CoverageDetailsBase {
  limit: string;
  deductible: string;
  description: string;
}

interface AutoCoverageDetails extends CoverageDetailsBase {
  vehicleInfo: VehicleInfo;
}

interface HomeCoverageDetails extends CoverageDetailsBase {
  propertyInfo: PropertyInfo;
}

interface LifeCoverageDetails extends CoverageDetailsBase {
  termLength: string;
}

type CoverageDetails = AutoCoverageDetails | HomeCoverageDetails | LifeCoverageDetails;

function generateCoverageDetails(type: keyof typeof POLICY_TYPES, policyTypeData: typeof POLICY_TYPES[keyof typeof POLICY_TYPES]): CoverageDetails {
  const limit = faker.helpers.arrayElement(policyTypeData.limits);
  const deductible = faker.helpers.arrayElement(policyTypeData.deductibles);
  const description = faker.helpers.arrayElement(policyTypeData.descriptions);

  const baseDetails = {
    limit: limit,
    deductible: deductible,
    description: description,
  };

  if (type === 'auto') {
    if ('vehicles' in policyTypeData) {
      const vehicle = faker.helpers.arrayElement(policyTypeData.vehicles);
      return {
        ...baseDetails,
        vehicleInfo: {
          make: vehicle.make,
          model: vehicle.model,
          year: faker.number.int({ min: vehicle.yearRange[0], max: vehicle.yearRange[1] }),
          vin: generateVIN()
        }
      };
    }
  }

  switch (type) {
    case 'home': {
      return {
        ...baseDetails,
        propertyInfo: {
          constructionYear: faker.number.int({ min: 1950, max: 2023 }),
          squareFeet: faker.number.int({ min: 1000, max: 5000 }),
          constructionType: 'constructionTypes' in policyTypeData ? faker.helpers.arrayElement(policyTypeData.constructionTypes) : ''
        }
      } as HomeCoverageDetails;
    }
    
    case 'life': {
      return {
        ...baseDetails,
        termLength: faker.helpers.arrayElement(['10 Years', '20 Years', '30 Years'])
      } as LifeCoverageDetails;
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

  for (let i = 0; i < 500; i++) {
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
          to: '2016-12-31' 
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

    // Assign 1-3 policies with different types
    const policyCount = Math.floor(Math.random() * 3) + 1
    const availableTypes = Object.keys(POLICY_VARIATIONS)
    const selectedTypes = faker.helpers.arrayElements(availableTypes, policyCount)

    for (const type of selectedTypes as (keyof typeof POLICY_TYPES)[]) {
      const policyTypeData = POLICY_TYPES[type];
      const coverageDetails = generateCoverageDetails(type, policyTypeData);
      if (!coverageDetails) {
        console.error('Coverage details are undefined for type:', type);
        continue;
      }
      const limit = coverageDetails.limit.replace(/[^0-9]/g, '');
      
      const issueDate = randomDate(new Date(2023, 0, 1), new Date());
      const effectiveDate = new Date(issueDate);
      const expirationDate = new Date(effectiveDate);
      expirationDate.setFullYear(effectiveDate.getFullYear() + 1);

      const selectedPackage = faker.helpers.arrayElement(POLICY_VARIATIONS[type].packages);

      await prisma.policy.create({
        data: {
          clientId: client.id,
          policyNumber: generatePolicyNumber(type),
          type: type,
          issueDate,
          effectiveDate,
          expirationDate,
          status: faker.helpers.arrayElement(['active', 'ACTIVE']),
          coverageDetails: JSON.stringify(coverageDetails),  // Stringify JSON fields
          premiumDetails: JSON.stringify(generatePremiumDetails(limit, type)),  // Stringify JSON fields
          underwritingStatus: 'approved',
          lastReviewDate: faker.date.recent(),
          renewalStatus: 'auto_renewal',
          claimsHistory: JSON.stringify({  // Stringify JSON fields
            claims: [],
            totalClaims: 0,
            lastClaimDate: null,
            riskScore: faker.number.int({ min: 50, max: 100 })
          }),
          packageType: selectedPackage.name.toLowerCase(),
          paymentStatus: faker.helpers.arrayElement(['current', 'past_due', 'paid_in_full'])
        }
      });
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