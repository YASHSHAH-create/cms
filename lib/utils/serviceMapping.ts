// Service mapping utility for executive assignments
export function mapToMainService(service: string): string {
  const serviceMap: { [key: string]: string } = {
    // Water Testing Services
    'water testing': 'Water Testing',
    'water quality': 'Water Testing',
    'water analysis': 'Water Testing',
    'drinking water': 'Water Testing',
    'groundwater': 'Water Testing',
    'surface water': 'Water Testing',
    
    // Environmental Testing
    'environmental testing': 'Environmental Testing',
    'soil testing': 'Environmental Testing',
    'air quality': 'Environmental Testing',
    'noise testing': 'Environmental Testing',
    'waste testing': 'Environmental Testing',
    
    // Food Testing
    'food testing': 'Food Testing',
    'food safety': 'Food Testing',
    'food quality': 'Food Testing',
    'nutritional analysis': 'Food Testing',
    
    // Chemical Testing
    'chemical testing': 'Chemical Testing',
    'chemical analysis': 'Chemical Testing',
    'pesticide testing': 'Chemical Testing',
    'heavy metals': 'Chemical Testing',
    
    // Microbiology
    'microbiology': 'Microbiology',
    'bacterial testing': 'Microbiology',
    'pathogen testing': 'Microbiology',
    'microbial analysis': 'Microbiology',
    
    // General
    'testing': 'General Testing',
    'analysis': 'General Testing',
    'laboratory': 'General Testing',
    'lab services': 'General Testing'
  };

  // Convert to lowercase for matching
  const lowerService = service.toLowerCase().trim();
  
  // Check for exact matches first
  if (serviceMap[lowerService]) {
    return serviceMap[lowerService];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(serviceMap)) {
    if (lowerService.includes(key) || key.includes(lowerService)) {
      return value;
    }
  }
  
  // Default fallback
  return 'General Testing';
}

// Get all available main services
export function getMainServices(): string[] {
  return [
    'Water Testing',
    'Environmental Testing',
    'Food Testing',
    'Chemical Testing',
    'Microbiology',
    'General Testing'
  ];
}

// Get sub-services for a main service
export function getSubServices(mainService: string): string[] {
  const subServiceMap: { [key: string]: string[] } = {
    'Water Testing': [
      'Drinking Water Testing',
      'Groundwater Testing',
      'Surface Water Testing',
      'Wastewater Testing',
      'Swimming Pool Water Testing'
    ],
    'Environmental Testing': [
      'Soil Testing',
      'Air Quality Testing',
      'Noise Testing',
      'Waste Testing',
      'Environmental Impact Assessment'
    ],
    'Food Testing': [
      'Food Safety Testing',
      'Nutritional Analysis',
      'Food Quality Testing',
      'Pesticide Residue Testing',
      'Food Allergen Testing'
    ],
    'Chemical Testing': [
      'Chemical Analysis',
      'Pesticide Testing',
      'Heavy Metals Testing',
      'Organic Compound Analysis',
      'Inorganic Analysis'
    ],
    'Microbiology': [
      'Bacterial Testing',
      'Pathogen Testing',
      'Microbial Analysis',
      'Yeast and Mold Testing',
      'Antibiotic Residue Testing'
    ],
    'General Testing': [
      'General Laboratory Services',
      'Quality Control Testing',
      'Research and Development',
      'Custom Testing Services'
    ]
  };

  return subServiceMap[mainService] || [];
}

// Get service display name (alias for mapToMainService)
export function getServiceDisplayName(service: string): string {
  return mapToMainService(service);
}

// Service to sub-service mapping
export const SERVICE_SUBSERVICE_MAP: { [key: string]: string[] } = {
  'Water Testing': [
    'Drinking Water Testing',
    'Groundwater Testing',
    'Surface Water Testing',
    'Wastewater Testing',
    'Swimming Pool Water Testing'
  ],
  'Environmental Testing': [
    'Soil Testing',
    'Air Quality Testing',
    'Noise Testing',
    'Waste Testing',
    'Environmental Impact Assessment'
  ],
  'Food Testing': [
    'Food Safety Testing',
    'Nutritional Analysis',
    'Food Quality Testing',
    'Pesticide Residue Testing',
    'Food Allergen Testing'
  ],
  'Chemical Testing': [
    'Chemical Analysis',
    'Pesticide Testing',
    'Heavy Metals Testing',
    'Organic Compound Analysis',
    'Inorganic Analysis'
  ],
  'Microbiology': [
    'Bacterial Testing',
    'Pathogen Testing',
    'Microbial Analysis',
    'Yeast and Mold Testing',
    'Antibiotic Residue Testing'
  ],
  'General Testing': [
    'General Laboratory Services',
    'Quality Control Testing',
    'Research and Development',
    'Custom Testing Services'
  ]
};
