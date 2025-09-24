import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  isBranch?: boolean;
  isParallel?: boolean;
  isEnd?: boolean;
  isDecision?: boolean;
}

interface StageHistory {
  id: string;
  stageId: string;
  stageName: string;
  timestamp: Date;
  previousStage?: string;
  executiveNotes?: string;
  isEditable?: boolean;
  isAutoFilled?: boolean;
}

const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'enquiry_required', name: 'Enquiry Received', color: 'bg-blue-500' },
  { id: 'contact_initiated', name: 'Contact Initiated', color: 'bg-orange-500' },
  { id: 'feasibility_check', name: 'Feasibility Check', color: 'bg-purple-500', isDecision: true },
  { id: 'qualified', name: 'Qualified', color: 'bg-green-500' },
  { id: 'quotation_sent', name: 'Quotation Sent', color: 'bg-pink-500' },
  { id: 'negotiation_stage', name: 'Negotiation Stage', color: 'bg-red-500' },
  { id: 'converted', name: 'Converted', color: 'bg-emerald-500' },
  { id: 'payment_received', name: 'Payment Received', color: 'bg-teal-500' },
  { id: 'sample_received', name: 'Sample Received', color: 'bg-indigo-500' },
  { id: 'handed_to_smc', name: 'Handed to SMC', color: 'bg-blue-600' },
  { id: 'informed_about_se', name: 'Informed about SE', color: 'bg-blue-700' },
  { id: 'provided_kyc_quotation_to_smc', name: 'Provided KYC & Quotation to SMC', color: 'bg-blue-800' },
  { id: 'process_initiated', name: 'Process Initiated', color: 'bg-green-700' },
  { id: 'ongoing_process', name: 'Ongoing Process', color: 'bg-green-800' },
  { id: 'report_generated', name: 'Report Generated', color: 'bg-green-900' },
  { id: 'sent_to_client_via_mail', name: 'Sent to Client via Mail', color: 'bg-purple-600' },
  { id: 'report_hardcopy_sent', name: 'Report Hardcopy Sent', color: 'bg-purple-700' },
  { id: 'unqualified', name: 'Unqualified (End)', color: 'bg-gray-500', isEnd: true }
];

// Helper function to get pipeline stage order
const getPipelineStageOrder = (stageId: string): number => {
  const index = PIPELINE_STAGES.findIndex(stage => stage.id === stageId);
  return index >= 0 ? index : 999; // Return 999 for unknown stages (put them at the end)
};

interface PipelineFlowchartProps {
  currentStatus: string;
  onStatusChange: (status: string, notes?: string) => void;
  className?: string;
  pipelineHistory?: Array<{
    status: string;
    changedAt: string;
    changedBy: string;
    notes?: string;
  }>;
  readOnly?: boolean;
}

export default function PipelineFlowchart({ currentStatus, onStatusChange, className = '', pipelineHistory = [], readOnly = false }: PipelineFlowchartProps) {
  const [stageHistory, setStageHistory] = useState<StageHistory[]>([]);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [editNotesText, setEditNotesText] = useState('');
  
  // State for mandatory notes modal
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [pendingStageChange, setPendingStageChange] = useState<string | null>(null);
  const [mandatoryNotes, setMandatoryNotes] = useState('');

  // Debug logging
  console.log('🚀🚀🚀 FRESH CODE LOADED - TIMESTAMP:', new Date().toISOString(), '🚀🚀🚀');
  console.log('🚀 PipelineFlowchart component loaded with NEW DEBUGGING CODE - TIMESTAMP:', new Date().toISOString());
  console.log('PipelineFlowchart rendered with currentStatus:', currentStatus);
  console.log('PipelineFlowchart pipelineHistory:', pipelineHistory);
  console.log('PipelineFlowchart stageHistory:', stageHistory);
  
  // Debug: Check if notes are in pipelineHistory
  if (pipelineHistory && pipelineHistory.length > 0) {
    console.log('🔍 PipelineFlowchart - Checking pipelineHistory entries:');
    pipelineHistory.forEach((entry, index) => {
      console.log(`  Entry ${index}:`, {
        status: entry.status,
        notes: entry.notes,
        hasNotes: !!entry.notes,
        notesLength: entry.notes?.length,
        timestamp: entry.timestamp
      });
    });
  }

  // Effect to log when currentStatus changes
  useEffect(() => {
    console.log('PipelineFlowchart currentStatus changed to:', currentStatus);
  }, [currentStatus]);

  // Create a stable key for pipeline history to prevent unnecessary recalculations
  const pipelineHistoryKey = useMemo(() => {
    if (!pipelineHistory || pipelineHistory.length === 0) {
      return `empty-${currentStatus}`;
    }
    return pipelineHistory.map(entry => `${entry.status}-${entry.changedAt}-${entry.changedBy}`).join('|') + `-${currentStatus}`;
  }, [pipelineHistory, currentStatus]);

  // Memoize the pipeline history processing to prevent infinite loops
  const processedStageHistory = useMemo(() => {
    console.log('Processing stage history with:', { pipelineHistory, currentStatus });
    console.log('Pipeline history entries:', pipelineHistory.map(entry => ({
      status: entry.status,
      notes: entry.notes,
      changedAt: entry.changedAt
    })));
    
    let stageHistoryEntries: StageHistory[] = [];
    
    if (pipelineHistory && pipelineHistory.length > 0) {
      console.log('Converting pipeline history:', pipelineHistory);
      
      // Create a map to ensure each stage appears only once
      const stageMap = new Map<string, any>();
      
      // Process pipeline history and keep only the latest entry for each stage
      pipelineHistory.forEach((entry) => {
        console.log('Processing pipeline entry:', {
          status: entry.status,
          notes: entry.notes,
          changedAt: entry.changedAt,
          changedBy: entry.changedBy
        });
        
        const existingEntry = stageMap.get(entry.status);
        if (!existingEntry || new Date(entry.changedAt) > new Date(existingEntry.changedAt)) {
          stageMap.set(entry.status, entry);
          console.log('Added/updated entry for stage:', entry.status, 'with notes:', entry.notes);
        }
      });
      
      // Get all stages that have been reached (from pipeline history + current status)
      const reachedStages = new Set<string>();
      stageMap.forEach((entry) => reachedStages.add(entry.status));
      if (currentStatus) {
        reachedStages.add(currentStatus);
      }
      
      // Filter pipeline stages to only include those that have been reached
      const reachedPipelineStages = PIPELINE_STAGES.filter(stage => reachedStages.has(stage.id));
      
      console.log('Pipeline stages that have been reached (in sequence):', reachedPipelineStages);
      
      // Create stage history entries following the pipeline sequence
      stageHistoryEntries = reachedPipelineStages.map((stage, index) => {
        const historyEntry = stageMap.get(stage.id);
        const isAutoFilled = historyEntry && historyEntry.notes && historyEntry.notes.includes('Auto-filled stage:');
        
        console.log(`Creating stage history entry for ${stage.id}:`, {
          historyEntry: historyEntry,
          hasNotes: historyEntry?.notes ? 'YES' : 'NO',
          notes: historyEntry?.notes
        });
        
        // Use the notes from the backend if available, otherwise use default text
        let executiveNotes = 'Stage reached';
        if (historyEntry && historyEntry.notes) {
          executiveNotes = historyEntry.notes;
          console.log(`Using backend notes for ${stage.id}: "${executiveNotes}"`);
        } else if (stage.id === currentStatus) {
          executiveNotes = 'Current status';
          console.log(`Using default "Current status" for ${stage.id}`);
        } else {
          console.log(`Using default "Stage reached" for ${stage.id}`);
        }
        
        const stageEntry = {
          id: `stage_${stage.id}_${index}`,
          stageId: stage.id,
          stageName: stage.name,
          timestamp: historyEntry ? new Date(historyEntry.changedAt) : new Date(),
          previousStage: index > 0 ? reachedPipelineStages[index - 1].id : undefined,
          executiveNotes: executiveNotes,
          isEditable: true,
          isAutoFilled: isAutoFilled
        };
        
        console.log(`Final stage entry for ${stage.id}:`, stageEntry);
        return stageEntry;
      });
      
    } else if (currentStatus) {
      // No pipeline history, create initial entry for current status
      const currentStage = PIPELINE_STAGES.find(s => s.id === currentStatus);
      if (currentStage) {
        console.log('Creating initial stage history entry for:', currentStatus);
        stageHistoryEntries = [{
          id: `stage_${currentStatus}_0`,
          stageId: currentStatus,
          stageName: currentStage.name,
          timestamp: new Date(),
          previousStage: undefined,
          executiveNotes: 'Initial status',
          isEditable: true
        }];
      }
    }
    
    console.log('Final stage history - FOLLOWS PIPELINE SEQUENCE:', stageHistoryEntries);
    return stageHistoryEntries;
  }, [pipelineHistoryKey]);

  // Update stage history when processed data changes
  const prevProcessedHistoryRef = useRef<StageHistory[]>([]);
  
  useEffect(() => {
    // Only update if the processed history actually changed
    const hasChanged = JSON.stringify(processedStageHistory) !== JSON.stringify(prevProcessedHistoryRef.current);
    
    if (hasChanged) {
      console.log('Stage history changed, updating state');
      console.log('Processed stage history:', processedStageHistory);
      
      // Use the processed history directly - it already contains the backend notes
      setStageHistory(processedStageHistory);
      prevProcessedHistoryRef.current = processedStageHistory;
    }
  }, [processedStageHistory]);

  const handleStageChange = useCallback((newStatus: string) => {
    console.log('Stage change requested:', newStatus);
    
    if (readOnly) {
      return; // Don't allow changes in read-only mode
    }
    
    // Store the pending stage change and show the notes modal
    setPendingStageChange(newStatus);
    setMandatoryNotes('');
    setShowNotesModal(true);
  }, [readOnly]);

  const startEditingNotes = useCallback((entryId: string, currentNotes: string) => {
    setEditingNotes(entryId);
    setEditNotesText(currentNotes || '');
  }, []);

  const saveEditedNotes = useCallback((entryId: string) => {
    const trimmedNotes = editNotesText.trim();
    
    // Find the entry to get the stageId
    const entry = stageHistory.find(e => e.id === entryId);
    if (entry) {
      // Update the local state immediately for better UX
      setStageHistory(prev => 
        prev.map(entry => 
          entry.id === entryId 
            ? { ...entry, executiveNotes: trimmedNotes || undefined }
            : entry
        )
      );
      
      // TODO: In the future, you might want to save edited notes to the backend
      // For now, we'll just update the local state
      console.log('Notes edited locally:', { stageId: entry.stageId, notes: trimmedNotes });
    }
    
    setEditingNotes(null);
    setEditNotesText('');
  }, [editNotesText, stageHistory]);

  const cancelEditingNotes = useCallback(() => {
    setEditingNotes(null);
    setEditNotesText('');
  }, []);

  // Functions to handle mandatory notes modal
  const handleConfirmStageChange = useCallback(() => {
    if (!pendingStageChange || !mandatoryNotes.trim()) {
      console.log('Cannot proceed - missing stage or notes:', { pendingStageChange, mandatoryNotes });
      return; // Don't proceed if no stage or empty notes
    }
    
    console.log('🚀 CONFIRMING STAGE CHANGE WITH NOTES:', { 
      newStatus: pendingStageChange, 
      notes: mandatoryNotes.trim(),
      notesLength: mandatoryNotes.trim().length
    });
    
    // Call the onStatusChange callback with the notes - backend will save them
    console.log('📤 Sending to backend via onStatusChange:', pendingStageChange, mandatoryNotes.trim());
    onStatusChange(pendingStageChange, mandatoryNotes.trim());
    
    // Close the modal and reset state
    setShowNotesModal(false);
    setPendingStageChange(null);
    setMandatoryNotes('');
    
    console.log('✅ Modal closed, waiting for backend response...');
  }, [pendingStageChange, mandatoryNotes, onStatusChange]);

  const handleCancelStageChange = useCallback(() => {
    setShowNotesModal(false);
    setPendingStageChange(null);
    setMandatoryNotes('');
  }, []);

  // Sort stage history by timestamp (chronological order)
  const sortedStageHistory = [...stageHistory].sort((a, b) => {
    return a.timestamp.getTime() - b.timestamp.getTime();
  });

  // Debug log sorted stage history
  useEffect(() => {
    console.log('Sorted stage history:', sortedStageHistory);
  }, [sortedStageHistory]);

  const getStageStatus = (stageId: string) => {
    const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === currentStatus);
    const stageIndex = PIPELINE_STAGES.findIndex(s => s.id === stageId);
    
    console.log(`getStageStatus for ${stageId}:`, {
      currentStatus,
      currentIndex,
      stageIndex,
      stageName: PIPELINE_STAGES[stageIndex]?.name
    });
    
    // Handle unqualified status
    if (currentStatus === 'unqualified' && stageId === 'unqualified') {
      return 'current';
    }
    
    if (currentStatus === 'unqualified' && stageId !== 'unqualified') {
      return 'disabled';
    }
    
    if (stageId === 'unqualified' && currentStatus !== 'unqualified') {
      return 'disabled';
    }
    
    // For normal pipeline progression
    if (stageIndex < currentIndex) {
      return 'completed'; // All stages before current should be green
    } else if (stageIndex === currentIndex) {
      return 'current'; // Current stage should be blue/active
    } else {
      return 'pending'; // Future stages should be gray
    }
  };

  const renderStage = (stage: PipelineStage, index: number, isLastStage: boolean = false) => {
    const status = getStageStatus(stage.id);
    const isCurrent = currentStatus === stage.id;
    
    console.log(`Rendering stage ${stage.name} (${stage.id}):`, {
      status,
      isCurrent,
      currentStatus
    });
    
    let statusClass = '';
    let borderClass = '';
    
    switch (status) {
      case 'current':
        statusClass = 'bg-blue-600 text-white shadow-lg transform scale-105';
        borderClass = 'border-2 border-blue-700';
        break;
      case 'completed':
        statusClass = 'bg-green-500 text-white shadow-md';
        borderClass = 'border-2 border-green-600';
        break;
      case 'pending':
        statusClass = 'bg-white text-gray-700 hover:bg-gray-50 transition-colors';
        borderClass = 'border-2 border-gray-300';
        break;
      case 'disabled':
        statusClass = 'bg-gray-200 text-gray-400 cursor-not-allowed';
        borderClass = 'border-2 border-gray-300';
        break;
    }

    const stageClasses = `
      relative px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 
      min-w-[140px] max-w-[160px] text-center ${statusClass} ${borderClass}
      ${stage.isDecision ? 'ring-2 ring-purple-300 ring-offset-2' : ''}
      ${stage.isEnd ? 'opacity-75' : ''}
      ${!stage.isEnd ? 'hover:shadow-lg cursor-pointer' : 'cursor-not-allowed'}
    `;

    return (
      <div key={stage.id} className="flex items-center">
        {/* Stage Box */}
        <button
          className={stageClasses}
          onClick={() => !stage.isEnd && !readOnly && handleStageChange(stage.id)}
          disabled={stage.isEnd || readOnly}
        >
          <div className="font-semibold text-xs leading-tight">{stage.name}</div>
          {isCurrent && (
            <div className="text-xs mt-1 opacity-90 font-medium">Current</div>
          )}
          {stage.isDecision && (
            <div className="text-xs mt-1 opacity-75">Decision Point</div>
          )}
        </button>
        
        {/* Arrow (except for last stage) */}
        {!isLastStage && (
          <div className="mx-3 flex items-center">
            <div className={`w-8 h-0.5 ${
              getStageStatus(stage.id) === 'completed' ? 'bg-green-400' : 'bg-gray-300'
            }`}></div>
            <svg className={`w-4 h-4 ${
              getStageStatus(stage.id) === 'completed' ? 'text-green-400' : 'text-gray-300'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  const renderMainPipeline = () => {
    // Show stages up to feasibility check
    const initialStages = PIPELINE_STAGES.filter(stage => 
      ['enquiry_required', 'contact_initiated', 'feasibility_check'].includes(stage.id)
    );
    
    const isQualifiedPath = ['qualified', 'quotation_sent', 'negotiation_stage', 'converted', 'payment_received', 'sample_received', 'handed_to_smc', 'informed_about_se', 'provided_kyc_quotation_to_smc'].includes(currentStatus);
    const isUnqualifiedPath = currentStatus === 'unqualified';
    
    return (
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-500 rounded-full"></div>
          Initial Pipeline Flow
        </h4>
        <div className="flex items-center justify-start gap-2 overflow-x-auto pb-4">
          {initialStages.map((stage, index) => 
            renderStage(stage, index, false)
          )}
          
          {/* Branching options directly under Feasibility Check */}
          <div className="mx-2 flex items-center">
            <div className={`w-8 h-0.5 ${
              getStageStatus('feasibility_check') === 'completed' ? 'bg-green-400' : 'bg-gray-300'
            }`}></div>
            <svg className={`w-4 h-4 ${
              getStageStatus('feasibility_check') === 'completed' ? 'text-green-400' : 'text-gray-300'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          
          {/* Vertical branching options */}
          <div className="flex flex-col gap-2">
            {/* Qualified Option */}
            <button
              onClick={() => !readOnly && handleStageChange('qualified')}
              disabled={readOnly}
              className={`relative px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-w-[140px] max-w-[160px] text-center ${
                isQualifiedPath 
                  ? 'bg-green-500 text-white shadow-md border-2 border-green-600' 
                  : 'bg-white text-gray-600 border-2 border-gray-300 hover:bg-gray-50'
              } ${readOnly ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
            >
              <div className="font-semibold text-xs leading-tight">Qualified</div>
              {isQualifiedPath && (
                <div className="text-xs mt-1 opacity-90">Current</div>
              )}
            </button>
            
            {/* Unqualified Option */}
            <button
              onClick={() => !readOnly && handleStageChange('unqualified')}
              disabled={readOnly}
              className={`relative px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-w-[140px] max-w-[160px] text-center ${
                isUnqualifiedPath 
                  ? 'bg-gray-500 text-white shadow-md border-2 border-gray-600' 
                  : 'bg-white text-gray-600 border-2 border-gray-300 hover:bg-gray-50'
              } ${readOnly ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
            >
              <div className="font-semibold text-xs leading-tight">Unqualified</div>
              {isUnqualifiedPath && (
                <div className="text-xs mt-1 opacity-90">Current</div>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderQualifiedPipeline = () => {
    // Only show if on qualified path
    const isQualifiedPath = ['qualified', 'quotation_sent', 'negotiation_stage', 'converted', 'payment_received', 'sample_received', 'handed_to_smc', 'informed_about_se', 'provided_kyc_quotation_to_smc'].includes(currentStatus);
    
    if (!isQualifiedPath) return null;
    
    const qualifiedStages = PIPELINE_STAGES.filter(stage => 
      ['qualified', 'quotation_sent', 'negotiation_stage', 'converted', 'payment_received', 'sample_received', 'handed_to_smc', 'informed_about_se', 'provided_kyc_quotation_to_smc'].includes(stage.id)
    );
    
    return (
      <div className="mt-8 mb-8">
        <h4 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
          <div className="w-5 h-5 bg-green-500 rounded-full"></div>
          Qualified Pipeline Flow
        </h4>
        <div className="flex items-center justify-start gap-2 overflow-x-auto pb-4">
          {qualifiedStages.map((stage, index) => 
            renderStage(stage, index, index === qualifiedStages.length - 1)
          )}
        </div>
      </div>
    );
  };

  const renderParallelProcess = () => {
    // Only show if converted or beyond
    const isConvertedOrBeyond = ['converted', 'payment_received', 'sample_received', 'handed_to_smc', 'informed_about_se', 'provided_kyc_quotation_to_smc', 'process_initiated', 'ongoing_process', 'report_generated', 'sent_to_client_via_mail', 'report_hardcopy_sent'].includes(currentStatus);
    
    if (!isConvertedOrBeyond) return null;
    
    const parallelStages = [
      'process_initiated',
      'ongoing_process', 
      'report_generated',
      'sent_to_client_via_mail',
      'report_hardcopy_sent'
    ];
    
    return (
      <div className="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-gray-800">Parallel Process (After Conversion)</h4>
          </div>
          <p className="text-sm text-gray-600">Runs concurrently with the main pipeline stages</p>
          <div className="w-40 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 mx-auto rounded-full mt-2"></div>
        </div>
        
        <div className="flex items-center justify-start gap-2 overflow-x-auto pb-4">
          {parallelStages.map((stageId, index) => {
            const stage = PIPELINE_STAGES.find(s => s.id === stageId);
            if (!stage) return null;
            return renderStage(stage, index, index === parallelStages.length - 1);
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl p-6 border border-gray-200 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-black mb-2">Pipeline Flowchart</h3>
        <p className="text-sm text-black">Click on any stage to update visitor status</p>
        <div className="mt-3 p-2 bg-blue-50 rounded-lg inline-block">
          <span className="text-sm font-medium text-blue-800">Current Status: </span>
          <span className="text-sm font-bold text-blue-900">{currentStatus}</span>
        </div>
      </div>
      
      {/* Initial Pipeline Flow */}
      {renderMainPipeline()}
      
      {/* Qualified Pipeline (only shown if qualified) */}
      {renderQualifiedPipeline()}
      
      {/* Parallel Process (only shown if converted or beyond) */}
      {renderParallelProcess()}
      
      {/* Stage History */}
      <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-black flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded-full"></div>
            Stage History
          </h4>
          <div className="text-sm text-black">
            Total Updates: {stageHistory.length}
          </div>
        </div>
        
        {stageHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-black mb-2">No stage updates yet</p>
            <p className="text-sm text-black">Start by clicking on a stage to update the visitor status</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {sortedStageHistory.map((entry, index) => (
              <div key={entry.id} className={`rounded-lg border shadow-sm hover:shadow-md transition-shadow ${
                entry.isAutoFilled 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="p-4">
                  {/* Header with stage info and status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-black">{entry.stageName}</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            Stage {getPipelineStageOrder(entry.stageId) + 1}
                          </span>
                          {entry.isAutoFilled && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                              Auto-filled
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Transition info */}
                      {entry.previousStage && (
                        <div className="flex items-center gap-2 text-sm text-black mb-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                          </svg>
                          <span>Transitioned from <span className="font-medium">{PIPELINE_STAGES.find(s => s.id === entry.previousStage)?.name || entry.previousStage}</span></span>
                        </div>
                      )}
                    </div>
                    
                    {/* Timestamp */}
                    <div className="text-right">
                      <div className="text-sm font-medium text-black">
                        {entry.timestamp.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="text-xs text-black">
                        {entry.timestamp.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Executive Notes */}
                  {entry.executiveNotes && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="text-sm font-semibold text-blue-800">Executive Notes</span>
                        </div>
                        {!editingNotes && !readOnly && (
                          <button
                            onClick={() => startEditingNotes(entry.id, entry.executiveNotes || '')}
                            className="text-blue-600 hover:text-blue-800 text-xs underline"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      {editingNotes === entry.id ? (
                        <div>
                          <textarea
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 placeholder-gray-500"
                            rows={3}
                            value={editNotesText}
                            onChange={(e) => setEditNotesText(e.target.value)}
                            placeholder="Enter your notes here..."
                          ></textarea>
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => saveEditedNotes(entry.id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditingNotes}
                              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-blue-900 font-medium leading-relaxed">{entry.executiveNotes}</div>
                      )}
                    </div>
                  )}
                  
                  {/* Add Notes Button for stages without notes */}
                  {!entry.executiveNotes && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-black">No notes added yet</span>
                        {!readOnly && (
                          <button
                            onClick={() => startEditingNotes(entry.id, '')}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                          >
                            Add Notes
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Progress indicator */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-black">
                      <span>Stage {getPipelineStageOrder(entry.stageId) + 1} of {PIPELINE_STAGES.length}</span>
                      <span>{Math.round(((getPipelineStageOrder(entry.stageId) + 1) / PIPELINE_STAGES.length) * 100)}% complete</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((getPipelineStageOrder(entry.stageId) + 1) / PIPELINE_STAGES.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span>Current Stage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white border-2 border-gray-300 rounded-full"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 border-2 border-gray-300 rounded-full"></div>
            <span>Disabled</span>
          </div>
        </div>
      </div>

      {/* Mandatory Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add Notes to Proceed</h3>
                <p className="text-sm text-gray-600">Notes are required to move to the next stage</p>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700">Moving to:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {PIPELINE_STAGES.find(s => s.id === pendingStageChange)?.name || pendingStageChange}
                </span>
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="mandatory-notes" className="block text-sm font-medium text-gray-700 mb-2">
                Executive Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                id="mandatory-notes"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
                rows={4}
                value={mandatoryNotes}
                onChange={(e) => setMandatoryNotes(e.target.value)}
                placeholder="Please provide notes about this stage transition..."
                autoFocus
              />
              {!mandatoryNotes.trim() && (
                <p className="text-red-500 text-xs mt-1">Notes are required to proceed</p>
              )}
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelStageChange}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStageChange}
                disabled={!mandatoryNotes.trim()}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  mandatoryNotes.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Proceed to Stage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}