import nextDynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  FolderOpen,
} from "lucide-react";
import { getDocumentsPageData } from "@/lib/actions/documents";
import { DocumentActions } from "@/components/documents/document-actions";
import { CategorySidebar } from "@/components/documents/category-sidebar";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

// Dynamic import for dialog - not needed on initial render
const UploadDocumentDialog = nextDynamic(
  () => import("@/components/documents/upload-dialog").then((mod) => mod.UploadDocumentDialog),
  {
    loading: () => <Skeleton className="h-10 w-40" />,
  }
);

function getStatusBadge(status: string) {
  switch (status) {
    case "CURRENT":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Current
        </Badge>
      );
    case "EXPIRING_SOON":
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-100">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Expiring Soon
        </Badge>
      );
    case "EXPIRED":
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    case "NEEDS_REVIEW":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-white">
          <Clock className="h-3 w-3 mr-1" />
          Needs Review
        </Badge>
      );
    case "PENDING_APPROVAL":
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Pending Approval
        </Badge>
      );
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
}

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function DocumentsPage({ searchParams }: PageProps) {
  // Optimized: Single auth call + parallel DB queries
  const data = await getDocumentsPageData();
  const params = await searchParams;
  const selectedCategoryId = params.category;

  const allDocuments = data?.documents || [];
  const categories = data?.categories || [];
  const stats = data?.stats;

  // Filter documents by category if selected
  const documents = selectedCategoryId
    ? allDocuments.filter(doc => doc.DocumentType?.DocumentCategory?.id === selectedCategoryId)
    : allDocuments;

  // Calculate document count per category
  const documentCountByCategory: Record<string, number> = {};
  allDocuments.forEach(doc => {
    const catId = doc.DocumentType?.DocumentCategory?.id;
    if (catId) {
      documentCountByCategory[catId] = (documentCountByCategory[catId] || 0) + 1;
    }
  });

  // Get selected category name for header
  const selectedCategory = selectedCategoryId
    ? categories.find(c => c.id === selectedCategoryId)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {selectedCategory ? selectedCategory.name : "OHSC Documents"}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {selectedCategory
              ? `Viewing ${documents.length} document${documents.length !== 1 ? "s" : ""} in ${selectedCategory.name}`
              : "Manage all your OHSC compliance documents in one place"
            }
          </p>
        </div>
        <UploadDocumentDialog />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-white">{stats?.current || 0}</p>
                <p className="text-xs text-green-600 dark:text-green-400">Current</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-amber-700 dark:text-white">{stats?.expiringSoon || 0}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-2xl font-bold text-red-700 dark:text-white">{stats?.expired || 0}</p>
                <p className="text-xs text-red-600 dark:text-red-400">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600 dark:text-white" />
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-white">0</p>
                <p className="text-xs text-blue-600 dark:text-blue-300">Needs Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <div>
                <p className="text-2xl font-bold text-slate-700 dark:text-white">{stats?.total || 0}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Category Sidebar */}
        <CategorySidebar
          categories={categories}
          totalDocuments={stats?.total || 0}
          documentCountByCategory={documentCountByCategory}
        />

        {/* Documents Table */}
        <Card className="flex-1">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search documents..."
                  className="pl-9"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="CURRENT">Current</SelectItem>
                    <SelectItem value="EXPIRING_SOON">Expiring Soon</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="NEEDS_REVIEW">Needs Review</SelectItem>
                    <SelectItem value="PENDING_APPROVAL">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Document Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 mb-2">
                        {selectedCategory
                          ? `No documents in ${selectedCategory.name}`
                          : "No documents uploaded yet"
                        }
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">
                        {selectedCategory
                          ? "Upload a document and select this category to see it here"
                          : "Click \"Upload Document\" to add your first document"
                        }
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{doc.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Version {doc.version}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {doc.DocumentType?.DocumentCategory?.name || "Uncategorized"}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {doc.expiryDate ? format(new Date(doc.expiryDate), "MMM d, yyyy") : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {format(new Date(doc.createdAt), "MMM d, yyyy")}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">by {doc.User_Document_uploadedByIdToUser?.name || "Unknown"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DocumentActions
                          document={{
                            id: doc.id,
                            title: doc.title,
                            fileUrl: doc.fileUrl,
                            fileName: doc.fileName,
                            version: doc.version,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
