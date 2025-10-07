import { QuotationItem, AdditionalCharge, TaxDetails } from './types/quotation'

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Compute row total
export const computeRowTotal = (noOfSamples: number, unitPrice: number): number => {
  return noOfSamples * unitPrice
}

// Compute subtotal from items and additional charges
export const computeSubtotal = (
  items: QuotationItem[],
  additionalCharges: AdditionalCharge[]
): number => {
  const itemsTotal = items.reduce((sum, item) => sum + item.total, 0)
  const chargesTotal = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0)
  return itemsTotal + chargesTotal
}

// Compute taxes
export const computeTaxes = (
  subtotal: number,
  cgstRate: number,
  sgstRate: number
): TaxDetails => {
  const cgstAmount = (subtotal * cgstRate) / 100
  const sgstAmount = (subtotal * sgstRate) / 100
  return {
    cgstRate,
    sgstRate,
    cgstAmount,
    sgstAmount,
  }
}

// Format Indian Rupee currency
export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

// Format contact person
export const formatContactPerson = (contact: {
  salutation?: string
  name: string
}): string => {
  return contact.salutation ? `${contact.salutation} ${contact.name}` : contact.name
}

// Convert amount to words (Indian style)
export const amountToWordsIndian = (amount: number): string => {
  if (amount === 0) return 'Zero Rupees Only'

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ]

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ]

  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return ''
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertLessThanThousand(n % 100) : '')
  }

  let integerPart = Math.floor(amount)
  const decimalPart = Math.round((amount - integerPart) * 100)

  let result = ''

  // Crores
  if (integerPart >= 10000000) {
    const crores = Math.floor(integerPart / 10000000)
    result += convertLessThanThousand(crores) + ' Crore '
    integerPart %= 10000000
  }

  // Lakhs
  if (integerPart >= 100000) {
    const lakhs = Math.floor(integerPart / 100000)
    result += convertLessThanThousand(lakhs) + ' Lakh '
    integerPart %= 100000
  }

  // Thousands
  if (integerPart >= 1000) {
    const thousands = Math.floor(integerPart / 1000)
    result += convertLessThanThousand(thousands) + ' Thousand '
    integerPart %= 1000
  }

  // Remaining hundreds
  if (integerPart > 0) {
    result += convertLessThanThousand(integerPart) + ' '
  }

  result = result.trim() + ' Rupees'

  if (decimalPart > 0) {
    result += ' and ' + convertLessThanThousand(decimalPart) + ' Paise'
  }

  return result + ' Only'
}

// Validate quotation number format
export const validateQuotationNo = (quotationNo: string): boolean => {
  // Example format: Q-2024-0001
  const pattern = /^Q-\d{4}-\d{4,}$/
  return pattern.test(quotationNo)
}

// Generate next quotation number
export const generateQuotationNo = (lastQuotationNo?: string): string => {
  const year = new Date().getFullYear()
  if (!lastQuotationNo) {
    return `Q-${year}-0001`
  }

  const match = lastQuotationNo.match(/^Q-(\d{4})-(\d+)$/)
  if (!match) {
    return `Q-${year}-0001`
  }

  const lastYear = parseInt(match[1])
  const lastNumber = parseInt(match[2])

  if (lastYear !== year) {
    return `Q-${year}-0001`
  }

  const nextNumber = (lastNumber + 1).toString().padStart(4, '0')
  return `Q-${year}-${nextNumber}`
}

