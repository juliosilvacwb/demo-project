import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createMovementServerFn, deleteMovementServerFn } from "@/lib/movements.server";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Dumbbell, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { movementsQueryOptions } from "./-queries/movements";

export const Route = createFileRoute("/__index/_layout/movements/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(movementsQueryOptions());
  },
  component: MovementsPage,
});

function MovementsPage() {
  const queryClient = useQueryClient();
  const { data: movements } = useSuspenseQuery(movementsQueryOptions());
  const [name, setName] = useState("");
  const [isBodyWeight, setIsBodyWeight] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const createMovementMutation = useMutation({
    mutationFn: (data: { name: string; isBodyWeight: boolean }) => createMovementServerFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movementsQueryOptions().queryKey });
      setName("");
      setIsBodyWeight(false);
    },
  });

  const deleteMovementMutation = useMutation({
    mutationFn: (movementId: string) => deleteMovementServerFn({ data: movementId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movementsQueryOptions().queryKey });
      setConfirmDeleteId(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMovementMutation.mutate({ name: name.trim(), isBodyWeight });
  };

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col gap-4">
      <div className="flex-none">
        <h1 className="text-2xl font-semibold text-slate-900">Movements</h1>
      </div>

      <Card className="flex-none">
        <CardHeader>
          <CardTitle>Add New Movement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-3">
              <Input
                placeholder="Movement name (e.g. Bench Press)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!name.trim() || createMovementMutation.isPending}>
                {createMovementMutation.isPending ? "Adding..." : "Add"}
              </Button>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 w-fit">
              <input
                type="checkbox"
                checked={isBodyWeight}
                onChange={(e) => setIsBodyWeight(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              This is a body-weight movement (e.g., Pull-ups, Push-ups)
            </label>
          </form>
        </CardContent>
      </Card>
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardHeader className="flex-none border-b bg-slate-50/50 py-4">
          <CardTitle className="text-lg">All Movements</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto min-h-0 p-0">
          {movements.length === 0 ? (
            <p className="text-sm text-slate-500">No movements yet. Add one above!</p>
          ) : (
            <ul className="divide-y divide-slate-100">
                {movements.map((movement) => (
                  <li
                    key={movement.id}
                    className={cn(
                      "px-6 py-3 hover:bg-slate-50 transition-all text-sm font-medium text-slate-700 flex items-center justify-between group",
                      confirmDeleteId === movement.id && "bg-red-50/50 hover:bg-red-50/50",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {movement.name}
                      {movement.isBodyWeight && (
                        <Badge variant="success" className="gap-1">
                          <Dumbbell className="w-3 h-3" />
                          body-weight
                        </Badge>
                      )}
                    </span>

                    <div className="flex items-center gap-2">
                      {confirmDeleteId === movement.id ? (
                        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                          <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider mr-1">
                            Are you sure?
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-slate-500 hover:text-slate-700"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={deleteMovementMutation.isPending}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="h-8 px-2"
                            onClick={() => deleteMovementMutation.mutate(movement.id)}
                            disabled={deleteMovementMutation.isPending}
                          >
                            {deleteMovementMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Confirm Delete"
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setConfirmDeleteId(movement.id)}
                          aria-label="Delete movement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
