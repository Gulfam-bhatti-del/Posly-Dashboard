"use client";
import { Separator } from "@/components/ui/separator";
import React, { use, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Download,
  Filter,
  Loader2,
  Pen,
  Pencil,
  Plus,
  Search,
  X,
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

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    const { data, error } = await supabase.from("quotations").select("*");
    if (error) {
      console.error("Error fetching quotations:", error);
      return [];
    } else {
      setQuotations(data);
    }
  };

  const [categoryToDelete, setCategoryToDelete] = React.useState<{
    code: string;
    name: string;
  } | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // async function handleDeleteCategory(code: string) {
  //     try {
  //         setLoading(true);
  //         // Find the quotation by code
  //         const quotationToDelete = quotations.find(q => q.code === code);
  //         if (!quotationToDelete) {
  //             console.error("Quotation not found for code:", code);
  //             return;
  //         }
  //         // Delete from supabase
  //         const { error } = await supabase.from("quotations").delete().eq("id", quotationToDelete.id);
  //         if (error) {
  //             console.error("Error deleting quotation:", error);
  //         } else {
  //             setQuotations(quotations.filter(q => q.id !== q.id));
  //         }
  //     } finally {
  //         setLoading(false);
  //     }
  // }

  useEffect(() => {
    if (deleteDialogOpen) {
      const handleDeleteCategory = async (id: string) => {
        const { error } = await supabase
          .from("quotations")
          .delete()
          .eq("id", id);
        if (error) {
          console.error("Error deleting quotation:", error);
        } else {
          setQuotations(quotations.filter((q) => q.id !== id));
        }
      };
    }
  }, [deleteDialogOpen]);

  async function handleDeleteCategory(code: string) {
    try {
      setLoading(true);
      // Find the quotation by code
      const quotationToDelete = quotations.find((q) => q.code === code);
      if (!quotationToDelete) {
        console.error("Quotation not found for code:", code);
        return;
      }
      // Delete from supabase
      const { error } = await supabase
        .from("quotations")
        .delete()
        .eq("id", quotationToDelete.id);
      if (error) {
        console.error("Error deleting quotation:", error);
      } else {
        setQuotations(quotations.filter((q) => q.id !== quotationToDelete.id));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div>
        <h1 className="text-2xl font-semibold mb-4">All Quotations</h1>
        <Separator className="my-4" />
      </div>
      {/* Card Table for show all quotations */}
      <div>
        <Card className="p-4 mb-6">
          <CardHeader>
            <div className="flex items-center justify-end mb-6">
              <Link href="/quotations/add-quotation">
                <Button
                  variant="outline"
                  className="-mb-4 border border-blue-700 hover:bg-blue-700 mt-[14px] hover:text-white"
                >
                  <Plus /> Create
                </Button>
              </Link>
              <Button
                variant="outline"
                className="ml-2 -mb-4 border border-green-700 hover:bg-green-700 hover:text-white"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Select>
                  <SelectTrigger className="w-20">
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
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      EXPORT
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                    <DropdownMenuItem>Export as Excel</DropdownMenuItem>
                    <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Search..." className="pl-10" />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Warehouse</TableHead>
                  <TableHead className="text-right">Grand Total</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell>
                      {new Date(quotation.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{quotation.ref}</TableCell>
                    <TableCell>{quotation.customer}</TableCell>
                    <TableCell className="text-right">
                      {quotation.warehouse}
                    </TableCell>
                    <TableCell className="text-right">
                      ${quotation.grand_total}
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end space-x-2">
                      <Link href={`/quotations/edit-quotation/${quotation.id}`}>
                        <Pencil className="w-4 h-4 text-blue-600 cursor-pointer mr-2" />
                      </Link>
                      <X
                        className="w-4 h-4 text-red-500 cursor-pointer ml-2"
                        onClick={() => {
                          setCategoryToDelete({
                            code: quotation.code,
                            name: quotation.name,
                          });
                          setDeleteDialogOpen(true);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl shadow-2xl border-0 bg-gradient-to-br from-white via-red-50 to-red-100">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2" />
            </DialogHeader>
            <div className="flex flex-col items-center py-6">
              <AlertTriangle className="w-16 h-16 text-orange-400 mb-4" />
              <h2 className="text-2xl font-bold mb-2 text-gray-800">
                Are you sure ?
              </h2>
              <p className="text-gray-500 mb-6 text-center">
                You won't be able to revert this!
              </p>
              <div className="flex gap-4">
                <Button
                  variant="destructive"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      if (categoryToDelete) {
                        await handleDeleteCategory(categoryToDelete.code);
                      }
                      setDeleteDialogOpen(false);
                      setCategoryToDelete(null);
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? (
                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                  ) : null}
                  Yes, delete it
                </Button>
                <Button
                  variant="outline"
                  className="border-red-400 text-red-500 hover:bg-red-50"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setCategoryToDelete(null);
                  }}
                  disabled={loading}
                >
                  No, cancel!
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default Page;
