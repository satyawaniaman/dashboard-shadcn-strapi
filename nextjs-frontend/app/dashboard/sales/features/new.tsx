"use client";

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosInstance from "@/app/lib/axios";
import { Trash2, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formSchema = z.object({
  invoice_number: z.string().min(1, "Invoice number is required"),
  date: z.string().min(1, "Date is required"),
  customer_name: z.string().min(1, "Customer name is required"),
  customer_email: z.string().email("Invalid email").min(1, "Email is required"),
  customer_phone: z.string().min(1, "Phone number is required"),
  tax_amount: z.number().min(0, "Tax must be non-negative"),
  discount_amount: z.number().min(0, "Discount must be non-negative"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Product {
  id: number;
  documentId: string;
  name: string;
  price: number;
  stock: number;
}

interface LineItem {
  product: Product | null;
  quantity: number;
  price: number;
}

interface SaleProduct {
  product: {
    id: number;
    documentId: string;
    name: string;
  };
  quantity: number;
  price: number;
}

interface Sale {
  id: number;
  documentId: string;
  date: string;
  total: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  invoice_number: string;
  discount_amount: number;
  tax_amount: number;
  subtotal: number;
  notes: string;
  products?: SaleProduct[];
}

interface NewProps {
  item?: Sale | null;
  onSuccess?: () => void;
  isOpen: boolean;
}

export const New = ({ item = null, onSuccess, isOpen }: NewProps) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoice_number: "",
      date: new Date().toISOString().split("T")[0],
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      tax_amount: 0,
      discount_amount: 0,
      notes: "",
    },
  });

  // Calculate totals from line items
  const subtotal = lineItems.reduce((sum, item) => {
    if (item.product && item.quantity > 0) {
      return sum + item.price * item.quantity;
    }
    return sum;
  }, 0);

  const taxAmount = form.watch("tax_amount");
  const discountAmount = form.watch("discount_amount");
  const total = subtotal + taxAmount - discountAmount;

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosInstance.get(
          "/api/products?pagination[pageSize]=100",
        );
        setProducts(response.data.data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };
    fetchProducts();
  }, []);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) return;

    if (item) {
      form.reset({
        invoice_number: item.invoice_number || "",
        date: item.date ? new Date(item.date).toISOString().split("T")[0] : "",
        customer_name: item.customer_name || "",
        customer_email: item.customer_email || "",
        customer_phone: item.customer_phone || "",
        tax_amount: item.tax_amount || 0,
        discount_amount: item.discount_amount || 0,
        notes: item.notes || "",
      });

      // Load existing line items
      if (item.products && item.products.length > 0) {
        const loadedItems: LineItem[] = item.products.map((p) => {
          const product = products.find((prod) => prod.id === p.product.id);
          return {
            product: product || {
              id: p.product.id,
              documentId: p.product.documentId,
              name: p.product.name,
              price: p.price,
              stock: 0,
            },
            quantity: p.quantity,
            price: p.price,
          };
        });
        setLineItems(loadedItems);
      } else {
        setLineItems([]);
      }
    } else {
      // Generate random invoice number for new invoices
      const randomInvoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
      form.reset({
        invoice_number: randomInvoiceNumber,
        date: new Date().toISOString().split("T")[0],
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        tax_amount: 0,
        discount_amount: 0,
        notes: "",
      });
      setLineItems([]);
    }
  }, [item, isOpen, form, products]);

  const addLineItem = () => {
    setLineItems([...lineItems, { product: null, quantity: 1, price: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (
    index: number,
    field: keyof LineItem,
    value: Product | number,
  ) => {
    const updated = [...lineItems];
    if (field === "product") {
      const product = value as Product;
      updated[index].product = product;
      updated[index].price = product.price;
    } else if (field === "quantity") {
      updated[index].quantity = value as number;
    }
    setLineItems(updated);
  };

  async function onSubmit(values: FormValues) {
    if (lineItems.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    const invalidItems = lineItems.filter(
      (item) => !item.product || item.quantity <= 0,
    );
    if (invalidItems.length > 0) {
      toast.error("Please select products and enter valid quantities");
      return;
    }

    setLoading(true);

    try {
      const productsData = lineItems.map((item) => ({
        product: item.product!.documentId,
        quantity: item.quantity,
        price: item.price,
      }));

      const payload = {
        invoice_number: values.invoice_number,
        date: new Date(values.date).toISOString(),
        customer_name: values.customer_name,
        customer_email: values.customer_email,
        customer_phone: values.customer_phone,
        subtotal: subtotal,
        tax_amount: values.tax_amount,
        discount_amount: values.discount_amount,
        notes: values.notes || "",
        total: total,
        products: productsData,
      };

      if (item?.id) {
        await axiosInstance.put(`/api/sales/${item.documentId}`, {
          data: payload,
        });
        toast.success("Invoice updated successfully");
      } else {
        await axiosInstance.post("/api/sales", { data: payload });
        toast.success("Invoice created successfully");
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to save invoice:", error);
      toast.error("Failed to save invoice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto !max-w-4xl w-[95vw]">
      <DialogHeader>
        <DialogTitle>{item?.id ? "Edit" : "Create"} Invoice</DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Top Section: Invoice & Customer Info Side by Side */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Invoice Details */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Invoice Details</h3>
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="invoice_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number</FormLabel>
                      <FormControl>
                        <Input placeholder="INV-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Right: Customer Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">
                Customer Information
              </h3>
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="customer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customer_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customer_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Products/Line Items */}
          <div className="border-t pt-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold">Products</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLineItem}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Product
              </Button>
            </div>

            {lineItems.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[45%]">Product</TableHead>
                      <TableHead className="w-[20%]">Price</TableHead>
                      <TableHead className="w-[15%]">Quantity</TableHead>
                      <TableHead className="w-[20%] text-right">
                        Total
                      </TableHead>
                      <TableHead className="w-[10%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={item.product?.documentId || ""}
                            onValueChange={(value) => {
                              const product = products.find(
                                (p) => p.documentId === value,
                              );
                              if (product) {
                                updateLineItem(index, "product", product);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem
                                  key={product.documentId}
                                  value={product.documentId}
                                >
                                  {product.name} (Stock: {product.stock})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            ₹{item.price.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateLineItem(
                                index,
                                "quantity",
                                Number(e.target.value),
                              )
                            }
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLineItem(index)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <p>No products added yet.</p>
                <p className="text-sm">
                  Click &quot;Add Product&quot; to get started.
                </p>
              </div>
            )}
          </div>

          {/* Payment Details & Notes Side by Side */}
          <div className="border-t pt-5">
            <div className="grid grid-cols-2 gap-6">
              {/* Left: Payment Details */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Payment Details</h3>
                <div className="space-y-3">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span className="font-medium">
                        ₹{subtotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="tax_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Amount (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discount_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Amount (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-primary/10 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold">Total:</span>
                      <span className="text-xl font-bold">
                        ₹{total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Notes */}
              <div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes or comments..."
                          className="resize-none h-[270px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? "Saving..."
              : item?.id
                ? "Update Invoice"
                : "Create Invoice"}
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
};
