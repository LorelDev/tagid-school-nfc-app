"use client";

import { useState } from "react";
import type { MissionType } from "@/lib/types";
import { addMission } from "@/app/dashboard/activities/actions";

export function MissionForm({ activityId }: { activityId: string }) {
  const [type, setType] = useState<MissionType>("single_choice");
  const isChoice = type === "single_choice" || type === "multi_choice";

  return (
    <form action={addMission} className="space-y-3">
      <input type="hidden" name="activity_id" value={activityId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Title</label>
          <input name="title" required className="input" placeholder="Station 1" />
        </div>
        <div>
          <label className="label">Type</label>
          <select
            name="type"
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value as MissionType)}
          >
            <option value="single_choice">Single choice</option>
            <option value="multi_choice">Multiple choice</option>
            <option value="text">Text answer</option>
            <option value="number">Number answer</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Prompt / question</label>
        <textarea name="prompt" rows={2} className="input" placeholder="What is...?" />
      </div>

      {isChoice && (
        <div>
          <label className="label">Options (one per line)</label>
          <textarea name="options" rows={3} className="input" placeholder={"Option A\nOption B\nOption C"} />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">
            Correct answer{type === "multi_choice" ? " (comma-separated)" : ""}
          </label>
          <input name="answer" className="input" placeholder={isChoice ? "Option A" : "42"} />
        </div>
        <div>
          <label className="label">Points</label>
          <input name="points" type="number" defaultValue={10} min={0} className="input" />
        </div>
      </div>

      <button type="submit" className="btn-primary">+ Add mission</button>
    </form>
  );
}
