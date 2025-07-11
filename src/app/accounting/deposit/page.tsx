"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Plus,
  Search,
  ChevronDown,
} from "lucide-react";
import { supabase, type Deposit } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [depositToDelete, setDepositToDelete] = useState<Deposit | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      const { data, error } = await supabase
        .from("deposits")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setDeposits(data || []);
    } catch (error) {
      console.error("Error fetching deposits:", error);
      toast.error("Failed to fetch deposits");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeposit = async (deposit: Deposit) => {
    setDeleteLoading(true);
    try {
      if (deposit.attachment_url) {
        const fileName = deposit.attachment_url.split("/").pop();
        if (fileName) {
          await supabase.storage.from("deposit-attachments").remove([fileName]);
        }
      }

      const { error } = await supabase
        .from("deposits")
        .delete()
        .eq("id", deposit.id);

      if (error) {
        throw error;
      }

      setDeposits(deposits.filter((d) => d.id !== deposit.id));
      toast.success("Deposit deleted successfully");
    } catch (error) {
      console.error("Error deleting deposit:", error);
      toast.error("Failed to delete deposit");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredDeposits = deposits.filter(
    (deposit) =>
      deposit.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.deposit_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEntries = filteredDeposits.length;
  const startIndex = (currentPage - 1) * Number.parseInt(pageSize);
  const endIndex = Math.min(
    startIndex + Number.parseInt(pageSize),
    totalEntries
  );
  const paginatedDeposits = filteredDeposits.slice(startIndex, endIndex);
  const totalPages = Math.ceil(totalEntries / Number.parseInt(pageSize));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4">
      <ToastContainer />
      <div>
        <h1 className="text-2xl font-semibold mb-4">Deposit List</h1>
        <Separator className="my-4" />
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-end">
            <Link href="/accounting/deposit/create">
              <Button
                variant="outline"
                className="border border-blue-700 hover:bg-blue-700 hover:text-white hover:shadow-2xl"
              >
                <Plus /> Create
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Select value={pageSize} onValueChange={setPageSize}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="cursor-pointer">
                  <Button variant="outline" size="sm">
                    EXPORT
                    <ChevronDown />
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
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Deposit Ref</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDeposits.map((deposit) => (
                  <TableRow key={deposit.id}>
                    <TableCell className="font-medium">
                      {deposit.account_name}
                    </TableCell>
                    <TableCell>
                        {deposit.deposit_ref}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{formatDate(deposit.date)}</div>
                        <div className="text-sm text-gray-500">
                          {formatTime(deposit.created_at)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{deposit.amount}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{deposit.category}</Badge>
                    </TableCell>
                    <TableCell>{deposit.payment_method}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/accounting/deposit/${deposit.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4 text-green-600" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDepositToDelete(deposit);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {endIndex} of {totalEntries} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant={currentPage === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(1)}
              >
                1
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="max-w-md rounded-2xl shadow-2xl border-0 bg-gradient-to-br from-white via-red-50 to-red-100">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2" />
              </DialogHeader>
              <div className="flex flex-col items-center py-6">
                <AlertTriangle className="w-16 h-16 text-orange-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2 text-gray-800">
                  Are you sure?
                </h2>
                <p className="text-gray-500 mb-6 text-center">
                  You won't be able to revert this!
                </p>
                <div className="flex gap-4">
                  <Button
                    variant="destructive"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                    onClick={async () => {
                      if (depositToDelete) {
                        await handleDeleteDeposit(depositToDelete);
                        setDeleteDialogOpen(false);
                        setDepositToDelete(null);
                      }
                    }}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                    ) : null}
                    Yes, delete it
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-400 text-red-500 hover:bg-red-50 bg-transparent"
                    onClick={() => {
                      setDeleteDialogOpen(false);
                      setDepositToDelete(null);
                    }}
                    disabled={deleteLoading}
                  >
                    No, cancel!
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
