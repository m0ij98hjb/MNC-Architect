"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WorkspaceRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  useEffect(() => {
    router.replace(`/architect-ai?id=${id}`);
  }, [id, router]);
  return null;
}
