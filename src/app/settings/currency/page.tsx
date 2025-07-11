"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Trash2, Pencil, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
}

export default function CurrencyPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [filtered, setFiltered] = useState<Currency[]>([]);
  const [search, setSearch] = useState("");
  const [newCurrency, setNewCurrency] = useState({ name: "", code: "", symbol: "" });
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const fetchCurrencies = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("currencies").select("*");
      if (error) console.error(error);
      else {
        setCurrencies(data);
        setFiltered(data);
      }
      setLoading(false);
    };
    fetchCurrencies();
  }, []);

  useEffect(() => {
    setFiltered(
      currencies.filter((c) =>
        `${c.code} ${c.name} ${c.symbol}`.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, currencies]);

  const handleAdd = async () => {
    setCreateLoading(true);
    const { data, error } = await supabase.from("currencies").insert([newCurrency]).select();
    setCreateLoading(false);
    if (error) return console.error(error);
    if (data) {
      const updated = [...currencies, ...data];
      setCurrencies(updated);
      setFiltered(updated);
      setNewCurrency({ name: "", code: "", symbol: "" });
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoadingId(id);
    const { error } = await supabase.from("currencies").delete().eq("id", id);
    setDeleteLoadingId(null);
    if (error) return console.error(error);
    const updated = currencies.filter((c) => c.id !== id);
    setCurrencies(updated);
    setFiltered(updated);
  };

  const handleEdit = async () => {
    if (!editingCurrency) return;
    setEditLoading(true);
    const { data, error } = await supabase
      .from("currencies")
      .update({
        name: editingCurrency.name,
        code: editingCurrency.code,
        symbol: editingCurrency.symbol
      })
      .eq("id", editingCurrency.id)
      .select();
    setEditLoading(false);
    if (error) return console.error(error);
    if (data) {
      const updated = currencies.map((c) => (c.id === editingCurrency.id ? data[0] : c));
      setCurrencies(updated);
      setFiltered(updated);
      setEditDialog(false);
      setEditingCurrency(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Currency</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Currency</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Currency name</Label>
                <Input value={newCurrency.name} onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })} />
              </div>
              <div>
                <Label>Currency code *</Label>
                <Input value={newCurrency.code} onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value })} />
              </div>
              <div>
                <Label>Currency symbol *</Label>
                <Input value={newCurrency.symbol} onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })} />
              </div>
              <Button onClick={handleAdd} disabled={createLoading}>
                {createLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : ""}
                Submit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex justify-end items-center">
        <Input
          placeholder="Search..."
          className="w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="animate-spin w-6 h-6 text-gray-500" />
              <span className="ml-2 text-gray-500">Loading currencies...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Currency Code</TableHead>
                  <TableHead>Currency Name</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((currency) => (
                  <TableRow key={currency.id}>
                    <TableCell>{currency.code}</TableCell>
                    <TableCell>{currency.name}</TableCell>
                    <TableCell>{currency.symbol}</TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCurrency(currency);
                          setEditDialog(true);
                        }}
                      >
                        <Pencil size={16} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={deleteLoadingId === currency.id}>
                            {deleteLoadingId === currency.id ? (
                              <Loader2 className="animate-spin w-4 h-4" />
                            ) : (
                              <Trash2 size={16} className="text-red-500" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to delete this currency?</AlertDialogTitle>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(currency.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Currency</DialogTitle>
          </DialogHeader>
          {editingCurrency && (
            <div className="space-y-4">
              <div>
                <Label>Currency name</Label>
                <Input
                  value={editingCurrency.name}
                  onChange={(e) => setEditingCurrency({ ...editingCurrency, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Currency code</Label>
                <Input
                  value={editingCurrency.code}
                  onChange={(e) => setEditingCurrency({ ...editingCurrency, code: e.target.value })}
                />
              </div>
              <div>
                <Label>Currency symbol</Label>
                <Input
                  value={editingCurrency.symbol}
                  onChange={(e) => setEditingCurrency({ ...editingCurrency, symbol: e.target.value })}
                />
              </div>
              <Button onClick={handleEdit} disabled={editLoading}>
                {editLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : ""}
                Update
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
