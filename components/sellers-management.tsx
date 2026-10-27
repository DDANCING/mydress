"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, User, Mail, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface Seller {
  id: string;
  userId: string;
  name: string;
  document: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export function SellersManagement() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form states
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newSellerName, setNewSellerName] = useState("");
  const [newSellerDocument, setNewSellerDocument] = useState("");

  const fetchSellers = async () => {
    try {
      const response = await fetch("/api/sellers");
      if (response.ok) {
        const data = await response.json();
        setSellers(data);
      }
    } catch (error) {
      console.error("Error fetching sellers:", error);
      toast.error("Erro ao carregar vendedores");
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch("/api/users/available-for-seller");
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data);
      }
    } catch (error) {
      console.error("Error fetching available users:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSellers(), fetchAvailableUsers()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleCreateSeller = async () => {
    if (!selectedUserId || !newSellerName) {
      toast.error("Usuário e nome são obrigatórios");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/sellers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserId,
          name: newSellerName,
          document: newSellerDocument || null,
        }),
      });

      if (response.ok) {
        const newSeller = await response.json();
        setSellers((prev) => [newSeller, ...prev]);
        setSelectedUserId("");
        setNewSellerName("");
        setNewSellerDocument("");
        setShowCreateForm(false);
        toast.success("Vendedor criado com sucesso!");
        await fetchAvailableUsers(); // Atualiza a lista de usuários disponíveis
      } else if (response.status === 400) {
        const error = await response.text();
        if (error.includes("User already has a seller profile")) {
          toast.error("Já existe um vendedor para este usuário ou documento.");
        } else {
          toast.error(error || "Erro ao criar vendedor");
        }
      } else {
        const error = await response.text();
        toast.error(error || "Erro ao criar vendedor");
      }
    } catch (error) {
      console.error("Error creating seller:", error);
      toast.error("Erro ao criar vendedor");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (sellerId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/sellers/${sellerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        const updatedSeller = await response.json();
        setSellers((prev) =>
          prev.map((seller) =>
            seller.id === sellerId ? updatedSeller : seller
          )
        );
        toast.success(`Vendedor ${isActive ? "ativado" : "desativado"} com sucesso!`);
      } else {
        toast.error("Erro ao atualizar vendedor");
      }
    } catch (error) {
      console.error("Error updating seller:", error);
      toast.error("Erro ao atualizar vendedor");
    }
  };

  const handleUpdateSeller = async (sellerId: string, data: { name?: string; document?: string }) => {
    try {
      const response = await fetch(`/api/sellers/${sellerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedSeller = await response.json();
        setSellers((prev) =>
          prev.map((seller) =>
            seller.id === sellerId ? updatedSeller : seller
          )
        );
        toast.success("Vendedor atualizado com sucesso!");
    } else if (response.status === 400) {
        const error = await response.text();
        toast.error(error || "Vendedor não atualizado");
      } else {
        toast.error("Erro ao atualizar vendedor");
      }
    } catch (error) {
      console.error("Error updating seller:", error);
      toast.error("Erro ao atualizar vendedor");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Vendedores</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Gerenciamento de Vendedores
        </CardTitle>
        <CardDescription>
          Gerencie os vendedores da sua loja, ative/desative perfis e adicione novos vendedores.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Botão para adicionar novo vendedor */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Vendedores ({sellers.length})</h3>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <h1 className="hidden md:block">Adicionar Vendedor</h1>
          </Button>
        </div>

        {/* Formulário para criar novo vendedor */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Novo Vendedor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-select">Usuário *</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um usuário" />
                    </SelectTrigger>
                    <SelectContent className="max-w-80 max-h-60 overflow-y-auto">
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <span>{user.name}</span>
                            <span className="text-muted-foreground text-sm">({user.email})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seller-name">Nome do Vendedor *</Label>
                  <Input
                    id="seller-name"
                    placeholder="Nome do vendedor"
                    value={newSellerName}
                    onChange={(e) => setNewSellerName(e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="seller-document">Documento (CPF/CNPJ)</Label>
                  <Input
                    id="seller-document"
                    placeholder="000.000.000-00 ou 00.000.000/0001-00"
                    value={newSellerDocument}
                    onChange={(e) => setNewSellerDocument(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setSelectedUserId("");
                    setNewSellerName("");
                    setNewSellerDocument("");
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateSeller} disabled={creating}>
                  {creating ? "Criando..." : "Criar Vendedor"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Lista de vendedores */}
        <div className="space-y-4">
          {sellers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum vendedor cadastrado ainda.</p>
              <p className="text-sm">Clique em &quot;Adicionar Vendedor&quot; para começar.</p>
            </div>
          ) : (
            sellers.map((seller) => (
              <SellerCard
                key={seller.id}
                seller={seller}
                onToggleActive={handleToggleActive}
                onUpdate={handleUpdateSeller}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SellerCardProps {
  seller: Seller;
  onToggleActive: (sellerId: string, isActive: boolean) => void;
  onUpdate: (sellerId: string, data: { name?: string; document?: string }) => void;
}

function SellerCard({ seller, onToggleActive, onUpdate }: SellerCardProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(seller.name);
  const [editDocument, setEditDocument] = useState(seller.document || "");

  const handleSave = () => {
    onUpdate(seller.id, {
      name: editName,
      document: editDocument || undefined,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditName(seller.name);
    setEditDocument(seller.document || "");
    setEditing(false);
  };

  return (
    <Card className={`transition-all ${seller.isActive ? "" : "opacity-60"}`}>
      <CardContent className="pt-6">
        <div className="grid md:flex items-start md:justify-between">
          <div className="flex-1 space-y-3">
            {/* Status e informações do usuário */}
            <div className="grid md:flex items-center gap-3">
              <Badge variant={seller.isActive ? "default" : "secondary"}>
                {seller.isActive ? "Ativo" : "Inativo"}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {seller.user.email}
              </div>
            </div>

            {/* Nome do vendedor */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nome do Vendedor</Label>
              {editing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="max-w-md"
                />
              ) : (
                <p className="font-medium">{seller.name}</p>
              )}
            </div>

            {/* Documento */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Documento</Label>
              {editing ? (
                <Input
                  value={editDocument}
                  onChange={(e) => setEditDocument(e.target.value)}
                  placeholder="CPF ou CNPJ"
                  className="max-w-md"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{seller.document || "Não informado"}</span>
                </div>
              )}
            </div>

            {/* Informações adicionais */}
            <div className="text-xs text-muted-foreground mb-4">
              Criado em: {new Date(seller.createdAt).toLocaleDateString("pt-BR")}
             
            </div>
          </div>

          {/* Controles */}
          <div className="flex flex-col md:items-end  gap-4">
            {/* Switch ativo/inativo */}
            <div className="flex items-center gap-2">
              <Label htmlFor={`active-${seller.id}`} className="text-sm">
                {seller.isActive ? "Ativo" : "Inativo"}
              </Label>
              <Switch
                id={`active-${seller.id}`}
                checked={seller.isActive}
                onCheckedChange={(checked) => onToggleActive(seller.id, checked)}
              />
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    Salvar
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                  Editar
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
