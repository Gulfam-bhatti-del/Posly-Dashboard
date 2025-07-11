"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import { CameraOffIcon, Loader2, X, Search } from "lucide-react"; // Added Search icon

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  brand: string;
  price: number;
  current_stock: number;
  image_url: string | null;
  unit: string;
}
interface Category {
  id: string;
  name: string;
}
interface Brand {
  id: string;
  name: string;
}
interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [shipping, setShipping] = useState<number>(5);
  const [orderTax, setOrderTax] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<string>("$");
  const [grandTotal, setGrandTotal] = useState<number>(0);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>(""); // New state for search
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let subtotal = cart.reduce((sum, i) => sum + i.total, 0);
    let tax = subtotal * (orderTax / 100);
    let disc = discountType === "$" ? discount : subtotal * (discount / 100);
    let total = subtotal + tax + shipping - disc;
    setGrandTotal(total < 0 ? 0 : total);
  }, [cart, shipping, orderTax, discount, discountType]);

  const fetchData = async () => {
    setLoading(true);
    // Fetch products
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("*");
    if (productsError) {
      console.error("Error fetching products:", productsError);
    }

    // Fetch categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("*");
    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError);
    }

    // Fetch brands
    const { data: brandsData, error: brandsError } = await supabase
      .from("brands")
      .select("*");
    if (brandsError) {
      console.error("Error fetching brands:", brandsError);
    }

    setProducts(productsData || []);
    setCategories(categoriesData || []);
    setBrands(brandsData || []);
    setLoading(false);
  };

  const addToCart = (p: Product) => {
    const exist = cart.find((i) => i.product.id === p.id);
    if (exist) {
      setCart(
        cart.map((i) =>
          i.product.id === p.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                total: (i.quantity + 1) * p.price,
              }
            : i
        )
      );
    } else {
      setCart([...cart, { product: p, quantity: 1, total: p.price }]);
    }
  };

  const increaseQty = (id: string) =>
    setCart(
      cart.map((i) =>
        i.product.id === id
          ? {
              ...i,
              quantity: i.quantity + 1,
              total: (i.quantity + 1) * i.product.price,
            }
          : i
      )
    );
  const decreaseQty = (id: string) =>
    setCart(
      cart
        .map((i) =>
          i.product.id === id && i.quantity > 1
            ? {
                ...i,
                quantity: i.quantity - 1,
                total: (i.quantity - 1) * i.product.price,
              }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  const removeFromCart = (id: string) =>
    setCart(cart.filter((i) => i.product.id !== id));

  const filteredProducts = products.filter(
    (p) =>
      (selectedCategory === "All" || p.category === selectedCategory) &&
      (selectedBrand === "All" || p.brand === selectedBrand) &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) // Apply search filter
  );

  const handleOrder = async () => {
    setPlacingOrder(true);
    const subtotal = cart.reduce((sum, i) => sum + i.total, 0);
    const tax = subtotal * (orderTax / 100);
    const disc = discountType === "$" ? discount : subtotal * (discount / 100);

    const { error } = await supabase.from("orders").insert([
      {
        items: cart.map((i) => ({
          id: i.product.id,
          name: i.product.name,
          qty: i.quantity,
          price: i.product.price,
          total: i.total,
        })),
        subtotal,
        tax,
        shipping,
        discount,
        discount_type: discountType,
        grand_total: grandTotal,
      },
    ]);

    if (error) {
      console.error("Error placing order:", error);
      // Optionally show an error message to the user
    } else {
      setCart([]);
      setShowDialog(false);
      // Optionally show a success message
    }
    setPlacingOrder(false);
  };

  return (
    <>
      <div className="grid grid-cols-12 gap-6 p-4 bg-gray-50 min-h-screen">
        {/* Cart Section - Column 1 */}
        <div className="col-span-12 md:col-span-5 lg:col-span-4 space-y-6">
          <div className="bg-white p-4 rounded-xl shadow space-y-4">
            {/* Cart Items */}
            <div className="border p-6 rounded bg-gray-50 space-y-3 max-h-96 overflow-y-auto">
              {" "}
              {/* Added max-h and overflow */}
              <h3 className="font-semibold text-lg">Cart</h3>
              {cart.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">
                  Cart is empty. Add some products!
                </p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex justify-between items-center py-2 border-b last:border-b-0"
                  >
                    <span className="text-sm font-medium">
                      {item.product.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline" // Changed to outline for subtle look
                        onClick={() => decreaseQty(item.product.id)}
                        className="w-7 h-7" // Smaller buttons
                      >
                        -
                      </Button>
                      <span className="text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline" // Changed to outline
                        onClick={() => increaseQty(item.product.id)}
                        className="w-7 h-7" // Smaller buttons
                      >
                        +
                      </Button>
                    </div>
                    <span className="text-sm font-bold">
                      ${item.total.toFixed(2)}
                    </span>
                    <X
                      className="cursor-pointer text-red-500 hover:text-red-700 transition-colors"
                      size={16} // Smaller icon
                      onClick={() => removeFromCart(item.product.id)}
                    />
                  </div>
                ))
              )}
            </div>
            {/* Order Summary Inputs */}
            <div className="bg-gray-50 p-3 rounded space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Shipping</span>
                <Input
                  type="number"
                  value={shipping}
                  onChange={(e) => setShipping(parseFloat(e.target.value) || 0)} // Handle empty input
                  className="w-24 text-right text-sm"
                  min="0"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Order Tax</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={orderTax}
                    onChange={(e) =>
                      setOrderTax(parseFloat(e.target.value) || 0)
                    }
                    className="w-20 text-right text-sm"
                    min="0"
                    max="100"
                  />
                  <span className="text-sm">%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Discount</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) =>
                      setDiscount(parseFloat(e.target.value) || 0)
                    }
                    className="w-20 text-right text-sm"
                    min="0"
                  />
                  <Select value={discountType} onValueChange={setDiscountType}>
                    <SelectTrigger className="w-[60px] h-9 text-sm">
                      {" "}
                      {/* Smaller trigger */}
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="$">$</SelectItem>
                      <SelectItem value="%">%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {/* Grand Total */}
            <div className="flex justify-between font-bold text-xl border-t pt-4">
              <span>Grand Total:</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
            {/* Order Button */}
            <Button
              className="w-full bg-blue-500 hover:bg-blue-600 text-lg py-3 rounded-lg"
              onClick={() => setShowDialog(true)}
              disabled={cart.length === 0}
            >
              Order Now
            </Button>
          </div>
        </div>

        {/* Products Section - Column 2 */}
        <div className="col-span-12 md:col-span-7 lg:col-span-5 space-y-4">
          <div className="relative">
            {" "}
            {/* Added relative for search icon positioning */}
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg shadow-sm" // Increased padding for icon
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-10">
              <Loader2 className="mx-auto h-8 w-8 animate-spin mb-3" />
              <p className="text-lg">Loading products...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {" "}
              {filteredProducts.length === 0 && searchQuery !== "" ? (
                <p className="col-span-full text-center text-gray-500 text-lg py-10">
                  No products found for "{searchQuery}".
                </p>
              ) : filteredProducts.length === 0 ? (
                <p className="col-span-full text-center text-gray-500 text-lg py-10">
                  No products available in this category/brand.
                </p>
              ) : (
                filteredProducts.map((p) => (
                  <Card
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="cursor-pointer p-3 text-center hover:shadow-lg transition-shadow duration-200 ease-in-out flex flex-col items-center justify-between" // Added flex for layout
                  >
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-28 w-28 object-contain mb-2 rounded-md bg-gray-100 p-1" // Slightly larger image and padding
                      />
                    ) : (
                      <div className="bg-red-300 rounded-md w-28 h-28 flex items-center justify-center mb-2">
                        <CameraOffIcon className="h-16 w-16 text-red-500" />{" "}
                        {/* Larger icon */}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {p.current_stock} {p.unit}
                    </div>
                    <div className="font-semibold text-base mt-1 line-clamp-2">
                      {p.name}
                    </div>{" "}
                    {/* line-clamp for long names */}
                    <div className="font-bold text-gray-700 text-lg mt-1">
                      ${p.price.toFixed(2)}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {/* Filters Section - Column 3 (Hidden on smaller screens) */}
        <div className="hidden lg:block col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-white p-4 rounded-xl shadow space-y-3">
            <h4 className="font-semibold text-lg mb-3">Filter by Category</h4>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center text-base">
                <input
                  type="radio"
                  id="categoryAll"
                  name="category"
                  checked={selectedCategory === "All"}
                  onChange={() => setSelectedCategory("All")}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="categoryAll">All</label>
              </div>
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center text-base">
                  <input
                    type="radio"
                    id={`category-${cat.id}`}
                    name="category"
                    checked={selectedCategory === cat.name}
                    onChange={() => setSelectedCategory(cat.name)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor={`category-${cat.id}`}>{cat.name}</label>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow space-y-3">
            <h4 className="font-semibold text-lg mb-3">Filter by Brand</h4>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center text-base">
                <input
                  type="radio"
                  id="brandAll"
                  name="brand"
                  checked={selectedBrand === "All"}
                  onChange={() => setSelectedBrand("All")}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="brandAll">All</label>
              </div>
              {brands.map((b) => (
                <div key={b.id} className="flex items-center text-base">
                  <input
                    type="radio"
                    id={`brand-${b.id}`}
                    name="brand"
                    checked={selectedBrand === b.name}
                    onChange={() => setSelectedBrand(b.name)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor={`brand-${b.id}`}>{b.name}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          {" "}
          {/* Constrained width for better mobile experience */}
          <DialogHeader>
            <DialogTitle>Confirm Order?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 leading-relaxed">
            {" "}
            {/* Adjusted text style */}
            You are about to place an order with a grand total of{" "}
            <span className="font-bold text-blue-600">
              ${grandTotal.toFixed(2)}
            </span>
            . Are you sure you want to proceed? This action cannot be undone.
          </p>
          <DialogFooter className="flex flex-col sm:flex-row-reverse gap-2 sm:gap-0 mt-4">
            {" "}
            {/* Responsive buttons */}
            <Button
              onClick={handleOrder}
              disabled={placingOrder}
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600"
            >
              {placingOrder ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : null}
              Place Order
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
