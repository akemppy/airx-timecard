"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, ChevronDown, ChevronUp } from "lucide-react";
import type { ParsedTimeEntry } from "@/types";

interface TimeEntryCardProps {
  entry: ParsedTimeEntry;
  index: number;
  onUpdate: (index: number, entry: ParsedTimeEntry) => void;
}

export default function TimeEntryCard({
  entry,
  index,
  onUpdate,
}: TimeEntryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const confidenceColor =
    entry.confidence >= 0.9
      ? "bg-green-100 text-green-800"
      : entry.confidence >= 0.8
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800";

  const isFlagged = entry.confidence < 0.8;

  return (
    <Card
      className={`p-3 ${isFlagged ? "border-amber-400 border-2" : ""}`}
    >
      <div
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm truncate">
              {entry.jobName}
            </span>
            <Badge variant="outline" className="text-xs shrink-0">
              {entry.costCode}
            </Badge>
          </div>
          <p className="text-sm text-slate-600 truncate">{entry.task}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span className="font-medium">{entry.hours}h</span>
            {entry.quantity && (
              <span>
                {entry.quantity} {entry.unit}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-2 shrink-0">
          {isFlagged ? (
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          ) : (
            <Check className="w-4 h-4 text-green-500" />
          )}
          <Badge className={`text-xs ${confidenceColor}`}>
            {Math.round(entry.confidence * 100)}%
          </Badge>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t space-y-3">
          {entry.flagReason && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              {entry.flagReason}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500">Hours</label>
              <Input
                type="number"
                step="0.25"
                value={entry.hours}
                onChange={(e) =>
                  onUpdate(index, {
                    ...entry,
                    hours: parseFloat(e.target.value) || 0,
                  })
                }
                className="h-8 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Quantity</label>
              <Input
                type="number"
                value={entry.quantity || ""}
                onChange={(e) =>
                  onUpdate(index, {
                    ...entry,
                    quantity: parseFloat(e.target.value) || undefined,
                  })
                }
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500">Task Description</label>
            <Input
              value={entry.task}
              onChange={(e) =>
                onUpdate(index, { ...entry, task: e.target.value })
              }
              className="h-8 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500">Notes</label>
            <Input
              value={entry.notes || ""}
              onChange={(e) =>
                onUpdate(index, { ...entry, notes: e.target.value })
              }
              className="h-8 text-sm"
            />
          </div>

          {entry.crewMembers && (typeof entry.crewMembers === "string" ? JSON.parse(entry.crewMembers) : entry.crewMembers).length > 0 && (
            <div>
              <label className="text-xs text-slate-500">Crew</label>
              <p className="text-sm">{(typeof entry.crewMembers === "string" ? JSON.parse(entry.crewMembers) : entry.crewMembers).join(", ")}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
