import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Megaphone,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { getAnnouncements } from "@/lib/actions/admin/system";
import { format } from "date-fns";
import { CreateAnnouncementDialog } from "@/components/admin/create-announcement-dialog";

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements(true);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "SUCCESS":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "ERROR":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "WARNING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "SUCCESS":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "ERROR":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Announcements</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Create and manage platform-wide announcements
          </p>
        </div>
        <CreateAnnouncementDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            All Announcements
          </CardTitle>
          <CardDescription>
            Announcements are shown to users based on their subscription tier and timing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No announcements created yet. Click &ldquo;Create Announcement&rdquo; to add one.
            </div>
          ) : (
            <div className="divide-y dark:divide-slate-700">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(announcement.type)}
                        <span className="font-medium text-slate-900 dark:text-white">
                          {announcement.title}
                        </span>
                        <Badge className={getTypeColor(announcement.type)}>
                          {announcement.type}
                        </Badge>
                        {announcement.isActive ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                        {announcement.message}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          From: {format(new Date(announcement.showFrom), "MMM d, yyyy")}
                        </div>
                        {announcement.showUntil && (
                          <div className="flex items-center gap-1">
                            Until: {format(new Date(announcement.showUntil), "MMM d, yyyy")}
                          </div>
                        )}
                        {announcement.targetTiers.length > 0 && (
                          <div>
                            Tiers: {announcement.targetTiers.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
