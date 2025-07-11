"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { supabase } from "@/lib/supabase";
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
  Shield,
  Loader2,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Permission {
  id: string;
  role_name: string;
  description: string;
  permissions: {
    users?: {
      create?: boolean;
      read?: boolean;
      update?: boolean;
      delete?: boolean;
    };
    permissions?: {
      create?: boolean;
      read?: boolean;
      update?: boolean;
      delete?: boolean;
    };
    dashboard?: { read?: boolean };
    settings?: { read?: boolean; update?: boolean };
  };
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Permission service functions
const getPermissions = async () => {
  const { data, error } = await supabase
    .from("permissions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Permission[];
};

const createPermission = async (
  permissionData: Omit<Permission, "id" | "created_at" | "updated_at">
) => {
  const { data, error } = await supabase
    .from("permissions")
    .insert([
      {
        ...permissionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Permission;
};

const updatePermission = async (
  id: string,
  permissionData: Partial<Permission>
) => {
  const { data, error } = await supabase
    .from("permissions")
    .update({
      ...permissionData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Permission;
};

const deletePermission = async (id: string) => {
  const { error } = await supabase.from("permissions").delete().eq("id", id);
  if (error) throw error;
};

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);
  const [formData, setFormData] = useState({
    role_name: "",
    description: "",
    permissions: {
      users: { create: false, read: false, update: false, delete: false },
      permissions: { create: false, read: false, update: false, delete: false },
      dashboard: { read: false },
      settings: { read: false, update: false },
    },
    is_default: false,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const data = await getPermissions();
      setPermissions(data);
    } catch (error) {
      toast.error("Failed to fetch permissions");
      console.error("Error fetching permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setCreateLoading(true);
      const permissionData = {
        role_name: formData.role_name,
        description: formData.description,
        permissions: formData.permissions,
        is_default: formData.is_default,
      };

      await createPermission(permissionData);
      toast.success("Permission created successfully!");
      setIsCreateOpen(false);
      resetForm();
      fetchPermissions();
    } catch (error) {
      toast.error("Failed to create permission");
      console.error("Error creating permission:", error);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditPermission = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPermission) return;

    try {
      setEditLoading(true);
      const permissionData = {
        role_name: formData.role_name,
        description: formData.description,
        permissions: formData.permissions,
        is_default: formData.is_default,
      };

      await updatePermission(selectedPermission.id, permissionData);
      toast.success("Permission updated successfully!");
      setIsEditOpen(false);
      resetForm();
      fetchPermissions();
    } catch (error) {
      toast.error("Failed to update permission");
      console.error("Error updating permission:", error);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeletePermission = async () => {
    if (!selectedPermission) return;

    try {
      setDeleteLoading(true);
      await deletePermission(selectedPermission.id);
      toast.success("Permission deleted successfully!");
      setIsDeleteOpen(false);
      setSelectedPermission(null);
      fetchPermissions();
    } catch (error) {
      toast.error("Failed to delete permission");
      console.error("Error deleting permission:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      role_name: "",
      description: "",
      permissions: {
        users: { create: false, read: false, update: false, delete: false },
        permissions: {
          create: false,
          read: false,
          update: false,
          delete: false,
        },
        dashboard: { read: false },
        settings: { read: false, update: false },
      },
      is_default: false,
    });
    setSelectedPermission(null);
  };

  const openEditDialog = (permission: Permission) => {
    setSelectedPermission(permission);
    setFormData({
      role_name: permission.role_name,
      description: permission.description,
      permissions: permission.permissions,
      is_default: permission.is_default,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (permission: Permission) => {
    setSelectedPermission(permission);
    setIsDeleteOpen(true);
  };

  const updatePermissionField = (
    module: string,
    action: string,
    value: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module as keyof typeof prev.permissions],
          [action]: value,
        },
      },
    }));
  };

  const filteredPermissions = permissions.filter(
    (permission) =>
      permission.role_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedPermissions = filteredPermissions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(filteredPermissions.length / pageSize);

  const PermissionCard = ({ permission }: { permission: Permission }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {permission.role_name}
              </h3>
              <p className="text-sm text-gray-600 truncate">
                {permission.description}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                {permission.is_default && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-yellow-100 text-yellow-800"
                  >
                    Default
                  </Badge>
                )}
                <span className="text-xs text-gray-500">
                  {permission.is_default
                    ? "Cannot change default permissions"
                    : "Can modify permissions"}
                </span>
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
              <DropdownMenuItem onClick={() => openEditDialog(permission)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {!permission.is_default && (
                <DropdownMenuItem
                  onClick={() => openDeleteDialog(permission)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
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
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-24 sm:h-4 sm:w-32" />
                        <Skeleton className="h-3 w-48 sm:h-4 sm:w-64" />
                      </div>
                      <div className="flex space-x-1 sm:space-x-2">
                        <Skeleton className="h-6 w-6 sm:h-8 sm:w-8" />
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
      <div className="mb-6 -mt-4">
        <h1 className="text-xl sm:text-2xl text-gray-900 mb-3">Permissions</h1>
        <Separator />
      </div>
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-3 sm:space-y-0">
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border -mb-5 border-blue-700 hover:bg-blue-700 hover:text-white w-full sm:w-auto cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-3xl max-h-[95vh] sm:max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>Create Permission</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh] sm:max-h-[70vh] pr-4">
                    <form
                      onSubmit={handleCreatePermission}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="role_name">Role Name*</Label>
                          <Input
                            id="role_name"
                            placeholder="Enter role name"
                            value={formData.role_name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                role_name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description*</Label>
                          <Input
                            id="description"
                            placeholder="Enter description"
                            value={formData.description}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                description: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is_default"
                            checked={formData.is_default}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                is_default: checked as boolean,
                              })
                            }
                          />
                          <Label htmlFor="is_default">Default Role</Label>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-6">
                        <h3 className="text-lg font-medium">Permissions</h3>

                        {/* Users Permissions */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">
                            Users Management
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {["create", "read", "update", "delete"].map(
                              (action) => (
                                <div
                                  key={action}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`users_${action}`}
                                    checked={
                                      formData.permissions.users[
                                        action as keyof typeof formData.permissions.users
                                      ]
                                    }
                                    onCheckedChange={(checked) =>
                                      updatePermissionField(
                                        "users",
                                        action,
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <Label
                                    htmlFor={`users_${action}`}
                                    className="capitalize"
                                  >
                                    {action}
                                  </Label>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        {/* Permissions Management */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">
                            Permissions Management
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {["create", "read", "update", "delete"].map(
                              (action) => (
                                <div
                                  key={action}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`permissions_${action}`}
                                    checked={
                                      formData.permissions.permissions[
                                        action as keyof typeof formData.permissions.permissions
                                      ]
                                    }
                                    onCheckedChange={(checked) =>
                                      updatePermissionField(
                                        "permissions",
                                        action,
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <Label
                                    htmlFor={`permissions_${action}`}
                                    className="capitalize"
                                  >
                                    {action}
                                  </Label>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        {/* Dashboard Permissions */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">
                            Dashboard
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="dashboard_read"
                                checked={formData.permissions.dashboard.read}
                                onCheckedChange={(checked) =>
                                  updatePermissionField(
                                    "dashboard",
                                    "read",
                                    checked as boolean
                                  )
                                }
                              />
                              <Label htmlFor="dashboard_read">Read</Label>
                            </div>
                          </div>
                        </div>

                        {/* Settings Permissions */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">
                            Settings
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {["read", "update"].map((action) => (
                              <div
                                key={action}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`settings_${action}`}
                                  checked={
                                    formData.permissions.settings[
                                      action as keyof typeof formData.permissions.settings
                                    ]
                                  }
                                  onCheckedChange={(checked) =>
                                    updatePermissionField(
                                      "settings",
                                      action,
                                      checked as boolean
                                    )
                                  }
                                />
                                <Label
                                  htmlFor={`settings_${action}`}
                                  className="capitalize"
                                >
                                  {action}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </form>
                  </ScrollArea>
                  <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0">
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
                      onClick={handleCreatePermission}
                    >
                      {createLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Permission"
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => setPageSize(Number(value))}
                  >
                    <SelectTrigger className="w-16 sm:w-20">
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
                      <TableHead>Role Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPermissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-medium">
                          {permission.role_name}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {permission.description}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(permission)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {!permission.is_default && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(permission)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                            {permission.is_default && (
                              <span className="text-xs text-gray-500">
                                Cannot change default permissions
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              {paginatedPermissions.map((permission) => (
                <PermissionCard key={permission.id} permission={permission} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 space-y-3 sm:space-y-0">
              <p className="text-sm text-gray-600 text-center sm:text-left">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredPermissions.length)}{" "}
                of {filteredPermissions.length} entries
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[95vh] sm:max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Permission</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] sm:max-h-[70vh] pr-4">
            <form onSubmit={handleEditPermission} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_role_name">Role Name*</Label>
                  <Input
                    id="edit_role_name"
                    placeholder="Enter role name"
                    value={formData.role_name}
                    onChange={(e) =>
                      setFormData({ ...formData, role_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_description">Description*</Label>
                  <Input
                    id="edit_description"
                    placeholder="Enter description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit_is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        is_default: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="edit_is_default">Default Role</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-6">
                <h3 className="text-lg font-medium">Permissions</h3>

                {/* Users Permissions */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">
                    Users Management
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {["create", "read", "update", "delete"].map((action) => (
                      <div key={action} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit_users_${action}`}
                          checked={
                            formData.permissions.users[
                              action as keyof typeof formData.permissions.users
                            ]
                          }
                          onCheckedChange={(checked) =>
                            updatePermissionField(
                              "users",
                              action,
                              checked as boolean
                            )
                          }
                        />
                        <Label
                          htmlFor={`edit_users_${action}`}
                          className="capitalize"
                        >
                          {action}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Permissions Management */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">
                    Permissions Management
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {["create", "read", "update", "delete"].map((action) => (
                      <div key={action} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit_permissions_${action}`}
                          checked={
                            formData.permissions.permissions[
                              action as keyof typeof formData.permissions.permissions
                            ]
                          }
                          onCheckedChange={(checked) =>
                            updatePermissionField(
                              "permissions",
                              action,
                              checked as boolean
                            )
                          }
                        />
                        <Label
                          htmlFor={`edit_permissions_${action}`}
                          className="capitalize"
                        >
                          {action}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dashboard Permissions */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Dashboard</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit_dashboard_read"
                        checked={formData.permissions.dashboard.read}
                        onCheckedChange={(checked) =>
                          updatePermissionField(
                            "dashboard",
                            "read",
                            checked as boolean
                          )
                        }
                      />
                      <Label htmlFor="edit_dashboard_read">Read</Label>
                    </div>
                  </div>
                </div>

                {/* Settings Permissions */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Settings</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {["read", "update"].map((action) => (
                      <div key={action} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit_settings_${action}`}
                          checked={
                            formData.permissions.settings[
                              action as keyof typeof formData.permissions.settings
                            ]
                          }
                          onCheckedChange={(checked) =>
                            updatePermissionField(
                              "settings",
                              action,
                              checked as boolean
                            )
                          }
                        />
                        <Label
                          htmlFor={`edit_settings_${action}`}
                          className="capitalize"
                        >
                          {action}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          </ScrollArea>
          <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0">
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
              onClick={handleEditPermission}
            >
              {editLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Permission"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
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
                  Deleting Permission...
                </p>
                <p className="text-xs sm:text-sm text-gray-500 px-4">
                  Please wait while we remove {selectedPermission?.role_name}
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
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                  </div>
                  <span className="text-base sm:text-lg">
                    Delete Permission
                  </span>
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm sm:text-base">
                  Are you sure you want to delete{" "}
                  <strong className="text-gray-900">
                    {selectedPermission?.role_name}
                  </strong>{" "}
                  permission?
                  <br />
                  <span className="text-red-600 font-medium">
                    This action cannot be undone.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0">
                <AlertDialogCancel
                  disabled={deleteLoading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeletePermission}
                  disabled={deleteLoading}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-500 w-full sm:w-auto"
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Permission
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
