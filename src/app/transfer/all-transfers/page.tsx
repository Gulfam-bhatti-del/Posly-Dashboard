"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card"; // Added CardContent
import { Separator } from "@/components/ui/separator"; // Separator might be needed
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
  Edit,
  Trash2,
  Plus,
  Download,
  Search,
  Loader2, // Added Loader2 for loading spinners
  ChevronLeft, // Added for pagination
  ChevronRight, // Added for pagination
  MoreVertical, // Added for mobile card dropdown
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast, ToastContainer } from "react-toastify"; // Combined imports for toast
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton component

type Transfer = {
  id: string;
  ref: string;
  date: string;
  from_warehouse_id: number;
  to_warehouse_id: number;
  from_warehouse_name: string;
  to_warehouse_name: string;
  total_products: number;
  grand_total: number;
  status: string;
  created_at: string;
};

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchTransfers();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    filterTransfers();
  }, [search, transfers]);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const { data, error, count } = await supabase
        .from("transfers_with_details")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage - 1
        );

      if (error) {
        toast.error("Error loading transfers");
        console.error("Error fetching transfers:", error);
        return;
      }

      if (data) {
        setTransfers(data);
        setTotalItems(count || 0);
      }
    } catch (error) {
      toast.error("Error loading transfers");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransfers = () => {
    if (!search.trim()) {
      setFilteredTransfers(transfers);
      return;
    }

    const filtered = transfers.filter(
      (transfer) =>
        transfer.ref?.toLowerCase().includes(search.toLowerCase()) ||
        transfer.from_warehouse_name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        transfer.to_warehouse_name?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredTransfers(filtered);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase.from("transfers").delete().eq("id", id);

      if (error) {
        toast.error("Error deleting transfer");
        console.error("Error deleting transfer:", error);
        return;
      }

      toast.success("Transfer deleted successfully");
      fetchTransfers();
    } catch (error) {
      toast.error("Error deleting transfer");
      console.error("Error deleting transfer:", error);
    } finally {
      setDeleting(null);
    }
  };

  const exportToCSV = async () => {
    try {
      const { data, error } = await supabase
        .from("transfers_with_details")
        .select("*");

      if (error || !data) {
        toast.error("Error exporting data");
        return;
      }

      const csvContent = [
        [
          "Date",
          "Reference",
          "From Warehouse",
          "To Warehouse",
          "Total Products",
          "Grand Total",
          "Status",
        ].join(","),
        ...data.map((transfer) =>
          [
            new Date(transfer.date).toLocaleDateString(),
            transfer.ref || "",
            transfer.from_warehouse_name || "",
            transfer.to_warehouse_name || "",
            transfer.total_products || 0,
            transfer.grand_total || 0,
            transfer.status || "",
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `transfers-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Data exported successfully");
    } catch (error) {
      toast.error("Error exporting data");
      console.error("Error exporting data:", error);
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const displayedTransfers = search ? filteredTransfers : transfers;

  // Mobile Transfer Card Component
  const TransferCard = ({ transfer }: { transfer: Transfer }) => (
    <Card className="mb-4 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="font-semibold text-gray-900 truncate">
              {transfer.ref}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              From: {transfer.from_warehouse_name} to:{" "}
              {transfer.to_warehouse_name}
            </p>
            <div className="flex flex-wrap items-center gap-x-2 mt-1 text-sm text-gray-500">
              <span>{new Date(transfer.date).toLocaleDateString()}</span>
              <span>{new Date(transfer.date).toLocaleTimeString()}</span>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                {transfer.total_products} items
              </span>
              <span className="font-semibold text-blue-600">
                ${transfer.grand_total?.toFixed(2) || "0.00"}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  transfer.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {transfer.status}
              </span>
            </div>
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
              <Link href={`/transfers/${transfer.id}/edit`}>
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
                    disabled={deleting === transfer.id}
                  >
                    {deleting === transfer.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Transfer</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete transfer{" "}
                      <strong>{transfer.ref}</strong>? This action cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(transfer.id)}
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
            All Transfers
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
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
            All Transfers
          </h1>
          <Separator className="my-5" />
        </div>

        <Card className="p-4 sm:p-6">
          <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-3 sm:space-y-0">
            <Link href="/transfer/create-transfer">
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
              className="border border-green-700 hover:bg-green-700 hover:text-white w-full sm:w-auto ml-0 sm:ml-2"
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
                    <Download className="w-4 h-4 mr-2" />
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
                placeholder="Search transfers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10"
              />
            </div>
          </div>
          <div className="border rounded-lg overflow-x-auto hidden lg:block">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Ref</TableHead>
                  <TableHead className="whitespace-nowrap">
                    From Warehouse
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    To Warehouse
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Total Products
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Grand Total
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedTransfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-gray-500">
                        {search
                          ? "No transfers found matching your search"
                          : "No transfers found"}
                      </div>
                      {!search && (
                        <Link href="/transfer/create-transfer">
                          <Button className="mt-4">
                            Create Your First Transfer
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedTransfers.map((transfer) => (
                    <TableRow key={transfer.id} className="hover:bg-gray-50">
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">
                          {new Date(transfer.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(transfer.date).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {transfer.ref}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="font-medium">
                          {transfer.from_warehouse_name}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="font-medium">
                          {transfer.to_warehouse_name}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                          {transfer.total_products}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="font-semibold">
                          $ {transfer.grand_total?.toFixed(2) || "0.00"}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transfer.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {transfer.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/transfers/${transfer.id}/edit`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                                title="Delete"
                                disabled={deleting === transfer.id}
                              >
                                {deleting === transfer.id ? (
                                  <Loader2 className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Transfer
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete transfer{" "}
                                  <strong>{transfer.ref}</strong>? This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(transfer.id)}
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
            {displayedTransfers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {search
                  ? "No transfers found matching your search"
                  : "No transfers found"}
                {!search && (
                  <Link href="/transfer/create-transfer">
                    <Button className="mt-4">Create Your First Transfer</Button>
                  </Link>
                )}
              </div>
            ) : (
              displayedTransfers.map((transfer) => (
                <TransferCard key={transfer.id} transfer={transfer} />
              ))
            )}
          </div>

          {!loading && displayedTransfers.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 space-y-3 sm:space-y-0">
              <div className="text-sm text-gray-600 text-center sm:text-left w-full sm:w-auto">
                Showing{" "}
                {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{" "}
                {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                {totalItems} entries
                {search && ` (filtered from ${transfers.length} total)`}
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
