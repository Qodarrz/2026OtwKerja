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
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { usersService } from "@/services/users.service";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Role } from "@/types/auth";
import { motion, AnimatePresence } from "framer-motion";
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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", roles: [Role.USER] });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setUsers(users.filter((u) => u.id !== deleteId));
      toast.success("Pengguna berhasil dihapus");
    } catch (error) {
      toast.error("Gagal menghapus pengguna");
    } finally {
      setDeleteId(null);
    }
  };

  const handleAddSubmit = async () => {
    if (!formData.email || !formData.password) return;
    setIsSubmitting(true);
    try {
      const created = await usersService.createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        roles: formData.roles,
        provider: "LOCAL",
        isKtpVerified: true,
      });
      setUsers([...users, created]);
      setIsAddOpen(false);
      setFormData({ name: "", email: "", password: "", roles: [Role.USER] });
      toast.success("Pengguna berhasil ditambahkan");
    } catch (error) {
      toast.error("Gagal menambahkan pengguna");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingUserId) return;
    setIsSubmitting(true);
    try {
      const updated = await usersService.updateUser(editingUserId, {
        name: formData.name,
        email: formData.email,
      });
      if (formData.roles.length > 0) {
        await usersService.updateRoles(editingUserId, formData.roles);
        updated.roles = formData.roles;
      }
      setUsers(users.map(u => u.id === editingUserId ? { ...u, ...updated } : u));
      setIsEditOpen(false);
      setEditingUserId(null);
      toast.success("Data pengguna berhasil diperbarui");
    } catch (error) {
      toast.error("Gagal memperbarui pengguna");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (user: any) => {
    setFormData({ name: user.name || "", email: user.email || "", password: "", roles: user.roles || [Role.USER] });
    setEditingUserId(user.id);
    setIsEditOpen(true);
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
            className="rounded-xl font-bold h-10 px-6 shadow-lg shadow-primary/10 gap-2"
            onClick={() => {
              setFormData({ name: "", email: "", password: "", roles: [Role.USER] });
              setIsAddOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
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
                          onClick={() => openEditModal(user)}
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

      <AnimatePresence>
        {(isAddOpen || isEditOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
              onClick={() => {
                setIsAddOpen(false);
                setIsEditOpen(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-background">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">
                    {isAddOpen ? "Tambah Pengguna Baru" : "Edit Pengguna"}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsAddOpen(false);
                    setIsEditOpen(false);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-accent transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-foreground">Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData(prev => ({...prev, name: e.target.value}))} 
                    className="w-full flex h-11 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-foreground">Alamat Email</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData(prev => ({...prev, email: e.target.value}))} 
                    className="w-full flex h-11 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" 
                  />
                </div>
                {isAddOpen && (
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-foreground">Password Sementara</label>
                    <input 
                      type="password" 
                      value={formData.password} 
                      onChange={e => setFormData(prev => ({...prev, password: e.target.value}))} 
                      className="w-full flex h-11 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" 
                    />
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-border bg-background flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddOpen(false);
                    setIsEditOpen(false);
                  }}
                  className="rounded-xl font-bold h-11 px-6"
                >
                  Batal
                </Button>
                <Button
                  onClick={isAddOpen ? handleAddSubmit : handleEditSubmit}
                  disabled={isSubmitting || !formData.email || (isAddOpen && !formData.password)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold h-11 px-8 shadow-lg"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Simpan Data
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
