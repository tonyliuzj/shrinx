import { useState, useEffect } from "react";
import { withSessionSsr } from "../../lib/session";
import AdminLayout from "../../components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ShieldCheck, Globe, Key, Trash2, Plus, Loader2 } from "lucide-react";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  
  // Settings State
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState("");
  const [turnstileSecretKey, setTurnstileSecretKey] = useState("");
  const [primaryDomain, setPrimaryDomain] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Domains State
  const [domains, setDomains] = useState([]);
  const [newDomain, setNewDomain] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);

  // Credentials State
  const [credentialsForm, setCredentialsForm] = useState({
    currentPassword: "",
    newUsername: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingCredentials, setChangingCredentials] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setTurnstileEnabled(data.settings.turnstile_enabled === "true");
        setTurnstileSiteKey(data.settings.turnstile_site_key || "");
        setTurnstileSecretKey(data.settings.turnstile_secret_key || "");
        setPrimaryDomain(data.settings.primary_domain || "");
        setDomains(data.domains || []);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnstile_enabled: turnstileEnabled,
          turnstile_site_key: turnstileSiteKey,
          turnstile_secret_key: turnstileSecretKey,
          primary_domain: primaryDomain,
        }),
      });

      if (res.ok) {
        toast.success("Settings saved successfully!");
      } else {
        throw new Error("Failed to save");
      }
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setAddingDomain(true);

    try {
      const res = await fetch("/api/admin/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });

      if (res.ok) {
        toast.success("Domain added successfully!");
        setNewDomain("");
        fetchSettings();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add domain.");
      }
    } catch {
      toast.error("Error adding domain.");
    } finally {
      setAddingDomain(false);
    }
  };

  const handleDeleteDomain = async (id) => {
    // In a real implementation, use AlertDialog. Using confirm for brevity here or implement Shadcn Alert Dialog.
    if (!confirm("Are you sure you want to delete this domain?")) return;

    try {
      const res = await fetch("/api/admin/domains", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        toast.success("Domain deleted successfully!");
        fetchSettings();
      } else {
        toast.error("Failed to delete domain.");
      }
    } catch {
      toast.error("Error deleting domain.");
    }
  };

  const handleChangeCredentials = async (e) => {
    e.preventDefault();

    if (!credentialsForm.currentPassword) {
      toast.error("Current password is required.");
      return;
    }

    if (!credentialsForm.newUsername && !credentialsForm.newPassword) {
      toast.error("Please provide a new username or new password.");
      return;
    }

    if (credentialsForm.newPassword && credentialsForm.newPassword !== credentialsForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (credentialsForm.newPassword && credentialsForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setChangingCredentials(true);

    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: credentialsForm.currentPassword,
          newUsername: credentialsForm.newUsername || undefined,
          newPassword: credentialsForm.newPassword || undefined,
        }),
      });

      if (res.ok) {
        const message = credentialsForm.newUsername && credentialsForm.newPassword
          ? "Username and password changed successfully!"
          : credentialsForm.newUsername
          ? "Username changed successfully!"
          : "Password changed successfully!";

        toast.success(message);

        setCredentialsForm({
          currentPassword: "",
          newUsername: "",
          newPassword: "",
          confirmPassword: "",
        });

        // If username was changed, redirect to login
        if (credentialsForm.newUsername) {
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to change credentials.");
      }
    } catch {
      toast.error("Error changing credentials.");
    } finally {
      setChangingCredentials(false);
    }
  };

  if (loading) {
     return (
        <AdminLayout>
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        </AdminLayout>
     )
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage global configuration and security.</p>
        </div>

        <div className="grid gap-6">
            {/* Turnstile Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        Global Cloudflare Turnstile Settings
                    </CardTitle>
                    <CardDescription>
                        Enable CAPTCHA protection for your short links.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSaveSettings} className="space-y-4">
                        <div className="flex items-center space-x-2">
                            {/* Checkbox component needed, or use simple input type checkbox styled */}
                            <input 
                                type="checkbox" 
                                id="turnstile-enabled"
                                checked={turnstileEnabled}
                                onChange={(e) => setTurnstileEnabled(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="turnstile-enabled">Enable Turnstile CAPTCHA</Label>
                        </div>
                        {turnstileEnabled && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="site-key">Site Key</Label>
                                    <Input 
                                        id="site-key"
                                        value={turnstileSiteKey}
                                        onChange={(e) => setTurnstileSiteKey(e.target.value)}
                                        placeholder="Enter Turnstile site key"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="secret-key">Secret Key</Label>
                                    <Input 
                                        id="secret-key"
                                        type="password"
                                        value={turnstileSecretKey}
                                        onChange={(e) => setTurnstileSecretKey(e.target.value)}
                                        placeholder="Enter Turnstile secret key"
                                    />
                                </div>
                            </>
                        )}
                        <Button type="submit" disabled={savingSettings}>
                            {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Turnstile Settings
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Primary Domain Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-600" />
                        Primary Domain Restriction
                    </CardTitle>
                    <CardDescription>
                        Set a primary domain to enforce. All requests from other domains will be redirected to this domain. Leave empty to allow all domains.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSaveSettings} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="primary-domain">Primary Domain</Label>
                            <Input
                                id="primary-domain"
                                value={primaryDomain}
                                onChange={(e) => setPrimaryDomain(e.target.value)}
                                placeholder="e.g. example.com or example.com:3000"
                            />
                            <p className="text-sm text-muted-foreground">
                                Include port if needed (e.g., localhost:3000). When set, only this domain will be accessible.
                            </p>
                        </div>
                        <Button type="submit" disabled={savingSettings}>
                            {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Primary Domain
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Domain Management */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-green-600" />
                        Domain Management
                    </CardTitle>
                    <CardDescription>
                        Add domains for creating short links.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleAddDomain} className="flex gap-2">
                        <Input 
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                            placeholder="e.g. example.com"
                            className="flex-1"
                        />
                        <Button type="submit" disabled={addingDomain} className="bg-green-600 hover:bg-green-700">
                             {addingDomain ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                             <span className="ml-2">Add Domain</span>
                        </Button>
                    </form>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Domain</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {domains.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center h-24 text-muted-foreground">
                                            No domains configured.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    domains.map((domain) => (
                                        <TableRow key={domain.id}>
                                            <TableCell className="font-mono">{domain.domain}</TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleDeleteDomain(domain.id)}
                                                    className="text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Change Credentials */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-purple-600" />
                        Change Admin Credentials
                    </CardTitle>
                    <CardDescription>
                        Update your username and/or password. You can change one or both fields.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangeCredentials} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password *</Label>
                            <Input
                                id="current-password"
                                type="password"
                                value={credentialsForm.currentPassword}
                                onChange={(e) => setCredentialsForm({...credentialsForm, currentPassword: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-username">New Username (optional)</Label>
                            <Input
                                id="new-username"
                                value={credentialsForm.newUsername}
                                onChange={(e) => setCredentialsForm({...credentialsForm, newUsername: e.target.value})}
                                placeholder="Leave empty to keep current username"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password (optional)</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={credentialsForm.newPassword}
                                onChange={(e) => setCredentialsForm({...credentialsForm, newPassword: e.target.value})}
                                placeholder="Leave empty to keep current password"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={credentialsForm.confirmPassword}
                                onChange={(e) => setCredentialsForm({...credentialsForm, confirmPassword: e.target.value})}
                                placeholder="Required if changing password"
                                disabled={!credentialsForm.newPassword}
                            />
                        </div>
                        <Button type="submit" disabled={changingCredentials} className="bg-purple-600 hover:bg-purple-700">
                             {changingCredentials && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Update Credentials
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

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
  return { props: {} };
});
