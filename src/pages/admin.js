import { useState } from "react";
import { withSessionSsr } from "../lib/session";
import { openDB } from "../lib/db";
import AdminLayout from "../components/layout/AdminLayout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

const formSchema = z.object({
  domain: z.string().min(1, "Domain is required"),
  path: z.string().min(1, "Path is required").regex(/^[a-zA-Z0-9-_]+$/, "Only letters, numbers, dashes and underscores allowed"),
  redirectUrl: z.string().url("Must be a valid URL"),
});

export const getServerSideProps = withSessionSsr(async ({ req }) => {
  const user = req.session.get("user");
  if (!user?.isLoggedIn) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const db = await openDB();
  await db.run(`
    CREATE TABLE IF NOT EXISTS paths (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT,
      domain TEXT,
      redirect_url TEXT
    )
  `);
  return { props: {} };
});

export default function Admin() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: "",
      path: "",
      redirectUrl: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      const res = await fetch("/api/admin/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(`Add failed: ${res.status}`);
      
      toast.success("Redirect created successfully!");
      form.reset();
    } catch (err) {
      console.error("Failed to add redirect:", err);
      toast.error("Failed to create redirect. Please try again.");
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Manage your short links and redirects.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="md:col-span-4 lg:col-span-4">
            <CardHeader>
              <CardTitle>Create Redirect</CardTitle>
              <CardDescription>
                Add a new short link to your collection.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="domain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domain</FormLabel>
                          <FormControl>
                            <Input placeholder="example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="path"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Path (Alias)</FormLabel>
                          <div className="relative flex items-center">
                             <span className="absolute left-3 text-muted-foreground">/</span>
                             <FormControl>
                                <Input className="pl-6" placeholder="my-link" {...field} />
                             </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="redirectUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://very-long-url.com/destination" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Redirect
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-3 bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-primary-foreground">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 text-xs font-bold">
                  1
                </div>
                <p className="text-sm text-primary-foreground/90">
                  Use clear, memorable aliases for better click-through rates.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 text-xs font-bold">
                  2
                </div>
                <p className="text-sm text-primary-foreground/90">
                  Double check the destination URL to ensure it works.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 text-xs font-bold">
                  3
                </div>
                <p className="text-sm text-primary-foreground/90">
                  You can view and manage all your redirects in the Redirects tab.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
