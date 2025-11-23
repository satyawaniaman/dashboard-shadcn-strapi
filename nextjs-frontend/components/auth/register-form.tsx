"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import axios from "axios";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterFormData, string>>
  >({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof RegisterFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const validatedData = registerSchema.parse(formData);

      await axios.post(`${STRAPI_URL}/api/auth/local/register`, {
        username: validatedData.username,
        email: validatedData.email,
        password: validatedData.password,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
      });

      toast.success("Account created successfully!");

      const signInResult = await signIn("credentials", {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        window.location.href = "/";
      } else {
        window.location.href = "/login";
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.error?.message || "Registration failed";
        toast.error("Registration failed", { description: message });
      } else if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof RegisterFormData, string>> = {};
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            fieldErrors[issue.path[0] as keyof RegisterFormData] =
              issue.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Please check the form for errors");
      } else {
        toast.error("An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
      <form
        onSubmit={handleRegister}
        className="bg-card m-auto h-fit w-full max-w-sm rounded-[calc(var(--radius)+.125rem)] border p-0.5 shadow-md dark:[--color-muted:var(--color-zinc-900)]"
      >
        <div className="p-8 pb-6">
          <div className="text-center">
            <Link href="/" aria-label="go home" className="inline-block">
              <svg
                id="logo-64"
                width="80"
                height="80"
                viewBox="0 0 50 50"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  className="ccustom"
                  d="M27.5308 40.1395C27.5757 35.5502 26.4122 31.8182 24.9322 31.8037C23.4521 31.7893 22.2159 35.4979 22.1711 40.0871C22.1262 44.6764 23.2897 48.4085 24.7697 48.4229C26.2498 48.4374 27.486 44.7288 27.5308 40.1395Z"
                  fill="black"
                ></path>
                <path
                  className="ccustom"
                  d="M18.947 39.0972C21.4661 35.2608 22.5052 31.4922 21.268 30.6798C20.0307 29.8674 16.9856 32.3188 14.4666 36.1552C11.9475 39.9916 10.9084 43.7601 12.1456 44.5726C13.3829 45.385 16.4279 42.9336 18.947 39.0972Z"
                  fill="black"
                ></path>
                <path
                  className="ccustom"
                  d="M12.2792 33.593C16.4726 31.7278 19.3843 29.1194 18.7827 27.767C18.1812 26.4146 14.2942 26.8304 10.1008 28.6957C5.90744 30.5609 2.99571 33.1693 3.59726 34.5217C4.1988 35.8741 8.08584 35.4583 12.2792 33.593Z"
                  fill="black"
                ></path>
                <path
                  className="ccustom"
                  d="M18.2794 23.9745C18.5046 22.5116 15.0099 20.7597 10.4739 20.0615C5.93778 19.3633 2.07804 19.9833 1.85288 21.4462C1.62772 22.9091 5.1224 24.6609 9.65848 25.3591C14.1945 26.0573 18.0543 25.4373 18.2794 23.9745Z"
                  fill="black"
                ></path>
                <path
                  className="ccustom"
                  d="M19.908 20.4895C20.8882 19.3805 18.895 16.0176 15.4561 12.9783C12.0172 9.93902 8.43482 8.37426 7.45464 9.48332C6.47446 10.5924 8.46766 13.9553 11.9066 16.9946C15.3455 20.0339 18.9279 21.5986 19.908 20.4895Z"
                  fill="black"
                ></path>
                <path
                  className="ccustom"
                  d="M23.1514 18.4528C24.5756 18.0498 24.7171 14.1431 23.4675 9.72704C22.2179 5.31095 20.0503 2.05771 18.6261 2.46072C17.2019 2.86373 17.0604 6.77037 18.31 11.1865C19.5596 15.6025 21.7272 18.8558 23.1514 18.4528Z"
                  fill="black"
                ></path>
                <path
                  className="ccustom"
                  d="M31.9584 11.3239C33.2949 6.9333 33.2305 3.02462 31.8145 2.59361C30.3985 2.16259 28.1672 5.37245 26.8307 9.76304C25.4943 14.1536 25.5587 18.0623 26.9747 18.4933C28.3907 18.9243 30.622 15.7145 31.9584 11.3239Z"
                  fill="black"
                ></path>
                <path
                  className="ccustom"
                  d="M38.2514 17.2565C41.7491 14.285 43.8077 10.9617 42.8493 9.83373C41.891 8.70573 38.2787 10.2002 34.7811 13.1716C31.2834 16.1431 29.2249 19.4664 30.1832 20.5944C31.1415 21.7224 34.7538 20.228 38.2514 17.2565Z"
                  fill="black"
                ></path>
                <path
                  className="ccustom"
                  d="M40.3322 25.6519C44.8812 25.0433 48.4097 23.3607 48.2134 21.8936C48.0172 20.4266 44.1704 19.7307 39.6214 20.3392C35.0725 20.9478 31.5439 22.6304 31.7402 24.0975C31.9365 25.5645 35.7832 26.2605 40.3322 25.6519Z"
                  fill="black"
                ></path>
                <path
                  className="ccustom"
                  d="M46.2004 34.941C46.8285 33.6008 43.9688 30.9355 39.813 28.9879C35.6573 27.0403 31.7792 26.548 31.1511 27.8882C30.523 29.2285 33.3827 31.8938 37.5385 33.8414C41.6942 35.7889 45.5723 36.2813 46.2004 34.941Z"
                  fill="black"
                ></path>
                <path
                  className="ccustom"
                  d="M37.4589 44.8299C38.7119 44.0421 37.7473 40.2537 35.3044 36.3684C32.8615 32.4831 29.8653 29.9722 28.6123 30.76C27.3593 31.5478 28.3239 35.3362 30.7668 39.2215C33.2097 43.1068 36.2059 45.6178 37.4589 44.8299Z"
                  fill="black"
                ></path>
              </svg>
            </Link>
            <h1 className="mb-1 mt-4 text-xl font-semibold">
              Sign up to dashboard
            </h1>
            <p className="text-sm">Welcome! Create an account to get started</p>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="block text-sm">
                  First name
                </Label>
                <Input
                  type="text"
                  required
                  name="firstName"
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="block text-sm">
                  Last name
                </Label>
                <Input
                  type="text"
                  required
                  name="lastName"
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="block text-sm">
                Username
              </Label>
              <Input
                type="text"
                required
                name="username"
                id="username"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
                className={errors.username ? "border-red-500" : ""}
              />
              {errors.username && (
                <p className="text-xs text-red-500">{errors.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="block text-sm">
                Email
              </Label>
              <Input
                type="email"
                required
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">
                Password
              </Label>
              <Input
                type="password"
                required
                name="password"
                id="password"
                className={errors.password ? "border-red-500" : ""}
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Continue"}
            </Button>
          </div>
        </div>

        <div className="bg-muted rounded-(--radius) border p-3">
          <p className="text-accent-foreground text-center text-sm">
            Have an account?
            <Button asChild variant="link" className="px-2">
              <Link href="/login">Sign In</Link>
            </Button>
          </p>
        </div>
      </form>
    </section>
  );
}
