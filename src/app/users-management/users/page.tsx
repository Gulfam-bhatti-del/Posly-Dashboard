"use client";

import type React from "react";
import { useState, useEffect } from "react";
// Assuming createClient and supabase are correctly configured in your project
// import { createClient } from "@supabase/supabase-js"; // This line might be redundant if supabase is imported from "@/lib/supabase"
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { supabase } from "@/lib/supabase"; // Assuming this is your configured supabase client
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  UserIcon,
  Loader2,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  full_name: string;
  email: string;
  password?: string;
  status: "Active" | "Inactive";
  role: "Super Admin" | "Admin" | "User" | "Manager";
  avatar_url?: string;
  access_warehouses: string[];
  created_at: string;
  updated_at: string;
}

// User service functions (assuming these are correctly implemented and accessible)
const getUsers = async () => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as User[];
};

const createUser = async (
  userData: Omit<User, "id" | "created_at" | "updated_at">
) => {
  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        ...userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as User;
};

const updateUser = async (id: string, userData: Partial<User>) => {
  const { data, error } = await supabase
    .from("users")
    .update({
      ...userData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as User;
};

const deleteUser = async (id: string) => {
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw error;
};

const uploadAvatar = async (file: File, userId: string) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}-${Math.random()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file);
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
  return data.publicUrl;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    repeat_password: "",
    status: "Active" as "Active" | "Inactive",
    role: "User" as "Super Admin" | "Admin" | "User" | "Manager",
    access_warehouses: [] as string[],
    all_warehouses: false,
    avatar_file: null as File | null,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.repeat_password) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setCreateLoading(true);
      let avatar_url = "";

      if (formData.avatar_file) {
        avatar_url = await uploadAvatar(
          formData.avatar_file,
          Date.now().toString()
        );
      }

      const userData = {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        status: formData.status,
        role: formData.role,
        avatar_url,
        access_warehouses: formData.all_warehouses
          ? ["all"]
          : formData.access_warehouses,
      };

      await createUser(userData);
      toast.success("User created successfully!");
      setIsCreateOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error("Failed to create user");
      console.error("Error creating user:", error);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) return;

    try {
      setEditLoading(true);
      let avatar_url = selectedUser.avatar_url;

      if (formData.avatar_file) {
        avatar_url = await uploadAvatar(formData.avatar_file, selectedUser.id);
      }

      const userData = {
        full_name: formData.full_name,
        email: formData.email,
        status: formData.status,
        role: formData.role,
        avatar_url,
        access_warehouses: formData.all_warehouses
          ? ["all"]
          : formData.access_warehouses,
      };

      await updateUser(selectedUser.id, userData);
      toast.success("User updated successfully!");
      setIsEditOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user");
      console.error("Error updating user:", error);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setDeleteLoading(true);
      await deleteUser(selectedUser.id);
      toast.success("User deleted successfully!");
      setIsDeleteOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user");
      console.error("Error deleting user:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      password: "",
      repeat_password: "",
      status: "Active",
      role: "User",
      access_warehouses: [],
      all_warehouses: false,
      avatar_file: null,
    });
    setSelectedUser(null);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      password: "",
      repeat_password: "",
      status: user.status,
      role: user.role,
      access_warehouses: user.access_warehouses.filter((w) => w !== "all"),
      all_warehouses: user.access_warehouses.includes("all"),
      avatar_file: null,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  // Mobile User Card Component
  const UserCard = ({ user }: { user: User }) => (
    <Card className="mb-4 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-grow min-w-0">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage
                src={user.avatar_url || "/placeholder.svg"}
                alt={user.full_name}
              />
              <AvatarFallback>
                <UserIcon className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {user.full_name}
              </h3>
              <p className="text-sm text-gray-600 truncate">{user.email}</p>
              <div className="flex flex-wrap items-center gap-x-2 mt-1">
                <Badge
                  variant={user.status === "Active" ? "default" : "secondary"}
                  className={`text-xs ${
                    user.status === "Active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {user.status}
                </Badge>
                <span className="text-xs text-gray-500">{user.role}</span>
              </div>
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
              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openDeleteDialog(user)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
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
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
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
                    <Skeleton className="h-8 w-16 sm:h-10 sm:w-20" />
                    <Skeleton className="h-8 w-24 sm:h-10 sm:w-32" />
                  </div>
                  <Skeleton className="h-8 w-full sm:h-10 sm:w-64" />
                </div>
                <Separator />
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32 sm:w-48" />
                        <Skeleton className="h-4 w-48 sm:w-64" />
                      </div>
                      <div className="hidden sm:flex space-x-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <ToastContainer position="top-center" />
      <div className="mb-6 -mt-2 sm:-mt-3">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
          Users
        </h1>
        <Separator />
      </div>
      <div className="max-w-7xl mx-auto">
        <Card>
          {/* Header */}
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-3 sm:space-y-0">
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border -mb-5 sm:-mb-4 border-blue-700 hover:bg-blue-700 hover:text-white w-full sm:w-auto cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>Create User</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="flex-1 pr-4">
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Full name*</Label>
                          <Input
                            id="full_name"
                            placeholder="Enter Fullname"
                            value={formData.full_name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                full_name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address*</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter email address"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="password">Password *</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="min : 6 characters"
                            value={formData.password}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                password: e.target.value,
                              })
                            }
                            minLength={6}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="repeat_password">
                            Repeat password *
                          </Label>
                          <Input
                            id="repeat_password"
                            type="password"
                            placeholder="Repeat password"
                            value={formData.repeat_password}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                repeat_password: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="status">Status *</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value: "Active" | "Inactive") =>
                              setFormData({ ...formData, status: value })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Role *</Label>
                          <Select
                            value={formData.role}
                            onValueChange={(
                              value:
                                | "Super Admin"
                                | "Admin"
                                | "User"
                                | "Manager"
                            ) => setFormData({ ...formData, role: value })}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Choose role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Super Admin">
                                Super Admin
                              </SelectItem>
                              <SelectItem value="Admin">Admin</SelectItem>
                              <SelectItem value="Manager">Manager</SelectItem>
                              <SelectItem value="User">User</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="avatar">Avatar</Label>
                        <Input
                          id="avatar"
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              avatar_file: e.target.files?.[0] || null,
                            })
                          }
                        />
                      </div>
                      <Separator />
                      <div className="space-y-3">
                        <Label className="text-base font-medium">
                          Access warehouses
                        </Label>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="all_warehouses"
                              checked={formData.all_warehouses}
                              onCheckedChange={(checked) =>
                                setFormData({
                                  ...formData,
                                  all_warehouses: checked as boolean,
                                })
                              }
                            />
                            <Label htmlFor="all_warehouses">
                              All Warehouses
                            </Label>
                          </div>
                          {!formData.all_warehouses && (
                            <Select>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Please Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="warehouse1">
                                  Warehouse 1
                                </SelectItem>
                                <SelectItem value="warehouse2">
                                  Warehouse 2
                                </SelectItem>
                                <SelectItem value="warehouse3">
                                  Warehouse 3
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </form>
                  </ScrollArea>
                  <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                      disabled={createLoading}
                      onClick={handleCreateUser}
                    >
                      {createLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Submit"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
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
                  className="pl-10 w-full"
                />
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <div className="rounded-md border">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">
                        Avatar
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Username
                      </TableHead>
                      <TableHead className="whitespace-nowrap">Email</TableHead>
                      <TableHead className="whitespace-nowrap">
                        Status
                      </TableHead>
                      <TableHead className="whitespace-nowrap">Role</TableHead>
                      <TableHead className="hidden xl:table-cell whitespace-nowrap">
                        Assign Role
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-gray-500"
                        >
                          No users found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="flex-shrink-0">
                            <Avatar>
                              <AvatarImage
                                className="w-8 h-8"
                                src={user.avatar_url || "/placeholder.svg"}
                                alt={user.full_name}
                              />
                              <AvatarFallback>
                                <UserIcon className="w-8 h-8" />
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">
                            {user.full_name}
                          </TableCell>
                          <TableCell className="text-gray-600 whitespace-nowrap">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.status === "Active"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                user.status === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {user.role}
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm hidden xl:table-cell whitespace-nowrap">
                            {user.role === "Super Admin"
                              ? "Cannot change default permissions"
                              : "Can assign roles"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <Button
                                title="edit"
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(user)}
                                className="text-blue-600 hover:text-blue-700 cursor-pointer"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(user)}
                                className="text-red-600 hover:text-red-700 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              {paginatedUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No users found.
                </div>
              ) : (
                paginatedUsers.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))
              )}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 space-y-3 sm:space-y-0">
              <p className="text-sm text-gray-600 text-center sm:text-left w-full sm:w-auto">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredUsers.length)} of{" "}
                {filteredUsers.length} entries
              </p>
              <div className="flex items-center justify-center space-x-1 sm:space-x-2 w-full sm:w-auto">
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

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[95vw] max-w-xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_full_name">Full name*</Label>
                  <Input
                    id="edit_full_name"
                    placeholder="Enter Fullname"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_email">Email Address*</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_password">Password</Label>
                  <Input
                    id="edit_password"
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_repeat_password">Repeat password</Label>
                  <Input
                    id="edit_repeat_password"
                    type="password"
                    placeholder="Repeat password"
                    value={formData.repeat_password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        repeat_password: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "Active" | "Inactive") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(
                      value: "Super Admin" | "Admin" | "User" | "Manager"
                    ) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Super Admin">Super Admin</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_avatar">Avatar</Label>
                <Input
                  id="edit_avatar"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      avatar_file: e.target.files?.[0] || null,
                    })
                  }
                />
              </div>
              <Separator />
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Access warehouses
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit_all_warehouses"
                      checked={formData.all_warehouses}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          all_warehouses: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="edit_all_warehouses">All Warehouses</Label>
                  </div>
                  {!formData.all_warehouses && (
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Please Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warehouse1">Warehouse 1</SelectItem>
                        <SelectItem value="warehouse2">Warehouse 2</SelectItem>
                        <SelectItem value="warehouse3">Warehouse 3</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </form>
          </ScrollArea>
          <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              disabled={editLoading}
              onClick={handleEditUser}
            >
              {editLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User AlertDialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user{" "}
              <span className="font-semibold">{selectedUser?.full_name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
