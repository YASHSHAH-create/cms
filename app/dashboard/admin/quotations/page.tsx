'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import DashboardHeader from '@/components/DashboardHeader'
import QuotationTable from '@/components/quotation/QuotationTable'
import QuotationFormModal from '@/components/quotation/QuotationFormModal'
import PreviewDrawer from '@/components/quotation/PreviewDrawer'
import GenerateQuotationButton from '@/components/quotation/GenerateQuotationButton'
import { QuotationDraft, SavedQuotation } from '@/lib/types/quotation'
import { generateQuotationNo } from '@/lib/quotation-calculations'
import { FileText, TrendingUp, CheckCircle, Clock } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

// Mock data for demonstration
const mockQuotations: SavedQuotation[] = [
  {
    id: '1',
    quotationNo: 'Q-2024-0001',
    date: '2024-01-15',
    customerName: 'ABC Manufacturing Ltd.',
    contactPerson: 'Mr. Rajesh Kumar',
    totalAmount: 125000,
    status: 'approved',
    createdAt: '2024-01-15T10:30:00Z',
    lastModified: '2024-01-16T14:20:00Z',
  },
  {
    id: '2',
    quotationNo: 'Q-2024-0002',
    date: '2024-01-18',
    customerName: 'XYZ Industries Pvt. Ltd.',
    contactPerson: 'Ms. Priya Sharma',
    totalAmount: 89500,
    status: 'sent',
    createdAt: '2024-01-18T09:15:00Z',
    lastModified: '2024-01-18T09:15:00Z',
  },
  {
    id: '3',
    quotationNo: 'Q-2024-0003',
    date: '2024-01-20',
    customerName: 'Green Earth Solutions',
    contactPerson: 'Dr. Amit Patel',
    totalAmount: 156000,
    status: 'draft',
    createdAt: '2024-01-20T16:45:00Z',
    lastModified: '2024-01-21T11:30:00Z',
  },
  {
    id: '4',
    quotationNo: 'Q-2024-0004',
    date: '2024-01-22',
    customerName: 'Tech Solutions India',
    contactPerson: 'Mr. Sanjay Mehta',
    totalAmount: 67800,
    status: 'rejected',
    createdAt: '2024-01-22T13:20:00Z',
    lastModified: '2024-01-23T10:15:00Z',
  },
  {
    id: '5',
    quotationNo: 'Q-2024-0005',
    date: '2024-01-25',
    customerName: 'EcoTest Laboratories',
    contactPerson: 'Ms. Neha Singh',
    totalAmount: 234500,
    status: 'sent',
    createdAt: '2024-01-25T08:00:00Z',
    lastModified: '2024-01-25T08:00:00Z',
  },
]

export default function QuotationsPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading } = useAuth()
  const [quotations, setQuotations] = useState<SavedQuotation[]>(mockQuotations)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>()
  const [previewQuotation, setPreviewQuotation] = useState<QuotationDraft | null>(null)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  // Calculate statistics
  const stats = {
    total: quotations.length,
    approved: quotations.filter((q) => q.status === 'approved').length,
    pending: quotations.filter((q) => q.status === 'sent').length,
    draft: quotations.filter((q) => q.status === 'draft').length,
    totalValue: quotations.reduce((sum, q) => sum + q.totalAmount, 0),
  }

  const handleCreateNew = () => {
    setModalMode('create')
    setSelectedQuotationId(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (id: string) => {
    setModalMode('edit')
    setSelectedQuotationId(id)
    setIsModalOpen(true)
  }

  const handleView = (id: string) => {
    setModalMode('view')
    setSelectedQuotationId(id)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this quotation?')) {
      setQuotations((prev) => prev.filter((q) => q.id !== id))
    }
  }

  const handleSave = (quotation: QuotationDraft) => {
    if (modalMode === 'create') {
      const newQuotation: SavedQuotation = {
        id: `${Date.now()}`,
        quotationNo: quotation.quotationNo,
        date: quotation.date,
        customerName: quotation.billTo.name,
        contactPerson: quotation.contact.name,
        totalAmount: quotation.grandTotal,
        status: 'draft',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      }
      setQuotations((prev) => [newQuotation, ...prev])
    } else if (modalMode === 'edit') {
      setQuotations((prev) =>
        prev.map((q) =>
          q.id === selectedQuotationId
            ? {
                ...q,
                quotationNo: quotation.quotationNo,
                date: quotation.date,
                customerName: quotation.billTo.name,
                contactPerson: quotation.contact.name,
                totalAmount: quotation.grandTotal,
                lastModified: new Date().toISOString(),
              }
            : q
        )
      )
    }
    setIsModalOpen(false)
  }

  const handlePreview = (quotation: QuotationDraft) => {
    setPreviewQuotation(quotation)
    setIsPreviewOpen(true)
  }

  const handleTablePreview = (quotation: any) => {
    // In a real app, fetch the full quotation data
    // For now, create a mock draft from saved quotation
    const mockDraft: QuotationDraft = {
      quotationNo: quotation.quotationNo,
      date: quotation.date,
      billTo: {
        name: quotation.customerName,
        address1: '123 Business Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pin: '400001',
        email: 'contact@example.com',
        phone: '+91 98765 43210',
      },
      shipTo: {
        name: quotation.customerName,
      },
      contact: {
        name: quotation.contactPerson,
        email: 'contact@example.com',
        phone: '+91 98765 43210',
      },
      items: [
        {
          id: '1',
          sNo: 1,
          sampleName: 'Water Quality Analysis',
          testParameters: 'pH, TDS, Hardness, BOD, COD',
          noOfSamples: 5,
          unitPrice: 2500,
          total: 12500,
        },
      ],
      additionalCharges: [],
      subtotal: 12500,
      taxes: {
        cgstRate: 9,
        sgstRate: 9,
        cgstAmount: 1125,
        sgstAmount: 1125,
      },
      grandTotal: quotation.totalAmount,
      amountInWords: '',
      preparedBy: {
        name: 'Admin User',
        email: 'admin@envirocare.com',
        phone: '+91 98765 43210',
      },
      bankDetails: {
        accountName: 'Envirocare Environmental Services',
        accountNumber: '1234567890123456',
        ifsc: 'HDFC0001234',
        bankNameBranch: 'HDFC Bank, Mumbai Branch',
        accountType: 'Current',
      },
      terms: '1. This quotation is valid for 30 days from the date of issue.\n2. Payment terms: 50% advance, 50% on completion.\n3. All prices are exclusive of applicable taxes.',
    }
    setPreviewQuotation(mockDraft)
    setIsPreviewOpen(true)
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar userRole="admin" userName={user?.name} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader userRole="admin" userName={user?.name} />
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="text-gray-600">Loading quotations...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole={user?.role as 'admin' | 'executive' | 'sales-executive' | 'customer-executive' || 'admin'} userName={user?.name} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          userRole={user?.role as 'admin' | 'executive' | 'sales-executive' | 'customer-executive' || 'admin'}
          userName={user?.name}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Quotation Management
            </h1>
            <p className="text-gray-600">
              Create, manage and track all your quotations in one place
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            <StatCard
              title="Total Quotations"
              value={stats.total}
              icon={<FileText className="w-6 h-6" />}
              color="from-blue-500 to-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard
              title="Approved"
              value={stats.approved}
              icon={<CheckCircle className="w-6 h-6" />}
              color="from-green-500 to-green-600"
              bgColor="bg-green-50"
            />
            <StatCard
              title="Pending"
              value={stats.pending}
              icon={<Clock className="w-6 h-6" />}
              color="from-yellow-500 to-yellow-600"
              bgColor="bg-yellow-50"
            />
            <StatCard
              title="Total Value"
              value={`₹${(stats.totalValue / 100000).toFixed(1)}L`}
              icon={<TrendingUp className="w-6 h-6" />}
              color="from-purple-500 to-purple-600"
              bgColor="bg-purple-50"
            />
          </div>

          {/* Quotations Table Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">
                    All Quotations
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {quotations.length} {quotations.length === 1 ? 'quotation' : 'quotations'} found
                  </p>
                </div>
                <GenerateQuotationButton onClick={handleCreateNew} />
              </div>
            </div>

            <div className="p-6">
              <QuotationTable
                quotations={quotations}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
                onPreview={handleTablePreview}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Form Modal */}
      <QuotationFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        quotationId={selectedQuotationId}
        onSave={handleSave}
        onClose={() => setIsModalOpen(false)}
        onPreview={handlePreview}
      />

      {/* Preview Drawer */}
      {previewQuotation && (
        <PreviewDrawer
          isOpen={isPreviewOpen}
          quotation={previewQuotation}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  )
}

// StatCard Component
interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  bgColor: string
}

function StatCard({ title, value, icon, color, bgColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
              {title}
            </p>
            <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
              {value}
            </p>
          </div>
          <div className={`${bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
            <div className={`bg-gradient-to-br ${color} text-white p-2 rounded-lg shadow-lg`}>
              {icon}
            </div>
          </div>
        </div>
      </div>
      <div className={`h-1 bg-gradient-to-r ${color}`}></div>
    </div>
  )
}

