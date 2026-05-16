"use client";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Loader2,
  Users,
  Search,
  Filter,
  Shield,
  MoreVertical,
} from "lucide-react";
import { usersService } from "@/services/users.service";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const result = await usersService.getUsers();
      setUsers(result);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await usersService.deleteUser(deleteId);
      fetchUsers();
    } catch (error) {
      alert("Gagal menghapus pengguna");
    } finally {
      setDeleteId(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <header className="flex justify-between gap-6">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-secondary rounded-md animate-pulse" />
            <div className="h-4 w-96 bg-muted rounded-md animate-pulse" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-64 bg-secondary rounded-xl animate-pulse" />
            <div className="h-10 w-24 bg-secondary rounded-xl animate-pulse" />
          </div>
        </header>
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="h-12 w-full bg-muted border-b border-border animate-pulse" />
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-12 w-full bg-muted rounded-lg animate-pulse"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Daftar Pengguna
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Manajemen seluruh akun yang terdaftar dalam ekosistem FlowGov.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 w-64 transition-all"
            />
          </div>
          <Button
            className="rounded-xl font-bold h-10 px-6 shadow-lg shadow-primary/10"
            onClick={() => alert("Fitur Tambah Pengguna segera hadir!")}
          >
            Tambah Pengguna
          </Button>
        </div>
      </header>

      <Card className="shadow-sm overflow-hidden border-none bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-background text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-5">Pengguna</th>
                  <th className="px-6 py-5">Email</th>
                  <th className="px-6 py-5">Peran (Role)</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-accent/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {user.name ? user.name.charAt(0) : "U"}
                        </div>
                        <span className="font-bold text-foreground">
                          {user.name || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.map((role: string) => (
                          <span
                            key={role}
                            className="inline-flex items-center px-2 py-1 bg-secondary text-secondary-foreground text-[10px] font-bold uppercase tracking-wider rounded-md border border-primary/10"
                          >
                            {role === "ADMIN" && (
                              <Shield className="w-3 h-3 mr-1" />
                            )}
                            {role.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                        Aktif
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(user.id)}
                          className="h-8 px-2 text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg"
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-muted-foreground font-medium"
                    >
                      Data pengguna tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Akun pengguna akan dihapus secara permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
