import { cookies } from "next/headers";

// The student has no auth account; identity is held in a cookie scoped to a
// single session. Privacy by design: we store only a display name and ids.
const COOKIE = "tagid_participant";

export type ParticipantCookie = {
  participantId: string;
  sessionId: string;
  sessionCode: string;
  groupId: string | null;
  name: string;
};

export function setParticipantCookie(data: ParticipantCookie) {
  cookies().set(COOKIE, JSON.stringify(data), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 10, // a long school day
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
