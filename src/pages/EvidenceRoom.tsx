import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { api } from '../lib/api';
import {
  WorkspaceHeader,
  TerminalPanel,
  TerminalButton,
  StatusBadge,
  MetricCell,
} from '../components/TerminalComponents';
import { FileUp, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function EvidenceRoom() {
  const { caseId } = useParams<{ caseId: string }>();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState('csv');
  const [importingId, setImportingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [detailFile, setDetailFile] = useState<any>(null);
  const [showExtracted, setShowExtracted] = useState(false);

  const { data: files } = useQuery({
    queryKey: ['files', caseId],
    queryFn: () => api.getFiles(caseId!),
    enabled: !!caseId,
  });

  const { data: imports } = useQuery({
    queryKey: ['imports', caseId],
    queryFn: () => api.getImports(caseId!),
    enabled: !!caseId,
  });

  const { data: detail } = useQuery({
    queryKey: ['evidence-detail', caseId, detailFile?.id],
    queryFn: () => api.getEvidenceDetail(caseId!, detailFile!.id),
    enabled: !!caseId && !!detailFile?.id,
  });

  const retryMutation = useMutation({
    mutationFn: () => api.retryExtract(caseId!, detailFile!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence-detail', caseId] });
      queryClient.invalidateQueries({ queryKey: ['files', caseId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-summary', caseId] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !caseId) return;
      return api.uploadEvidence(caseId, selectedFile, sourceType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', caseId] });
      setSelectedFile(null);
      setUploading(false);
      setUploadError(null);
    },
    onError: (err: any) => {
      setUploading(false);
      setUploadError(err?.response?.data?.detail || err?.message || 'Upload failed');
    },
  });

  const importMutation = useMutation({
    mutationFn: async (fileId: string) => {
      setImportingId(fileId);
      setImportError(null);
      return api.importEvidence(caseId!, fileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imports', caseId] });
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['files', caseId] });
      setImportingId(null);
      setImportError(null);
    },
    onError: (err: any) => {
      setImportingId(null);
      setImportError(err?.response?.data?.detail || err?.message || 'Import failed');
    },
  });

  const handleUpload = () => {
    setUploading(true);
    setUploadError(null);
    uploadMutation.mutate();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-mono text-[#FFBA42]">
      <WorkspaceHeader
        code="INTAKE // 02"
        title="FORENSIC EVIDENCE VAULT"
        description="Ingest, cryptographic SHA-256 verify, and parse telecommunication records and intelligence files."
      />

      {uploadError && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444] rounded-xs p-3 text-xs text-[#EF4444] flex items-start gap-2">
          <span>⚠</span>
          <div>
            <span className="font-bold">[INGESTION FAULT]:</span> {uploadError}
          </div>
        </div>
      )}

      {importError && (
        <div className="bg-[#FF9E1B]/10 border border-[#FF9E1B] rounded-xs p-3 text-xs text-[#FF9E1B] flex items-start gap-2">
          <span>⚠</span>
          <div>
            <span className="font-bold">[IMPORT CONFLICT]:</span> {importError}
          </div>
        </div>
      )}

      {/* Ingestion Console */}
      <TerminalPanel title="INGEST FORENSIC EVIDENCE ARTIFACT" variant="raised">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <select
            value={sourceType}
            onChange={e => setSourceType(e.target.value)}
            className="px-3 py-1.5 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none"
          >
            <option value="csv">CSV (CDR / Call Records / Financial Ledger)</option>
            <option value="json">JSON (Device Extraction / WhatsApp / Signal)</option>
            <option value="txt">TXT (Field Interrogation / Surveillance Notes)</option>
            <option value="pdf">PDF (Official Subpoena / Lab Reports)</option>
          </select>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,.txt,.pdf"
            onChange={e => {
              setSelectedFile(e.target.files?.[0] || null);
              setUploadError(null);
            }}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 border border-[#3D2A12] bg-[#14110C] hover:border-[#FF9E1B] text-xs text-[#FFE7B8] rounded-xs flex items-center gap-2 transition-colors"
          >
            <FileUp className="w-3.5 h-3.5 text-[#FF9E1B]" />
            <span className="truncate max-w-[220px]">
              {selectedFile ? selectedFile.name : '[ SELECT LOCAL ARTIFACT ]'}
            </span>
          </button>

          <TerminalButton
            variant="primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'INGESTING...' : '[ TRANSMIT & VERIFY ]'}
          </TerminalButton>
        </div>
        <div className="text-[10px] text-[#A6732E] mt-2 flex items-center gap-3">
          <span>SUPPORTED: CSV, JSON, TXT, PDF</span>
          <span>//</span>
          <span>MAX 50MB</span>
          <span>//</span>
          <span>AUTOMATIC SHA-256 DEDUPLICATION</span>
        </div>
      </TerminalPanel>

      {/* Ingested Files Registry */}
      <TerminalPanel title="INGESTED FORENSIC ARTIFACTS REGISTRY">
        {files && files.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#3D2A12] text-[#A6732E] uppercase text-[10px] tracking-wider bg-[#14110C]">
                  <th className="py-2.5 px-3">FILENAME</th>
                  <th className="py-2.5 px-3">FORMAT</th>
                  <th className="py-2.5 px-3">SIZE</th>
                  <th className="py-2.5 px-3">SHA-256 DIGEST</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3D2A12]/40">
                {files.map((f: any) => (
                  <tr
                    key={f.id}
                    className="hover:bg-[#14110C] transition-colors cursor-pointer group"
                    onClick={() => setDetailFile(f)}
                  >
                    <td className="py-2.5 px-3 font-semibold text-[#FFE7B8] group-hover:text-[#FF9E1B]">
                      {f.original_filename}
                    </td>
                    <td className="py-2.5 px-3 text-[#A6732E] uppercase">{f.source_type}</td>
                    <td className="py-2.5 px-3 text-[#A6732E]">
                      {(f.byte_size / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-2.5 px-3 text-[#7A521D] font-mono text-[11px]">
                      {f.sha256?.substring(0, 16)}...
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={f.status} />
                    </td>
                    <td
                      className="py-2.5 px-3 text-right"
                      onClick={e => e.stopPropagation()}
                    >
                      {f.status === 'uploaded' && (
                        <TerminalButton
                          size="xs"
                          variant="primary"
                          onClick={() => importMutation.mutate(f.id)}
                          disabled={importingId === f.id}
                        >
                          {importingId === f.id ? 'EXTRACTING...' : '[ PARSE & IMPORT ]'}
                        </TerminalButton>
                      )}
                      {f.status === 'imported' && (
                        <span className="text-[10px] text-[#34D399]">
                          ✓ {f.accepted_count} RECORDS
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-[#A6732E] text-xs">
            NO FORENSIC EVIDENCE FILES UPLOADED YET.
          </div>
        )}
      </TerminalPanel>

      {/* Import Run History */}
      <TerminalPanel title="INGESTION & PARSING PIPELINE HISTORY">
        {imports && imports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#3D2A12] text-[#A6732E] uppercase text-[10px] tracking-wider bg-[#14110C]">
                  <th className="py-2 px-3">RUN STATUS</th>
                  <th className="py-2 px-3">ACCEPTED RECORDS</th>
                  <th className="py-2 px-3">REJECTED ANOMALIES</th>
                  <th className="py-2 px-3 text-right">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3D2A12]/40">
                {imports.map((imp: any) => (
                  <tr key={imp.id} className="hover:bg-[#14110C]">
                    <td className="py-2 px-3">
                      <StatusBadge status={imp.status} />
                    </td>
                    <td className="py-2 px-3 text-[#34D399] font-bold">
                      {imp.accepted_count}
                    </td>
                    <td className="py-2 px-3 text-[#EF4444] font-bold">
                      {imp.rejected_count}
                    </td>
                    <td className="py-2 px-3 text-right text-[#A6732E]">
                      {new Date(imp.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-[#A6732E] text-xs">
            NO IMPORT HISTORY RECORDED.
          </div>
        )}
      </TerminalPanel>

      {/* Evidence Detail Modal */}
      {detailFile && detail && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setDetailFile(null)}
        >
          <div
            className="border border-[#FF9E1B] bg-[#0D0B08] rounded-xs max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl relative amber-box-glow"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#3D2A12] pb-3">
              <div>
                <div className="text-sm font-bold text-[#FFBA42] flex items-center gap-2">
                  <span className="text-[#FF9E1B]">ARTIFACT //</span>
                  <span>{detail.original_filename}</span>
                </div>
                <div className="text-[10px] text-[#A6732E] mt-1 space-x-2">
                  <span className="font-mono text-[#7A521D]">
                    SHA: {detail.sha256}
                  </span>
                  <span>·</span>
                  <span className="uppercase">{detail.source_type}</span>
                  <span>·</span>
                  <span>{(detail.byte_size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
              <button
                onClick={() => setDetailFile(null)}
                className="text-xs text-[#A6732E] hover:text-[#FFBA42] px-2 py-1 border border-[#3D2A12]"
              >
                [ ESC ]
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCell
                label="PARSED"
                value={detail.record_count ?? 0}
                sublabel="Raw items"
              />
              <MetricCell
                label="ACCEPTED"
                value={detail.accepted_count ?? 0}
                sublabel="Valid records"
              />
              <MetricCell
                label="REJECTED"
                value={detail.rejected_count ?? 0}
                sublabel="Anomalies"
                alert={detail.rejected_count > 0}
              />
              <MetricCell
                label="DERIVED"
                value={detail.derived_links?.event_count ?? 0}
                sublabel="Timeline events"
              />
            </div>

            {/* Error state */}
            {(detail.extraction_error || detail.status === 'failed') && (
              <div className="bg-[#EF4444]/10 border border-[#EF4444] rounded-xs p-3 text-xs text-[#EF4444]">
                <div className="font-bold mb-1">[EXTRACTION ANOMALY DETECTED]</div>
                <div className="text-[11px]">
                  {detail.extraction_error || 'Text extraction could not process this document.'}
                </div>
                {detail.retry_count > 0 && (
                  <div className="text-[10px] mt-1 text-[#A6732E]">
                    Prior Retries: {detail.retry_count}
                  </div>
                )}
                <div className="mt-2">
                  <TerminalButton
                    variant="danger"
                    size="xs"
                    onClick={() => retryMutation.mutate()}
                    disabled={retryMutation.isPending}
                  >
                    {retryMutation.isPending ? 'RETRYING...' : '[ FORCE EXTRACTION RETRY ]'}
                  </TerminalButton>
                </div>
              </div>
            )}

            {/* Extracted text inspection */}
            {detail.extracted_text && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-[#A6732E]">
                    FORENSIC TEXT CONTENT ({detail.extracted_text.length.toLocaleString()} CHARS)
                  </span>
                  <TerminalButton
                    size="xs"
                    onClick={() => setShowExtracted(!showExtracted)}
                  >
                    {showExtracted ? 'HIDE TEXT' : 'INSPECT TEXT'}
                  </TerminalButton>
                </div>
                {showExtracted && (
                  <pre className="p-3 bg-[#14110C] border border-[#3D2A12] rounded-xs text-[11px] whitespace-pre-wrap max-h-64 overflow-y-auto text-[#FFBA42] font-mono leading-relaxed">
                    {detail.extracted_text}
                  </pre>
                )}
              </div>
            )}

            {/* Import history within modal */}
            {detail.import_history?.length > 0 && (
              <div>
                <div className="text-[10px] uppercase text-[#A6732E] mb-1.5">
                  AUDIT LOG // EXTRACTION HISTORY
                </div>
                <div className="space-y-1">
                  {detail.import_history.map((i: any) => (
                    <div
                      key={i.id}
                      className="flex items-center justify-between text-xs bg-[#14110C] border border-[#3D2A12]/50 p-2 rounded-xs"
                    >
                      <StatusBadge status={i.status} />
                      <span className="text-[#A6732E] text-[10px]">
                        {i.accepted_count} accepted · {i.rejected_count} rejected
                      </span>
                      <span className="text-[#7A521D] text-[10px]">
                        {i.created_at ? new Date(i.created_at).toLocaleString() : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <TerminalButton onClick={() => setDetailFile(null)}>
                [ CLOSE DOSSIER ]
              </TerminalButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
