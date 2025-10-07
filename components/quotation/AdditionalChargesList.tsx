'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { AdditionalCharge } from '@/lib/types/quotation'

interface AdditionalChargesListProps {
  charges: AdditionalCharge[]
  errors: any
  onChange: (additionalCharges: AdditionalCharge[]) => void
  mode: 'create' | 'edit' | 'view'
}

export default function AdditionalChargesList({ 
  charges, 
  errors,
  onChange, 
  mode 
}: AdditionalChargesListProps) {
  const isReadOnly = mode === 'view'
  const additionalCharges = charges || []
  const [newCharge, setNewCharge] = useState({ label: '', amount: 0 })

  const addCharge = () => {
    if (newCharge.label.trim() && newCharge.amount > 0) {
      const charge: AdditionalCharge = {
        id: Date.now().toString(),
        label: newCharge.label.trim(),
        amount: newCharge.amount
      }
      onChange([...additionalCharges, charge])
      setNewCharge({ label: '', amount: 0 })
    }
  }

  const updateCharge = (index: number, field: keyof AdditionalCharge, value: any) => {
    const updatedCharges = [...additionalCharges]
    updatedCharges[index] = { ...updatedCharges[index], [field]: value }
    onChange(updatedCharges)
  }

  const deleteCharge = (index: number) => {
    const updatedCharges = additionalCharges.filter((_, idx) => idx !== index)
    onChange(updatedCharges)
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
      {/* Add New Charge */}
      {!isReadOnly && (
        <div 
          className="p-4 rounded-lg border border-dashed"
          style={{ 
            borderColor: 'rgb(209, 213, 219)',
            backgroundColor: 'rgb(249, 250, 251)'
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(17, 24, 39)' }}>
                Label
              </label>
              <input
                type="text"
                value={newCharge.label}
                onChange={(e) => setNewCharge({ ...newCharge, label: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                style={{
                  backgroundColor: 'white',
                  color: 'rgb(17, 24, 39)'
                }}
                placeholder="e.g., Additional Charges (Sampling)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(17, 24, 39)' }}>
                Amount (INR)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newCharge.amount}
                onChange={(e) => setNewCharge({ ...newCharge, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                style={{
                  backgroundColor: 'white',
                  color: 'rgb(17, 24, 39)'
                }}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={addCharge}
                disabled={!newCharge.label.trim() || newCharge.amount <= 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'rgb(37, 99, 235)' }}
              >
                <Plus className="w-4 h-4" />
                Add Charge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Charges List */}
      {(additionalCharges || []).length === 0 ? (
        <div 
          className="text-center py-6 rounded-lg border-2 border-dashed"
          style={{ 
            borderColor: 'rgb(209, 213, 219)',
            backgroundColor: 'rgb(249, 250, 251)'
          }}
        >
          <div className="text-3xl mb-2">💰</div>
          <p className="text-sm" style={{ color: 'rgb(107, 114, 128)' }}>
            No additional charges added
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(additionalCharges || []).map((charge, index) => (
            <div 
              key={charge.id}
              className="flex items-center gap-4 p-4 rounded-lg border"
              style={{ 
                borderColor: 'rgb(209, 213, 219)',
                backgroundColor: 'var(--surface-1)'
              }}
            >
              <div className="flex-1">
                <input
                  type="text"
                  value={charge.label}
                  onChange={(e) => updateCharge(index, 'label', e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  style={{
                    backgroundColor: 'white',
                    color: 'rgb(17, 24, 39)'
                  }}
                />
              </div>
              <div className="w-32">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={charge.amount}
                  onChange={(e) => updateCharge(index, 'amount', parseFloat(e.target.value) || 0)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-300 bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  style={{
                    backgroundColor: 'white',
                    color: 'rgb(17, 24, 39)'
                  }}
                />
              </div>
              <div className="w-24 text-right">
                <span className="text-sm font-medium" style={{ color: 'rgb(17, 24, 39)' }}>
                  {formatCurrency(charge.amount)}
                </span>
              </div>
              {!isReadOnly && (
                <button
                  onClick={() => deleteCharge(index)}
                  className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                  style={{ color: 'rgb(107, 114, 128)' }}
                  title="Delete Charge"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {additionalCharges.length > 0 && (
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: 'rgb(249, 250, 251)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'rgb(17, 24, 39)' }}>
              Total Additional Charges
            </span>
            <span className="text-lg font-semibold" style={{ color: 'rgb(17, 24, 39)' }}>
              {formatCurrency(additionalCharges.reduce((sum, charge) => sum + charge.amount, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
