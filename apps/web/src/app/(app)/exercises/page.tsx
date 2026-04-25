"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getExercises, getEquipmentList, type Exercise } from "@/features/exercises/exercises.api";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageLoader, EmptyState } from "@/components/ui/Feedback";

const CATEGORIES = ["STRENGTH", "CARDIO", "FLEXIBILITY", "MOBILITY"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  STRENGTH: "💪 Strength", CARDIO: "🏃 Cardio",
  FLEXIBILITY: "🤸 Flexibility", MOBILITY: "🔄 Mobility",
};
const CATEGORY_VARIANT = {
  STRENGTH: "strength", CARDIO: "cardio",
  FLEXIBILITY: "flexibility", MOBILITY: "mobility",
} as const;

export default function ExercisesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [equipment, setEquipment] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Exercise | null>(null);

  const { data: equipmentList = [] } = useQuery({
    queryKey: ["equipment-list"],
    queryFn: getEquipmentList,
    staleTime: Infinity,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["exercises", search, category, equipment, page],
    queryFn: () => getExercises({ search: search || undefined, category: category || undefined, equipment: equipment || undefined, page, limit: 20 }),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900">Exercises</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Search exercises…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
        <select
          value={equipment}
          onChange={(e) => { setEquipment(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All equipment</option>
          {equipmentList.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
        </select>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setCategory(""); setPage(1); }}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            !category ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => { setCategory(category === c ? "" : c); setPage(1); }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              category === c ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Count */}
      {data && (
        <div className="flex flex-wrap items-center">
          <span className="text-sm text-gray-500">
          {data.total} exercise{data.total !== 1 ? "s" : ""}
          </span>
          {/* Pagination */}
          {data && data.pages > 1 && (
              <span className="ml-auto flex gap-3 items-center">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <span className="text-sm text-gray-600">Page {page} of {data.pages}</span>
                <Button variant="secondary" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </span>
          )}
        </div>
      )}

      {/* Grid */}
      {isLoading ? <PageLoader /> : !data?.items.length ? (
        <EmptyState title="No exercises found" body="Try adjusting your search or filters." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.items.map((ex) => (
            <Card
              key={ex.id}
              className="cursor-pointer hover:border-indigo-300 hover:shadow-sm transition"
              onClick={() => setSelected(ex)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900 text-sm leading-snug">{ex.name}</p>
                  <Badge variant={CATEGORY_VARIANT[ex.category] ?? "default"} className="shrink-0">
                    {ex.category.charAt(0) + ex.category.slice(1).toLowerCase()}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {ex.muscleGroups.map((m) => (
                    <span key={m} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{m}</span>
                  ))}
                </div>
                {ex.equipment && (
                  <p className="text-xs text-gray-400 mt-2">🏋️ {ex.equipment}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <Badge variant={CATEGORY_VARIANT[selected.category] ?? "default"}>
              {selected.category.charAt(0) + selected.category.slice(1).toLowerCase()}
            </Badge>
            <div className="mt-3 space-y-2">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Muscle groups</p>
                <div className="flex flex-wrap gap-1">
                  {selected.muscleGroups.map((m) => (
                    <span key={m} className="text-xs bg-gray-100 text-gray-700 rounded-full px-2.5 py-1">{m}</span>
                  ))}
                </div>
              </div>
              {selected.equipment && (
                <p className="text-sm text-gray-700"><span className="text-gray-400">Equipment:</span> {selected.equipment}</p>
              )}
              {selected.instructions && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Instructions</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selected.instructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

