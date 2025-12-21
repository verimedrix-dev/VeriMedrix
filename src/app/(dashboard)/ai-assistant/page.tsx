import dynamic from "next/dynamic";
import { ensureUserAndPractice } from "@/lib/actions/practice";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { SUBSCRIPTION_LIMITS } from "@/lib/subscription-config";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

// Dynamic import for heavy AI chat component (uses react-markdown)
const AIAssistantChat = dynamic(
  () => import("@/components/ai/ai-assistant-chat").then((mod) => mod.AIAssistantChat),
  {
    loading: () => <AIAssistantLoadingSkeleton />,
  }
);

// Lighter upgrade component can be loaded normally
const AIAssistantUpgrade = dynamic(
  () => import("@/components/ai/ai-assistant-upgrade").then((mod) => mod.AIAssistantUpgrade)
);

function AIAssistantLoadingSkeleton() {
  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
      </div>
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-6">
          <div className="h-full flex flex-col items-center justify-center">
            <Skeleton className="w-20 h-20 rounded-2xl mb-6" />
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96 mb-8" />
          </div>
        </div>
        <CardContent className="border-t p-4">
          <div className="max-w-3xl mx-auto flex gap-3">
            <Skeleton className="flex-1 h-[52px] rounded-xl" />
            <Skeleton className="h-[52px] w-24 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function AIAssistantPage() {
  await requirePermission(PERMISSIONS.AI_ASSISTANT);
  const { practice } = await ensureUserAndPractice();

  // Check if user has AI access based on subscription
  const subscriptionTier = practice?.subscriptionTier || "ESSENTIALS";
  const hasAiAccess = SUBSCRIPTION_LIMITS[subscriptionTier].features.aiAssistant;

  if (!hasAiAccess) {
    return <AIAssistantUpgrade currentPlan={SUBSCRIPTION_LIMITS[subscriptionTier].displayName} />;
  }

  return <AIAssistantChat />;
}
