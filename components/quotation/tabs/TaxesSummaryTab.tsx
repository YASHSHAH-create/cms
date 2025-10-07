'use client'

import { useFormContext } from 'react-hook-form'
import { Calculator, Percent } from 'lucide-react'
import { QuotationDraft, ValidationErrors } from '@/lib/types/quotation'
import { formatINR } from '@/lib/quotation-calculations'

interface TaxesSummaryTabProps {
  form: any
  errors: ValidationErrors
  mode: 'create' | 'edit' | 'view'
}

export default function TaxesSummaryTab({ 
  form, 
  errors, 
  mode 
}: TaxesSummaryTabProps) {
  const { register, watch } = form
  const watchedValues = watch()
  const isReadOnly = mode === 'view'

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2" >
          <Calculator className="w-5 h-5" />
          Summary
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Tax Rates */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-800" >
                  CGST Rate (%)
                </label>
                <div className="relative">
                  <input
                    {...register('taxes.cgstRate', { 
                      required: 'CGST rate is required',
                      min: { value: 0, message: 'Rate must be non-negative' },
                      max: { value: 100, message: 'Rate cannot exceed 100%' }
                    })}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      errors.taxes?.cgstRate 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    placeholder="9.00"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Percent className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                {errors.taxes?.cgstRate && (
                  <p className="mt-1 text-sm text-red-600">{String(errors.taxes?.cgstRate?.message || "")}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-800" >
                  SGST Rate (%)
                </label>
                <div className="relative">
                  <input
                    {...register('taxes.sgstRate', { 
                      required: 'SGST rate is required',
                      min: { value: 0, message: 'Rate must be non-negative' },
                      max: { value: 100, message: 'Rate cannot exceed 100%' }
                    })}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      errors.taxes?.sgstRate 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    placeholder="9.00"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Percent className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                {errors.taxes?.sgstRate && (
                  <p className="mt-1 text-sm text-red-600">{String(errors.taxes?.sgstRate?.message || "")}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Calculated Totals */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4" style={{ backgroundColor: 'var(--surface-2)' }}>
              <h4 className="font-medium mb-3" >Calculated Totals</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                  <span className="font-medium" >
                    {formatINR(watchedValues.subtotal || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>CGST ({watchedValues.taxes?.cgstRate || 0}%):</span>
                  <span className="font-medium" >
                    {formatINR(watchedValues.taxes?.cgstAmount || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>SGST ({watchedValues.taxes?.sgstRate || 0}%):</span>
                  <span className="font-medium" >
                    {formatINR(watchedValues.taxes?.sgstAmount || 0)}
                  </span>
                </div>
                
                <div className="border-t pt-2" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex justify-between text-base font-semibold">
                    <span >Grand Total:</span>
                    <span className="text-blue-600" style={{ color: 'var(--primary)' }}>
                      {formatINR(watchedValues.grandTotal || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount in Words */}
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-800" >
                Amount in Words
              </label>
              <div className="p-3 rounded-lg border" style={{ 
                 
                borderColor: 'var(--border)',
                color: 'var(--text)'
              }}>
                <p className="text-sm font-medium">
                  {watchedValues.amountInWords || 'Amount will be calculated automatically'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Messages */}
      {errors.subtotal && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{String(errors.subtotal?.message || "")}</p>
        </div>
      )}
      
      {errors.taxes && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{String(errors.taxes?.message || "")}</p>
        </div>
      )}
    </div>
  )
}