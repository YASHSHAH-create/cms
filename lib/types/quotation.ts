export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'

export type FormStep = 'header' | 'items' | 'taxes' | 'prepared' | 'terms'

export interface Address {
  name: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  pin?: string
  email?: string
  phone?: string
}

export interface ContactPerson {
  salutation?: 'Mr.' | 'Ms.' | 'Dr.' | ''
  name: string
  phone?: string
  email?: string
}

export interface QuotationItem {
  id: string
  sNo: number
  sampleName: string
  testParameters?: string
  noOfSamples: number
  unitPrice: number
  total: number
}

export interface AdditionalCharge {
  id: string
  label: string
  amount: number
}

export interface TaxDetails {
  cgstRate: number
  sgstRate: number
  cgstAmount: number
  sgstAmount: number
}

export interface BankDetails {
  accountName: string
  accountNumber: string
  ifsc: string
  bankNameBranch: string
  accountType: string
}

export interface QuotationDraft {
  quotationNo: string
  date: string
  customerId?: string
  vendorId?: string
  billTo: Address
  shipTo: Address
  contact: ContactPerson
  items: QuotationItem[]
  additionalCharges: AdditionalCharge[]
  subtotal: number
  taxes: TaxDetails
  grandTotal: number
  amountInWords?: string
  preparedBy: {
    name: string
    phone?: string
    email?: string
  }
  bankDetails: BankDetails
  terms: string
  attachments?: {
    rateList?: File
  }
}

export interface SavedQuotation {
  id: string
  quotationNo: string
  date: string
  customerName: string
  contactPerson: string
  totalAmount: number
  status: QuotationStatus
  createdAt: string
  lastModified: string
}

export interface ValidationErrors {
  [key: string]: string | ValidationErrors
}

