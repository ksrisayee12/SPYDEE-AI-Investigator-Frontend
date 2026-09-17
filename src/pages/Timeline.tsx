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
    call: { dot: 'bg-[#9FE3B1] border-[#9FE3B1]', badge: 'text-[#9FE3B1]' },
    message: { dot: 'bg-[#2DD4BF] border-[#2DD4BF]', badge: 'text-[#2DD4BF]' },
    transaction: { dot: 'bg-[#FFB84D] border-[#FFB84D]', badge: 'text-[#FFB84D]' },
    device_event: { dot: 'bg-[#A78BFA] border-[#A78BFA]', badge: 'text-[#A78BFA]' },
    observation: { dot: 'bg-[#6F887A] border-[#D8E5DC]', badge: 'text-[#D8E5DC]' },
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-mono text-[#D8E5DC]">
      <WorkspaceHeader
        code="CHRONOLOGY // 05"
        title="FORENSIC TIMELINE & EVENT SEQUENCER"
        description="Unified chronological ledger of telecommunication events, cell pings, and investigator observations."
      >
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#6F887A]">
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
            <span className="text-[10px] text-[#FFB84D]">
              MANUAL ATTESTATION (NON-RAW)
            </span>
          }
        >
          <div className="space-y-4 text-xs">
            <p className="text-[#6F887A]">
              Manual entries are flagged as investigator-logged events and are segregated from telecommunication raw evidence.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#6F887A] block mb-1">EVENT TYPE</label>
                <select
                  value={manualForm.event_type}
                  onChange={e => setManualForm({ ...manualForm, event_type: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#07100D] border border-[#27453A] text-xs text-[#D8E5DC] rounded-xs"
                >
                  <option value="observation">Physical Observation / Surveillance</option>
                  <option value="call">Intercepted / Witnessed Call</option>
                  <option value="message">Transcribed Message</option>
                  <option value="transaction">Cash / Hawala Transaction</option>
                  <option value="device_event">Hardware Handover</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#6F887A] block mb-1">TIMESTAMP (LOCAL)</label>
                <input
                  type="datetime-local"
                  value={manualForm.start_time}
                  onChange={e => setManualForm({ ...manualForm, start_time: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#07100D] border border-[#27453A] text-xs text-[#D8E5DC] rounded-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#6F887A] block mb-1">DESCRIPTION / SUMMARY LABEL</label>
              <input
                value={manualForm.label}
                onChange={e => setManualForm({ ...manualForm, label: e.target.value })}
                placeholder="e.g. Suspect observed meeting secondary courier at Sector 14"
                className="w-full px-3 py-1.5 bg-[#07100D] border border-[#27453A] text-xs text-[#D8E5DC] placeholder-[#6F887A] rounded-xs focus:border-[#FFB84D] outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#6F887A] block mb-1">FORENSIC FIELD NOTES</label>
              <textarea
                value={manualForm.details}
                onChange={e => setManualForm({ ...manualForm, details: e.target.value })}
                placeholder="Additional contextual details, license plates, physical descriptions..."
                className="w-full px-3 py-1.5 bg-[#07100D] border border-[#27453A] text-xs text-[#D8E5DC] placeholder-[#6F887A] rounded-xs focus:border-[#FFB84D] outline-none"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 bg-[#0B1713] border border-[#27453A] p-2.5 rounded-sm text-xs">
        <select
          value={eventType}
          onChange={e => setEventType(e.target.value)}
          className="px-2 py-1.5 bg-[#07100D] border border-[#27453A] text-xs text-[#D8E5DC] rounded-xs"
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
          className="px-2 py-1.5 bg-[#07100D] border border-[#27453A] text-xs text-[#D8E5DC] placeholder-[#6F887A] rounded-xs outline-none focus:border-[#FFB84D]"
        />

        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="px-2 py-1.5 bg-[#07100D] border border-[#27453A] text-xs text-[#D8E5DC] rounded-xs"
        />

        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="px-2 py-1.5 bg-[#07100D] border border-[#27453A] text-xs text-[#D8E5DC] rounded-xs"
        />

        <input
          type="text"
          value={source}
          onChange={e => setSource(e.target.value)}
          placeholder="SOURCE TYPE..."
          className="px-2 py-1.5 bg-[#07100D] border border-[#27453A] text-xs text-[#D8E5DC] placeholder-[#6F887A] rounded-xs outline-none focus:border-[#FFB84D]"
        />
      </div>

      {/* Chronological Stream */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-[#FFB84D]">
          [ RETRIEVING CASE CHRONOLOGY... ]
        </div>
      ) : events.length > 0 ? (
        <div className="relative pl-6 sm:pl-8 space-y-4">
          {/* Central Line */}
          <div className="absolute left-2.5 sm:left-3 top-2 bottom-2 w-0.5 bg-[#27453A]" />

          {events.map((ev: any) => {
            const style = typeStyles[ev.event_type] || { dot: 'bg-[#6F887A] border-[#27453A]', badge: 'text-[#6F887A]' };
            return (
              <div key={ev.id} className="relative flex items-start gap-4">
                {/* Timeline Node Marker */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-3.5 w-2.5 h-2.5 rounded-full border-2 ${style.dot} bg-[#07100D] z-10`}
                />

                {/* Event Card */}
                <div className="flex-1 bg-[#0B1713] border border-[#27453A] hover:border-[#FFB84D]/40 p-4 rounded-sm transition-colors space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#27453A]/60 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold text-xs uppercase ${style.badge}`}>
                        [{ev.event_type?.replace('_', ' ')}]
                      </span>
                      <span className="text-xs text-[#D8E5DC] font-bold">
                        {ev.label || ev.event_type}
                      </span>
                      {ev.is_manual && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-xs bg-[#FFB84D]/10 border border-[#FFB84D]/40 text-[#FFB84D] uppercase">
                          MANUAL
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-[#6F887A]">
                      {ev.start_time ? new Date(ev.start_time).toLocaleString() : 'UNDATED'}
                      {ev.time_precision === 'unknown' && ev.start_time ? ' (APPROX)' : ''}
                    </div>
                  </div>

                  {/* Participants */}
                  {ev.participants?.length > 0 && (
                    <div className="text-xs text-[#D8E5DC] flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-[#6F887A]">ACTORS:</span>
                      {ev.participants.map((p: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-[#07100D] border border-[#27453A] text-[10px] text-[#9FE3B1] rounded-xs"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6F887A] pt-1">
                    {ev.location && (
                      <span className="flex items-center gap-1 text-[#E05A52]">
                        📍 {ev.location}
                      </span>
                    )}
                    {ev.source_type && (
                      <span>
                        SRC: <span className="text-[#D8E5DC]">{ev.source_type}</span>
                      </span>
                    )}
                    {ev.details?.amount && (
                      <span className="text-[#FFB84D] font-bold">
                        ₹{ev.details.amount.toLocaleString()} ({ev.details.currency || 'INR'})
                      </span>
                    )}
                  </div>

                  {ev.details?.text && (
                    <div className="text-xs text-[#D8E5DC]/90 italic bg-[#07100D] border-l-2 border-[#FFB84D] p-2 rounded-r-xs">
                      "{ev.details.text}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-[#6F887A] border border-dashed border-[#27453A] rounded-sm bg-[#07100D]">
          NO EVENTS MATCHING ACTIVE CHRONOLOGICAL SCOPE.
        </div>
      )}
    </div>
  );
}