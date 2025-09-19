/**
 * Service Mapping Utility
 * Maps sub-services to main services for consistent assignment
 */

const MAIN_SERVICES = [
  'Water Testing',
  'Food Testing',
  'Environmental Testing',
  'Shelf-Life Study',
  'Others'
];

const SERVICE_MAPPINGS = {
  // Water Testing sub-services
  'Drinking Water Testing': 'Water Testing',
  'FSSAI Compliance Water Testing': 'Water Testing',
  'Swimming Pool Water Testing': 'Water Testing',
  'Drinking Water': 'Water Testing',
  'FSSAI Compliance Water': 'Water Testing',
  'Swimming Pool Water': 'Water Testing',
  
  // Environmental Testing sub-services
  'ETP Water Testing': 'Environmental Testing',
  'STP Water Testing': 'Environmental Testing',
  'Ambient Air': 'Environmental Testing',
  'Stack Emission': 'Environmental Testing',
  'Workplace Monitoring': 'Environmental Testing',
  'IAQ [Indoor Air Quality]': 'Environmental Testing',
  'Noise Testing': 'Environmental Testing',
  'Illumination': 'Environmental Testing',
  'ETP Water': 'Environmental Testing',
  'STP Water': 'Environmental Testing',
  'IAQ': 'Environmental Testing',
  
  // Food Testing sub-services (all food categories)
  'Dairy products and analogues': 'Food Testing',
  'Fats and oils, and fat emulsions': 'Food Testing',
  'Edible ices, including sherbet and sorbet': 'Food Testing',
  'Fruits, vegetables, seaweeds, nuts, and seeds': 'Food Testing',
  'Confectionery': 'Food Testing',
  'Cereals, grains, roots, tubers, pulses, and legumes': 'Food Testing',
  'Bakery products': 'Food Testing',
  'Meat and meat products including poultry': 'Food Testing',
  'Fish and fish products, including molluscs, crustaceans, and echinoderms': 'Food Testing',
  'Eggs and egg products': 'Food Testing',
  'Sweeteners, including honey': 'Food Testing',
  'Salts, spices, soups, sauces, salads, and protein products': 'Food Testing',
  'Foodstuffs for particular nutritional uses': 'Food Testing',
  'Beverages, excluding dairy products': 'Food Testing',
  'Ready-to-eat savouries': 'Food Testing',
  'Substances added to food': 'Food Testing',
  'Standardised Food Product': 'Food Testing',
  'Indian Sweets and Snacks': 'Food Testing',
  'Hemp Seeds and Seed Products': 'Food Testing',
  'Dairy': 'Food Testing',
  'Fats and oils': 'Food Testing',
  'Edible ices': 'Food Testing',
  'Fruits': 'Food Testing',
  'Confectionery': 'Food Testing',
  'Cereals': 'Food Testing',
  'Bakery': 'Food Testing',
  'Meat': 'Food Testing',
  'Fish': 'Food Testing',
  'Eggs': 'Food Testing',
  'Sweeteners': 'Food Testing',
  'Salts': 'Food Testing',
  'Foodstuffs': 'Food Testing',
  'Beverages': 'Food Testing',
  'Ready-to-eat': 'Food Testing',
  'Substances added': 'Food Testing',
  'Standardised Food': 'Food Testing',
  'Indian Sweets': 'Food Testing',
  'Hemp Seeds': 'Food Testing'
};

/**
 * Maps a service name to its main service category
 * @param {string} serviceName - The service name to map
 * @returns {string} - The main service category
 */
function mapToMainService(serviceName) {
  if (!serviceName) return 'Others';
  
  // If it's already a main service, return as is
  if (MAIN_SERVICES.includes(serviceName)) {
    return serviceName;
  }
  
  // Check for exact match in mappings
  if (SERVICE_MAPPINGS[serviceName]) {
    return SERVICE_MAPPINGS[serviceName];
  }
  
  // Check for partial matches (case-insensitive)
  const serviceLower = serviceName.toLowerCase();
  for (const [subService, mainService] of Object.entries(SERVICE_MAPPINGS)) {
    if (serviceLower.includes(subService.toLowerCase()) || subService.toLowerCase().includes(serviceLower)) {
      return mainService;
    }
  }
  
  // Default to Others for unrecognized services
  return 'Others';
}

/**
 * Gets all main services
 * @returns {string[]} - Array of main service names
 */
function getMainServices() {
  return [...MAIN_SERVICES];
}

/**
 * Gets all sub-services for a main service
 * @param {string} mainService - The main service name
 * @returns {string[]} - Array of sub-service names
 */
function getSubServices(mainService) {
  return Object.entries(SERVICE_MAPPINGS)
    .filter(([_, main]) => main === mainService)
    .map(([sub, _]) => sub);
}

/**
 * Validates if a service name is a valid main service
 * @param {string} serviceName - The service name to validate
 * @returns {boolean} - True if valid main service
 */
function isValidMainService(serviceName) {
  return MAIN_SERVICES.includes(serviceName);
}

module.exports = {
  mapToMainService,
  getMainServices,
  getSubServices,
  isValidMainService,
  MAIN_SERVICES,
  SERVICE_MAPPINGS
};
