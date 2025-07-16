"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Loader2,
  Download,
  MoreVertical,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MdOfflineBolt } from "react-icons/md"; // Assuming this is correctly imported
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton component

type Adjustment = {
  id: string;
  ref: string;
  date: string;
  warehouse_id: number;
  warehouse_name: string;
  total_products: number;
  details: string;
  created_at: string;
};

export default function AdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [filteredAdjustments, setFilteredAdjustments] = useState<Adjustment[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchAdjustments();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    filterAdjustments();
  }, [search, adjustments]);

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const { data, error, count } = await supabase
        .from("adjustments_with_details")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage - 1
        );

      if (error) {
        console.error("Error fetching adjustments:", error);
        toast.error("Error loading adjustments");
        return;
      }

      if (data) {
        setAdjustments(data);
        setTotalItems(count || 0);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error loading adjustments");
    } finally {
      setLoading(false);
    }
  };

  const filterAdjustments = () => {
    if (!search.trim()) {
      setFilteredAdjustments(adjustments);
      return;
    }

    const filtered = adjustments.filter(
      (adj) =>
        adj.ref?.toLowerCase().includes(search.toLowerCase()) ||
        adj.warehouse_name?.toLowerCase().includes(search.toLowerCase()) ||
        adj.details?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredAdjustments(filtered);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase
        .from("adjustments")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting adjustment:", error);
        toast.error("Error deleting adjustment");
        return;
      }

      toast.success("Adjustment deleted successfully");
      fetchAdjustments();
    } catch (error) {
      console.error("Error deleting adjustment:", error);
      toast.error("Error deleting adjustment");
    } finally {
      setDeleting(null);
    }
  };

  const exportToCSV = async () => {
    try {
      const { data, error } = await supabase
        .from("adjustments_with_details")
        .select("*");

      if (error || !data) {
        toast.error("Error exporting data");
        return;
      }

      const csvContent = [
        ["Date", "Reference", "Warehouse", "Total Products", "Details"].join(
          ","
        ),
        ...data.map((adj) =>
          [
            new Date(adj.date).toLocaleDateString(),
            adj.ref || "",
            adj.warehouse_name || "",
            adj.total_products || 0,
            `"${adj.details || ""}"`,
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `adjustments-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Data exported successfully!");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Error exporting data");
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const displayedAdjustments = search ? filteredAdjustments : adjustments;

  // Mobile Adjustment Card Component
  const AdjustmentCard = ({ adj }: { adj: Adjustment }) => (
    <Card className="mb-4 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-4">
            {" "}
            {/* Added pr-4 for spacing */}
            <h3 className="font-semibold text-gray-900 truncate">
              {adj.ref || "N/A"}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {adj.warehouse_name || `Warehouse ${adj.warehouse_id}`}
            </p>
            <div className="flex flex-wrap items-center gap-x-2 mt-1 text-sm text-gray-500">
              <span>{new Date(adj.date).toLocaleDateString()}</span>
              <span>{new Date(adj.date).toLocaleTimeString()}</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                {adj.total_products || 0} items
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {adj.details
                ? adj.details.length > 60
                  ? `${adj.details.substring(0, 60)}...`
                  : adj.details
                : "No details"}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/adjustment/all-adjustments/${adj.id}`}>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
              </Link>
              <Link href={`/adjustment/all-adjustments/${adj.id}/edit`}>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()} // Prevent dropdown from closing
                    className="text-red-600"
                    disabled={deleting === adj.id}
                  >
                    {deleting === adj.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Adjustment</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete adjustment{" "}
                      <strong>{adj.ref}</strong>? This action cannot be undone
                      and will also delete all associated adjustment items.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(adj.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
            Stock Adjustments
          </h1>
          <Separator className="my-5" />
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-2 sm:space-y-0">
                <Skeleton className="h-8 w-24 sm:w-32" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-6">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-24" />
                </div>
                <Skeleton className="h-9 w-full sm:w-64" />
              </div>
              <Separator className="mb-6" />
              <div className="space-y-4">
                {Array.from({ length: itemsPerPage }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <ToastContainer position="top-center" />
      <div className="max-w-7xl mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
            Stock Adjustments
          </h1>
          <Separator className="my-5" />
        </div>

        <Card className="p-4 sm:p-6">
          <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-3 sm:space-y-0">
            <Link href="/adjustment/create-adjustment">
              <Button
                variant="outline"
                className="border border-blue-700 hover:bg-blue-700 hover:text-white w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </Link>
            <Button
              variant="outline"
              className="border border-green-700 hover:bg-green-700 hover:text-white w-full sm:w-auto ml-0 sm:ml-2" // Added ml-0 sm:ml-2
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-6">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-full sm:w-20 border-gray-300">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto border-gray-300 hover:bg-gray-50 hidden sm:inline-flex"
                    onClick={exportToCSV}
                  >
                    EXPORT
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={exportToCSV}>
                    Export as CSV
                  </DropdownMenuItem>
                  {/* You can add more export options here if needed */}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                className="sm:hidden w-auto"
                onClick={exportToCSV}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search adjustments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10"
              />
            </div>
          </div>
          <div className="border rounded-lg overflow-x-auto hidden lg:block">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Reference</TableHead>
                  <TableHead className="whitespace-nowrap">Warehouse</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Total Products
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Details</TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedAdjustments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-gray-500">
                        {search
                          ? "No adjustments found matching your search"
                          : "No adjustments found"}
                      </div>
                      {!search && (
                        <div className="mt-4 p-4 text-center border border-red-600 bg-red-100 text-red-800 rounded-md max-w-sm mx-auto flex items-center justify-center space-x-2">
                          <MdOfflineBolt className="w-5 h-5" />
                          <p>
                            Seen the offline? Check your internet connection.
                          </p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedAdjustments.map((adj) => (
                    <TableRow key={adj.id} className="hover:bg-gray-50">
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">
                          {new Date(adj.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(adj.date).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {adj.ref || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="font-medium">
                          {adj.warehouse_name ||
                            `Warehouse ${adj.warehouse_id}`}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {adj.total_products || 0} items
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="text-gray-600 text-sm">
                          {adj.details
                            ? adj.details.length > 40
                              ? `${adj.details.substring(0, 40)}...`
                              : adj.details
                            : "No details"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/adjustment/all-adjustments/${adj.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link
                            href={`/adjustment/all-adjustments/${adj.id}/edit`}
                          >
                            <Button size="sm" variant="outline" title="Edit">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                                title="Delete"
                                disabled={deleting === adj.id}
                              >
                                {deleting === adj.id ? (
                                  <Loader2 className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Adjustment
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete adjustment{" "}
                                  <strong>{adj.ref}</strong>? This action cannot
                                  be undone and will also delete all associated
                                  adjustment items.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(adj.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            {displayedAdjustments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {search
                  ? "No adjustments found matching your search"
                  : "No adjustments found"}
                {!search && (
                  <div className="mt-4 p-4 text-center border border-red-600 bg-red-100 text-red-800 rounded-md max-w-sm mx-auto flex items-center justify-center space-x-2">
                    <MdOfflineBolt className="w-5 h-5" />
                    <p>Seen the offline? Check your internet connection.</p>
                  </div>
                )}
              </div>
            ) : (
              displayedAdjustments.map((adj) => (
                <AdjustmentCard key={adj.id} adj={adj} />
              ))
            )}
          </div>

          {!loading && displayedAdjustments.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 space-y-3 sm:space-y-0">
              <div className="text-sm text-gray-600 text-center sm:text-left w-full sm:w-auto">
                Showing{" "}
                {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{" "}
                {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                {totalItems} entries
                {search && ` (filtered from ${adjustments.length} total)`}
              </div>

              <div className="flex items-center justify-center space-x-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="text-xs sm:text-sm"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 p-0 text-xs sm:text-sm ${
                          currentPage === pageNum
                            ? "bg-blue-600 hover:bg-blue-700"
                            : ""
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="text-xs sm:text-sm"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
