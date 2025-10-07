'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Plus, Copy, Trash2, Upload, Download } from 'lucide-react'
import { QuotationDraft, ValidationErrors, QuotationItem as ItemRow, AdditionalCharge } from '@/lib/types/quotation'
import ItemsTable from '../ItemsTable'
import AdditionalChargesList from '../AdditionalChargesList'
import RateListPicker from '../RateListPicker'
import { generateId } from '@/lib/quotation-calculations'

interface ItemsTabProps {
  form: any
  errors: ValidationErrors
  mode: 'create' | 'edit' | 'view'
}

export default function ItemsTab({ 
  form, 
  errors, 
  mode 
}: ItemsTabProps) {
  const { register, watch, setValue } = form
  const [showRateListPicker, setShowRateListPicker] = useState(false)
  const watchedValues = watch()

  const handleItemsChange = (items: ItemRow[]) => {
    setValue('items', items)
  }

  const handleAdditionalChargesChange = (charges: AdditionalCharge[]) => {
    setValue('additionalCharges', charges)
  }

  const handleExcelParse = (parsedItems: ItemRow[]) => {
    const currentItems = watchedValues.items || []
    const newItems = parsedItems.map((item, index) => ({
      ...item,
      id: generateId(),
      sNo: currentItems.length + index + 1
    }))
    setValue('items', [...currentItems, ...newItems])
  }

  const isReadOnly = mode === 'view'

  return (
    <div className="space-y-6">
      {/* Rate List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2" >
            <Upload className="w-5 h-5" />
            Rate List
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowRateListPicker(true)}
              disabled={isReadOnly}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              Upload Excel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              Select Rate List
            </label>
            <select
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
            >
              <option value="">Select a rate list</option>
              <option value="standard">Standard Rate List</option>
              <option value="premium">Premium Rate List</option>
              <option value="custom">Custom Rate List</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              Rate List File
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2" >
            <Plus className="w-5 h-5" />
            Items & Services
          </h3>
          <button
            type="button"
            onClick={() => {
              const currentItems = watchedValues.items || []
              const newItem: ItemRow = {
                id: generateId(),
                sNo: currentItems.length + 1,
                sampleName: '',
                testParameters: '',
                noOfSamples: 1,
                unitPrice: 0,
                total: 0
              }
              setValue('items', [...currentItems, newItem])
            }}
            disabled={isReadOnly}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        <ItemsTable
          items={watchedValues.items || []}
          errors={errors}
          onChange={handleItemsChange}
          mode={mode}
        />

        {errors.items && (
          <p className="text-sm text-red-600">{String(errors.items?.message || "")}</p>
        )}
      </div>

      {/* Additional Charges */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2" >
          <Plus className="w-5 h-5" />
          Additional Charges (Sampling)
        </h3>

        <AdditionalChargesList
          charges={watchedValues.additionalCharges || []}
          errors={errors}
          onChange={handleAdditionalChargesChange}
          mode={mode}
        />

        {errors.additionalCharges && (
          <p className="text-sm text-red-600">{String(errors.additionalCharges?.message || "")}</p>
        )}
      </div>

      {/* Rate List Picker Modal */}
      {showRateListPicker && (
        <RateListPicker
          isOpen={showRateListPicker}
          onClose={() => setShowRateListPicker(false)}
          onExcelParse={handleExcelParse}
        />
      )}
    </div>
  )
}