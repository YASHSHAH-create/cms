// Simple in-memory storage for when MongoDB is not available
// Use global variables to persist data across requests in serverless environments
declare global {
  var __memoryStorage: {
    enquiries: any[];
    visitors: any[];
  };
}

class MemoryStorage {
  private static instance: MemoryStorage;

  static getInstance(): MemoryStorage {
    if (!MemoryStorage.instance) {
      MemoryStorage.instance = new MemoryStorage();
      console.log('🔄 MemoryStorage instance created');
    }
    return MemoryStorage.instance;
  }

  private getStorage() {
    if (!global.__memoryStorage) {
      global.__memoryStorage = {
        enquiries: [],
        visitors: []
      };
      console.log('🔄 Global memory storage initialized');
    }
    return global.__memoryStorage;
  }

  // Enquiry methods
  addEnquiry(enquiry: any): any {
    const storage = this.getStorage();
    const newEnquiry = {
      _id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...enquiry,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    storage.enquiries.push(newEnquiry);
    console.log('✅ Enquiry added to memory storage:', newEnquiry._id);
    console.log('📊 Total enquiries in storage:', storage.enquiries.length);
    return newEnquiry;
  }

  getEnquiries(filter: any = {}, page: number = 1, limit: number = 50): { enquiries: any[], count: number } {
    const storage = this.getStorage();
    let filteredEnquiries = [...storage.enquiries];

    // Apply search filter
    if (filter.search) {
      const searchRegex = new RegExp(filter.search, 'i');
      filteredEnquiries = filteredEnquiries.filter(enquiry => 
        enquiry.name?.match(searchRegex) ||
        enquiry.email?.match(searchRegex) ||
        enquiry.phone?.match(searchRegex) ||
        enquiry.organization?.match(searchRegex) ||
        enquiry.service?.match(searchRegex) ||
        enquiry.enquiryDetails?.match(searchRegex)
      );
    }

    // Apply status filter
    if (filter.status) {
      filteredEnquiries = filteredEnquiries.filter(enquiry => enquiry.status === filter.status);
    }

    // Sort by creation date (newest first)
    filteredEnquiries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEnquiries = filteredEnquiries.slice(startIndex, endIndex);

    return {
      enquiries: paginatedEnquiries,
      count: filteredEnquiries.length
    };
  }

  // Visitor methods
  addVisitor(visitor: any): any {
    const storage = this.getStorage();
    const newVisitor = {
      _id: `memory_visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...visitor,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    storage.visitors.push(newVisitor);
    console.log('✅ Visitor added to memory storage:', newVisitor._id);
    return newVisitor;
  }

  getVisitors(filter: any = {}, page: number = 1, limit: number = 50): { visitors: any[], count: number } {
    const storage = this.getStorage();
    let filteredVisitors = [...storage.visitors];

    // Apply search filter
    if (filter.search) {
      const searchRegex = new RegExp(filter.search, 'i');
      filteredVisitors = filteredVisitors.filter(visitor => 
        visitor.name?.match(searchRegex) ||
        visitor.email?.match(searchRegex) ||
        visitor.phone?.match(searchRegex) ||
        visitor.organization?.match(searchRegex) ||
        visitor.service?.match(searchRegex)
      );
    }

    // Sort by creation date (newest first)
    filteredVisitors.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedVisitors = filteredVisitors.slice(startIndex, endIndex);

    return {
      visitors: paginatedVisitors,
      count: filteredVisitors.length
    };
  }

  // Delete specific visitors by IDs
  deleteVisitors(ids: string[]): number {
    const storage = this.getStorage();
    const initialCount = storage.visitors.length;
    storage.visitors = storage.visitors.filter(visitor => !ids.includes(visitor._id));
    const deletedCount = initialCount - storage.visitors.length;
    console.log(`🗑️ Deleted ${deletedCount} visitors from memory storage`);
    return deletedCount;
  }

  // Delete all visitors
  deleteAllVisitors(): number {
    const storage = this.getStorage();
    const count = storage.visitors.length;
    storage.visitors = [];
    console.log(`🗑️ Deleted all ${count} visitors from memory storage`);
    return count;
  }

  // Clear all data (for testing)
  clearAll(): void {
    const storage = this.getStorage();
    storage.enquiries = [];
    storage.visitors = [];
    console.log('🧹 Memory storage cleared');
  }
}

export default MemoryStorage;
