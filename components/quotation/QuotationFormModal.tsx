'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save, Eye, ChevronRight, ChevronLeft, Download, FileText } from 'lucide-react'
import { QuotationDraft, FormStep, ValidationErrors } from '@/lib/types/quotation'
import { computeRowTotal, computeSubtotal, computeTaxes, formatINR, amountToWordsIndian, generateId } from '@/lib/quotation-calculations'
import HeaderPartiesTab from './tabs/HeaderPartiesTab'
import ItemsTab from './tabs/ItemsTab'
import TaxesSummaryTab from './tabs/TaxesSummaryTab'
import PreparedByTab from './tabs/PreparedByTab'
import TermsTab from './tabs/TermsTab'
import QuotationPreview from './QuotationPreview'

interface QuotationFormModalProps {
  isOpen: boolean
  mode: 'create' | 'edit' | 'view'
  quotationId?: string
  onSave: (quotation: QuotationDraft) => void
  onClose: () => void
  onPreview: (quotation: QuotationDraft) => void
}

// Zod validation schema
const quotationSchema = z.object({
  quotationNo: z.string().min(1, 'Quotation number is required'),
  date: z.string().min(1, 'Date is required'),
  customerId: z.string().optional(),
  vendorId: z.string().optional(),
  billTo: z.object({
    name: z.string().min(1, 'Bill to name is required'),
    address1: z.string().optional(),
    address2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pin: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
  }),
  shipTo: z.object({
    name: z.string().optional(),
    address1: z.string().optional(),
    address2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pin: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
  }),
  contact: z.object({
    salutation: z.enum(['Mr.', 'Ms.', 'Dr.', '']).optional(),
    name: z.string().min(1, 'Contact name is required'),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
  }),
  items: z.array(z.object({
    id: z.string(),
    sNo: z.number(),
    sampleName: z.string().min(1, 'Sample name is required'),
    testParameters: z.string().optional(),
    noOfSamples: z.number().min(1, 'Number of samples must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be non-negative'),
    total: z.number(),
  })).min(1, 'At least one item is required'),
  additionalCharges: z.array(z.object({
    id: z.string(),
    label: z.string().min(1, 'Label is required'),
    amount: z.number().min(0, 'Amount must be non-negative'),
  })),
  subtotal: z.number(),
  taxes: z.object({
    cgstRate: z.number().min(0).max(100),
    sgstRate: z.number().min(0).max(100),
    cgstAmount: z.number(),
    sgstAmount: z.number(),
  }),
  grandTotal: z.number(),
  amountInWords: z.string().optional(),
  preparedBy: z.object({
    name: z.string().min(1, 'Prepared by name is required'),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
  }),
  bankDetails: z.object({
    bankLine: z.string().optional(),
    ifsc: z.string().optional(),
    accountType: z.string().optional(),
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
    micr: z.string().optional(),
  }),
  terms: z.string().min(1, 'Terms and conditions are required'),
  attachments: z.object({
    rateListFileName: z.string().optional(),
  }).optional(),
})

const formSteps: { key: FormStep; label: string; description: string }[] = [
  { key: 'header', label: 'Header & Parties', description: 'Customer and vendor details' },
  { key: 'items', label: 'Scope & Items', description: 'Products and services' },
  { key: 'taxes', label: 'Taxes & Summary', description: 'Tax calculations and totals' },
  { key: 'prepared', label: 'Prepared By', description: 'Prepared by and bank details' },
  { key: 'terms', label: 'Terms & Conditions', description: 'Terms and conditions' }
]

const initialQuotation: QuotationDraft = {
  quotationNo: '',
  date: new Date().toISOString().split('T')[0],
  customerId: '',
  vendorId: '',
  billTo: {
    name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    pin: '',
    email: '',
    phone: ''
  },
  shipTo: {
    name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    pin: '',
    email: '',
    phone: ''
  },
  contact: {
    name: '',
    phone: '',
    email: ''
  },
  items: [],
  additionalCharges: [],
  subtotal: 0,
  taxes: {
    cgstRate: 9,
    sgstRate: 9,
    cgstAmount: 0,
    sgstAmount: 0
  },
  grandTotal: 0,
  amountInWords: '',
  preparedBy: {
    name: '',
    phone: '',
    email: ''
  },
  bankDetails: {
    accountName: 'Envirocare Environmental Services',
    accountNumber: '1234567890123456',
    ifsc: 'HDFC0001234',
    bankNameBranch: 'HDFC Bank, Mumbai Branch',
    accountType: 'Current'
  },
  terms: '1. This quotation is valid for 30 days from the date of issue.\n2. Payment terms: 50% advance, 50% on completion.\n3. All prices are exclusive of applicable taxes.\n4. Sampling charges as per standard rates.\n5. NABL accredited laboratory services.',
  attachments: {}
}

export default function QuotationFormModal({
  isOpen,
  mode,
  quotationId,
  onSave,
  onClose,
  onPreview
}: QuotationFormModalProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('header')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedFile, setGeneratedFile] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const form = useForm<QuotationDraft>({
    resolver: zodResolver(quotationSchema) as any,
    defaultValues: initialQuotation,
    mode: 'onChange'
  })

  const { watch, setValue, formState: { errors, isValid } } = form
  const watchedValues = watch()

  // Auto-calculate totals when items or charges change
  useEffect(() => {
    const items = watchedValues.items || []
    const charges = watchedValues.additionalCharges || []
    const cgstRate = watchedValues.taxes?.cgstRate || 9
    const sgstRate = watchedValues.taxes?.sgstRate || 9

    // Update item totals
    const updatedItems = items.map(item => ({
      ...item,
      total: computeRowTotal(item.noOfSamples, item.unitPrice)
    }))
    
    if (JSON.stringify(updatedItems) !== JSON.stringify(items)) {
      setValue('items', updatedItems)
    }

    // Calculate subtotal
    const subtotal = computeSubtotal(updatedItems, charges)
    if (subtotal !== watchedValues.subtotal) {
      setValue('subtotal', subtotal)
    }

    // Calculate taxes
    const taxes = computeTaxes(subtotal, cgstRate, sgstRate)
    if (JSON.stringify(taxes) !== JSON.stringify(watchedValues.taxes)) {
      setValue('taxes', taxes)
    }

    // Calculate grand total
    const grandTotal = subtotal + taxes.cgstAmount + taxes.sgstAmount
    if (grandTotal !== watchedValues.grandTotal) {
      setValue('grandTotal', grandTotal)
      setValue('amountInWords', amountToWordsIndian(grandTotal))
    }
  }, [watchedValues.items, watchedValues.additionalCharges, watchedValues.taxes?.cgstRate, watchedValues.taxes?.sgstRate, setValue])

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('header')
      form.reset(initialQuotation)
      setShowPreview(false)
    }
  }, [isOpen, form])

  const handleSave = () => {
    if (isValid) {
      onSave(watchedValues)
    }
  }

  const handlePreview = () => {
    if (isValid) {
      setShowPreview(true)
    }
  }

  const handleNext = () => {
    const stepIndex = formSteps.findIndex(step => step.key === currentStep)
    if (stepIndex < formSteps.length - 1) {
      setCurrentStep(formSteps[stepIndex + 1].key)
    }
  }

  const handlePrevious = () => {
    const stepIndex = formSteps.findIndex(step => step.key === currentStep)
    if (stepIndex > 0) {
      setCurrentStep(formSteps[stepIndex - 1].key)
    }
  }


  const handleGenerateDocx = async () => {
    if (!isValid) return
    
    setIsGenerating(true)
    try {
      // Send current form state directly to the DOCX API
      const response = await fetch('/api/quotation/docx-proper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(watchedValues),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      // Handle file download
      const blob = await response.blob()
      
      // Check if file has content
      if (blob.size === 0) {
        throw new Error('Generated file is empty')
      }

      // Check content type
      const contentType = response.headers.get('content-type')
      console.log('Response content type:', contentType)

      const url_blob = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url_blob
      
      // Get filename from Content-Disposition header or create default
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `Quotation_${watchedValues.quotationNo}_${Date.now()}.docx`
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url_blob)

      setGeneratedFile(filename)
      alert('DOCX quotation generated and downloaded successfully!')
      
    } catch (error) {
      console.error('Error generating DOCX:', error)
      alert(`Error generating quotation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }


  const handleDownload = () => {
    if (generatedFile) {
      const link = document.createElement('a')
      link.href = generatedFile
      link.download = generatedFile.split('/').pop() || 'quotation.docx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'header':
        return (
          <HeaderPartiesTab
            form={form}
            errors={errors as any}
            mode={mode}
          />
        )
      case 'items':
        return (
          <ItemsTab
            form={form}
            errors={errors as any}
            mode={mode}
          />
        )
      case 'taxes':
        return (
          <TaxesSummaryTab
            form={form}
            errors={errors as any}
            mode={mode}
          />
        )
      case 'prepared':
        return (
          <PreparedByTab
            form={form}
            errors={errors as any}
            mode={mode}
          />
        )
      case 'terms':
        return (
          <TermsTab
            form={form}
            errors={errors as any}
            mode={mode}
          />
        )
      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="fixed inset-0"
          onClick={onClose}
        />
        
        <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {mode === 'create' ? '📝 Generate New Quotation' : 
                   mode === 'edit' ? '✏️ Edit Quotation' : '👁️ View Quotation'}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {formSteps.find(step => step.key === currentStep)?.description}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/20 transition-all text-white hover:scale-110"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Step Navigation */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                {formSteps.map((step, index) => {
                  const isActive = step.key === currentStep
                  const isCompleted = formSteps.findIndex(s => s.key === currentStep) > index
                  
                  return (
                    <div key={step.key} className="flex items-center">
                      <button
                        onClick={() => setCurrentStep(step.key)}
                        className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                          isActive 
                            ? 'bg-blue-600 text-white shadow-lg scale-105' 
                            : isCompleted 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isActive 
                            ? 'bg-white text-blue-600' 
                            : isCompleted 
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-200 text-gray-600'
                        }`}>
                          {isCompleted ? '✓' : index + 1}
                        </span>
                        <span className="hidden sm:inline">{step.label}</span>
                      </button>
                      {index < formSteps.length - 1 && (
                        <ChevronRight className="w-5 h-5 mx-1 text-gray-400" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto bg-white">
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 'header'}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-semibold transition-all hover:bg-gray-100 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              
              {currentStep !== 'terms' && (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-blue-500 bg-white text-blue-600 font-semibold transition-all hover:bg-blue-50"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-semibold transition-all hover:bg-gray-100"
              >
                Cancel
              </button>
              
              {mode !== 'view' && (
                <button
                  onClick={handleSave}
                  disabled={!isValid}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 text-white font-semibold transition-all hover:bg-green-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Draft</span>
                </button>
              )}
              
              <button
                onClick={handlePreview}
                disabled={!isValid}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold transition-all hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
              
              <button
                onClick={handleGenerateDocx}
                disabled={!isValid || isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4" />
                <span>{isGenerating ? 'Generating...' : 'Generate DOCX'}</span>
              </button>
              
              {generatedFile && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 text-white font-semibold transition-all hover:bg-green-700 hover:shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/70 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
            <div 
              className="fixed inset-0"
              onClick={() => setShowPreview(false)}
            />
            
            <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">
                    👁️ Quotation Preview
                  </h2>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2 rounded-lg hover:bg-white/20 transition-all text-white hover:scale-110"
                    title="Close Preview"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 max-h-[80vh] overflow-y-auto bg-gray-50">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <QuotationPreview quotation={watchedValues} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
