"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Unlock } from "lucide-react";
import { createUnlockCheckout } from "@/lib/employer/actions";
import { formatCurrency } from "@/lib/utils/profile";
import { UNLOCK_PRICE_CENTS } from "@/lib/matching/engine";
import type { AnonymousCandidateMatch } from "@/types/database";

interface MatchingResultsTableProps {
  jobId: string;
  results: AnonymousCandidateMatch[];
}

export function MatchingResultsTable({ jobId, results }: MatchingResultsTableProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const locked = results.filter((r) => !r.is_unlocked);
  const total = selected.length * UNLOCK_PRICE_CENTS;

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleUnlock() {
    setLoading(true);
    const formData = new FormData();
    formData.set("jobId", jobId);
    selected.forEach((id) => formData.append("candidateIds", id));
    await createUnlockCheckout(jobId, selected);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="py-3 text-sm text-amber-900">
          All scores shown are <strong>DEMO / Placeholder</strong> only. Final matching
          algorithm pending confirmation.
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ranked Candidates</CardTitle>
          {selected.length > 0 && (
            <Button
              className="bg-[#1e40af] hover:bg-[#1e3a8a]"
              disabled={loading}
              onClick={handleUnlock}
            >
              Unlock {selected.length} Selected ({formatCurrency(total)})
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No matching results yet. Generate matches to see ranked candidates.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Candidate ID</TableHead>
                  <TableHead>Match Score</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Education</TableHead>
                  <TableHead>Skills Overview</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {!row.is_unlocked && (
                        <Checkbox
                          checked={selected.includes(row.id)}
                          onCheckedChange={() => toggle(row.id)}
                        />
                      )}
                    </TableCell>
                    <TableCell>#{row.ranking_position}</TableCell>
                    <TableCell className="font-mono text-sm">{row.anonymous_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{row.overall_score}%</span>
                        {row.is_placeholder && (
                          <Badge variant="outline" className="text-xs">
                            DEMO
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.years_of_experience != null
                        ? `${row.years_of_experience} yrs`
                        : "—"}
                    </TableCell>
                    <TableCell>{row.highest_education ?? "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {row.skills_overview.slice(0, 3).join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      {row.is_unlocked ? (
                        <Badge className="gap-1 bg-green-600">
                          <Unlock className="h-3 w-3" /> Unlocked
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" /> Locked
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {results.some((r) => r.is_unlocked) && (
        <Button variant="outline" asChild>
          <Link href={`/employer/jobs/${jobId}/unlocked`}>View Unlocked Candidates</Link>
        </Button>
      )}
    </div>
  );
}
