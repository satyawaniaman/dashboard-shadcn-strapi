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
import { Loader2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import axiosInstance from "@/app/lib/axios";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  stock: z.number().int().min(0, "Stock must be non-negative"),
  barcode: z.string().optional(),
  category: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Category {
  id: number;
  documentId: string;
  name: string;
  description: string;
}

interface ImageFile {
  id: number;
  url: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  documentId: string;
  price: number;
  stock: number;
  barcode: string | null;
  category: Category | null;
  image: ImageFile[];
}

interface NewProps {
  item?: Product | null;
  onSuccess?: () => void;
  isOpen: boolean;
}

export const New = ({ item = null, onSuccess, isOpen }: NewProps) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageId, setImageId] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock: 0,
      barcode: "",
      category: undefined,
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get("/api/categories");
        setCategories(response.data.data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (item) {
      form.reset({
        name: item.name || "",
        description: item.description || "",
        price: item.price || 0,
        stock: item.stock || 0,
        barcode: item.barcode || "",
        category: item.category?.documentId || undefined,
      });

      // Set image preview if exists
      if (item.image && item.image.length > 0) {
        setImagePreview(item.image[0].url);
        setImageId(item.image[0].id);
      } else {
        setImagePreview(null);
        setImageId(null);
      }
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        stock: 0,
        barcode: "",
        category: undefined,
      });
      setImagePreview(null);
      setImageId(null);
    }
  }, [item, isOpen, form]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("files", file);

    setUploading(true);
    setUploadProgress(0);

    try {
      const res = await axiosInstance.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(percent);
          }
        },
      });

      const uploadedImage = res.data[0];
      setImagePreview(uploadedImage.url);
      setImageId(uploadedImage.id);
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Image upload failed");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  async function onSubmit(values: FormValues) {
    setLoading(true);

    try {
      const payload = {
        name: values.name,
        description: values.description,
        price: values.price,
        stock: values.stock,
        barcode: values.barcode || null,
        category: values.category || undefined,
        image: imageId,
      };

      if (item?.id) {
        await axiosInstance.put(`/api/products/${item.documentId}`, {
          data: payload,
        });
        toast.success("Product updated successfully");
      } else {
        await axiosInstance.post("/api/products", { data: payload });
        toast.success("Product created successfully");
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to save product:", error);
      toast.error("Failed to save product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{item?.id ? "Edit" : "Add"} product</DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Product name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Product description"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="barcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Barcode (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter barcode" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category (Optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.documentId} value={cat.documentId}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image Upload Section */}
          <div className="space-y-2">
            <FormLabel>Product Image</FormLabel>

            {imagePreview && (
              <div className="relative w-full max-w-xs">
                <Image
                  src={`http://localhost:1337${imagePreview}`}
                  alt="Product Preview"
                  width={300}
                  height={300}
                  className="w-full h-48 object-cover rounded border"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setImageId(null);
                  }}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 hover:bg-destructive/90 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-primary hover:underline">
                <UploadCloud className="w-4 h-4" />
                {imagePreview ? "Change image" : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading... {uploadProgress}%
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || uploading}
            className="w-full"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
};
