import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm text-brand">→ דף הבית</Link>
      <h1 className="mt-3 text-2xl font-bold">תנאי שימוש</h1>
      <div className="mt-4 space-y-3 text-slate-700">
        <p>השימוש בתגיד מיועד לפעילות חינוכית מאורגנת בבית הספר בלבד.</p>
        <ul className="list-disc space-y-2 pr-5">
          <li>המורה אחראי/ת על הפעלת המפגש ועל התוכן שנוצר.</li>
          <li>אין להעלות תוכן פוגעני, מזהה או שאינו רלוונטי לפעילות.</li>
          <li>המערכת ניתנת כפי שהיא (as-is) לצורך MVP והדגמה.</li>
          <li>בית הספר אחראי לקבלת הסכמות הנדרשות לפי דין.</li>
        </ul>
      </div>
    </main>
  );
}
