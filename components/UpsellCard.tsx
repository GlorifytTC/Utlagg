"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** Shown in place of a gated feature when the user's plan doesn't include it. */
export function UpsellCard({
  title,
  requiredPlan,
  description,
}: {
  title: string;
  requiredPlan: string;
  description?: string;
}) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2 text-gray-500">
          <Lock className="h-5 w-5" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>
          {description ?? `Den här funktionen ingår i ${requiredPlan}-planen.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/dashboard/subscription">
          <Button>Uppgradera till {requiredPlan}</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
