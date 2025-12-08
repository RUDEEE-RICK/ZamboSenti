import { 
  Service, 
  ServiceCategory, 
  NewsArticle, 
  EmergencyContact, 
  QuickAction, 
  TransparencyDocument,
  ExploreCategory 
} from '@/lib/types';

// Quick Actions for Home Dashboard
export const quickActions: QuickAction[] = [
  { id: '1', title: 'Agencies', icon: '⚙️', route: '/agencies' },
  { id: '2', title: 'News', icon: '📖', route: '/news' },
  { id: '3', title: 'Complaints', icon: '📂', route: '/account/my-complaints' },
  { id: '4', title: 'Emergency', icon: '⚠️', route: '/emergency' },
];

// E-Services
export const eServices: Service[] = [
  {
    id: 'e1',
    title: 'Business Permit',
    description: 'Apply for business permits online',
    icon: '🏢',
    category: 'e-service',
    externalUrl: 'https://naga.gov.ph/business-permit'
  },
  {
    id: 'e2',
    title: 'Real Property Tax',
    description: 'Pay your real property taxes online',
    icon: '🏛️',
    category: 'e-service',
    externalUrl: 'https://naga.gov.ph/property-tax'
  },
  {
    id: 'e3',
    title: 'Local Civil Registry',
    description: 'Request birth, marriage, and death certificates',
    icon: '👥',
    category: 'e-service',
    externalUrl: 'https://naga.gov.ph/civil-registry'
  },
];

// Popular Services
export const popularServices: Service[] = [
  {
    id: 'p1',
    title: 'Use of Government Facilities',
    description: 'Book venues for your programs or activities',
    icon: '🏛️',
    category: 'popular',
  },
  {
    id: 'p2',
    title: 'Medical Assistance',
    description: 'Get aid for medical expenses',
    icon: '💚',
    category: 'popular',
  },
  {
    id: 'p3',
    title: 'Transportation Assistance',
    description: 'Request a ride for urgent needs',
    icon: '🚌',
    category: 'popular',
  },
  {
    id: 'p4',
    title: 'Request for Training',
    description: 'Request training from city experts',
    icon: '📚',
    category: 'popular',
  },
];

// Featured Services
export const featuredServices: Service[] = [
  {
    id: 'f1',
    title: 'Livelihood Training & Loan Assistance',
    description: 'Access training programs and financial support',
    icon: '💼',
    category: 'featured',
  },
  {
    id: 'f2',
    title: 'Medical Certificate Issuance',
    description: 'Get medical certificates for various purposes',
    icon: '🩺',
    category: 'featured',
  },
  {
    id: 'f3',
    title: 'Solo Parent ID',
    description: 'Apply for Solo Parent identification card',
    icon: '🆔',
    category: 'featured',
  },
  {
    id: 'f4',
    title: 'Mt. Isarog Hiking Permit',
    description: 'Secure permits for hiking adventures',
    icon: '⛰️',
    category: 'featured',
  },
  {
    id: 'f5',
    title: 'Senior Citizen ID',
    description: 'Register for Senior Citizen benefits',
    icon: '👴',
    category: 'featured',
  },
  {
    id: 'f6',
    title: 'Summer Employment',
    description: 'Apply for summer job opportunities',
    icon: '🎓',
    category: 'featured',
  },
];

// Service Categories (Guide to All Services)
export const serviceCategories: ServiceCategory[] = [
  {
    id: 'cat1',
    title: 'Health and Nutrition',
    description: 'Health services and nutritional programs',
    icon: '🏥',
    subServices: [
      { id: 's1', title: 'Medical Assistance Program', description: 'Financial aid for medical expenses' },
      { id: 's2', title: 'Supplemental Feeding Program', description: 'Nutrition support for children' },
      { id: 's3', title: 'Immunization Services', description: 'Free vaccines for children and adults' },
    ]
  },
  {
    id: 'cat2',
    title: 'Social Services',
    description: 'Social welfare and community assistance',
    icon: '🤝',
    subServices: [
      { id: 's4', title: 'Burial Assistance', description: 'Financial support for funeral expenses' },
      { id: 's5', title: 'Crisis Intervention', description: 'Emergency support for families' },
      { id: 's6', title: 'Senior Citizens Affairs', description: 'Programs for elderly citizens' },
    ]
  },
  {
    id: 'cat3',
    title: 'Housing and Urban Poor',
    description: 'Housing programs and urban development',
    icon: '🏘️',
    subServices: [
      { id: 's7', title: 'Socialized Housing Program', description: 'Affordable housing for qualified residents' },
      { id: 's8', title: 'Urban Poor Registration', description: 'Register for housing benefits' },
    ]
  },
  {
    id: 'cat4',
    title: 'Education, Arts, Culture, and Sports Development',
    description: 'Educational and cultural programs',
    icon: '🎨',
    subServices: [
      { id: 's9', title: 'Scholarship Programs', description: 'Educational financial assistance' },
      { id: 's10', title: 'Sports Development', description: 'Athletic training and facilities' },
      { id: 's11', title: 'Cultural Events', description: 'Festivals and cultural activities' },
    ]
  },
  {
    id: 'cat5',
    title: 'Legal Assistance',
    description: 'Free legal consultation and support',
    icon: '⚖️',
    subServices: [
      { id: 's12', title: 'Legal Consultation', description: 'Free legal advice' },
      { id: 's13', title: 'Document Notarization', description: 'Notarial services' },
    ]
  },
  {
    id: 'cat6',
    title: 'Livelihood, Employment, Agriculture, and Human Development',
    description: 'Economic development and job placement',
    icon: '🌾',
    subServices: [
      { id: 's14', title: 'Livelihood Training', description: 'Skills development programs' },
      { id: 's15', title: 'Job Placement Assistance', description: 'Employment opportunities' },
      { id: 's16', title: 'Agricultural Extension', description: 'Support for farmers' },
    ]
  },
  {
    id: 'cat7',
    title: 'Transparency, Accountability, Good Governance, and Growth',
    description: 'Open government and transparency initiatives',
    icon: '📊',
    subServices: [
      { id: 's17', title: 'Freedom of Information', description: 'Access to government documents' },
      { id: 's18', title: 'Citizens Complaints', description: 'Report issues and concerns' },
    ]
  },
  {
    id: 'cat8',
    title: 'Engineering, General Services, and Sound System Assistance',
    description: 'Infrastructure and technical services',
    icon: '🔧',
    subServices: [
      { id: 's19', title: 'Building Permit Application', description: 'Construction permits' },
      { id: 's20', title: 'Equipment Rental', description: 'Sound system and facility booking' },
    ]
  },
];

// News Articles
export const newsArticles: NewsArticle[] = [
  {
    id: 'n1',
    title: "Naga's IMT, EOC conduct post-assessment of Super Typhoon Uwan response",
    category: 'COMMUNITY',
    excerpt: 'The Incident Management Team (IMT) and Emergency Operations Center (EOC) of Naga City conducted a comprehensive review of their response to Super Typhoon Uwan.',
    imageUrl: '/images/news/typhoon-assessment.jpg',
    publishedAt: '2025-11-13',
    featured: true
  },
  {
    id: 'n2',
    title: "Mayor Robredo cites 'minimal damage' post Uwan, aims urgent retrofitting of evacuation centers",
    category: 'Community',
    excerpt: 'Mayor announces plans to strengthen evacuation facilities following successful disaster response.',
    publishedAt: '2025-11-13',
    featured: false
  },
  {
    id: 'n3',
    title: 'Naga City launches new digital services platform',
    category: 'Technology',
    excerpt: 'Citizens can now access more government services online through the new e-government portal.',
    publishedAt: '2025-11-10',
    featured: false
  },
  {
    id: 'n4',
    title: 'Free skills training for Nagueños this December',
    category: 'Livelihood',
    excerpt: 'The city government announces various livelihood training programs for residents.',
    publishedAt: '2025-11-08',
    featured: false
  },
];

// Emergency Contacts
export const emergencyContacts: EmergencyContact[] = [
  { id: 'em1', type: 'smart', number: '0908 525 3000', label: 'Smart' },
  { id: 'em2', type: 'tnt', number: '0963 220 9700', label: 'TNT' },
  { id: 'em3', type: 'landline', number: '(054) 472 3000', label: 'Tel' },
];

// Transparency & Good Governance Documents
export const transparencyDocuments: TransparencyDocument[] = [
  {
    id: 't1',
    title: 'Program and Projects',
    icon: '🏗️',
    category: 'Projects',
    url: '/documents/programs-projects'
  },
  {
    id: 't2',
    title: 'Bids and Projects',
    icon: '🎁',
    category: 'Procurement',
    url: '/documents/bids-projects'
  },
  {
    id: 't3',
    title: 'Financial Reports',
    icon: '📊',
    category: 'Finance',
    url: '/documents/financial-reports'
  },
  {
    id: 't4',
    title: 'Annual Budget',
    icon: '🏛️',
    category: 'Budget',
    url: '/documents/annual-budget'
  },
  {
    id: 't5',
    title: 'Legislative Ordinances',
    icon: '🏢',
    category: 'Legal',
    url: '/documents/ordinances'
  },
  {
    id: 't6',
    title: 'Executive Orders',
    icon: '👑',
    category: 'Executive',
    url: '/documents/executive-orders'
  },
];

// Explore Naga Categories
export const exploreCategories: ExploreCategory[] = [
  {
    id: 'exp1',
    title: 'Dining',
    imageUrl: '/images/explore/dining.jpg',
    description: 'Discover local restaurants and cafes'
  },
  {
    id: 'exp2',
    title: 'Kinalas',
    imageUrl: '/images/explore/kinalas.jpg',
    description: 'Try Naga\'s famous noodle dish'
  },
  {
    id: 'exp3',
    title: 'Tourism Spots',
    imageUrl: '/images/explore/tourism.jpg',
    description: 'Visit historical and cultural sites'
  },
];
