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

// Get all available main services (matching enquiry form)
export function getMainServices(): string[] {
  return [
    'Food Testing',
    'Water Testing',
    'Environmental Testing',
    'Others'
  ];
}

// Get sub-services for a main service
export function getSubServices(mainService: string): string[] {
  return SERVICE_SUBSERVICE_MAP[mainService] || [];
}

// Get service display name (alias for mapToMainService)
export function getServiceDisplayName(service: string): string {
  return mapToMainService(service);
}

// Service to sub-service mapping (matching enquiry form)
export const SERVICE_SUBSERVICE_MAP: { [key: string]: string[] } = {
  'Food Testing': [
    'Microbiological Testing',
    'Chemical Testing',
    'Nutritional Analysis',
    'Pesticide Residue Testing',
    'Heavy Metal Testing',
    'Allergen Testing',
    'Shelf Life Studies',
    'GMO Testing'
  ],
  'Water Testing': [
    'Drinking Water Analysis',
    'Industrial Wastewater Testing',
    'Groundwater Testing',
    'Surface Water Testing',
    'Swimming Pool Water Testing',
    'Packaged Drinking Water Testing',
    'Effluent Testing',
    'Seawater Testing'
  ],
  'Environmental Testing': [
    'Air Quality Monitoring',
    'Soil Testing',
    'Noise Level Monitoring',
    'Stack Emission Testing',
    'Ambient Air Quality',
    'Indoor Air Quality'
  ],
  'Others': []
};
