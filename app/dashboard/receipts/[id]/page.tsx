import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { getT } from "@/lib/i18n-server";
import { formatSek, formatDate } from "@/lib/utils";
import { resolveReceiptImageSrc } from "@/lib/storage";
import { getBasAccount } from "@/lib/bas";
import { ReceiptDetailActions } from "@/components/dashboard/ReceiptDetailActions";

export const metadata = { title: "Kvitto" };
export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  approved: "bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
  rejected: "bg-red-100/50 text-red-700 dark:bg-red-900/20 dark:text-red-300",
};

export default async function ReceiptDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const t = getT();

  const [receipt] = await db
    .select()
    .from(receipts)
    // scoped to the owner so nobody can open someone else's receipt by id
    .where(and(eq(receipts.id, params.id), eq(receipts.userId, session.user.id)))
    .limit(1);
  if (!receipt) notFound();

  // The image (base64 data URL or private R2 key) is resolved here, on demand,
  // rather than being shipped with the whole list.
  const imageSrc = await resolveReceiptImageSrc(receipt.imageUrl, session.user.id);
  const basAccount = receipt.basCode ? getBasAccount(receipt.basCode) : undefined;

  const statusLabel: Record<string, string> = {
    pending: t.statusPending,
    approved: t.statusApproved,
    rejected: t.statusRejected,
  };

  const fields: { label: string; value: React.ReactNode }[] = [
    { label: t.colVendor, value: receipt.vendorName ?? "—" },
    { label: t.colDate, value: formatDate(receipt.date) },
    { label: t.receiptNumberLabel, value: receipt.receiptNumber ?? "—" },
    {
      label: t.colBas,
      value: receipt.basCode
        ? `${receipt.basCode}${basAccount ? ` · ${basAccount.name}` : ""}`
        : "—",
    },
    { label: t.colCategory, value: receipt.category ?? "—" },
    {
      label: t.colVat,
      value: (
        <>
          {receipt.vatRate ? `${receipt.vatRate}% · ` : ""}
          {formatSek(receipt.vatAmount)}
        </>
      ),
    },
    { label: t.colAmount, value: formatSek(receipt.totalAmount) },
    { label: t.receiptCreatedLabel, value: formatDate(receipt.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/receipts"
        className="inline-flex items-center gap-1.5 text-sm text-nordic-600 hover:underline"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
          <path d="M12 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t.receiptBack}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {receipt.vendorName ?? t.receiptDetails}
          </h1>
          <p className="text-nordic-600 dark:text-nordic-600">{t.receiptDetails}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[receipt.status] ?? ""}`}>
          {statusLabel[receipt.status] ?? receipt.status}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-gray-900/[0.07] bg-gray-900/[0.03] sm:grid-cols-2 dark:border-white/[0.08] dark:bg-white/[0.04]">
          {fields.map((f) => (
            <div key={f.label} className="bg-white p-4 dark:bg-[#0D0D0D]">
              <dt className="text-xs uppercase tracking-wide text-gray-400">{f.label}</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{f.value}</dd>
            </div>
          ))}
          <div className="bg-white p-4 sm:col-span-2 dark:bg-[#0D0D0D]">
            <ReceiptDetailActions id={receipt.id} status={receipt.status} />
          </div>
        </dl>

        <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-3 dark:border-white/[0.08] dark:bg-[#0D0D0D]">
          {imageSrc ? (
            <a href={imageSrc} target="_blank" rel="noreferrer" title={t.receiptOpenImage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={receipt.vendorName ?? ""}
                className="w-full rounded-lg object-contain"
              />
            </a>
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center rounded-lg bg-gray-900/[0.03] p-6 text-center text-sm text-gray-400 dark:bg-white/[0.03]">
              {t.receiptNoImage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
