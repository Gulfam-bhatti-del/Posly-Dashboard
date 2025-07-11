"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
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
import {
  Download,
  Search,
  Plus,
  Pencil,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { Label } from "@/components/ui/label";

function Category() {
  const [pageSize, setPageSize] = useState("10");
  const [showCategories, setShowCategories] = useState<any[]>([]);
  const [addProductCategory, setAddProductCategory] = useState({
    code: "",
    name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{
    code: string;
    name: string;
  } | null>(null);
  // Update dialog state
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [categoryToUpdate, setCategoryToUpdate] = useState<{
    code: string;
    name: string;
  } | null>(null);
  const [updateCategoryName, setUpdateCategoryName] = useState("");
  const [updateCategoryCode, setUpdateCategoryCode] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    addAllCategories();
  }, []);

  // Sync update dialog fields when opening
  useEffect(() => {
    if (updateDialogOpen && categoryToUpdate) {
      setUpdateCategoryCode(categoryToUpdate.code);
      setUpdateCategoryName(categoryToUpdate.name);
    }
    if (!updateDialogOpen) {
      setUpdateError(null);
    }
  }, [updateDialogOpen, categoryToUpdate]);

  const addAllCategories = async () => {
    const { data: product_category, error } = await supabase
      .from("product_category")
      .select("*");

    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    } else {
      setShowCategories(product_category || []);
    }
  };

  const handleAddProductCategory = async () => {
    if (!addProductCategory.code || !addProductCategory.name) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.from("product_category").insert([
      {
        code: addProductCategory.code,
        name: addProductCategory.name,
      },
    ]);
    setLoading(false);

    if (error) {
      setError("Failed to create category. Please try again.");
      console.error("Error adding category:", error);
    } else {
      setAddProductCategory({ code: "", name: "" });
      addAllCategories();
    }
  };

  const handleDeleteCategory = async (code: string) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("product_category")
      .delete()
      .eq("code", code);
    setLoading(false);

    if (error) {
      setError("Failed to delete category. Please try again.");
      console.error("Error deleting category:", error);
    } else {
      addAllCategories();
    }
  };

  // Update category handler
  const handleUpdateCategory = async () => {
    if (!categoryToUpdate || !updateCategoryCode || !updateCategoryName) {
      setUpdateError("All fields are required.");
      return;
    }
    setUpdateLoading(true);
    setUpdateError(null);
    const { error } = await supabase
      .from("product_category")
      .update({ code: updateCategoryCode, name: updateCategoryName })
      .eq("code", categoryToUpdate.code);
    setUpdateLoading(false);

    if (error) {
      setUpdateError("Failed to update category. Please try again.");
      console.error("Error updating category:", error);
    } else {
      setUpdateDialogOpen(false);
      setCategoryToUpdate(null);
      setUpdateCategoryName("");
      setUpdateCategoryCode("");
      addAllCategories();
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="-mt-3">
        <h1 className="text-2xl">Category</h1>
        <Separator className="my-4" />
      </div>
      <Card className="p-4 mb-6">
        <CardHeader>
          <div className="flex items-center justify-end mb-6">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="-mb-4">
                  <Plus /> Create
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center gap-2">
                    <Plus /> Create
                  </DialogTitle>
                  <Separator className="my-2" />
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddProductCategory();
                  }}
                  className="space-y-6"
                >
                  <div className="grid gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="code">Code of category*</Label>
                      <Input
                        id="code"
                        name="code"
                        placeholder="Enter category Code"
                        value={addProductCategory.code}
                        onChange={(e) =>
                          setAddProductCategory({
                            ...addProductCategory,
                            code: e.target.value,
                          })
                        }
                        disabled={loading}
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="name">Name of category*</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Enter category Name"
                        value={addProductCategory.name}
                        onChange={(e) =>
                          setAddProductCategory({
                            ...addProductCategory,
                            name: e.target.value,
                          })
                        }
                        disabled={loading}
                      />
                    </div>
                    {error && (
                      <div className="text-red-500 text-sm font-medium">
                        {error}
                      </div>
                    )}
                  </div>
                  <DialogFooter className="float-left">
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="animate-spin w-4 h-4" />}
                      {loading ? "Submitting..." : "Submit"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center justify-between mb-4">
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
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showCategories.map((c) => (
                <TableRow key={c.code}>
                  <TableCell className="font-medium">{c.code}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell className="flex">
                    <Pencil
                      className="w-4 h-4 text-blue-500 cursor-pointer"
                      onClick={() => {
                        setCategoryToUpdate({ code: c.code, name: c.name });
                        setUpdateCategoryCode(c.code);
                        setUpdateCategoryName(c.name);
                        setUpdateDialogOpen(true);
                      }}
                    />
                    <X
                      className="w-4 h-4 text-red-500 cursor-pointer ml-2"
                      onClick={() => {
                        setCategoryToDelete({ code: c.code, name: c.name });
                        setDeleteDialogOpen(true);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {showCategories.length === 0 && (
            <div className="text-center py-8 text-gray-500">No categories found</div>
          )}

         {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-600">
              Showing 1 to {showCategories.length} of {showCategories.length}{" "}
              entries
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-gray-300">
                Previous
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                1
              </Button>

              <Button variant="outline" size="sm" className="border-gray-300">
                Next
              </Button>
            </div>
          </div>
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
                disabled={loading}
                onClick={async () => {
                  if (categoryToDelete) {
                    await handleDeleteCategory(categoryToDelete.code);
                  }
                  setDeleteDialogOpen(false);
                  setCategoryToDelete(null);
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

      {/* Update Category Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Pencil /> Edit
            </DialogTitle>
            <Separator className="my-2" />
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await handleUpdateCategory();
            }}
            className="space-y-6"
          >
            <div className="grid gap-4">
              <div className="grid gap-3">
                <Label htmlFor="update-code">Code of category*</Label>
                <Input
                  id="update-code"
                  name="update-code"
                  placeholder="Enter category code"
                  value={updateCategoryCode}
                  onChange={(e) => setUpdateCategoryCode(e.target.value)}
                  disabled={updateLoading}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="update-name">Name of category*</Label>
                <Input
                  id="update-name"
                  name="update-name"
                  placeholder="Enter new category name"
                  value={updateCategoryName}
                  onChange={(e) => setUpdateCategoryName(e.target.value)}
                  disabled={updateLoading}
                />
              </div>
              {updateError && (
                <div className="text-red-500 text-sm font-medium">
                  {updateError}
                </div>
              )}
            </div>
            <DialogFooter className="float-left">
              <Button type="submit" disabled={updateLoading}>
                {updateLoading && (
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                )}
                {updateLoading ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Category;
