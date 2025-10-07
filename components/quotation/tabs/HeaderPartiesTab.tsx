'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Copy, User, Building, MapPin, Phone, Mail } from 'lucide-react'
import { QuotationDraft, ValidationErrors } from '@/lib/types/quotation'

interface HeaderPartiesTabProps {
  form: any
  errors: ValidationErrors
  mode: 'create' | 'edit' | 'view'
}

export default function HeaderPartiesTab({ 
  form, 
  errors, 
  mode 
}: HeaderPartiesTabProps) {
  const { register, watch, setValue } = form
  const [copyFromBillTo, setCopyFromBillTo] = useState(false)
  const watchedValues = watch()

  const handleCopyFromBillTo = () => {
    if (copyFromBillTo) {
      setValue('shipTo', { ...watchedValues.billTo })
    }
  }

  const isReadOnly = mode === 'view'

  return (
    <div className="space-y-6">
      {/* Header Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2" >
            <Building className="w-5 h-5" />
            Quotation Details
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-800" >
                Quotation # *
              </label>
              <input
                {...register('quotationNo', { required: 'Quotation number is required' })}
                disabled={isReadOnly}
                className={`w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.quotationNo 
                    ? 'border-red-500 focus:border-red-600 focus:ring-red-200' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                }`}
                placeholder="Enter quotation number"
              />
              {errors.quotationNo && (
                <p className="mt-1 text-sm text-red-600">{String(errors.quotationNo?.message || "")}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-800" >
                Date *
              </label>
              <input
                type="date"
                {...register('date', { required: 'Date is required' })}
                disabled={isReadOnly}
                className={`w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 transition-colors ${
                  errors.date 
                    ? 'border-red-500 focus:border-red-600 focus:ring-red-200' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                }`}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{String(errors.date?.message || "")}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-800" >
                Customer ID
              </label>
              <input
                {...register('customerId')}
                disabled={isReadOnly}
                className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                placeholder="Enter customer ID"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-800" >
                Vendor ID
              </label>
              <input
                {...register('vendorId')}
                disabled={isReadOnly}
                className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                placeholder="Enter vendor ID"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2" >
            <User className="w-5 h-5" />
            Contact Person
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-800" >
                  Salutation
                </label>
                <select
                  {...register('contact.salutation')}
                  disabled={isReadOnly}
                  className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                >
                  <option value="">Select</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Dr.">Dr.</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-800" >
                  Name *
                </label>
                <input
                  {...register('contact.name', { required: 'Contact name is required' })}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    errors.contact?.name 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Enter contact name"
                />
                {errors.contact?.name && (
                  <p className="mt-1 text-sm text-red-600">{String(errors.contact?.name?.message || "")}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-800" >
                  Phone
                </label>
                <input
                  {...register('contact.phone')}
                  disabled={isReadOnly}
                  className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-800" >
                  Email
                </label>
                <input
                  type="email"
                  {...register('contact.email')}
                  disabled={isReadOnly}
                  className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                  placeholder="Enter email address"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2" >
          <Building className="w-5 h-5" />
          Bill To *
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              Company/Organization Name *
            </label>
            <input
              {...register('billTo.name', { required: 'Bill to name is required' })}
              disabled={isReadOnly}
              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                errors.billToName 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              placeholder="Enter company name"
            />
            {errors.billToName && (
              <p className="mt-1 text-sm text-red-600">{String(errors.billToName?.message || "")}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              Address Line 1
            </label>
            <input
              {...register('billTo.address1')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="Enter address line 1"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              Address Line 2
            </label>
            <input
              {...register('billTo.address2')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="Enter address line 2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              City
            </label>
            <input
              {...register('billTo.city')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="Enter city"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              State
            </label>
            <input
              {...register('billTo.state')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="Enter state"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              PIN Code
            </label>
            <input
              {...register('billTo.pin')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="Enter PIN code"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              Phone
            </label>
            <input
              {...register('billTo.phone')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              Email
            </label>
            <input
              type="email"
              {...register('billTo.email')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="Enter email address"
            />
          </div>
        </div>
      </div>

      {/* Ship To Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2" >
            <MapPin className="w-5 h-5" />
            Ship To
          </h3>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={copyFromBillTo}
              onChange={(e) => {
                setCopyFromBillTo(e.target.checked)
                if (e.target.checked) {
                  setValue('shipTo', { ...watchedValues.billTo })
                }
              }}
              disabled={isReadOnly}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Copy from Bill To
            </span>
          </label>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              Company/Organization Name
            </label>
            <input
              {...register('shipTo.name')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="Enter company name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              Address Line 1
            </label>
            <input
              {...register('shipTo.address1')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="Enter address line 1"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              Address Line 2
            </label>
            <input
              {...register('shipTo.address2')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="Enter address line 2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              City
            </label>
            <input
              {...register('shipTo.city')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="Enter city"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              State
            </label>
            <input
              {...register('shipTo.state')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="Enter state"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              PIN Code
            </label>
            <input
              {...register('shipTo.pin')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="Enter PIN code"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              Phone
            </label>
            <input
              {...register('shipTo.phone')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800" >
              Email
            </label>
            <input
              type="email"
              {...register('shipTo.email')}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-lg border-2 bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              placeholder="Enter email address"
            />
          </div>
        </div>
      </div>
    </div>
  )
}