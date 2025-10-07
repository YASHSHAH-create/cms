'use client'

import { useFormContext } from 'react-hook-form'
import { FileText } from 'lucide-react'
import { QuotationDraft, ValidationErrors } from '@/lib/types/quotation'

interface TermsTabProps {
  form: any
  errors: ValidationErrors
  mode: 'create' | 'edit' | 'view'
}

export default function TermsTab({ 
  form, 
  errors, 
  mode 
}: TermsTabProps) {
  const { register, watch } = form
  const watchedValues = watch()
  const isReadOnly = mode === 'view'

  const defaultTerms = `1. This quotation is valid for 30 days from the date of issue.
2. Payment terms: 50% advance, 50% on completion.
3. All prices are exclusive of applicable taxes.
4. Sampling charges as per standard rates.
5. NABL accredited laboratory services.
6. Test reports will be provided within 7-10 working days.
7. Sample collection charges extra as applicable.
8. Prices are subject to change without prior notice.
9. All disputes subject to jurisdiction of local courts.
10. Terms and conditions as per standard laboratory practices.`

  return (
    <div className="space-y-6">
      {/* Terms & Conditions Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2" >
          <FileText className="w-5 h-5" />
          Terms & Conditions *
        </h3>

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800" >
            General Terms & Conditions
          </label>
          <textarea className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            {...register('terms', { required: 'Terms and conditions are required' })}
            disabled={isReadOnly}
            rows={12}
            className={`w-full px-3 py-2 rounded-lg border transition-colors resize-none ${
              errors.terms 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            placeholder="Enter terms and conditions..."
            defaultValue={defaultTerms}
          />
          {errors.terms && (
            <p className="mt-1 text-sm text-red-600">{String(errors.terms?.message || "")}</p>
          )}
        </div>

        {/* Terms Preview */}
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2" >
            Preview
          </h4>
          <div className="p-4 rounded-lg border" style={{ 
            backgroundColor: 'var(--surface-2)', 
            borderColor: 'var(--border)',
            color: 'var(--text)'
          }}>
            <div className="text-sm whitespace-pre-line">
              {watchedValues.terms || defaultTerms}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <h4 className="text-md font-medium" >
          Additional Information
        </h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              Rate List File Name
            </label>
            <input
              {...register('attachments.rateListFileName')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="e.g., Standard_Rate_List_2024.xlsx"
            />
          </div>
        </div>
      </div>

      {/* Validation Messages */}
      {errors.terms && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{String(errors.terms?.message || "")}</p>
        </div>
      )}
    </div>
  )
}