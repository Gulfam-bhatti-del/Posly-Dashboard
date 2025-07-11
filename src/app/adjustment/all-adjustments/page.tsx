"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/card";
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
  Download,
  Plus,
  Search,
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
import { MdOfflineBolt } from "react-icons/md";

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
        alert("Error loading adjustments");
        return;
      }

      if (data) {
        setAdjustments(data);
        setTotalItems(count || 0);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error loading adjustments");
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
        alert("Error deleting adjustment");
        return;
      }

      alert("Adjustment deleted successfully");
      fetchAdjustments();
    } catch (error) {
      console.error("Error deleting adjustment:", error);
      alert("Error deleting adjustment");
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
        alert("Error exporting data");
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
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Error exporting data");
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const displayedAdjustments = search ? filteredAdjustments : adjustments;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Stock Adjustments</h1>
          <Separator className="my-5" />
        </div>

        <Card className="p-6">
          <div>
            <CardHeader>
              <div className="flex items-center justify-end gap-2 -mr-6">
                <Link href="/adjustment/create-adjustment">
                  <Button
                    variant="outline"
                    className="border border-blue-700 hover:bg-blue-700 hover:text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="border border-green-700 hover:bg-green-700 hover:text-white"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>
            </CardHeader>
          </div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Select>
                <SelectTrigger className="w-20 border-gray-300">
                  <SelectValue defaultValue="10" placeholder="10" />
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
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    EXPORT
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem>Export as Excel</DropdownMenuItem>
                  <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="relative">
              {" "}
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />{" "}
              <Input
                placeholder="Search adjustments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs pl-10"
              />{" "}
            </div>
          </div>{" "}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Total Products</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                        <span className="ml-2">Loading adjustments...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : displayedAdjustments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-gray-500">
                        {search
                          ? "No adjustments found matching your search"
                          : "No adjustments found"}
                      </div>
                      {!search && (
                          <div className="mt-4 w-64 h-14 text-center justify-center items-center m-auto border border-red-600 bg-red-300">
                            <p className="mt-2">Seen the offline
                              <pre />
                              check you're internet connection
                            </p>
                          </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedAdjustments.map((adj) => (
                    <TableRow key={adj.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium">
                          {new Date(adj.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(adj.date).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {adj.ref || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {adj.warehouse_name ||
                            `Warehouse ${adj.warehouse_id}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {adj.total_products || 0} items
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600 text-sm">
                          {adj.details
                            ? adj.details.length > 40
                              ? `${adj.details.substring(0, 40)}...`
                              : adj.details
                            : "No details"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
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
                          <Link href={`/adjustment/all-adjustments/${adj.id}/edit`}>
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
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
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
          {!loading && displayedAdjustments.length > 0 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                Showing{" "}
                {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{" "}
                {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                {totalItems} entries
                {search && ` (filtered from ${adjustments.length} total)`}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
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
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
