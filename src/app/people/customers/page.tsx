"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { supabase } from "@/lib/supabase";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  PlusIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  Search,
  Download,
  Loader2,
  UserIcon,
  MoreVertical,
} from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

type Customer = {
  id: number;
  code: number;
  full_name: string;
  phone: string;
  total_sale_due: number;
  total_sell_return_due: number;
  status: string;
  image_path: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState<Omit<Customer, "id" | "code">>({
    full_name: "",
    phone: "",
    total_sale_due: 0,
    total_sell_return_due: 0,
    status: "Client Actif",
    image_path: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("code", { ascending: false });
      if (!error && data) {
        setCustomers(data);
      } else if (error) {
        toast.error("Failed to fetch customers");
        console.error("Error fetching customers:", error);
      }
    } catch (error) {
      toast.error("Failed to fetch customers");
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  }

  // Reset form and states
  function resetForm() {
    setForm({
      full_name: "",
      phone: "",
      total_sale_due: 0,
      total_sell_return_due: 0,
      status: "Client Actif",
      image_path: "",
    });
    setImageFile(null);
    setEditingCustomer(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Open create dialog
  function handleCreateClick() {
    resetForm();
    setOpen(true);
  }

  // Open edit dialog
  function handleEditClick(customer: Customer) {
    setEditingCustomer(customer);
    setForm({
      full_name: customer.full_name,
      phone: customer.phone,
      total_sale_due: customer.total_sale_due,
      total_sell_return_due: customer.total_sell_return_due,
      status: customer.status,
      image_path: customer.image_path,
    });
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setOpen(true);
  }

  // Open delete confirmation dialog
  function handleDeleteClick(customer: Customer) {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  }

  // Create or update customer
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingCustomer) {
        setEditLoading(true);
      } else {
        setCreateLoading(true);
      }

      let image_path = form.image_path;

      // Handle image upload if new file is selected
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, imageFile, { upsert: false });

        if (!uploadError) {
          // Delete old image if editing and had previous image
          if (editingCustomer && editingCustomer.image_path) {
            await supabase.storage
              .from("avatars")
              .remove([editingCustomer.image_path]);
          }
          image_path = fileName;
        } else {
          toast.error("Failed to upload image");
          return;
        }
      }

      if (editingCustomer) {
        // Update existing customer
        const { error } = await supabase
          .from("customers")
          .update({
            ...form,
            image_path,
          })
          .eq("id", editingCustomer.id);

        if (!error) {
          toast.success("Customer updated successfully!");
          setOpen(false);
          resetForm();
          fetchCustomers();
        } else {
          toast.error("Failed to update customer");
        }
      } else {
        // Create new customer
        const maxCode = customers.length
          ? Math.max(...customers.map((c) => c.code))
          : 0;
        const { error } = await supabase.from("customers").insert([
          {
            ...form,
            code: maxCode + 1,
            image_path,
          },
        ]);

        if (!error) {
          toast.success("Customer created successfully!");
          setOpen(false);
          resetForm();
          fetchCustomers();
        } else {
          toast.error("Failed to create customer");
        }
      }
    } catch (error) {
      toast.error(
        editingCustomer
          ? "Failed to update customer"
          : "Failed to create customer"
      );
      console.error("Error:", error);
    } finally {
      setCreateLoading(false);
      setEditLoading(false);
    }
  }

  // Delete customer
  async function handleDelete() {
    if (!customerToDelete) return;

    try {
      setDeleteLoading(true);

      // Delete image from storage if exists
      if (customerToDelete.image_path) {
        await supabase.storage
          .from("avatars")
          .remove([customerToDelete.image_path]);
      }

      // Delete customer record
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerToDelete.id);

      if (!error) {
        toast.success("Customer deleted successfully!");
        setDeleteDialogOpen(false);
        setCustomerToDelete(null);
        fetchCustomers();
      } else {
        toast.error("Failed to delete customer");
      }
    } catch (error) {
      toast.error("Failed to delete customer");
      console.error("Error deleting customer:", error);
    } finally {
      setDeleteLoading(false);
    }
  }

  // Filter customers based on search term
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.code.toString().includes(searchTerm)
  );

  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalPages = Math.ceil(filteredCustomers.length / pageSize);

  // Mobile Customer Card Component
  const CustomerCard = ({ customer }: { customer: Customer }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={
                  customer.image_path
                    ? `${supabaseUrl}/storage/v1/object/public/avatars/${customer.image_path}`
                    : defaultAvatar
                }
                alt={customer.full_name}
              />
              <AvatarFallback>
                <UserIcon className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {customer.full_name}
              </h3>
              <p className="text-sm text-gray-600 truncate">{customer.phone}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge
                  variant={
                    customer.status === "Client Actif" ? "default" : "secondary"
                  }
                  className={`text-xs ${
                    customer.status === "Client Actif"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {customer.status}
                </Badge>
                <span className="text-xs text-gray-500">
                  Code: {customer.code}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <div>Sale Due: ${customer.total_sale_due.toFixed(2)}</div>
                <div>
                  Return Due: ${customer.total_sell_return_due.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditClick(customer)}>
                <EditIcon className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteClick(customer)}
                className="text-red-600"
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <Skeleton className="h-6 w-24 sm:h-8 sm:w-32" />
                <Skeleton className="h-8 w-20 sm:h-10 sm:w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    <Skeleton className="h-8 w-12 sm:h-10 sm:w-16" />
                    <Skeleton className="h-8 w-20 sm:h-10 sm:w-24" />
                  </div>
                  <Skeleton className="h-8 w-full sm:h-10 sm:w-64" />
                </div>
                <Separator />
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-24 sm:h-4 sm:w-32" />
                        <Skeleton className="h-3 w-32 sm:h-4 sm:w-48" />
                      </div>
                      <div className="hidden sm:flex space-x-2">
                        <Skeleton className="h-6 w-12 sm:h-6 sm:w-16" />
                        <Skeleton className="h-4 w-16 sm:h-4 sm:w-24" />
                      </div>
                      <div className="flex space-x-1 sm:space-x-2">
                        <Skeleton className="h-6 w-6 sm:h-8 sm:w-8" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 -mt-3">
          <h1 className="text-2xl sm:text-3x mb-3">Client list</h1>
          <Separator />
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div></div>
              <Button
                onClick={handleCreateClick}
                variant="outline"
                className="bg-blue-500 hover:text-white text-white hover:bg-blue-600 cursor-pointer -mb-5 w-full sm:w-auto ml-auto"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => setPageSize(Number(value))}
                  >
                    <SelectTrigger className="w-full md:px-3 pr-8 sm:w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto sm:inline-flex"
                      >
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
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Total Sale Due</TableHead>
                      <TableHead className="hidden xl:table-cell">
                        Total Sell Return Due
                      </TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No customers found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontalIcon className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() => handleEditClick(customer)}
                                >
                                  <EditIcon className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(customer)}
                                  className="text-red-600"
                                >
                                  <TrashIcon className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell>
                            <Avatar>
                              <AvatarImage
                                src={
                                  customer.image_path
                                    ? `${supabaseUrl}/storage/v1/object/public/avatars/${customer.image_path}`
                                    : defaultAvatar
                                }
                                alt={customer.full_name}
                              />
                              <AvatarFallback>
                                <UserIcon className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">
                            {customer.code}
                          </TableCell>
                          <TableCell>{customer.full_name}</TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell>
                            ${customer.total_sale_due.toFixed(2)}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            ${customer.total_sell_return_due.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                customer.status === "Client Actif"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                customer.status === "Client Actif"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {customer.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="lg:hidden">
              {paginatedCustomers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No customers found.
                </div>
              ) : (
                paginatedCustomers.map((customer) => (
                  <CustomerCard key={customer.id} customer={customer} />
                ))
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 space-y-3 sm:space-y-0">
              <p className="text-sm text-gray-600 text-center sm:text-left">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredCustomers.length)} of{" "}
                {filteredCustomers.length} entries
              </p>
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="text-xs sm:text-sm"
                >
                  Previous
                </Button>
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page = i + 1;
                    if (totalPages > 5) {
                      if (currentPage > 3) {
                        page = currentPage - 2 + i;
                      }
                      if (currentPage > totalPages - 2) {
                        page = totalPages - 4 + i;
                      }
                    }
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 p-0 text-xs sm:text-sm ${
                          currentPage === page
                            ? "bg-blue-600 hover:bg-blue-700"
                            : ""
                        }`}
                      >
                        {page}
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
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] sm:max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Edit Customer" : "Create Customer"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] sm:max-h-[70vh] pr-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-600">Full Name *</Label>
                  <Input
                    required
                    value={form.full_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, full_name: e.target.value }))
                    }
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600">Phone *</Label>
                  <Input
                    required
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="Phone"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-600">Total Sale Due *</Label>
                  <Input
                    type="number"
                    value={form.total_sale_due}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        total_sale_due: Number(e.target.value),
                      }))
                    }
                    placeholder="Total Sale Due"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600">
                    Total Sell Return Due *
                  </Label>
                  <Input
                    type="number"
                    value={form.total_sell_return_due}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        total_sell_return_due: Number(e.target.value),
                      }))
                    }
                    placeholder="Total Sell Return Due"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600">Status *</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Client Actif">Client Actif</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600">Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                    }
                  }}
                />
                {editingCustomer && editingCustomer.image_path && (
                  <p className="text-sm text-gray-500 mt-1">
                    Current image will be replaced if you select a new one
                  </p>
                )}
              </div>
            </form>
          </ScrollArea>
          <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="w-full sm:w-auto bg-transparent"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={createLoading || editLoading}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              {createLoading || editLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingCustomer ? "Updating..." : "Creating..."}
                </>
              ) : editingCustomer ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[95vw] max-w-md">
          {deleteLoading ? (
            <div className="flex flex-col items-center justify-center py-6 sm:py-8">
              <div className="relative">
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-red-200 rounded-full animate-spin border-t-red-600"></div>
                <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 border-4 border-transparent rounded-full animate-ping border-t-red-400"></div>
              </div>
              <div className="mt-4 sm:mt-6 space-y-2 text-center">
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-red-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-red-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <p className="text-base sm:text-lg font-medium text-gray-900">
                  Deleting Customer...
                </p>
                <p className="text-xs sm:text-sm text-gray-500 px-4">
                  Please wait while we remove {customerToDelete?.full_name}
                </p>
              </div>
              <div className="mt-4 sm:mt-6 w-48 sm:w-64">
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-red-400 to-red-600 h-full rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center space-x-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                  </div>
                  <span className="text-base sm:text-lg">Are you sure?</span>
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm sm:text-base">
                  This action cannot be undone. This will permanently delete the
                  customer{" "}
                  <strong className="text-gray-900">
                    "{customerToDelete?.full_name}"
                  </strong>{" "}
                  and remove their data from the server.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0">
                <AlertDialogCancel
                  onClick={() => setCustomerToDelete(null)}
                  disabled={deleteLoading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="mt-16 sm:mt-0"
      />
    </div>
  );
}
