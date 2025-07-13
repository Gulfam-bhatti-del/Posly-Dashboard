"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Edit, Plus, Search, Download, X } from "lucide-react";
import { supabase, type Unit } from "@/lib/supabase";
import { toast } from "react-toastify";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    short_name: "",
    base_unit: "",
    operator: "×",
    operation_value: 1.0,
  });
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    const filtered = units.filter(
      (unit) =>
        unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.short_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUnits(filtered);
  }, [units, searchTerm]);

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .order("name");

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      toast.error("Failed to fetch units");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("units").insert([
        {
          name: formData.name,
          short_name: formData.short_name,
          base_unit: formData.base_unit || null,
          operator: formData.operator,
          operation_value: formData.operation_value,
        },
      ]);

      if (error) throw error;

      toast.success("Unit created successfully");

      setIsCreateDialogOpen(false);
      resetForm();
      fetchUnits();
    } catch (error: any) {
      toast.error(error.message || "Failed to create unit");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;

    try {
      const { error } = await supabase
        .from("units")
        .update({
          name: formData.name,
          short_name: formData.short_name,
          base_unit: formData.base_unit || null,
          operator: formData.operator,
          operation_value: formData.operation_value,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingUnit.id);

      if (error) throw error;

      toast.success("Unit updated successfully");

      setIsEditDialogOpen(false);
      setEditingUnit(null);
      resetForm();
      fetchUnits();
    } catch (error: any) {
      toast.error(error.message || "Failed to update unit");
    }
  };

  const handleDelete = async () => {
    if (!unitToDelete) return;

    try {
      const { error } = await supabase
        .from("units")
        .delete()
        .eq("id", unitToDelete.id);

      if (error) throw error;

      toast.success("Unit deleted successfully");

      setIsDeleteDialogOpen(false);
      setUnitToDelete(null);
      fetchUnits();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete unit");
    }
  };

  const openEditDialog = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      short_name: unit.short_name,
      base_unit: unit.base_unit || "",
      operator: unit.operator,
      operation_value: unit.operation_value,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      short_name: "",
      base_unit: "",
      operator: "×",
      operation_value: 1.0,
    });
  };

  const baseUnits = units.filter((unit) => !unit.base_unit);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading units...</div>
        </div>
      </div>
    );
  }

  const openDeleteDialog = (unit: Unit) => {
    setUnitToDelete(unit);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 -mt-4">
        <h1 className="text-2xl mb-4">Unit</h1>
        <Separator />
      </div>
      <Card>
        <CardHeader>
          {/* Create Button Section */}
          <div className="flex justify-end mb-4">
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Title *</Label>
                    <Input
                      id="name"
                      placeholder="Enter Unit Name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="short_name">Short Name *</Label>
                    <Input
                      id="short_name"
                      placeholder="Enter shortname Unit"
                      value={formData.short_name}
                      onChange={(e) =>
                        setFormData({ ...formData, short_name: e.target.value })
                      }
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="base_unit">Base Unit</Label>
                    <Select
                      value={formData.base_unit}
                      onValueChange={(value) =>
                        setFormData({ ...formData, base_unit: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose Base Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {baseUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.short_name}>
                            {unit.name} ({unit.short_name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.base_unit && (
                    <>
                      <div>
                        <Label htmlFor="operator">Operator</Label>
                        <Select
                          value={formData.operator}
                          onValueChange={(value) =>
                            setFormData({ ...formData, operator: value })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="×">×</SelectItem>
                            <SelectItem value="÷">÷</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="operation_value">Operation Value</Label>
                        <Input
                          id="operation_value"
                          type="number"
                          step="any"
                          value={formData.operation_value}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              operation_value:
                                Number.parseFloat(e.target.value) || 1.0,
                            })
                          }
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                  <Button type="submit" className="w-full">
                    Submit
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Controls and Search Section */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-4 gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Select defaultValue="10">
                <SelectTrigger className="w-full sm:w-20">
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
                    className="w-full sm:w-auto"
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
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Name</TableHead>
                  <TableHead className="min-w-[120px]">Short Name</TableHead>
                  <TableHead className="min-w-[120px]">Base Unit</TableHead>
                  <TableHead className="min-w-[100px]">Operator</TableHead>
                  <TableHead className="min-w-[150px]">
                    Operation Value
                  </TableHead>
                  <TableHead className="min-w-[80px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnits.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell>{unit.name}</TableCell>
                    <TableCell>{unit.short_name}</TableCell>
                    <TableCell>{unit.base_unit || "-"}</TableCell>
                    <TableCell>{unit.operator}</TableCell>
                    <TableCell>{unit.operation_value}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Edit
                          className="w-4 h-4 text-green-600 cursor-pointer"
                          onClick={() => openEditDialog(unit)}
                        />
                        <X
                          className="w-4 h-4 text-red-600 cursor-pointer"
                          onClick={() => openDeleteDialog(unit)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUnits.length === 0 && (
            <div className="text-center py-8 text-gray-500">No units found</div>
          )}

          {/* Pagination Section */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <div className="text-sm text-gray-600">
              Showing 1 to {units.length} of {units.length} entries
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Unit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit_name">Title *</Label>
              <Input
                id="edit_name"
                placeholder="Enter Unit Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="edit_short_name">Short Name *</Label>
              <Input
                id="edit_short_name"
                placeholder="Enter shortname Unit"
                value={formData.short_name}
                onChange={(e) =>
                  setFormData({ ...formData, short_name: e.target.value })
                }
                required
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="edit_base_unit">Base Unit</Label>
              <Select
                value={formData.base_unit}
                onValueChange={(value) =>
                  setFormData({ ...formData, base_unit: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose Base Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {baseUnits
                    .filter((unit) => unit.id !== editingUnit?.id)
                    .map((unit) => (
                      <SelectItem key={unit.id} value={unit.short_name}>
                        {unit.name} ({unit.short_name})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {formData.base_unit && (
              <>
                <div>
                  <Label htmlFor="edit_operator">Operator</Label>
                  <Select
                    value={formData.operator}
                    onValueChange={(value) =>
                      setFormData({ ...formData, operator: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="×">×</SelectItem>
                      <SelectItem value="÷">÷</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_operation_value">Operation Value</Label>
                  <Input
                    id="edit_operation_value"
                    type="number"
                    step="any"
                    value={formData.operation_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        operation_value:
                          Number.parseFloat(e.target.value) || 1.0,
                      })
                    }
                    className="w-full"
                  />
                </div>
              </>
            )}
            <Button type="submit" className="w-full">
              Update
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Unit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete the unit "
              <span className="font-semibold">{unitToDelete?.name}</span>" (
              <span className="font-semibold">{unitToDelete?.short_name}</span>
              )?
            </p>
            <p className="text-sm text-red-600 font-medium">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setUnitToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
