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
    <div className="max-w-6xl mx-auto space-y-6 font-mono text-[#D8E5DC]">
      <WorkspaceHeader
        code="INTAKE // 02"
        title="FORENSIC EVIDENCE VAULT"
        description="Ingest, cryptographic SHA-256 verify, and parse telecommunication records and intelligence files."
      />

      {uploadError && (
        <div className="bg-[#E05A52]/10 border border-[#E05A52] rounded-sm p-3 text-xs text-[#E05A52] flex items-start gap-2">
          <span>⚠</span>
          <div>
            <span className="font-bold">[INGESTION FAULT]:</span> {uploadError}
          </div>
        </div>
      )}

      {importError && (
        <div className="bg-[#FFB84D]/10 border border-[#FFB84D] rounded-sm p-3 text-xs text-[#FFB84D] flex items-start gap-2">
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
            className="px-3 py-1.5 bg-[#0B1713] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
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
            className="px-3 py-1.5 border border-[#27453A] bg-[#0F1D18] hover:border-[#628C73] text-xs text-[#D8E5DC] rounded-sm flex items-center gap-2"
          >
            <span>📁</span>
            <span className="truncate max-w-[220px]">
              {selectedFile ? selectedFile.name : '[ SELECT LOCAL FILE ]'}
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
        <div className="text-[10px] text-[#6F887A] mt-2 flex items-center gap-3">
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
                <tr className="border-b border-[#27453A] text-[#6F887A] uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">FILENAME</th>
                  <th className="py-2.5 px-3">FORMAT</th>
                  <th className="py-2.5 px-3">SIZE</th>
                  <th className="py-2.5 px-3">SHA-256 DIGEST</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27453A]/40">
                {files.map((f: any) => (
                  <tr
                    key={f.id}
                    className="hover:bg-[#0F1D18] transition-colors cursor-pointer group"
                    onClick={() => setDetailFile(f)}
                  >
                    <td className="py-2.5 px-3 font-semibold text-[#D8E5DC] group-hover:text-[#FFB84D]">
                      {f.original_filename}
                    </td>
                    <td className="py-2.5 px-3 text-[#6F887A] uppercase">{f.source_type}</td>
                    <td className="py-2.5 px-3 text-[#6F887A]">
                      {(f.byte_size / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-2.5 px-3 text-[#3C6653] font-mono text-[11px]">
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
                        <span className="text-[10px] text-[#9FE3B1]">
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
          <div className="text-center py-12 text-[#6F887A] text-xs">
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
                <tr className="border-b border-[#27453A] text-[#6F887A] uppercase text-[10px] tracking-wider">
                  <th className="py-2 px-3">RUN STATUS</th>
                  <th className="py-2 px-3">ACCEPTED RECORDS</th>
                  <th className="py-2 px-3">REJECTED ANOMALIES</th>
                  <th className="py-2 px-3 text-right">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27453A]/40">
                {imports.map((imp: any) => (
                  <tr key={imp.id} className="hover:bg-[#0F1D18]">
                    <td className="py-2 px-3">
                      <StatusBadge status={imp.status} />
                    </td>
                    <td className="py-2 px-3 text-[#9FE3B1] font-bold">
                      {imp.accepted_count}
                    </td>
                    <td className="py-2 px-3 text-[#E05A52] font-bold">
                      {imp.rejected_count}
                    </td>
                    <td className="py-2 px-3 text-right text-[#6F887A]">
                      {new Date(imp.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-[#6F887A] text-xs">
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
            className="border border-[#27453A] bg-[#07100D] rounded-sm max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#27453A] pb-3">
              <div>
                <div className="text-sm font-bold text-[#D8E5DC] flex items-center gap-2">
                  <span className="text-[#FFB84D]">ARTIFACT //</span>
                  <span>{detail.original_filename}</span>
                </div>
                <div className="text-[10px] text-[#6F887A] mt-1 space-x-2">
                  <span className="font-mono text-[#3C6653]">
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
                className="text-xs text-[#6F887A] hover:text-[#D8E5DC] px-2 py-1 border border-[#27453A]"
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
              <div className="bg-[#E05A52]/10 border border-[#E05A52] rounded-sm p-3 text-xs text-[#E05A52]">
                <div className="font-bold mb-1">[EXTRACTION ANOMALY DETECTED]</div>
                <div className="text-[11px]">
                  {detail.extraction_error || 'Text extraction could not process this document.'}
                </div>
                {detail.retry_count > 0 && (
                  <div className="text-[10px] mt-1 text-[#6F887A]">
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
                  <span className="text-[10px] uppercase text-[#6F887A]">
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
                  <pre className="p-3 bg-[#0B1713] border border-[#27453A] rounded-sm text-[11px] whitespace-pre-wrap max-h-64 overflow-y-auto text-[#9FE3B1] font-mono leading-relaxed">
                    {detail.extracted_text}
                  </pre>
                )}
              </div>
            )}

            {/* Import history within modal */}
            {detail.import_history?.length > 0 && (
              <div>
                <div className="text-[10px] uppercase text-[#6F887A] mb-1.5">
                  AUDIT LOG // EXTRACTION HISTORY
                </div>
                <div className="space-y-1">
                  {detail.import_history.map((i: any) => (
                    <div
                      key={i.id}
                      className="flex items-center justify-between text-xs bg-[#0F1D18] border border-[#27453A]/50 p-2 rounded-sm"
                    >
                      <StatusBadge status={i.status} />
                      <span className="text-[#6F887A] text-[10px]">
                        {i.accepted_count} accepted · {i.rejected_count} rejected
                      </span>
                      <span className="text-[#3C6653] text-[10px]">
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