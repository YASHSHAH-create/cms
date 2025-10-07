'use client'

import { Plus } from 'lucide-react'

interface GenerateQuotationButtonProps {
  onClick: () => void
}

export default function GenerateQuotationButton({ onClick }: GenerateQuotationButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-300 bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-600 hover:text-white shadow-md"
    >
      <Plus className="w-5 h-5" />
      <span>Generate Quotation</span>
    </button>
  )
}
