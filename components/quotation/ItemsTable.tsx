'use client'

import { useState } from 'react'
import { Plus, Copy, Trash2 } from 'lucide-react'
import { QuotationItem as ItemRow } from '@/lib/types/quotation'

interface ItemsTableProps {
  items: ItemRow[]
  errors: any
  onChange: (items: ItemRow[]) => void
  mode: 'create' | 'edit' | 'view'
}

export default function ItemsTable({ items, errors, onChange, mode }: ItemsTableProps) {
  const isReadOnly = mode === 'view'
  const safeItems = items || []
  
  const updateItem = (index: number, field: keyof ItemRow, value: any) => {
    const updatedItems = [...safeItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // Recalculate total for this item
    if (field === 'noOfSamples' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].noOfSamples * updatedItems[index].unitPrice
    }
    
    // Update serial numbers
    updatedItems.forEach((item, idx) => {
      item.sNo = idx + 1
    })
    
    onChange(updatedItems)
  }

  const addItem = () => {
    const newItem: ItemRow = {
      id: Date.now().toString(),
      sNo: safeItems.length + 1,
      sampleName: '',
      testParameters: '',
      noOfSamples: 1,
      unitPrice: 0,
      total: 0
    }
    onChange([...safeItems, newItem])
  }

  const duplicateItem = (index: number) => {
    const itemToDuplicate = safeItems[index]
    const newItem: ItemRow = {
      ...itemToDuplicate,
      id: Date.now().toString(),
      sNo: safeItems.length + 1
    }
    onChange([...safeItems, newItem])
  }

  const deleteItem = (index: number) => {
    const updatedItems = safeItems.filter((_, idx) => idx !== index)
    // Update serial numbers
    updatedItems.forEach((item, idx) => {
      item.sNo = idx + 1
    })
    onChange(updatedItems)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      {safeItems.length === 0 ? (
        <div 
          className="text-center py-8 rounded-lg border-2 border-dashed"
          style={{ 
            borderColor: 'rgb(209, 213, 219)',
            backgroundColor: 'rgb(249, 250, 251)'
          }}
        >
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium mb-2" style={{ color: 'rgb(17, 24, 39)' }}>
            No items added
          </h3>
          <p className="text-sm mb-4" style={{ color: 'rgb(107, 114, 128)' }}>
            Add items and services to create your quotation
          </p>
          {!isReadOnly && (
            <button
              onClick={addItem}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white mx-auto"
              style={{ backgroundColor: 'rgb(37, 99, 235)' }}
            >
              <Plus className="w-4 h-4" />
              Add First Item
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="text-left py-3 px-4 font-medium text-sm w-16" style={{ color: 'rgb(107, 114, 128)' }}>
                  S.No
                </th>
                <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: 'rgb(107, 114, 128)' }}>
                  Sample Name *
                </th>
                <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: 'rgb(107, 114, 128)' }}>
                  Test Parameters
                </th>
                <th className="text-center py-3 px-4 font-medium text-sm w-24" style={{ color: 'rgb(107, 114, 128)' }}>
                  No Of Samples
                </th>
                <th className="text-center py-3 px-4 font-medium text-sm w-32" style={{ color: 'rgb(107, 114, 128)' }}>
                  Unit Price (INR)
                </th>
                <th className="text-center py-3 px-4 font-medium text-sm w-32" style={{ color: 'rgb(107, 114, 128)' }}>
                  Total Price (INR)
                </th>
                {!isReadOnly && (
                  <th className="text-left py-3 px-4 font-medium text-sm w-24" style={{ color: 'rgb(107, 114, 128)' }}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {safeItems.map((item, index) => (
                <tr 
                  key={item.id} 
                  className="border-b hover:bg-gray-50 transition-colors min-h-[3rem]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium" style={{ color: 'rgb(17, 24, 39)' }}>
                      {item.sNo}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={item.sampleName}
                      onChange={(e) => updateItem(index, 'sampleName', e.target.value)}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      style={{
                        backgroundColor: 'white',
                        color: 'rgb(17, 24, 39)'
                      }}
                      placeholder="e.g., Dairy - Paneer"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <textarea
                      value={item.testParameters || ''}
                      onChange={(e) => updateItem(index, 'testParameters', e.target.value)}
                      disabled={isReadOnly}
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                      style={{
                        backgroundColor: 'white',
                        color: 'rgb(17, 24, 39)'
                      }}
                      placeholder="Test parameters (multi-line)"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.noOfSamples}
                      onChange={(e) => updateItem(index, 'noOfSamples', parseInt(e.target.value) || 1)}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      style={{
                        backgroundColor: 'white',
                        color: 'rgb(17, 24, 39)'
                      }}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      style={{
                        backgroundColor: 'white',
                        color: 'rgb(17, 24, 39)'
                      }}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium" style={{ color: 'rgb(17, 24, 39)' }}>
                      {formatCurrency(item.total)}
                    </div>
                  </td>
                  {!isReadOnly && (
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => duplicateItem(index)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          style={{ color: 'rgb(107, 114, 128)' }}
                          title="Duplicate Row"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteItem(index)}
                          className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                          style={{ color: 'rgb(107, 114, 128)' }}
                          title="Delete Row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {items.length > 0 && !isReadOnly && (
        <div className="flex items-center justify-between">
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors"
            style={{ 
              borderColor: 'rgb(209, 213, 219)',
              color: 'rgb(107, 114, 128)'
            }}
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>
          
          <div className="text-sm" style={{ color: 'rgb(107, 114, 128)' }}>
            Total Items: {items.length}
          </div>
        </div>
      )}
    </div>
  )
}
