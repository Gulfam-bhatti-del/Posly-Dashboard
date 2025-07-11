"use client";
import { Separator } from "@/components/ui/separator";
import React, { use, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ChevronDown,
  Loader2,
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
import { toast, ToastContainer } from "react-toastify";

function Page() {
  const [accounts, setaccounts] = React.useState<any[]>([]);

  useEffect(() => {
    fetchaccounts();
  }, []);

  const fetchaccounts = async () => {
    const { data, error } = await supabase.from("accounts").select("*");
    if (error) {
      console.error("Error fetching accounts:", error);
      return [];
    } else {
      setaccounts(data);
      toast.success('Accounts fetched successfully')
    }
  };

  const [categoryToDelete, setCategoryToDelete] = React.useState<{
    code: string;
    name: string;
  } | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleDeleteCategory(code: string) {
    try {
      setLoading(true);
      const accountToDelete = accounts.find((q) => q.code === code);
      if (!accountToDelete) {
        console.error("account not found for code:", code);
        return;
      }
      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", accountToDelete.id);
      if (error) {
        console.error("Error deleting account:", error);
      } else {
        setaccounts(accounts.filter((q) => q.id !== accountToDelete.id));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <ToastContainer />
      <div>
        <h1 className="text-2xl font-semibold mb-4">All accounts</h1>
        <Separator className="my-4" />
      </div>
      <div>
        <Card className="p-4 mb-6">
          <CardHeader>
            <div className="flex items-center justify-end mb-6">
              <Link href="/accounting/account/create">
                <Button
                  variant="outline"
                  className="-mb-4 border border-blue-700 hover:bg-blue-700 mt-[14px] hover:text-white hover:shadow-2xl"
                >
                  <Plus /> Create
                </Button>
              </Link>
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
                  <TableHead>Account Name</TableHead>
                  <TableHead>Account Num</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>{account.account_name}</TableCell>
                    <TableCell>{account.account_num}</TableCell>
                    <TableCell>{account.account_balance}</TableCell>
                    <TableCell className="text-right flex items-center justify-end space-x-2">
                      <Link href={`/accounting/account/${account.id}/edit`}>
                        <Pencil className="w-4 h-4 text-blue-600 cursor-pointer mr-2" />
                      </Link>
                      <X
                        className="w-4 h-4 text-red-500 cursor-pointer ml-2"
                        onClick={() => {
                          setCategoryToDelete({
                            code: account.code,
                            name: account.name,
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
