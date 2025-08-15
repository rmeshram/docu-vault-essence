import { supabase } from '@/integrations/supabase/client'

export const createEnhancedMockData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    console.log('Creating enhanced mock data for user:', user.id)

    // Enhanced categories with more details
    const categories = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        user_id: user.id,
        name: 'Financial',
        description: 'Bank statements, tax returns, invoices, investments',
        icon: 'DollarSign',
        color: '#10B981',
        document_count: 15,
        auto_rules: {
          keywords: ['bank', 'tax', 'invoice', 'investment', 'mutual fund', 'fd'],
          patterns: ['₹', 'INR', 'NEFT', 'RTGS']
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        user_id: user.id,
        name: 'Legal',
        description: 'Contracts, agreements, legal papers, property docs',
        icon: 'Scale',
        color: '#3B82F6',
        document_count: 8,
        auto_rules: {
          keywords: ['agreement', 'contract', 'legal', 'property', 'deed'],
          patterns: ['whereas', 'party', 'witness']
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        user_id: user.id,
        name: 'Identity',
        description: 'Aadhaar, PAN, passport, driving license, voter ID',
        icon: 'User',
        color: '#8B5CF6',
        document_count: 12,
        auto_rules: {
          keywords: ['aadhaar', 'pan', 'passport', 'license', 'voter'],
          patterns: ['government of india', 'unique identification']
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        user_id: user.id,
        name: 'Medical',
        description: 'Health reports, prescriptions, insurance claims',
        icon: 'Heart',
        color: '#EF4444',
        document_count: 9,
        auto_rules: {
          keywords: ['medical', 'health', 'prescription', 'doctor', 'hospital'],
          patterns: ['mg', 'ml', 'blood pressure', 'diagnosis']
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        user_id: user.id,
        name: 'Insurance',
        description: 'Life, health, vehicle, property insurance policies',
        icon: 'Shield',
        color: '#F59E0B',
        document_count: 6,
        auto_rules: {
          keywords: ['insurance', 'policy', 'premium', 'claim', 'coverage'],
          patterns: ['policy number', 'sum assured', 'beneficiary']
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440006',
        user_id: user.id,
        name: 'Education',
        description: 'Certificates, marksheets, transcripts, diplomas',
        icon: 'BookOpen',
        color: '#06B6D4',
        document_count: 7,
        auto_rules: {
          keywords: ['certificate', 'marksheet', 'degree', 'diploma', 'transcript'],
          patterns: ['university', 'board', 'examination', 'grade']
        }
      }
    ]

    const { error: categoriesError } = await supabase
      .from('categories')
      .upsert(categories)

    if (categoriesError) {
      console.error('Error creating categories:', categoriesError)
    }

    // Enhanced documents with realistic Indian data
    const documents = [
      // Financial Documents
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        user_id: user.id,
        name: 'SBI Bank Statement - March 2024',
        category: 'Financial',
        mime_type: 'application/pdf',
        size: 2456789,
        ai_tags: ['bank', 'statement', 'sbi', 'march', '2024'],
        file_url: 'https://example.com/files/sbi-statement-mar-2024.pdf',
        download_url: 'https://example.com/download/sbi-statement-mar-2024.pdf',
        ai_summary: 'SBI bank statement for March 2024 showing salary credit of ₹75,000, utility payments, and ending balance of ₹1,25,340.',
        extracted_text: 'STATE BANK OF INDIA\nAccount Statement\nAccount Number: 12345678901\nStatement Period: 01-Mar-2024 to 31-Mar-2024\nOpening Balance: ₹67,340\nSalary Credit: ₹75,000\nElectricity Bill: ₹2,400\nInternet Bill: ₹1,200\nClosing Balance: ₹1,25,340',
        status: 'completed',
        language_detected: 'en',
        ai_confidence: 96.5,
        pages: 3,
        metadata: {
          account_number: '12345678901',
          bank_name: 'State Bank of India',
          statement_period: 'March 2024',
          key_amounts: ['₹75,000', '₹1,25,340']
        }
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440002',
        user_id: user.id,
        name: 'Income Tax Return AY 2023-24',
        category: 'Financial',
        mime_type: 'application/pdf',
        size: 1856432,
        ai_tags: ['tax', 'itr', 'income', '2023-24', 'government'],
        file_url: 'https://example.com/files/itr-2023-24.pdf',
        download_url: 'https://example.com/download/itr-2023-24.pdf',
        ai_summary: 'Income Tax Return for AY 2023-24 showing total income of ₹9,50,000, tax paid ₹95,000, and refund due ₹15,000.',
        extracted_text: 'INCOME TAX RETURN\nAssessment Year: 2023-24\nPAN: ABCDE1234F\nTotal Income: ₹9,50,000\nTax Payable: ₹80,000\nTax Paid: ₹95,000\nRefund Due: ₹15,000',
        status: 'completed',
        language_detected: 'en',
        ai_confidence: 98.2,
        pages: 8
      },
      // Identity Documents
      {
        id: '660e8400-e29b-41d4-a716-446655440003',
        user_id: user.id,
        name: 'Aadhaar Card',
        category: 'Identity',
        mime_type: 'application/pdf',
        size: 512000,
        ai_tags: ['aadhaar', 'identity', 'government', 'biometric'],
        file_url: 'https://example.com/files/aadhaar-card.pdf',
        download_url: 'https://example.com/download/aadhaar-card.pdf',
        ai_summary: 'Aadhaar card with unique identification number, address proof, and biometric verification from UIDAI.',
        extracted_text: 'भारत सरकार GOVERNMENT OF INDIA\nUnique Identification Authority of India\nआधार AADHAAR\nName: राज कुमार शर्मा / RAJ KUMAR SHARMA\nDOB: 15/08/1985\nGender: MALE / पुरुष\nAddress: 123, Green Park, New Delhi - 110016\nAadhaar Number: 1234 5678 9012',
        status: 'completed',
        language_detected: 'hi',
        ai_confidence: 99.1,
        pages: 1,
        metadata: {
          document_type: 'Aadhaar Card',
          aadhaar_number: '1234 5678 9012',
          issue_authority: 'UIDAI'
        }
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440004',
        user_id: user.id,
        name: 'PAN Card',
        category: 'Identity',
        mime_type: 'image/jpeg',
        size: 456789,
        ai_tags: ['pan', 'tax', 'identity', 'income-tax'],
        file_url: 'https://example.com/files/pan-card.jpg',
        download_url: 'https://example.com/download/pan-card.jpg',
        ai_summary: 'PAN (Permanent Account Number) card for tax identification and financial transactions.',
        extracted_text: 'INCOME TAX DEPARTMENT\nGOVT. OF INDIA\nPERMANENT ACCOUNT NUMBER CARD\nName: RAJ KUMAR SHARMA\nFather\'s Name: SURESH KUMAR SHARMA\nDate of Birth: 15/08/1985\nPAN: ABCDE1234F',
        status: 'completed',
        language_detected: 'en',
        ai_confidence: 97.8,
        pages: 1
      },
      // Medical Documents
      {
        id: '660e8400-e29b-41d4-a716-446655440005',
        user_id: user.id,
        name: 'Annual Health Checkup Report',
        category: 'Medical',
        mime_type: 'application/pdf',
        size: 1234567,
        ai_tags: ['health', 'checkup', 'medical', 'report', 'blood-test'],
        file_url: 'https://example.com/files/health-checkup.pdf',
        download_url: 'https://example.com/download/health-checkup.pdf',
        ai_summary: 'Comprehensive health checkup report with blood tests, ECG, and general examination. All parameters within normal limits.',
        extracted_text: 'ANNUAL HEALTH CHECKUP REPORT\nPatient: Raj Kumar Sharma\nAge: 38 Years\nBlood Pressure: 120/80 mmHg\nSugar (Fasting): 95 mg/dl\nCholesterol: 180 mg/dl\nHemoglobin: 14.2 g/dl\nOverall Assessment: Healthy',
        status: 'completed',
        language_detected: 'en',
        ai_confidence: 94.5,
        pages: 4
      },
      // Insurance Documents
      {
        id: '660e8400-e29b-41d4-a716-446655440006',
        user_id: user.id,
        name: 'LIC Life Insurance Policy',
        category: 'Insurance',
        mime_type: 'application/pdf',
        size: 987654,
        ai_tags: ['lic', 'life-insurance', 'policy', 'premium'],
        file_url: 'https://example.com/files/lic-policy.pdf',
        download_url: 'https://example.com/download/lic-policy.pdf',
        ai_summary: 'LIC life insurance policy with sum assured ₹10,00,000, annual premium ₹24,000, and 20-year term.',
        extracted_text: 'LIFE INSURANCE CORPORATION OF INDIA\nPolicy Number: 123456789\nPolicyholder: Raj Kumar Sharma\nSum Assured: ₹10,00,000\nAnnual Premium: ₹24,000\nPolicy Term: 20 Years\nCommencement Date: 15/08/2020\nMaturity Date: 15/08/2040',
        status: 'completed',
        language_detected: 'en',
        ai_confidence: 96.8,
        pages: 12
      }
    ]

    const { error: documentsError } = await supabase
      .from('documents')
      .upsert(documents)

    if (documentsError) {
      console.error('Error creating documents:', documentsError)
    }

    // Enhanced Smart Tags
    const smartTags = [
      {
        id: '770e8400-e29b-41d4-a716-446655440001',
        user_id: user.id,
        name: 'Tax Season 2024',
        description: 'All documents related to tax filing for AY 2023-24',
        color: '#F59E0B',
        document_count: 8,
        ai_query: 'tax OR itr OR income OR deduction OR 2023-24',
        is_system_generated: true
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440002',
        user_id: user.id,
        name: 'Government IDs',
        description: 'All government-issued identity documents',
        color: '#3B82F6',
        document_count: 5,
        ai_query: 'aadhaar OR pan OR passport OR license OR voter',
        is_system_generated: true
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440003',
        user_id: user.id,
        name: 'Financial Planning',
        description: 'Investment, insurance, and financial planning documents',
        color: '#10B981',
        document_count: 12,
        ai_query: 'investment OR insurance OR mutual fund OR fd OR sip',
        is_system_generated: true
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440004',
        user_id: user.id,
        name: 'Health Records',
        description: 'Medical reports, prescriptions, and health insurance',
        color: '#EF4444',
        document_count: 6,
        ai_query: 'medical OR health OR prescription OR doctor OR hospital',
        is_system_generated: true
      }
    ]

    const { error: smartTagsError } = await supabase
      .from('smart_tags')
      .upsert(smartTags)

    if (smartTagsError) {
      console.error('Error creating smart tags:', smartTagsError)
    }

    // AI Insights
    const aiInsights = [
      {
        id: '880e8400-e29b-41d4-a716-446655440001',
        user_id: user.id,
        insight_type: 'opportunity',
        title: 'Tax Savings Opportunity',
        description: 'Based on your income tax return, you can save additional ₹46,800 by investing in ELSS mutual funds under Section 80C.',
        priority: 'high',
        savings_potential: '₹46,800',
        action_required: 'Invest in ELSS before March 31st',
        related_document_ids: ['660e8400-e29b-41d4-a716-446655440002'],
        is_acknowledged: false
      },
      {
        id: '880e8400-e29b-41d4-a716-446655440002',
        user_id: user.id,
        insight_type: 'compliance',
        title: 'Health Insurance Premium Deduction',
        description: 'You can claim deduction of ₹25,000 for health insurance premiums under Section 80D. Upload your health insurance premium receipts.',
        priority: 'medium',
        savings_potential: '₹7,500',
        action_required: 'Upload premium receipts',
        is_acknowledged: false
      },
      {
        id: '880e8400-e29b-41d4-a716-446655440003',
        user_id: user.id,
        insight_type: 'security',
        title: 'Document Backup Recommended',
        description: 'Your Aadhaar and PAN cards are critical identity documents. Consider enabling family vault sharing for emergency access.',
        priority: 'medium',
        action_required: 'Enable family vault sharing',
        related_document_ids: ['660e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004'],
        is_acknowledged: false
      }
    ]

    const { error: insightsError } = await supabase
      .from('ai_insights')
      .upsert(aiInsights)

    if (insightsError) {
      console.error('Error creating AI insights:', insightsError)
    }

    // Reminders
    const reminders = [
      {
        id: '990e8400-e29b-41d4-a716-446655440001',
        user_id: user.id,
        title: 'LIC Premium Due',
        description: 'Your LIC policy premium of ₹24,000 is due on 15th August 2024',
        reminder_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        urgency: 'high',
        amount: '₹24,000',
        related_document_id: '660e8400-e29b-41d4-a716-446655440006',
        is_auto_generated: true,
        is_completed: false
      },
      {
        id: '990e8400-e29b-41d4-a716-446655440002',
        user_id: user.id,
        title: 'Tax Filing Deadline',
        description: 'ITR filing deadline for AY 2024-25 is approaching on July 31st',
        reminder_date: new Date('2024-07-15').toISOString(),
        urgency: 'high',
        is_auto_generated: true,
        is_completed: false
      },
      {
        id: '990e8400-e29b-41d4-a716-446655440003',
        user_id: user.id,
        title: 'Health Checkup',
        description: 'Annual health checkup is recommended - last checkup was 11 months ago',
        reminder_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        urgency: 'medium',
        is_auto_generated: true,
        is_completed: false
      }
    ]

    const { error: remindersError } = await supabase
      .from('reminders')
      .upsert(reminders)

    if (remindersError) {
      console.error('Error creating reminders:', remindersError)
    }

    // Timeline Events
    const timelineEvents = [
      {
        id: '100e8400-e29b-41d4-a716-446655440001',
        user_id: user.id,
        document_id: '660e8400-e29b-41d4-a716-446655440001',
        event_type: 'upload',
        title: 'Bank Statement Uploaded',
        description: 'SBI Bank Statement for March 2024 uploaded and processed'
      },
      {
        id: '100e8400-e29b-41d4-a716-446655440002',
        user_id: user.id,
        document_id: '660e8400-e29b-41d4-a716-446655440001',
        event_type: 'ai_analysis',
        title: 'AI Analysis Completed',
        description: 'Extracted key financial information and categorized automatically'
      },
      {
        id: '100e8400-e29b-41d4-a716-446655440003',
        user_id: user.id,
        event_type: 'insight',
        title: 'Tax Savings Insight Generated',
        description: 'AI identified potential tax savings of ₹46,800 through ELSS investments'
      }
    ]

    const { error: timelineError } = await supabase
      .from('timeline_events')
      .upsert(timelineEvents)

    if (timelineError) {
      console.error('Error creating timeline events:', timelineError)
    }

    // Notifications
    const notifications = [
      {
        id: '110e8400-e29b-41d4-a716-446655440001',
        user_id: user.id,
        type: 'insight',
        title: 'New Tax Savings Opportunity',
        message: 'AI found you can save ₹46,800 in taxes. Review your tax optimization suggestions.',
        is_read: false,
        metadata: {
          insight_id: '880e8400-e29b-41d4-a716-446655440001',
          priority: 'high',
          amount: '₹46,800'
        }
      },
      {
        id: '110e8400-e29b-41d4-a716-446655440002',
        user_id: user.id,
        type: 'reminder',
        title: 'LIC Premium Due Soon',
        message: 'Your LIC policy premium of ₹24,000 is due in 30 days.',
        is_read: false,
        metadata: {
          reminder_id: '990e8400-e29b-41d4-a716-446655440001',
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    ]

    const { error: notificationsError } = await supabase
      .from('notifications')
      .upsert(notifications)

    if (notificationsError) {
      console.error('Error creating notifications:', notificationsError)
    }

    // Comments (sample)
    const comments = [
      {
        id: '120e8400-e29b-41d4-a716-446655440001',
        document_id: '660e8400-e29b-41d4-a716-446655440001',
        user_id: user.id,
        comment_text: 'This statement shows good savings rate. Need to review the investment allocation.'
      },
      {
        id: '120e8400-e29b-41d4-a716-446655440002',
        document_id: '660e8400-e29b-41d4-a716-446655440002',
        user_id: user.id,
        comment_text: 'Remember to include Form 16 for salary income verification next year.'
      }
    ]

    const { error: commentsError } = await supabase
      .from('comments')
      .upsert(comments)

    if (commentsError) {
      console.error('Error creating comments:', commentsError)
    }

    // Document versions
    const documentVersions = [
      {
        id: '130e8400-e29b-41d4-a716-446655440001',
        document_id: '660e8400-e29b-41d4-a716-446655440002',
        version_number: 1,
        created_by: user.id,
        file_url: 'https://example.com/files/itr-2023-24-v1.pdf',
        file_size: 1756432,
        change_description: 'Initial upload of ITR for AY 2023-24'
      },
      {
        id: '130e8400-e29b-41d4-a716-446655440002',
        document_id: '660e8400-e29b-41d4-a716-446655440002',
        version_number: 2,
        created_by: user.id,
        file_url: 'https://example.com/files/itr-2023-24-v2.pdf',
        file_size: 1856432,
        change_description: 'Updated with revised Form 16 data and additional deductions'
      }
    ]

    const { error: versionsError } = await supabase
      .from('document_versions')
      .upsert(documentVersions)

    if (versionsError) {
      console.error('Error creating document versions:', versionsError)
    }

    console.log('Enhanced mock data created successfully')
    return { success: true, message: 'Enhanced mock data created successfully' }

  } catch (error) {
    console.error('Error creating enhanced mock data:', error)
    return { success: false, error: error.message }
  }
}