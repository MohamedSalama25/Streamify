import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/ui/components/card";
import { ROUTES } from "@/shared/constants/routes";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Page not found</CardTitle>
          <CardDescription>
            The page you were looking for does not exist or the room link is invalid.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={ROUTES.home}
            className="inline-flex h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-slate-100 transition hover:bg-white/10"
          >
            Back to Streamify
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

