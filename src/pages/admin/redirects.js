import { useState } from "react";
import { withSessionSsr } from "../../lib/session";
import { openDB } from "../../lib/db";
import AdminLayout from "../../components/layout/AdminLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

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
  const redirects = await db.all("SELECT * FROM paths ORDER BY id DESC");

  return {
    props: { initialRedirects: redirects },
  };
});

export default function RedirectsPage({ initialRedirects }) {
  const [list, setList] = useState(initialRedirects);
  const [searchTerm, setSearchTerm] = useState("");
  const [redirectToDelete, setRedirectToDelete] = useState(null);

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/admin/delete?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      setList((prev) => prev.filter((r) => r.id !== id));
      toast.success("Redirect deleted successfully.");
    } catch (err) {
      console.error("Failed to delete redirect:", err);
      toast.error("Failed to delete redirect.");
    }
  };

  const filteredList = list.filter(r => 
    r.path?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.redirect_url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Redirects</h1>
            <p className="text-muted-foreground">View and manage all your shortened links.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search redirects..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Path (Alias)</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Destination URL</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">/{r.path}</TableCell>
                  <TableCell className="text-muted-foreground">{r.domain}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 max-w-[300px]">
                      <span className="truncate" title={r.redirect_url}>
                        {r.redirect_url}
                      </span>
                      <a 
                        href={r.redirect_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the redirect for 
                            <span className="font-semibold text-foreground"> /{r.path}</span>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(r.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {filteredList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    {searchTerm ? "No redirects found matching your search." : "No redirects created yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
