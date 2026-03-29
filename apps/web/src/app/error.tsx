"use client";

import { useEffect } from "react";

import { Button } from "@/features/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/ui/components/card";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>{error.message || "Unexpected application error."}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={reset}>
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

