'use client'

import { useFormContext } from 'react-hook-form'
import { User, Building, CreditCard } from 'lucide-react'
import { QuotationDraft, ValidationErrors } from '@/lib/types/quotation'

interface PreparedByTabProps {
  form: any
  errors: ValidationErrors
  mode: 'create' | 'edit' | 'view'
}

export default function PreparedByTab({ 
  form, 
  errors, 
  mode 
}: PreparedByTabProps) {
  const { register, watch } = form
  const watchedValues = watch()
  const isReadOnly = mode === 'view'

  return (
    <div className="space-y-6">
      {/* Prepared By Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2" >
          <User className="w-5 h-5" />
          Prepared By
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              Name *
            </label>
            <input
              {...register('preparedBy.name', { required: 'Prepared by name is required' })}
              disabled={isReadOnly}
              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                errors.preparedByName 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              placeholder="Enter prepared by name"
            />
            {errors.preparedByName && (
              <p className="mt-1 text-sm text-red-600">{String(errors.preparedByName?.message || "")}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              Phone
            </label>
            <input
              {...register('preparedBy.phone')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="Enter phone number"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800" >
            Email
          </label>
          <input
            type="email"
            {...register('preparedBy.email')}
            disabled={isReadOnly}
            className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
            placeholder="Enter email address"
          />
        </div>
      </div>

      {/* Bank Details Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2" >
          <CreditCard className="w-5 h-5" />
          Bank Details
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              Bank Name & Branch
            </label>
            <input
              {...register('bankDetails.bankLine')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="e.g., ICICI Bank Ltd. Centrum Park, Wagle Estate Branch, Thane (West) – 400604"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              IFSC Code
            </label>
            <input
              {...register('bankDetails.ifsc')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="e.g., ICIC0004815"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              Account Type
            </label>
            <input
              {...register('bankDetails.accountType')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="e.g., Current Account"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              Account Name
            </label>
            <input
              {...register('bankDetails.accountName')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="e.g., Envirocare Labs Private Limited"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              Account Number
            </label>
            <input
              {...register('bankDetails.accountNumber')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="Enter account number"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              MICR Code
            </label>
            <input
              {...register('bankDetails.micr')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="Enter MICR code"
            />
          </div>
        </div>
      </div>
    </div>
  )
}