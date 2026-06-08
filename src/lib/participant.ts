import { cookies } from "next/headers";

// The student has no auth account; identity is held in a signed-less cookie
// scoped to a single session. (Anti-cheat is out of scope for this classroom
// tool — the teacher can see everyone live.)
const COOKIE = "tagid_participant";

export type ParticipantCookie = {
  participantId: string;
  sessionId: string;
  name: string;
};

export function setParticipantCookie(data: ParticipantCookie) {
  cookies().set(COOKIE, JSON.stringify(data), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // a school day
  });
}

export function getParticipantCookie(): ParticipantCookie | null {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ParticipantCookie;
  } catch {
    return null;
  }
}

export function clearParticipantCookie() {
  cookies().delete(COOKIE);
}
