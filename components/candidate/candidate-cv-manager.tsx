"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ArrowRight,
  Download,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  deleteCandidateCV,
  getCandidateCvDownloadUrl,
  uploadCandidateCV,
} from "@/lib/candidate/actions";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { cn } from "@/lib/utils";
import { formatDate, formatFileSize } from "@/lib/utils/profile";
import type { CandidateCvFile } from "@/types/database";

type CandidateCvManagerProps = {
  files: CandidateCvFile[];
  continueHref?: string;
  continueLabel?: string;
  showProfileComplete?: boolean;
  /** When true, first successful upload redirects into onboarding (matrix). */
  redirectOnFirstUpload?: boolean;
};

const ACCEPT = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function fileKindLabel(file: CandidateCvFile): string {
  const name = file.file_name.toLowerCase();
  if (name.endsWith(".pdf") || file.file_type === "application/pdf") return "PDF";
  if (name.endsWith(".docx")) return "DOCX";
  if (name.endsWith(".doc")) return "DOC";
  return "File";
}

export function CandidateCvManager({
  files,
  continueHref,
  continueLabel,
  showProfileComplete = false,
  redirectOnFirstUpload = false,
}: CandidateCvManagerProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyKind, setBusyKind] = useState<"download" | "delete" | null>(null);

  const current = files[0] ?? null;
  const previous = files.slice(1);
  const hasCv = files.length > 0;
  const fileActionPending = busyId !== null;
  const actionsDisabled = uploading || fileActionPending;

  function pickFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setSelectedName(file.name);
    const shouldRedirect = redirectOnFirstUpload && !hasCv;
    upload(file, { stay: !shouldRedirect });
  }

  async function upload(file: File, options: { stay: boolean }) {
    const formData = new FormData();
    formData.set("file", file);
    if (options.stay) formData.set("stay", "1");

    setUploading(true);
    try {
      const result = await uploadCandidateCV(formData);
      if (result.error) {
        toast.error(result.error);
        setSelectedName(null);
        return;
      }
      toast.success(options.stay ? "CV uploaded" : "CV uploaded — continuing");
      setSelectedName(null);
      if (inputRef.current) inputRef.current.value = "";
      if (result.redirectTo) {
        router.push(result.redirectTo);
        return;
      }
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  async function onDownload(fileId: string) {
    setBusyId(fileId);
    setBusyKind("download");
    try {
      const result = await getCandidateCvDownloadUrl(fileId);
      if (result.error || !result.downloadUrl) {
        toast.error(result.error || "Download failed");
        return;
      }
      window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
    } finally {
      setBusyId(null);
      setBusyKind(null);
    }
  }

  async function onDelete(fileId: string, fileName: string) {
    if (!window.confirm(`Delete “${fileName}”? This cannot be undone.`)) return;
    setBusyId(fileId);
    setBusyKind("delete");
    try {
      const result = await deleteCandidateCV(fileId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("CV deleted");
      router.refresh();
    } finally {
      setBusyId(null);
      setBusyKind(null);
    }
  }

  return (
    <div className="space-y-5">
      {showProfileComplete ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
          <FileText />
          <AlertTitle>Profile saved</AlertTitle>
          <AlertDescription>Upload your CV to continue onboarding.</AlertDescription>
        </Alert>
      ) : null}

      {current ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50/50 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-800/70">
                  Current CV
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">Ready for employers</h2>
              </div>
              <Badge className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-800">
                Latest upload
              </Badge>
            </div>
          </div>
          <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{current.file_name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {fileKindLabel(current)}
                  <span className="mx-1.5 text-slate-300">·</span>
                  {formatFileSize(current.file_size)}
                  <span className="mx-1.5 text-slate-300">·</span>
                  {formatDate(current.uploaded_at)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className="rounded-xl"
                disabled={actionsDisabled}
                onClick={() => onDownload(current.id)}
              >
                {busyId === current.id && busyKind === "download" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="rounded-xl"
                disabled={actionsDisabled}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={actionsDisabled}
                onClick={() => onDelete(current.id, current.file_name)}
              >
                {busyId === current.id && busyKind === "delete" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="px-5 py-5 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {current ? "Upload another version" : "Upload your CV"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">PDF or Word · max 10MB</p>

          <label
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              pickFile(e.dataTransfer.files);
            }}
            className={cn(
              "mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-10 text-center transition",
              dragOver
                ? "border-sky-400 bg-sky-50"
                : "border-slate-200 bg-slate-50/70 hover:border-sky-300 hover:bg-sky-50/50",
              (uploading || fileActionPending) && "pointer-events-none opacity-60"
            )}
          >
            <input
              ref={inputRef}
              type="file"
              name="file"
              accept={ACCEPT}
              className="sr-only"
              disabled={uploading || fileActionPending}
              onChange={(e) => pickFile(e.target.files)}
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
              ) : (
                <Upload className="h-5 w-5 text-sky-600" />
              )}
            </div>
            <p className="mt-3 text-sm font-medium text-slate-800">
              {uploading
                ? selectedName
                  ? `Uploading ${selectedName}…`
                  : "Uploading…"
                : "Drop your file here, or click to browse"}
            </p>
            <p className="mt-1 text-xs text-slate-500">.pdf · .doc · .docx</p>
          </label>
        </div>
      </section>

      {previous.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-slate-900">Earlier uploads</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Employers always see your latest CV. Older files stay here until you delete them.
            </p>
          </div>
          <ul className="divide-y divide-slate-100">
            {previous.map((file) => (
              <li
                key={file.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{file.file_name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {fileKindLabel(file)}
                    <span className="mx-1 text-slate-300">·</span>
                    {formatFileSize(file.file_size)}
                    <span className="mx-1 text-slate-300">·</span>
                    {formatDate(file.uploaded_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="rounded-lg"
                    disabled={actionsDisabled}
                    onClick={() => onDownload(file.id)}
                  >
                    {busyId === file.id && busyKind === "download" ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Download
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={actionsDisabled}
                    onClick={() => onDelete(file.id, file.file_name)}
                  >
                    {busyId === file.id && busyKind === "delete" ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hasCv && continueHref ? (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button asChild className="rounded-xl px-5">
            <Link href={continueHref}>
              {continueLabel || `Continue to ${FRAMEWORK_MATCHING_LANGUAGE}`}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
