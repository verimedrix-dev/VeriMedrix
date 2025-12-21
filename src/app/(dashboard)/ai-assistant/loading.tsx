import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AIAssistantLoading() {
  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div>
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto">
            <Skeleton className="w-20 h-20 rounded-2xl mb-6" />
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96 mb-8" />

            {/* Suggested Questions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                  <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Input Area */}
        <CardContent className="border-t dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end">
              <Skeleton className="flex-1 h-[52px] rounded-xl" />
              <Skeleton className="h-[52px] w-24 rounded-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
