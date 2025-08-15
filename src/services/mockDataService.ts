import { supabase } from '@/integrations/supabase/client'

export const createMockData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    console.log('Creating mock data for user:', user.id)

    // Insert mock categories
    const { error: categoriesError } = await supabase
      .from('categories')
      .upsert([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          user_id: user.id,
          name: 'Financial Documents',
          description: 'Bank statements, tax returns, invoices',
          icon: 'DollarSign',
          color: '#10B981',
          document_count: 8
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          user_id: user.id,
          name: 'Legal Documents',
          description: 'Contracts, agreements, legal papers',
          icon: 'Scale',
          color: '#3B82F6',
          document_count: 5
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          user_id: user.id,
          name: 'Personal',
          description: 'ID cards, passports, certificates',
          icon: 'User',
          color: '#8B5CF6',
          document_count: 12
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          user_id: user.id,
          name: 'Medical Records',
          description: 'Health reports, prescriptions, insurance',
          icon: 'Heart',
          color: '#EF4444',
          document_count: 6
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440005',
          user_id: user.id,
          name: 'Insurance',
          description: 'Insurance policies and claims',
          icon: 'Shield',
          color: '#F59E0B',
          document_count: 4
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440006',
          user_id: user.id,
          name: 'Property Documents',
          description: 'Real estate, property papers',
          icon: 'Home',
          color: '#06B6D4',
          document_count: 3
        }
      ])

    if (categoriesError) {
      console.error('Error creating categories:', categoriesError)
    } else {
      console.log('Categories created successfully')
    }

    // Insert mock documents
    const { error: documentsError } = await supabase
      .from('documents')
      .upsert([
        {
          id: '660e8400-e29b-41d4-a716-446655440001',
          user_id: user.id,
          name: 'Bank Statement - January 2024',
          category: 'Financial',
          mime_type: 'application/pdf',
          size: 2048576,
          tags: ['bank', 'statement', 'january', '2024'],
          file_url: 'https://example.com/files/bank-statement-jan-2024.pdf',
          download_url: 'https://example.com/download/bank-statement-jan-2024.pdf',
          ai_summary: 'Bank statement showing transactions for January 2024 with ending balance of $5,240.',
          extracted_text: 'BANK STATEMENT January 2024 Beginning Balance: $4,890 Ending Balance: $5,240',
          status: 'completed'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440002',
          user_id: user.id,
          name: 'Tax Return 2023',
          category: 'Financial',
          mime_type: 'application/pdf',
          size: 1536000,
          tags: ['tax', 'return', '2023', 'income'],
          file_url: 'https://example.com/files/tax-return-2023.pdf',
          download_url: 'https://example.com/download/tax-return-2023.pdf',
          ai_summary: 'Complete tax return for 2023 showing total income of $75,000 and tax owed of $8,200.',
          extracted_text: 'FORM 1040 Tax Year 2023 Total Income: $75,000 Tax Owed: $8,200',
          status: 'completed'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440003',
          user_id: user.id,
          name: 'Investment Portfolio Summary',
          category: 'Financial',
          mime_type: 'application/pdf',
          size: 1024000,
          tags: ['investment', 'portfolio', 'stocks', 'bonds'],
          file_url: 'https://example.com/files/investment-summary.pdf',
          download_url: 'https://example.com/download/investment-summary.pdf',
          ai_summary: 'Investment portfolio summary showing total value of $125,000 across stocks and bonds.',
          extracted_text: 'INVESTMENT SUMMARY Total Portfolio Value: $125,000 Stocks: 60% Bonds: 40%',
          status: 'completed'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440004',
          user_id: user.id,
          name: 'Employment Contract',
          category: 'Legal',
          mime_type: 'application/pdf',
          size: 800000,
          tags: ['employment', 'contract', 'agreement', 'salary'],
          file_url: 'https://example.com/files/employment-contract.pdf',
          download_url: 'https://example.com/download/employment-contract.pdf',
          ai_summary: 'Employment contract with ABC Corp starting salary $80,000 annually.',
          extracted_text: 'EMPLOYMENT AGREEMENT ABC Corporation Salary: $80,000 per year Start Date: January 15, 2024',
          status: 'completed'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440005',
          user_id: user.id,
          name: 'Rental Agreement',
          category: 'Legal',
          mime_type: 'application/pdf',
          size: 1200000,
          tags: ['rental', 'lease', 'apartment', 'monthly'],
          file_url: 'https://example.com/files/rental-agreement.pdf',
          download_url: 'https://example.com/download/rental-agreement.pdf',
          ai_summary: 'Rental agreement for 2-bedroom apartment at $2,400 per month.',
          extracted_text: 'RENTAL LEASE AGREEMENT Property: 123 Main St, Apt 4B Monthly Rent: $2,400',
          status: 'completed'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440006',
          user_id: user.id,
          name: 'Passport Copy',
          category: 'Personal',
          mime_type: 'image/jpeg',
          size: 512000,
          tags: ['passport', 'travel', 'identity', 'official'],
          file_url: 'https://example.com/files/passport-copy.jpg',
          download_url: 'https://example.com/download/passport-copy.jpg',
          ai_summary: 'Digital copy of passport valid until 2029 for international travel.',
          extracted_text: 'PASSPORT USA Valid Until: 2029-06-15 Passport Number: 123456789',
          status: 'completed'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440007',
          user_id: user.id,
          name: 'Birth Certificate',
          category: 'Personal',
          mime_type: 'application/pdf',
          size: 600000,
          tags: ['birth', 'certificate', 'official', 'document'],
          file_url: 'https://example.com/files/birth-certificate.pdf',
          download_url: 'https://example.com/download/birth-certificate.pdf',
          ai_summary: 'Official birth certificate issued by state registry.',
          extracted_text: 'CERTIFICATE OF BIRTH State of California Date of Birth: 1990-05-15',
          status: 'completed'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440008',
          user_id: user.id,
          name: 'Annual Health Checkup',
          category: 'Medical',
          mime_type: 'application/pdf',
          size: 700000,
          tags: ['health', 'checkup', 'medical', 'report'],
          file_url: 'https://example.com/files/health-checkup.pdf',
          download_url: 'https://example.com/download/health-checkup.pdf',
          ai_summary: 'Annual health checkup report showing good overall health with minor recommendations.',
          extracted_text: 'HEALTH REPORT Overall Health: Good Blood Pressure: 120/80 Cholesterol: Normal',
          status: 'completed'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440009',
          user_id: user.id,
          name: 'Prescription Record',
          category: 'Medical',
          mime_type: 'application/pdf',
          size: 300000,
          tags: ['prescription', 'medication', 'doctor', 'pharmacy'],
          file_url: 'https://example.com/files/prescription.pdf',
          download_url: 'https://example.com/download/prescription.pdf',
          ai_summary: 'Prescription for blood pressure medication, 30-day supply.',
          extracted_text: 'PRESCRIPTION Medication: Lisinopril 10mg Quantity: 30 tablets',
          status: 'completed'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440010',
          user_id: user.id,
          name: 'Auto Insurance Policy',
          category: 'Insurance',
          mime_type: 'application/pdf',
          size: 900000,
          tags: ['auto', 'insurance', 'policy', 'coverage'],
          file_url: 'https://example.com/files/auto-insurance.pdf',
          download_url: 'https://example.com/download/auto-insurance.pdf',
          ai_summary: 'Auto insurance policy with comprehensive coverage, $500 deductible.',
          extracted_text: 'AUTO INSURANCE POLICY Coverage: Comprehensive Deductible: $500 Premium: $1,200/year',
          status: 'completed'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440011',
          user_id: user.id,
          name: 'House Deed',
          category: 'Property',
          mime_type: 'application/pdf',
          size: 1100000,
          tags: ['deed', 'property', 'house', 'ownership'],
          file_url: 'https://example.com/files/house-deed.pdf',
          download_url: 'https://example.com/download/house-deed.pdf',
          ai_summary: 'Property deed for 3-bedroom house at 456 Oak Street purchased for $350,000.',
          extracted_text: 'PROPERTY DEED Address: 456 Oak Street Purchase Price: $350,000 Date: 2022-03-15',
          status: 'completed'
        }
      ])

    if (documentsError) {
      console.error('Error creating documents:', documentsError)
    } else {
      console.log('Documents created successfully')
    }

    // Insert smart tags
    const { error: smartTagsError } = await supabase
      .from('smart_tags')
      .upsert([
        {
          id: '770e8400-e29b-41d4-a716-446655440001',
          user_id: user.id,
          name: 'High Priority',
          description: 'Documents requiring immediate attention',
          color: '#EF4444',
          document_count: 5,
          ai_query: 'urgent OR priority OR deadline OR important',
          is_system_generated: true
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440002',
          user_id: user.id,
          name: 'Tax Related',
          description: 'All tax and IRS related documents',
          color: '#F59E0B',
          document_count: 8,
          ai_query: 'tax OR IRS OR 1040 OR deduction OR income',
          is_system_generated: true
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440003',
          user_id: user.id,
          name: 'Financial Planning',
          description: 'Investment and financial planning docs',
          color: '#10B981',
          document_count: 6,
          ai_query: 'investment OR retirement OR portfolio OR financial planning',
          is_system_generated: true
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440004',
          user_id: user.id,
          name: 'Legal Contracts',
          description: 'All contractual agreements',
          color: '#3B82F6',
          document_count: 4,
          ai_query: 'contract OR agreement OR terms OR conditions',
          is_system_generated: true
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440005',
          user_id: user.id,
          name: 'Medical History',
          description: 'Health and medical related documents',
          color: '#EC4899',
          document_count: 7,
          ai_query: 'medical OR health OR doctor OR prescription OR diagnosis',
          is_system_generated: true
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440006',
          user_id: user.id,
          name: 'Property Records',
          description: 'Real estate and property documents',
          color: '#06B6D4',
          document_count: 3,
          ai_query: 'property OR deed OR mortgage OR real estate',
          is_system_generated: true
        }
      ])

    if (smartTagsError) {
      console.error('Error creating smart tags:', smartTagsError)
    } else {
      console.log('Smart tags created successfully')
    }

    // Insert timeline events
    const { error: timelineError } = await supabase
      .from('timeline_events')
      .upsert([
        {
          id: '990e8400-e29b-41d4-a716-446655440001',
          user_id: user.id,
          document_id: '660e8400-e29b-41d4-a716-446655440001',
          event_type: 'upload',
          title: 'Document Uploaded',
          description: 'Bank Statement - January 2024 has been uploaded',
          metadata: { file_size: 2048576, file_type: 'application/pdf' }
        },
        {
          id: '990e8400-e29b-41d4-a716-446655440002',
          user_id: user.id,
          document_id: '660e8400-e29b-41d4-a716-446655440001',
          event_type: 'ai_analysis',
          title: 'AI Analysis Completed',
          description: 'AI successfully analyzed and categorized the document',
          metadata: { confidence: 0.95, category: 'Financial' }
        },
        {
          id: '990e8400-e29b-41d4-a716-446655440003',
          user_id: user.id,
          document_id: '660e8400-e29b-41d4-a716-446655440002',
          event_type: 'upload',
          title: 'Document Uploaded',
          description: 'Tax Return 2023 has been uploaded',
          metadata: { file_size: 1536000, file_type: 'application/pdf' }
        },
        {
          id: '990e8400-e29b-41d4-a716-446655440004',
          user_id: user.id,
          document_id: '660e8400-e29b-41d4-a716-446655440003',
          event_type: 'upload',
          title: 'Document Uploaded',
          description: 'Investment Portfolio Summary uploaded',
          metadata: { file_size: 1024000, file_type: 'application/pdf' }
        },
        {
          id: '990e8400-e29b-41d4-a716-446655440005',
          user_id: user.id,
          document_id: '660e8400-e29b-41d4-a716-446655440004',
          event_type: 'upload',
          title: 'Document Uploaded',
          description: 'Employment Contract uploaded',
          metadata: { file_size: 800000, file_type: 'application/pdf' }
        },
        {
          id: '990e8400-e29b-41d4-a716-446655440006',
          user_id: user.id,
          event_type: 'system',
          title: 'AI Insights Generated',
          description: 'New financial insights available based on recent uploads',
          metadata: { insights_count: 3, type: 'financial_analysis' }
        }
      ])

    if (timelineError) {
      console.error('Error creating timeline events:', timelineError)
    } else {
      console.log('Timeline events created successfully')
    }

    return { success: true, message: 'Mock data created successfully' }
  } catch (error) {
    console.error('Error creating mock data:', error)
    return { success: false, error: error.message }
  }
}