'use client'

import { QuotationDraft } from '@/lib/types/quotation'
import { formatINR, formatDate, formatContactPerson, amountToWordsIndian } from '@/lib/quotation-calculations'

interface QuotationPreviewProps {
  quotation: QuotationDraft
}

export default function QuotationPreview({ quotation }: QuotationPreviewProps) {
  const renderValue = (value: string | number | undefined, fallback = '—') => {
    if (value === undefined || value === null || value === '') return fallback
    return value
  }

  const renderCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return '—'
    return formatINR(value)
  }

  return (
    <div className="quotation-preview bg-white text-gray-900 p-8 max-w-4xl mx-auto">
      {/* A4 Print Styles */}
      <style jsx>{`
        @media print {
          .quotation-preview {
            margin: 12mm;
            font-size: 12px;
            line-height: 1.4;
          }
          .page-break {
            page-break-before: always;
          }
          .no-break {
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Business Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-blue-900 mb-2">ENVIROCARE LABS PRIVATE LIMITED</h1>
        <p className="text-sm text-gray-600 mb-1">Environmental Testing & Consulting Services</p>
        <p className="text-sm text-gray-600 mb-1">Address: [Your Company Address]</p>
        <p className="text-sm text-gray-600 mb-1">Phone: [Your Phone] | Email: [Your Email]</p>
        
        {/* Services Line */}
        <div className="border-t border-gray-300 mt-4 pt-2">
          <p className="text-xs text-gray-500">Our Services Food Testing Water Testing Air Monitoring Survey & Inspections</p>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-900">QUOTATION</h2>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Left Column - Bill To & Ship To */}
        <div className="space-y-6">
          {/* Bill To */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
            <div className="text-sm text-gray-700">
              <p className="font-medium">{renderValue(quotation.billTo.name)}</p>
              {quotation.billTo.address1 && <p>{renderValue(quotation.billTo.address1)}</p>}
              {quotation.billTo.address2 && <p>{renderValue(quotation.billTo.address2)}</p>}
              <p>
                {[quotation.billTo.city, quotation.billTo.state, quotation.billTo.pin]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              {quotation.billTo.phone && <p>Phone: {renderValue(quotation.billTo.phone)}</p>}
              {quotation.billTo.email && <p>Email: {renderValue(quotation.billTo.email)}</p>}
            </div>
          </div>

          {/* Ship To */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Ship To:</h3>
            <div className="text-sm text-gray-700">
              <p className="font-medium">{renderValue(quotation.shipTo.name)}</p>
              {quotation.shipTo.address1 && <p>{renderValue(quotation.shipTo.address1)}</p>}
              {quotation.shipTo.address2 && <p>{renderValue(quotation.shipTo.address2)}</p>}
              <p>
                {[quotation.shipTo.city, quotation.shipTo.state, quotation.shipTo.pin]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              {quotation.shipTo.phone && <p>Phone: {renderValue(quotation.shipTo.phone)}</p>}
              {quotation.shipTo.email && <p>Email: {renderValue(quotation.shipTo.email)}</p>}
            </div>
          </div>
        </div>

        {/* Right Column - Meta Information */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Quotation Details:</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Date:</strong> {formatDate(quotation.date)}</p>
              <p><strong>Quotation No:</strong> {renderValue(quotation.quotationNo)}</p>
              {quotation.customerId && <p><strong>Customer ID:</strong> {renderValue(quotation.customerId)}</p>}
              {quotation.vendorId && <p><strong>Vendor ID:</strong> {renderValue(quotation.vendorId)}</p>}
              <p><strong>Contact Person:</strong> {formatContactPerson(quotation.contact)}</p>
              {quotation.contact.phone && <p><strong>Tel:</strong> {renderValue(quotation.contact.phone)}</p>}
              {quotation.contact.email && <p><strong>Email:</strong> {renderValue(quotation.contact.email)}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      {quotation.items.length > 0 && (
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-3 py-2 text-left">S.No.</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Sample Name</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Test Parameters</th>
                <th className="border border-gray-300 px-3 py-2 text-center">No. of Samples</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Unit Price (INR)</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Total Price (INR)</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item, index) => (
                <tr key={item.id} className="no-break">
                  <td className="border border-gray-300 px-3 py-2">{index + 1}</td>
                  <td className="border border-gray-300 px-3 py-2">{renderValue(item.sampleName)}</td>
                  <td className="border border-gray-300 px-3 py-2">{renderValue(item.testParameters)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{renderValue(item.noOfSamples)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{renderCurrency(item.unitPrice)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{renderCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Additional Charges */}
      {quotation.additionalCharges.length > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-2">Additional Charges (Sampling):</h3>
          <div className="space-y-2">
            {quotation.additionalCharges.map((charge) => (
              <div key={charge.id} className="flex justify-between text-sm">
                <span>{renderValue(charge.label)}</span>
                <span>{renderCurrency(charge.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mb-8">
        <div className="flex justify-end">
          <div className="w-80">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{renderCurrency(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST ({quotation.taxes.cgstRate}%):</span>
                <span>{renderCurrency(quotation.taxes.cgstAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST ({quotation.taxes.sgstRate}%):</span>
                <span>{renderCurrency(quotation.taxes.sgstAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-300 pt-2 font-semibold">
                <span>Grand Total:</span>
                <span>{renderCurrency(quotation.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amount in Words */}
      {quotation.amountInWords && (
        <div className="mb-8">
          <p className="text-sm"><strong>Amount in Words:</strong> {renderValue(quotation.amountInWords)}</p>
        </div>
      )}

      {/* Prepared By */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-900 mb-2">Prepared By:</h3>
        <div className="text-sm text-gray-700">
          <p><strong>Name:</strong> {renderValue(quotation.preparedBy.name)}</p>
          {quotation.preparedBy.phone && <p><strong>Phone:</strong> {renderValue(quotation.preparedBy.phone)}</p>}
          {quotation.preparedBy.email && <p><strong>Email:</strong> {renderValue(quotation.preparedBy.email)}</p>}
        </div>
      </div>

      {/* Bank Details */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-900 mb-2">Bank Details:</h3>
        <div className="text-sm text-gray-700 space-y-1">
          {quotation.bankDetails.bankLine && <p><strong>Bank:</strong> {renderValue(quotation.bankDetails.bankLine)}</p>}
          {quotation.bankDetails.ifsc && <p><strong>IFSC:</strong> {renderValue(quotation.bankDetails.ifsc)}</p>}
          {quotation.bankDetails.accountType && <p><strong>Account Type:</strong> {renderValue(quotation.bankDetails.accountType)}</p>}
          {quotation.bankDetails.accountName && <p><strong>Account Name:</strong> {renderValue(quotation.bankDetails.accountName)}</p>}
          {quotation.bankDetails.accountNumber && <p><strong>Account Number:</strong> {renderValue(quotation.bankDetails.accountNumber)}</p>}
          {quotation.bankDetails.micr && <p><strong>MICR:</strong> {renderValue(quotation.bankDetails.micr)}</p>}
        </div>
      </div>

      {/* Terms & Conditions */}
      {quotation.terms && (
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-2">General Terms & Conditions:</h3>
          <div className="text-sm text-gray-700 whitespace-pre-line">{renderValue(quotation.terms)}</div>
        </div>
      )}

      {/* Footer Placeholders */}
      <div className="mt-12 pt-8 border-t border-gray-300">
        <div className="grid grid-cols-2 gap-8 text-center">
          <div>
            <p className="text-sm text-gray-500 mb-2">Scan to Pay</p>
            <div className="w-24 h-24 bg-gray-200 mx-auto"></div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Scan to Explore NABL Scope</p>
            <div className="w-24 h-24 bg-gray-200 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
