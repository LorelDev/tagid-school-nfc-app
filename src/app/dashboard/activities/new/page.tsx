import Link from "next/link";
import { createActivity } from "../actions";

export default function NewActivityPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link href="/dashboard/activities" className="text-sm text-brand">
          ← Activities
        </Link>
        <h1 className="mt-2 text-2xl font-bold">New activity</h1>
      </div>

      <form action={createActivity} className="card space-y-4">
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" name="title" required className="input" placeholder="e.g. Photosynthesis Trail" />
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={3} className="input" placeholder="What students will learn..." />
        </div>
        <button type="submit" className="btn-primary w-full">Create activity</button>
      </form>
    </div>
  );
}
