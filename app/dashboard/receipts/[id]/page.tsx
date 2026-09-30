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
import { PageHeader } from "@/components/ui/page-header";

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
    { label: t.colVendor, value: receipt.vendorName ?? "-" },
    { label: t.colDate, value: formatDate(receipt.date) },
    { label: t.receiptNumberLabel, value: receipt.receiptNumber ?? "-" },
    {
      label: t.colBas,
      value: receipt.basCode
        ? `${receipt.basCode}${basAccount ? ` · ${basAccount.name}` : ""}`
        : "-",
    },
    { label: t.colCategory, value: receipt.category ?? "-" },
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
    <div className="max-w-6xl space-y-6">
      <PageHeader
        title={receipt.vendorName ?? t.receiptDetails}
        subtitle={t.receiptDetails}
        back={{ href: "/dashboard/receipts", label: t.receiptBack }}
        actions={
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[receipt.status] ?? ""}`}>
            {statusLabel[receipt.status] ?? receipt.status}
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <dl className="panel grid grid-cols-1 gap-px self-start overflow-hidden rounded-2xl bg-gray-900/[0.06] sm:grid-cols-2 dark:bg-white/[0.06]">
          {fields.map((f) => (
            <div key={f.label} className="panel-fill p-4">
              <dt className="text-xs text-gray-500 dark:text-gray-400">{f.label}</dt>
              <dd className="mt-1 break-words text-sm font-medium text-gray-900 dark:text-white">{f.value}</dd>
            </div>
          ))}
          <div className="panel-fill p-4 sm:col-span-2">
            <ReceiptDetailActions id={receipt.id} status={receipt.status} />
          </div>
        </dl>

        <div className="panel rounded-2xl p-3">
          {imageSrc ? (
            <a href={imageSrc} target="_blank" rel="noreferrer" title={t.receiptOpenImage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={receipt.vendorName ?? ""}
                className="w-full rounded-xl object-contain"
              />
            </a>
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center rounded-xl bg-gray-900/[0.03] p-6 text-center text-sm text-gray-500 dark:bg-white/[0.03]">
              {t.receiptNoImage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
