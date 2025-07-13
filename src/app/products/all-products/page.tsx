"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  MoreHorizontal,
  Plus,
  Filter,
  Search,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  CameraOffIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-toastify";
import { Separator } from "@/components/ui/separator";

interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  brand: string;
  cost: number;
  price: number;
  current_stock: number;
  type: string;
  unit_sale: string;
  image_url: string | null;
  created_at: string;
  details: string | null;
  order_tax: number;
  tax_method: string;
  unit_product: string;
  unit_purchase: string;
  minimum_quantity: number;
  stock_alert: number;
  has_imei: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState("10");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [productToView, setProductToView] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      if (productToDelete.image_url) {
        const imagePath = productToDelete.image_url.split("/").pop();
        if (imagePath) {
          await supabase.storage
            .from("product-images")
            .remove([`products/${imagePath}`]);
        }
      }
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productToDelete.id);

      if (error) throw error;
      toast.success("Product deleted successfully!");
      setProducts(products.filter((p) => p.id !== productToDelete.id));
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 -mt-3">
        <h1 className="text-2xl mb-3">All Products</h1>
        <Separator />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-end gap-2 -mb-4">
            <Link href="/products/create-product">
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

        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                <SelectTrigger className="w-20 border-gray-300">
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
                  <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem>Export as Excel</DropdownMenuItem>
                  <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Product Cost</TableHead>
                  <TableHead>Product Price</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts
                    .slice(0, Number.parseInt(itemsPerPage))
                    .map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          {product.image_url ? (
                            <img
                              src={product.image_url || "/placeholder.svg"}
                              alt={product.name}
                              className="w-10 h-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="bg-red-300 rounded-md w-12 h-12 flex justify-center items-center">
                              <CameraOffIcon className="w-8 h-8 text-red-500" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="capitalize">{product.type}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.code}</TableCell>
                        <TableCell className="capitalize">{product.category}</TableCell>
                        <TableCell className="capitalize">{product.brand || "N/D"}</TableCell>
                        <TableCell>${product.cost.toFixed(2)}</TableCell>
                        <TableCell>${product.price.toFixed(2)}</TableCell>
                        <TableCell>
                          {product.current_stock} {product.unit_sale}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setProductToView(product);
                                  setViewDialogOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <Link href={`/products/all-products/${product.id}/edit`}>
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setProductToDelete(product);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6">
            <div className="text-sm text-gray-600">
              Showing 1 to {products.length} of {products.length} entries
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product "{productToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>Complete product info</DialogDescription>
          </DialogHeader>
          {productToView && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {productToView.image_url && (
                  <div className="flex justify-center">
                    <img
                      src={productToView.image_url}
                      alt={productToView.name}
                      className="w-48 h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{productToView.name}</h3>
                  <p className="text-sm text-gray-600">Code: {productToView.code}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="font-medium">Category:</span>
                  <span className="capitalize">{productToView.category}</span>
                  <span className="font-medium">Brand:</span>
                  <span className="capitalize">{productToView.brand || "N/A"}</span>
                  <span className="font-medium">Type:</span>
                  <span className="capitalize">{productToView.type}</span>
                  <span className="font-medium">Cost:</span>
                  <span>${productToView.cost.toFixed(2)}</span>
                  <span className="font-medium">Price:</span>
                  <span>${productToView.price.toFixed(2)}</span>
                  <span className="font-medium">Stock:</span>
                  <span>{productToView.current_stock} {productToView.unit_sale}</span>
                  <span className="font-medium">Tax:</span>
                  <span>{productToView.order_tax}% ({productToView.tax_method})</span>
                  <span className="font-medium">Min Qty:</span>
                  <span>{productToView.minimum_quantity}</span>
                  <span className="font-medium">Stock Alert:</span>
                  <span>{productToView.stock_alert}</span>
                  <span className="font-medium">Has IMEI:</span>
                  <span>{productToView.has_imei ? "Yes" : "No"}</span>
                </div>
                {productToView.details && (
                  <div>
                    <span className="font-medium">Details:</span>
                    <p className="text-sm text-gray-600 mt-1">{productToView.details}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
