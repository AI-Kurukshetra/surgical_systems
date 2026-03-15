"use client";

import { useEffect, useMemo, useState } from "react";
import { ORDashboardLive } from "@/components/dashboard/or-dashboard-live";
import { DelayAlertBanner } from "@/components/dashboard/delay-alert-banner";
import { SurgeryCard } from "@/components/surgery/surgery-card";
import { caseRequestsService, patientsService, surgeriesService } from "@/src/services";
import type { CaseRequest, Patient, Surgery } from "@/src/services/types";

function patientName(patient?: Patient) {
  if (!patient) return "Unknown Patient";
  return `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim() || "Unknown Patient";
}

export function LiveCommandDashboard() {
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [requests, setRequests] = useState<CaseRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [surgeriesRes, patientsRes, requestsRes] = await Promise.all([
        surgeriesService.getAll(),
        patientsService.getAll(),
        caseRequestsService.getAll(),
      ]);

      if (surgeriesRes.error || patientsRes.error || requestsRes.error) {
        console.error("[LiveCommandDashboard] load failed", {
          surgeriesError: surgeriesRes.error,
          patientsError: patientsRes.error,
          requestsError: requestsRes.error,
        });
        setSurgeries([]);
        setPatients([]);
        setRequests([]);
        setError("Unable to load data. Please try again later.");
        return;
      }

      setSurgeries(surgeriesRes.data ?? []);
      setPatients(patientsRes.data ?? []);
      setRequests(requestsRes.data ?? []);
    };

    void load();
  }, []);

  const delayedCount = useMemo(() => surgeries.filter((s) => s.status === "cancelled").length, [surgeries]);

  const patientsMap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);
  const requestsMap = useMemo(() => new Map(requests.map((r) => [r.id, r])), [requests]);

  const upcoming = useMemo(
    () =>
      surgeries
        .filter((s) => s.status === "scheduled" || s.status === "in_progress")
        .sort((a, b) => (a.scheduled_start ?? "").localeCompare(b.scheduled_start ?? ""))
        .slice(0, 6),
    [surgeries],
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Command Dashboard</h1>
      <DelayAlertBanner count={delayedCount} />
      {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}

      <ORDashboardLive />

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Upcoming Surgeries</h2>
        {upcoming.length === 0 ? (
          <p className="rounded-md border bg-white p-4 text-sm text-muted-foreground">No data available.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.map((surgery) => {
              const request = surgery.case_request_id ? requestsMap.get(surgery.case_request_id) : undefined;
              const patient =
                (request?.patient_id ? patientsMap.get(request.patient_id) : undefined) ??
                (surgery.patient_id ? patientsMap.get(surgery.patient_id) : undefined);

              return (
                <SurgeryCard
                  key={surgery.id}
                  title={request?.procedure_name ?? `Surgery ${surgery.id.slice(0, 8)}`}
                  patient={patientName(patient)}
                  room={surgery.operating_room_id ? `OR ${surgery.operating_room_id.slice(0, 6)}` : "Unassigned OR"}
                  start={surgery.scheduled_start ? new Date(surgery.scheduled_start).toLocaleString() : "-"}
                  status={surgery.status === "in_progress" ? "in_progress" : "scheduled"}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
