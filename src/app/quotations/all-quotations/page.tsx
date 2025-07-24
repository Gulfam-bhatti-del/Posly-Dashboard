"use client";
import { Separator } from "@/components/ui/separator";
import React, { useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Download,
  Filter,
  Loader2,
  Plus,
  Search,
  X,
  Pencil,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Dialog } from "@radix-ui/react-dialog";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function Page() {
  const [quotations, setQuotations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [categoryToDelete, setCategoryToDelete] = React.useState<{
    code: string;
    name: string;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("quotations").select("*");
    if (error) {
      console.error("Error fetching quotations:", error);
      setQuotations([]);
    } else {
      setQuotations(data);
    }
    setLoading(false);
  };

  async function handleDeleteQuotation(code: string) {
    setLoading(true);
    try {
      const quotationToDelete = quotations.find((q) => q.code === code);
      if (!quotationToDelete) {
        console.error("Quotation not found for code:", code);
        return;
      }
      const { error } = await supabase
        .from("quotations")
        .delete()
        .eq("id", quotationToDelete.id);
      if (error) {
        console.error("Error deleting quotation:", error);
      } else {
        setQuotations(quotations.filter((q) => q.id !== quotationToDelete.id));
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
      }
    } catch (error) {
      console.error("An unexpected error occurred during deletion:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Page Title and Separator */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">
        All Quotations
      </h1>
      <Separator className="my-6" />

      {/* Main Card for Quotations Table */}
      <Card className="shadow-lg rounded-lg">
        <CardHeader className="p-4 sm:p-6 lg:p-8">
          {/* Action Buttons: Create & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mb-6">
            <Link href="/quotations/add-quotation" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors duration-200 ease-in-out"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span>Create New</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto border border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-colors duration-200 ease-in-out"
            >
              <Filter className="w-4 h-4 mr-2" />
              <span>Filter</span>
            </Button>
          </div>

          {/* Table Controls: Show Entries, Export, Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Select Entries */}
              <Select>
                <SelectTrigger className="w-full sm:w-[100px] text-sm">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>

              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    <span>EXPORT</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="text-sm">
                  <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem>Export as Excel</DropdownMenuItem>
                  <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search..."
                className="pl-10 w-full text-sm"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
                <span className="ml-3 text-gray-600">Loading quotations...</span>
              </div>
            ) : quotations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                <AlertTriangle className="w-10 h-10 mb-3 text-yellow-500" />
                <p className="text-lg font-medium">No quotations found.</p>
                <p className="text-sm">Start by creating a new quotation.</p>
              </div>
            ) : (
              <Table className="min-w-full divide-y divide-gray-200">
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ref
                    </TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Warehouse
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white divide-y divide-gray-200">
                  {quotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                        {new Date(quotation.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                        {quotation.ref}
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                        {quotation.customer}
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-800">
                        {quotation.warehouse}
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-800">
                        {/* THE FIX IS HERE: Ensure grand_total is a number */}
                        ${Number(quotation.grand_total || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/quotations/edit-quotation/${quotation.id}`}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:bg-red-50 transition-colors duration-200"
                            onClick={() => {
                              setCategoryToDelete({
                                code: quotation.code,
                                name: quotation.customer,
                              });
                              setDeleteDialogOpen(true);
                            }}
                            title="Delete"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-xs sm:max-w-md rounded-xl p-6 bg-white shadow-2xl border border-gray-100 flex flex-col items-center text-center">
          <AlertTriangle className="w-16 h-16 text-orange-500 mb-4" />
          <DialogTitle className="text-2xl font-bold mb-2 text-gray-800">
            Are you sure?
          </DialogTitle>
          <p className="text-gray-600 mb-6 text-base">
            You are about to delete the quotation for{" "}
            <span className="font-semibold">{categoryToDelete?.name || "this item"}</span>{" "}
            (<span className="font-semibold">{categoryToDelete?.code || "N/A"}</span>). This action cannot be undone.
          </p>
          <div className="flex gap-4">
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md transition-colors duration-200 text-base font-medium"
              onClick={() => {
                if (categoryToDelete) {
                  handleDeleteQuotation(categoryToDelete.code);
                }
              }}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
              ) : null}
              Yes, Delete It!
            </Button>
            <Button
              variant="outline"
              className="border border-gray-300 text-gray-700 hover:bg-gray-100 px-6 py-2 rounded-md transition-colors duration-200 text-base font-medium"
              onClick={() => {
                setDeleteDialogOpen(false);
                setCategoryToDelete(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Page;