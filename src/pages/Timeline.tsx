import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import {
  WorkspaceHeader,
  TerminalPanel,
  TerminalButton,
  StatusBadge,
} from '../components/TerminalComponents';
import { Clock, Plus, Filter, Calendar } from 'lucide-react';

export default function Timeline() {
  const { caseId } = useParams<{ caseId: string }>();
  const queryClient = useQueryClient();
  const [eventType, setEventType] = useState('');
  const [entityLabel, setEntityLabel] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [source, setSource] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    event_type: 'observation',
    label: '',
    start_time: '',
    time_precision: 'full',
    details: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['timeline', caseId, eventType, entityLabel, dateFrom, dateTo, source],
    queryFn: () => api.getTimeline(caseId!, {
      event_type: eventType || undefined,
      entity_label: entityLabel || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      source: source || undefined,
      page_size: 100,
    }),
    enabled: !!caseId,
  });
  const events = data?.items || [];

  const manualMutation = useMutation({
    mutationFn: () => api.createManualEvent(caseId!, {
      event_type: manualForm.event_type,
      label: manualForm.label,
      start_time: manualForm.start_time ? new Date(manualForm.start_time).toISOString() : undefined,
      time_precision: manualForm.start_time ? manualForm.time_precision : 'unknown',
      details: manualForm.details ? { text: manualForm.details } : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', caseId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-summary', caseId] });
      setShowManual(false);
      setManualForm({ event_type: 'observation', label: '', start_time: '', time_precision: 'full', details: '' });
    },
  });

  const typeStyles: Record<string, { dot: string; badge: string }> = {
    call: { dot: 'bg-[#34D399] border-[#34D399]', badge: 'text-[#34D399]' },
    message: { dot: 'bg-[#FFBA42] border-[#FFBA42]', badge: 'text-[#FFBA42]' },
    transaction: { dot: 'bg-[#FF9E1B] border-[#FF9E1B]', badge: 'text-[#FF9E1B]' },
    device_event: { dot: 'bg-[#F59E0B] border-[#F59E0B]', badge: 'text-[#F59E0B]' },
    observation: { dot: 'bg-[#A6732E] border-[#FFE7B8]', badge: 'text-[#FFE7B8]' },
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-mono text-[#FFBA42]">
      <WorkspaceHeader
        code="CHRONOLOGY // 05"
        title="FORENSIC TIMELINE & EVENT SEQUENCER"
        description="Unified chronological ledger of telecommunication events, cell pings, and investigator observations."
      >
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#A6732E]">
            {data?.total || 0} TOTAL EVENTS
          </span>
          <TerminalButton
            variant={showManual ? 'secondary' : 'primary'}
            onClick={() => setShowManual(v => !v)}
          >
            {showManual ? '[ CANCEL ]' : '+ LOG MANUAL EVENT'}
          </TerminalButton>
        </div>
      </WorkspaceHeader>

      {/* Manual Entry Form */}
      {showManual && (
        <TerminalPanel
          title="LOG INVESTIGATOR OBSERVATION"
          action={
            <span className="text-[10px] text-[#FF9E1B]">
              MANUAL ATTESTATION (NON-RAW)
            </span>
          }
        >
          <div className="space-y-4 text-xs">
            <p className="text-[#A6732E]">
              Manual entries are flagged as investigator-logged events and are segregated from telecommunication raw evidence.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#A6732E] block mb-1">EVENT TYPE</label>
                <select
                  value={manualForm.event_type}
                  onChange={e => setManualForm({ ...manualForm, event_type: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#14110C] border border-[#3D2A12] text-xs text-[#FFE7B8] rounded-xs focus:border-[#FF9E1B] focus:outline-none"
                >
                  <option value="observation">Physical Observation / Surveillance</option>
                  <option value="call">Intercepted / Witnessed Call</option>
                  <option value="message">Transcribed Message</option>
                  <option value="transaction">Cash / Hawala Transaction</option>
                  <option value="device_event">Hardware Handover</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#A6732E] block mb-1">TIMESTAMP (LOCAL)</label>
                <input
                  type="datetime-local"
                  value={manualForm.start_time}
                  onChange={e => setManualForm({ ...manualForm, start_time: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#14110C] border border-[#3D2A12] text-xs text-[#FFE7B8] rounded-xs focus:border-[#FF9E1B] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#A6732E] block mb-1">DESCRIPTION / SUMMARY LABEL</label>
              <input
                value={manualForm.label}
                onChange={e => setManualForm({ ...manualForm, label: e.target.value })}
                placeholder="e.g. Suspect observed meeting secondary courier at Sector 14"
                className="w-full px-3 py-1.5 bg-[#14110C] border border-[#3D2A12] text-xs text-[#FFE7B8] placeholder-[#7A521D] rounded-xs focus:border-[#FF9E1B] outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#A6732E] block mb-1">FORENSIC FIELD NOTES</label>
              <textarea
                value={manualForm.details}
                onChange={e => setManualForm({ ...manualForm, details: e.target.value })}
                placeholder="Additional contextual details, license plates, physical descriptions..."
                className="w-full px-3 py-1.5 bg-[#14110C] border border-[#3D2A12] text-xs text-[#FFE7B8] placeholder-[#7A521D] rounded-xs focus:border-[#FF9E1B] outline-none"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <TerminalButton
                variant="secondary"
                onClick={() => setShowManual(false)}
              >
                CANCEL
              </TerminalButton>
              <TerminalButton
                variant="primary"
                onClick={() => manualMutation.mutate()}
                disabled={!manualForm.label || manualMutation.isPending}
              >
                {manualMutation.isPending ? '[ ATTESTING EVENT... ]' : 'COMMIT TO CHRONOLOGY'}
              </TerminalButton>
            </div>
          </div>
        </TerminalPanel>
      )}

      {/* Filter Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 bg-[#0D0B08] border border-[#3D2A12] p-2.5 rounded-xs text-xs">
        <select
          value={eventType}
          onChange={e => setEventType(e.target.value)}
          className="px-2 py-1.5 bg-[#14110C] border border-[#3D2A12] text-xs text-[#FFE7B8] rounded-xs focus:border-[#FF9E1B] focus:outline-none"
        >
          <option value="">ALL EVENT CLASSES</option>
          <option value="call">CALLS</option>
          <option value="message">MESSAGES</option>
          <option value="transaction">TRANSACTIONS</option>
          <option value="device_event">DEVICE EVENTS</option>
          <option value="observation">OBSERVATIONS</option>
        </select>

        <input
          type="text"
          value={entityLabel}
          onChange={e => setEntityLabel(e.target.value)}
          placeholder="FILTER ENTITY..."
          className="px-2 py-1.5 bg-[#14110C] border border-[#3D2A12] text-xs text-[#FFE7B8] placeholder-[#7A521D] rounded-xs outline-none focus:border-[#FF9E1B]"
        />

        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="px-2 py-1.5 bg-[#14110C] border border-[#3D2A12] text-xs text-[#FFE7B8] rounded-xs focus:border-[#FF9E1B] focus:outline-none"
        />

        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="px-2 py-1.5 bg-[#14110C] border border-[#3D2A12] text-xs text-[#FFE7B8] rounded-xs focus:border-[#FF9E1B] focus:outline-none"
        />

        <input
          type="text"
          value={source}
          onChange={e => setSource(e.target.value)}
          placeholder="SOURCE TYPE..."
          className="px-2 py-1.5 bg-[#14110C] border border-[#3D2A12] text-xs text-[#FFE7B8] placeholder-[#7A521D] rounded-xs outline-none focus:border-[#FF9E1B]"
        />
      </div>

      {/* Chronological Stream */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-[#FF9E1B]">
          [ RETRIEVING CASE CHRONOLOGY... ]
        </div>
      ) : events.length > 0 ? (
        <div className="relative pl-6 sm:pl-8 space-y-4">
          {/* Central Line */}
          <div className="absolute left-2.5 sm:left-3 top-2 bottom-2 w-0.5 bg-[#3D2A12]" />

          {events.map((ev: any) => {
            const style = typeStyles[ev.event_type] || { dot: 'bg-[#A6732E] border-[#3D2A12]', badge: 'text-[#A6732E]' };
            return (
              <div key={ev.id} className="relative flex items-start gap-4">
                {/* Timeline Node Marker */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-3.5 w-2.5 h-2.5 rounded-full border-2 ${style.dot} bg-[#0D0B08] z-10 shadow-[0_0_8px_rgba(255,158,27,0.4)]`}
                />

                {/* Event Card */}
                <div className="flex-1 bg-[#0D0B08] border border-[#3D2A12] hover:border-[#FF9E1B] p-4 rounded-xs transition-colors space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3D2A12]/60 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold text-xs uppercase ${style.badge}`}>
                        [{ev.event_type?.replace('_', ' ')}]
                      </span>
                      <span className="text-xs text-[#FFE7B8] font-bold">
                        {ev.label || ev.event_type}
                      </span>
                      {ev.is_manual && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-xs bg-[#FF9E1B]/10 border border-[#FF9E1B]/40 text-[#FF9E1B] uppercase">
                          MANUAL
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-[#A6732E]">
                      {ev.start_time ? new Date(ev.start_time).toLocaleString() : 'UNDATED'}
                      {ev.time_precision === 'unknown' && ev.start_time ? ' (APPROX)' : ''}
                    </div>
                  </div>

                  {/* Participants */}
                  {ev.participants?.length > 0 && (
                    <div className="text-xs text-[#FFBA42] flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-[#A6732E]">ACTORS:</span>
                      {ev.participants.map((p: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-[#14110C] border border-[#3D2A12] text-[10px] text-[#FF9E1B] rounded-xs"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#A6732E] pt-1">
                    {ev.location && (
                      <span className="flex items-center gap-1 text-[#EF4444]">
                        📍 {ev.location}
                      </span>
                    )}
                    {ev.source_type && (
                      <span>
                        SRC: <span className="text-[#FFE7B8]">{ev.source_type}</span>
                      </span>
                    )}
                    {ev.details?.amount && (
                      <span className="text-[#FF9E1B] font-bold">
                        ₹{ev.details.amount.toLocaleString()} ({ev.details.currency || 'INR'})
                      </span>
                    )}
                  </div>

                  {ev.details?.text && (
                    <div className="text-xs text-[#FFE7B8]/90 italic bg-[#14110C] border-l-2 border-[#FF9E1B] p-2 rounded-r-xs">
                      "{ev.details.text}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-[#A6732E] border border-dashed border-[#3D2A12] rounded-xs bg-[#0D0B08]">
          NO EVENTS MATCHING ACTIVE CHRONOLOGICAL SCOPE.
        </div>
      )}
    </div>
  );
}
