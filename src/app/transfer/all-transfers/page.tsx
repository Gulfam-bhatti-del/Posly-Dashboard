"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/card";
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
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { showSuccess, showError } from "@/lib/toast";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        showError("Error loading transfers");
        console.error("Error fetching transfers:", error);
        return;
      }

      if (data) {
        setTransfers(data);
        setTotalItems(count || 0);
      }
    } catch (error) {
      showError("Error loading transfers");
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
        showError("Error deleting transfer");
        console.error("Error deleting transfer:", error);
        return;
      }

      showSuccess("Transfer deleted successfully");
      fetchTransfers();
    } catch (error) {
      showError("Error deleting transfer");
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
        showError("Error exporting data");
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

      showSuccess("Data exported successfully");
    } catch (error) {
      showError("Error exporting data");
      console.error("Error exporting data:", error);
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const displayedTransfers = search ? filteredTransfers : transfers;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">All Transfers</h1>
        </div>

        <Card className="p-6">
          <div>
            <CardHeader>
              <div className="flex items-center justify-end gap-2 -mr-6">
                <Link href="/transfer/create-transfer">
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
                  <DropdownMenuItem onClick={exportToCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem>Export as Excel</DropdownMenuItem>
                  <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />{" "}
              <Input
                placeholder="Search adjustments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs pl-10"
              />
            </div>
          </div>{" "}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Date</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead>From Warehouse</TableHead>
                  <TableHead>To Warehouse</TableHead>
                  <TableHead>Total Products</TableHead>
                  <TableHead>Grand Total</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                        <span className="ml-2">Loading transfers...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : displayedTransfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-gray-500">
                        {search
                          ? "No transfers found matching your search"
                          : "No transfers found"}
                      </div>
                      {!search && (
                        <Link href="/transfers/create">
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
                      <TableCell>
                        <div className="font-medium">
                          {new Date(transfer.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(transfer.date).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {transfer.ref}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {transfer.from_warehouse_name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {transfer.to_warehouse_name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                          {transfer.total_products}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          $ {transfer.grand_total?.toFixed(2) || "0.00"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/transfers/${transfer.id}/edit`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
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
                                disabled={deleting === transfer.id}
                              >
                                {deleting === transfer.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
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
          {!loading && displayedTransfers.length > 0 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                Showing{" "}
                {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{" "}
                {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                {totalItems} entries
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {currentPage}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
