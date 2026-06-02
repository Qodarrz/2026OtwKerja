"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, ShieldCheck, Lock, Edit3, X, UserPlus } from "lucide-react";
import { usersService } from "@/services/users.service";
import { Button } from "@/components/ui/button";
import { Role } from "@/types/auth";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function RolesPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "", roles: [] as Role[] });
  const [isCreating, setIsCreating] = useState(false);

  // Role Protection
  useEffect(() => {
    if (!loading && (!currentUser || !currentUser.roles.includes(Role.ADMIN))) {
      router.push("/dashboard");
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const result = await usersService.getStaff();
        setUsers(result);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleOpenModal = (user: any) => {
    setSelectedUser(user);
    setSelectedRoles(user.roles || []);
  };

  const handleToggleRole = (role: Role) => {
    setSelectedRoles([role]);
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    setIsUpdating(true);
    try {
      await usersService.updateRoles(selectedUser.id, selectedRoles);
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id ? { ...u, roles: selectedRoles } : u
        )
      );
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to update roles", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateStaff = async () => {
    if (!newStaff.email || !newStaff.password) return;
    setIsCreating(true);
    try {
      const created = await usersService.createUser({
        name: newStaff.name,
        email: newStaff.email,
        password: newStaff.password,
        roles: newStaff.roles,
        provider: "LOCAL",
        isKtpVerified: true,
      });
      setUsers([...users, created]);
      setIsAddStaffOpen(false);
      setNewStaff({ name: "", email: "", password: "", roles: [] });
    } catch (error) {
      console.error("Failed to create staff", error);
    } finally {
      setIsCreating(false);
    }
  };

  const roleDefinitions = [
    {
      role: Role.ADMIN,
      name: "Administrator",
      desc: "Akses penuh ke seluruh sistem, manajemen pengguna, dan laporan analitik tingkat lanjut.",
    },
    {
      role: Role.DOCUMENT_VALIDATOR,
      name: "Document Validator",
      desc: "Verifikasi kelengkapan dan keabsahan dokumen persyaratan perizinan.",
    },
    {
      role: Role.FIELD_INSPECTOR,
      name: "Field Inspector",
      desc: "Melakukan verifikasi lapangan dan memberikan rekomendasi teknis.",
    },
    {
      role: Role.LEGALIZER,
      name: "Legalizer",
      desc: "Otorisasi akhir dan pengesahan dokumen perizinan yang siap diterbitkan.",
    },
    {
      role: Role.CS,
      name: "Customer Service",
      desc: "Menangani aduan, pertanyaan, dan memberikan dukungan langsung kepada warga.",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <header className="space-y-2">
          <div className="h-8 w-48 bg-secondary rounded-md animate-pulse" />
          <div className="h-4 w-96 bg-muted rounded-md animate-pulse" />
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardContent className="p-0">
                <div className="h-16 w-full bg-muted border-b border-border animate-pulse" />
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-12 w-full bg-muted rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="shadow-sm h-96 animate-pulse bg-background" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser?.roles.includes(Role.ADMIN)) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Hak Akses (RBAC)
          </h1>
          <p className="text-muted-foreground mt-1">
            Pengelolaan otorisasi dan Role-Based Access Control untuk keamanan sistem.
          </p>
        </div>
        <Button onClick={() => setIsAddStaffOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-11 px-6 shadow-lg shrink-0">
          <UserPlus className="w-4 h-4 mr-2" />
          Tambah Staf Baru
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm overflow-hidden border-none">
            <CardHeader className="border-b border-border bg-background flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Otorisasi Pengguna</CardTitle>
                <CardDescription>
                  Daftar hak akses yang melekat pada setiap akun staf.
                </CardDescription>
              </div>
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <Lock className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-background text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-6 py-4">Nama Staf</th>
                      <th className="px-6 py-4">Roles Terdaftar</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-accent/30 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground">
                            {user.name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1.5 flex-wrap">
                            {user.roles.map((role: string) => (
                              <span
                                key={role}
                                className={cn(
                                  "inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border",
                                  role === Role.ADMIN
                                    ? "bg-primary/10 text-primary border-primary/20"
                                    : "bg-secondary text-secondary-foreground border-border"
                                )}
                              >
                                {role === Role.ADMIN && (
                                  <ShieldCheck className="w-3 h-3 mr-1" />
                                )}
                                {role.replace("_", " ")}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-xs font-bold h-9 hover:bg-primary hover:text-primary-foreground transition-all"
                            onClick={() => handleOpenModal(user)}
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-2" /> Ubah Role
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm bg-background border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
            <CardHeader className="border-b border-border">
              <CardTitle className="text-xl">Hierarki Role</CardTitle>
              <CardDescription>Definisi level akses sistem.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6 relative z-10">
              {roleDefinitions.map((role) => (
                <div key={role.role} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {role.name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {role.desc}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Role Update Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
              onClick={() => setSelectedUser(null)}
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
                    Ubah Role Pengguna
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Mengelola akses untuk {selectedUser.name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-accent transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="p-6 space-y-3">
                {roleDefinitions.map((rd) => {
                  const isSelected = selectedRoles.includes(rd.role);
                  return (
                    <div
                      key={rd.role}
                      onClick={() => handleToggleRole(rd.role)}
                      className={cn(
                        "p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-background hover:border-border"
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-lg flex items-center justify-center border mt-0.5 shrink-0 transition-colors",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-input bg-card"
                        )}
                      >
                        {isSelected && <ShieldCheck className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <p
                          className={cn(
                            "font-bold text-sm",
                            isSelected ? "text-primary" : "text-foreground"
                          )}
                        >
                          {rd.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                          {rd.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-6 border-t border-border bg-background flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                  className="rounded-xl font-bold h-11 px-6"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSaveRoles}
                  disabled={isUpdating}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold h-11 px-8 shadow-lg shadow-primary/20"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Simpan Perubahan
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {isAddStaffOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
              onClick={() => setIsAddStaffOpen(false)}
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
                    Tambah Staf Baru
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Buat akun staf baru dan atur role mereka.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddStaffOpen(false)}
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
                    value={newStaff.name} 
                    onChange={e => setNewStaff(prev => ({...prev, name: e.target.value}))} 
                    className="w-full flex h-11 rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all" 
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-foreground">Alamat Email</label>
                  <input 
                    type="email" 
                    value={newStaff.email} 
                    onChange={e => setNewStaff(prev => ({...prev, email: e.target.value}))} 
                    className="w-full flex h-11 rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all" 
                    placeholder="staff@flowgov.id"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-foreground">Password Sementara</label>
                  <input 
                    type="password" 
                    value={newStaff.password} 
                    onChange={e => setNewStaff(prev => ({...prev, password: e.target.value}))} 
                    className="w-full flex h-11 rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all" 
                    placeholder="Minimal 8 karakter"
                  />
                </div>
                <div className="space-y-3 pt-2">
                  <label className="text-sm font-bold text-foreground">Pilih Role Akses</label>
                  <div className="space-y-2">
                    {roleDefinitions.map((rd) => {
                      const isSelected = newStaff.roles.includes(rd.role);
                      return (
                        <div
                          key={rd.role}
                          onClick={() => {
                            setNewStaff(prev => ({
                              ...prev,
                              roles: [rd.role]
                            }))
                          }}
                          className={cn(
                            "p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-transparent bg-background hover:border-border"
                          )}
                        >
                          <div
                            className={cn(
                              "w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors",
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-input bg-card"
                            )}
                          >
                            {isSelected && <ShieldCheck className="w-2.5 h-2.5" />}
                          </div>
                          <div>
                            <p
                              className={cn(
                                "font-bold text-sm",
                                isSelected ? "text-primary" : "text-foreground"
                              )}
                            >
                              {rd.name}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-border bg-background flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="rounded-xl font-bold h-11 px-6"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleCreateStaff}
                  disabled={isCreating || !newStaff.email || !newStaff.password}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold h-11 px-8 shadow-lg shadow-primary/20"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Buat Akun Staf
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
