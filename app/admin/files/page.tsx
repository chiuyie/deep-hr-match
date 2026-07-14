import { FileText } from "lucide-react";
import { AdminFileLink, AdminPageSection } from "@/components/admin/admin-ui";
import { AdminSearchableTable } from "@/components/admin/admin-searchable-table";
import { adminRowSearchProps } from "@/lib/admin/table-search";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableCell, TableRow } from "@/components/ui/table";
import { adminFileDownloadUrl, formatFileSize } from "@/lib/admin/files";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/profile";

export default async function AdminFilesPage() {
  const supabase = await createClient();

  const { data: cvs } = await supabase
    .from("candidate_cv_files")
    .select("*, candidate_profiles(full_name, email)")
    .order("uploaded_at", { ascending: false });

  const { data: jds } = await supabase
    .from("job_jd_files")
    .select("*, jobs(title)")
    .order("uploaded_at", { ascending: false });

  const cvRows = cvs ?? [];
  const jdRows = jds ?? [];

  return (
    <AdminPageSection
      title="Uploaded files"
      description="CV and job description documents stored in Supabase"
      icon={<FileText className="h-6 w-6" />}
      gradient="from-slate-600 to-slate-800"
    >
      <Tabs defaultValue="cvs" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2 rounded-xl">
          <TabsTrigger value="cvs" className="rounded-lg">
            CV files ({cvRows.length})
          </TabsTrigger>
          <TabsTrigger value="jds" className="rounded-lg">
            JD files ({jdRows.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cvs">
          <AdminSearchableTable
            recordCount={cvRows.length}
            searchPlaceholder="Search CV files…"
            emptyIcon={<FileText className="h-7 w-7" />}
            emptyTitle="No CV uploads"
            emptyDescription="Candidate CV files will appear here after upload."
            columns={["File", "Candidate", "Size", "Uploaded", "Download"]}
          >
            {cvRows.map((file) => {
              const candidate = file.candidate_profiles as {
                full_name: string | null;
                email: string | null;
              } | null;

              return (
                <TableRow
                  key={file.id}
                  {...adminRowSearchProps(
                    `${file.file_name} ${candidate?.full_name ?? ""} ${candidate?.email ?? ""}`
                  )}
                >
                  <TableCell className="font-medium text-slate-800">{file.file_name}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-800">
                        {candidate?.full_name ?? "—"}
                      </p>
                      {candidate?.email && (
                        <p className="text-xs text-slate-500">{candidate.email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {formatFileSize(file.file_size)}
                  </TableCell>
                  <TableCell className="text-slate-500">{formatDate(file.uploaded_at)}</TableCell>
                  <TableCell>
                    <AdminFileLink
                      href={adminFileDownloadUrl("candidate-cvs", file.file_path)}
                      label="Download"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </AdminSearchableTable>
        </TabsContent>

        <TabsContent value="jds">
          <AdminSearchableTable
            recordCount={jdRows.length}
            searchPlaceholder="Search JD files…"
            emptyIcon={<FileText className="h-7 w-7" />}
            emptyTitle="No JD uploads"
            emptyDescription="Job description files will appear here after employer upload."
            columns={["File", "Job", "Size", "Uploaded", "Download"]}
          >
            {jdRows.map((file) => {
              const jobTitle = (file.jobs as { title: string } | null)?.title ?? "";

              return (
                <TableRow
                  key={file.id}
                  {...adminRowSearchProps(`${file.file_name} ${jobTitle}`)}
                >
                  <TableCell className="font-medium text-slate-800">{file.file_name}</TableCell>
                  <TableCell className="text-slate-600">{jobTitle || "—"}</TableCell>
                  <TableCell className="text-slate-600">
                    {formatFileSize(file.file_size)}
                  </TableCell>
                  <TableCell className="text-slate-500">{formatDate(file.uploaded_at)}</TableCell>
                  <TableCell>
                    <AdminFileLink
                      href={adminFileDownloadUrl("job-jds", file.file_path)}
                      label="Download"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </AdminSearchableTable>
        </TabsContent>
      </Tabs>
    </AdminPageSection>
  );
}
