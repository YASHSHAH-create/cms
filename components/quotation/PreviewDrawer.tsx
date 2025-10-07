'use client'

import { useState } from 'react'
import { X, Download, Printer, FileText, Building, User, MapPin, Phone, Mail, CreditCard } from 'lucide-react'
import { QuotationDraft } from '@/lib/types/quotation'

interface PreviewDrawerProps {
  isOpen: boolean
  quotation?: QuotationDraft
  onClose: () => void
}

export default function PreviewDrawer({ isOpen, quotation, onClose }: PreviewDrawerProps) {
  const [isPrinting, setIsPrinting] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const handlePrint = () => {
    setIsPrinting(true)
    window.print()
    setTimeout(() => setIsPrinting(false), 1000)
  }

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Exporting to PDF...')
  }

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    console.log('Exporting to Excel...')
  }

  if (!isOpen || !quotation) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        <div 
          className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl"
          style={{ 
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border)'
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-6 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                Quotation Preview
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {quotation.quotationNo} - {formatDate(quotation.date)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors"
                style={{ 
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)'
                }}
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors"
                style={{ 
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)'
                }}
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors"
                style={{ 
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)'
                }}
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div 
              className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto"
              style={{ minHeight: '800px' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    E
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                      Envirocare Environmental Services
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      NABL Accredited Laboratory
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-bold text-blue-600">QUOTATION</h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Quotation No: {quotation.quotationNo}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Date: {formatDate(quotation.date)}
                  </p>
                </div>
              </div>

              {/* Bill To & Ship To */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    <Building className="w-5 h-5" />
                    Bill To
                  </h3>
                  <div className="space-y-2">
                    <p className="font-medium" style={{ color: 'var(--text)' }}>
                      {quotation.billTo.name}
                    </p>
                    {quotation.billTo.address1 && (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {quotation.billTo.address1}
                      </p>
                    )}
                    {quotation.billTo.address2 && (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {quotation.billTo.address2}
                      </p>
                    )}
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {quotation.billTo.city && `${quotation.billTo.city}, `}
                      {quotation.billTo.state && `${quotation.billTo.state} `}
                      {quotation.billTo.pin && `- ${quotation.billTo.pin}`}
                    </p>
                    {quotation.billTo.phone && (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        <Phone className="w-4 h-4 inline mr-1" />
                        {quotation.billTo.phone}
                      </p>
                    )}
                    {quotation.billTo.email && (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        <Mail className="w-4 h-4 inline mr-1" />
                        {quotation.billTo.email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    <MapPin className="w-5 h-5" />
                    Ship To
                  </h3>
                  <div className="space-y-2">
                    <p className="font-medium" style={{ color: 'var(--text)' }}>
                      {quotation.shipTo.name || quotation.billTo.name}
                    </p>
                    {quotation.shipTo.address1 && (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {quotation.shipTo.address1}
                      </p>
                    )}
                    {quotation.shipTo.address2 && (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {quotation.shipTo.address2}
                      </p>
                    )}
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {quotation.shipTo.city && `${quotation.shipTo.city}, `}
                      {quotation.shipTo.state && `${quotation.shipTo.state} `}
                      {quotation.shipTo.pin && `- ${quotation.shipTo.pin}`}
                    </p>
                    {quotation.shipTo.phone && (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        <Phone className="w-4 h-4 inline mr-1" />
                        {quotation.shipTo.phone}
                      </p>
                    )}
                    {quotation.shipTo.email && (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        <Mail className="w-4 h-4 inline mr-1" />
                        {quotation.shipTo.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Person */}
              {quotation.contact.name && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    <User className="w-5 h-5" />
                    Contact Person
                  </h3>
                  <div className="space-y-2">
                    <p className="font-medium" style={{ color: 'var(--text)' }}>
                      {quotation.contact.name}
                    </p>
                    {quotation.contact.phone && (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        <Phone className="w-4 h-4 inline mr-1" />
                        {quotation.contact.phone}
                      </p>
                    )}
                    {quotation.contact.email && (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        <Mail className="w-4 h-4 inline mr-1" />
                        {quotation.contact.email}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
                  Items & Services
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2" style={{ borderColor: 'var(--border)' }}>
                        <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: 'var(--text-muted)' }}>
                          S.No
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: 'var(--text-muted)' }}>
                          Sample Name
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: 'var(--text-muted)' }}>
                          Description
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-sm" style={{ color: 'var(--text-muted)' }}>
                          Quantity
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-sm" style={{ color: 'var(--text-muted)' }}>
                          Unit Price (₹)
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-sm" style={{ color: 'var(--text-muted)' }}>
                          Total (₹)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotation.items.map((item, index) => (
                        <tr key={item.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                          <td className="py-3 px-4 text-sm" style={{ color: 'var(--text)' }}>
                            {item.sNo}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium" style={{ color: 'var(--text)' }}>
                            {item.sampleName}
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                            {item.description || '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-right" style={{ color: 'var(--text)' }}>
                            {item.quantity}
                          </td>
                          <td className="py-3 px-4 text-sm text-right" style={{ color: 'var(--text)' }}>
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-medium" style={{ color: 'var(--text)' }}>
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Additional Charges */}
                {quotation.additionalCharges.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-md font-semibold mb-2" style={{ color: 'var(--text)' }}>
                      Additional Charges
                    </h4>
                    <div className="space-y-2">
                      {quotation.additionalCharges.map((charge) => (
                        <div key={charge.id} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                          <span className="text-sm" style={{ color: 'var(--text)' }}>
                            {charge.label}
                          </span>
                          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                            {formatCurrency(charge.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="mb-8">
                <div className="max-w-md ml-auto">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Subtotal
                      </span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        {formatCurrency(quotation.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        CGST ({quotation.taxes.cgstRate}%)
                      </span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        {formatCurrency(quotation.taxes.cgstAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        SGST ({quotation.taxes.sgstRate}%)
                      </span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        {formatCurrency(quotation.taxes.sgstAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-t-2" style={{ borderColor: 'var(--border)' }}>
                      <span className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                        Grand Total
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(quotation.grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount in Words */}
              {quotation.amountInWords && (
                <div className="mb-8">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    <strong>Amount in Words:</strong> {quotation.amountInWords}
                  </p>
                </div>
              )}

              {/* Prepared By */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
                  Prepared By
                </h3>
                <div className="space-y-2">
                  <p className="font-medium" style={{ color: 'var(--text)' }}>
                    {quotation.preparedBy.name}
                  </p>
                  {quotation.preparedBy.phone && (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      <Phone className="w-4 h-4 inline mr-1" />
                      {quotation.preparedBy.phone}
                    </p>
                  )}
                  {quotation.preparedBy.email && (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      <Mail className="w-4 h-4 inline mr-1" />
                      {quotation.preparedBy.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Bank Details */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <CreditCard className="w-5 h-5" />
                  Bank Details
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      <strong>Account Name:</strong> {quotation.bankDetails.accountName}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      <strong>Account Number:</strong> {quotation.bankDetails.accountNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      <strong>IFSC Code:</strong> {quotation.bankDetails.ifsc}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      <strong>Bank:</strong> {quotation.bankDetails.bankNameBranch}
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
                  Terms & Conditions
                </h3>
                <div className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>
                  {quotation.terms}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t pt-8" style={{ borderColor: 'var(--border)' }}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: 'var(--text)' }}>
                      Thank you for choosing Envirocare!
                    </h4>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      For any queries, please contact us at info@envirocare.com
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      <strong>Scan to Pay:</strong> [QR Code Placeholder]
                    </p>
                    <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                      <strong>Scan to Explore NABL Scope:</strong> [QR Code Placeholder]
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
