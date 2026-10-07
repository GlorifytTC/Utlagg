import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { receipts, receiptReviews, users } from "@/db/schema";
import { getT, getServerLang } from "@/lib/i18n-server";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { formatSek, formatDate } from "@/lib/utils";
import { resolveReceiptImageSrc } from "@/lib/storage";
import { getBasAccount } from "@/lib/bas";
import { ReceiptDetailActions } from "@/components/dashboard/ReceiptDetailActions";
import { ClientAvatar } from "@/components/accountant/ClientAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Kvitto" };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, BadgeTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export default async function ReceiptDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const t = getT();
  const lang = getServerLang();

  const [receipt] = await db
    .select()
    .from(receipts)
    // scoped to the owner so nobody can open someone else's receipt by id
    .where(and(eq(receipts.id, params.id), eq(receipts.userId, session.user.id)))
    .limit(1);
  if (!receipt) notFound();

  const reviewers = await db
    .select({
      name: users.name,
      email: users.email,
      logoUrl: users.logoUrl,
      verified: users.verificationStatus,
      reviewedAt: receiptReviews.reviewedAt,
    })
    .from(receiptReviews)
    .innerJoin(users, eq(users.id, receiptReviews.accountantId))
    .where(eq(receiptReviews.receiptId, receipt.id))
    .orderBy(asc(receiptReviews.reviewedAt));

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
    { label: t.colDate, value: formatDate(receipt.date, lang) },
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
    { label: t.receiptCreatedLabel, value: formatDate(receipt.createdAt, lang) },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <PageHeader
        title={receipt.vendorName ?? t.receiptDetails}
        subtitle={t.receiptDetails}
        back={{ href: "/dashboard/receipts", label: t.receiptBack }}
        actions={
          <Badge tone={STATUS_TONE[receipt.status] ?? "neutral"}>
            {statusLabel[receipt.status] ?? receipt.status}
          </Badge>
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
          {reviewers.length > 0 && (
            <div className="panel-fill p-4 sm:col-span-2">
              <dt className="text-xs text-gray-500 dark:text-gray-400">{t.reviewedBy}</dt>
              <dd className="mt-2 space-y-3">
                {reviewers.map((v: (typeof reviewers)[number], i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <ClientAvatar name={v.name ?? v.email} logoUrl={v.logoUrl} size="md" />
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                        {v.name ?? v.email}
                        {v.verified === "approved" && <VerifiedBadge />}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {v.name ? `${v.email} · ` : ""}
                        {t.reviewedOn} {formatDate(v.reviewedAt, lang)}
                      </p>
                    </div>
                  </div>
                ))}
                {receipt.note && (
                  <div className="rounded-xl bg-gray-900/[0.03] p-3 text-sm dark:bg-white/[0.04]">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.accountantNote}</p>
                    <p className="mt-1 whitespace-pre-wrap break-words">{receipt.note}</p>
                  </div>
                )}
              </dd>
            </div>
          )}
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
                alt={receipt.vendorName ? `${t.receiptImageAlt}: ${receipt.vendorName}` : t.receiptImageAlt}
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
