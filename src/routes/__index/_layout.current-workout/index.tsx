import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createWorkoutServerFn, completeWorkoutServerFn, addSetServerFn, deleteSetServerFn, } from "@/lib/workouts.server";
import { Play, Check, Plus, X } from "lucide-react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { currentWorkoutQueryOptions, movementsQueryOptions, latestBodyWeightQueryOptions, } from "./-queries/current-workout";

export const Route = createFileRoute("/__index/_layout/current-workout/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(currentWorkoutQueryOptions()),
      context.queryClient.ensureQueryData(movementsQueryOptions()),
      context.queryClient.ensureQueryData(latestBodyWeightQueryOptions()),
    ]);
  },
  component: CurrentWorkoutPage,
});

function CurrentWorkoutPage() {
  const queryClient = useQueryClient();
  const { data: workout } = useSuspenseQuery(currentWorkoutQueryOptions());
  const { data: movements } = useSuspenseQuery(movementsQueryOptions());
  const { data: latestBodyWeight } = useSuspenseQuery(latestBodyWeightQueryOptions());
  const [selectedMovement, setSelectedMovement] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");

  const handleMovementChange = (movementId: string) => {
    setSelectedMovement(movementId);

    if (!movementId) {
      setWeight("");
      return;
    };

    const movement = movements.find((m) => m.id === movementId);
    if (movement?.isBodyWeight && latestBodyWeight?.weight !== undefined) {
      const roundedWeight = Math.round(latestBodyWeight.weight);
      setWeight(roundedWeight.toString());
    } else {
      setWeight("");
    }
  };

  const createWorkoutMutation = useMutation({
    mutationFn: () => createWorkoutServerFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions().queryKey });
    },
  });

  const completeWorkoutMutation = useMutation({
    mutationFn: () => completeWorkoutServerFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions().queryKey });
    },
  });

  const addSetMutation = useMutation({
    mutationFn: (data: { movementId: string; reps: number; weight: number }) =>
      addSetServerFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions().queryKey });
      setReps("");
    },
  });

  const deleteSetMutation = useMutation({
    mutationFn: (setId: string) => deleteSetServerFn({ data: { setId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions().queryKey });
    },
  });

  const handleAddSet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMovement || !reps || !weight) return;
    addSetMutation.mutate({
      movementId: selectedMovement,
      reps: parseInt(reps),
      weight: parseInt(weight),
    });
  };

  if (!workout) {
    return (
      <div className="h-[calc(100vh-3rem)] flex flex-col gap-6">
        <div className="flex-none">
          <h1 className="text-2xl font-semibold text-slate-900">Current Workout</h1>
        </div>
        <Card className="flex-1 flex items-center justify-center">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 mb-4 text-lg">No active workout. Ready to start?</p>
            <Button onClick={() => createWorkoutMutation.mutate()} size="lg" className="h-12 px-8">
              <Play className="w-5 h-5 mr-2" />
              {createWorkoutMutation.isPending ? "Starting..." : "Start Workout"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col gap-4">
      <div className="flex-none flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Current Workout</h1>
        <Button variant="outline" onClick={() => completeWorkoutMutation.mutate()}>
          <Check className="w-4 h-4 mr-2" />
          {completeWorkoutMutation.isPending ? "Completing..." : "Complete Workout"}
        </Button>
      </div>

      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardHeader className="flex-none border-b bg-slate-50/50 py-4">
          <CardTitle className="text-lg">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 flex flex-col p-0 overflow-hidden">
          <div className="flex-none p-6 border-b bg-slate-50/20">
            <form onSubmit={handleAddSet} className="flex gap-2 items-center">
              <Select value={selectedMovement} onChange={(e) => handleMovementChange(e.target.value)} className="flex-1">
                <option value="">Select movement</option>
                {movements.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                placeholder="Weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-24"
                min={0}
              />
              <Input
                type="number"
                placeholder="Reps"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-24"
                min={1}
              />
              <Button type="submit" disabled={!selectedMovement || !reps || !weight} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                {addSetMutation.isPending ? "Adding..." : "Add"}
              </Button>
            </form>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 p-6">
            {workout.sets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">
                <p>No sets yet.</p>
                <p className="text-sm">Add exercises to your workout above!</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {workout.sets.map((set) => (
                  <li key={set.id} className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-sm flex items-center justify-between hover:bg-slate-100/80 transition-colors">
                    <div>
                      <span className="font-semibold text-slate-900">{set.movement.name}</span>
                      <span className="text-slate-500 ml-3">
                        {set.reps} reps × {set.weight} lbs
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSetMutation.mutate(set.id)}
                      className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50">
                      <X className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
