"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { markAllAlertsAsRead } from "@/lib/actions/alerts";
import { useRouter } from "next/navigation";

interface MarkAllReadButtonProps {
  userId: string;
}

export function MarkAllReadButton({ userId }: MarkAllReadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleMarkAllRead = async () => {
    setIsLoading(true);
    try {
      await markAllAlertsAsRead(userId);
      toast.success("All notifications marked as read");
      router.refresh();
    } catch (error) {
      toast.error("Failed to mark notifications as read");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleMarkAllRead} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <CheckCircle className="h-4 w-4 mr-2" />
      )}
      Mark All Read
    </Button>
  );
}
