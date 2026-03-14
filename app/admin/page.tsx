"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2,
  ArrowLeft,
  Plus,
  RefreshCw,
  Users,
  Briefcase,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Employee, Job } from "@/types";

export default function AdminPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // New employee form
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newRole, setNewRole] = useState<string>("field");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/employees").then((r) => r.json()),
      fetch("/api/jobs").then((r) => r.json()),
    ])
      .then(([empData, jobData]) => {
        setEmployees(empData.employees || []);
        setJobs(jobData.jobs || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const createEmployee = async () => {
    if (!newName || !newPin || newPin.length !== 4) return;
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, pin: newPin, role: newRole }),
    });
    if (res.ok) {
      const data = await res.json();
      setEmployees((prev) => [...prev, data.employee]);
      setNewName("");
      setNewPin("");
      setNewRole("field");
      setDialogOpen(false);
    }
  };

  const syncFoundation = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/jobs/sync", { method: "POST" });
      const data = await res.json();
      if (data.jobs) setJobs(data.jobs);
      alert(`Sync complete. ${data.message || ""}`);
    } catch {
      alert("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const seedCostCodes = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/cost-codes", { method: "POST" });
      const data = await res.json();
      alert(`Seeded ${data.synced || 0} cost codes.`);
    } catch {
      alert("Seed failed");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1F3864]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#1F3864] text-white px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Admin</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <Tabs defaultValue="employees">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="employees" className="flex-1">
              <Users className="w-4 h-4 mr-1" /> Employees
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex-1">
              <Briefcase className="w-4 h-4 mr-1" /> Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-500">
                {employees.length} employees
              </p>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger>
                  <Button size="sm" className="bg-[#1F3864]">
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Employee</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 mt-2">
                    <Input
                      placeholder="Name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                    <Input
                      placeholder="4-digit PIN"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) =>
                        setNewPin(e.target.value.replace(/\D/g, ""))
                      }
                    />
                    <Select value={newRole} onValueChange={(v) => { if (v) setNewRole(v); }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="field">Field Worker</SelectItem>
                        <SelectItem value="pm">PM</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={createEmployee}
                      className="w-full bg-[#1F3864]"
                    >
                      Create
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {employees.map((emp) => (
              <Card key={emp.id} className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{emp.name}</p>
                  <p className="text-xs text-slate-500">{emp.email || "No email"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{emp.role}</Badge>
                  {!emp.isActive && (
                    <Badge className="bg-red-100 text-red-700">Inactive</Badge>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="jobs" className="space-y-3">
            <div className="flex justify-between items-center gap-2">
              <p className="text-sm text-slate-500">{jobs.length} active jobs</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={seedCostCodes} disabled={syncing}>
                  Seed Codes
                </Button>
                <Button
                  size="sm"
                  className="bg-[#1F3864]"
                  onClick={syncFoundation}
                  disabled={syncing}
                >
                  {syncing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  )}
                  Sync Foundation
                </Button>
              </div>
            </div>

            {jobs.map((job) => (
              <Card
                key={job.id}
                className="p-3 cursor-pointer hover:bg-slate-50"
                onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{job.name}</p>
                    <p className="text-xs text-slate-500">
                      #{job.foundationJobId}
                      {job.state && ` | ${job.state}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.isPrevailingWage && (
                      <Badge className="bg-purple-100 text-purple-700 text-xs">
                        PW
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {job.status}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}

            {jobs.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">
                No jobs yet. Sync from Foundation or add manually.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
