'use client'

import { useState } from 'react'
import { Eye, Edit, Trash2, FileText, Download, Plus } from 'lucide-react'
import { SavedQuotation, QuotationStatus } from '@/lib/types/quotation'

interface QuotationTableProps {
  quotations: SavedQuotation[]
  onEdit: (id: string) => void
  onView: (id: string) => void
  onDelete: (id: string) => void
  onPreview: (quotation: any) => void
}

const getStatusColor = (status: QuotationStatus) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-600 text-gray-200'
    case 'sent':
      return 'bg-blue-600 text-blue-100'
    case 'approved':
      return 'bg-green-600 text-green-100'
    case 'rejected':
      return 'bg-red-600 text-red-100'
    case 'expired':
      return 'bg-orange-600 text-orange-100'
    default:
      return 'bg-gray-600 text-gray-200'
  }
}

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
    month: 'short',
    year: 'numeric'
  })
}

export default function QuotationTable({ 
  quotations, 
  onEdit, 
  onView, 
  onDelete, 
  onPreview 
}: QuotationTableProps) {
  const [sortField, setSortField] = useState<keyof SavedQuotation>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: keyof SavedQuotation) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedQuotations = [...quotations].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    return 0
  })

  return (
      <div className="overflow-hidden">
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b-2 border-gray-200">
                <th 
                  className="text-left py-4 px-6 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors text-gray-700"
                  onClick={() => handleSort('quotationNo')}
                >
                  <div className="flex items-center gap-2">
                    Quotation #
                    {sortField === 'quotationNo' && (
                      <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              <th 
                className="text-left py-4 px-6 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors text-gray-700"
                onClick={() => handleSort('customerName')}
              >
                <div className="flex items-center gap-2">
                  Customer
                  {sortField === 'customerName' && (
                    <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                className="text-left py-4 px-6 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors text-gray-700"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-2">
                  Date
                  {sortField === 'date' && (
                    <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                className="text-right py-4 px-6 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors text-gray-700"
                onClick={() => handleSort('totalAmount')}
              >
                <div className="flex items-center justify-end gap-2">
                  Amount
                  {sortField === 'totalAmount' && (
                    <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                className="text-left py-4 px-6 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors text-gray-700"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">
                  Status
                  {sortField === 'status' && (
                    <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="text-center py-4 px-6 font-semibold text-xs uppercase tracking-wider text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sortedQuotations.map((quotation, index) => (
              <tr 
                key={quotation.id} 
                className="hover:bg-blue-50 transition-colors group"
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {quotation.quotationNo}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      {quotation.customerName}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      {quotation.contactPerson}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="text-sm text-gray-700">
                    {formatDate(quotation.date)}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <span className="font-bold text-gray-900 text-lg">
                    {formatCurrency(quotation.totalAmount)}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span 
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(quotation.status)}`}
                  >
                    {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onView(quotation.id)}
                      className="p-2 rounded-lg hover:bg-blue-100 transition-all text-gray-600 hover:text-blue-600 hover:scale-110"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(quotation.id)}
                      className="p-2 rounded-lg hover:bg-green-100 transition-all text-gray-600 hover:text-green-600 hover:scale-110"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onPreview(quotation)}
                      className="p-2 rounded-lg hover:bg-indigo-100 transition-all text-gray-600 hover:text-indigo-600 hover:scale-110"
                      title="Preview"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {/* TODO: Implement export */}}
                      className="p-2 rounded-lg hover:bg-purple-100 transition-all text-gray-600 hover:text-purple-600 hover:scale-110"
                      title="Export"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(quotation.id)}
                      className="p-2 rounded-lg hover:bg-red-100 transition-all text-gray-600 hover:text-red-600 hover:scale-110"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {quotations.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-bold mb-2 text-gray-800">
            No quotations found
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Generate your first quotation to get started
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer">
            <Plus className="w-5 h-5" />
            Create First Quotation
          </div>
        </div>
      )}
    </div>
  )
}
