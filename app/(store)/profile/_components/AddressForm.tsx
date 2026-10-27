"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heading } from "@/components/ui/heading";
import { MapPin, Edit, Trash2, Home } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

type AddressData = {
  fullName: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
};

type Props = {
  initialAddress: AddressData;
  userEmail: string;
};

export default function AddressForm({ initialAddress, userEmail }: Props) {
  const [addressData, setAddressData] = useState<AddressData>(initialAddress);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(!initialAddress.address);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.patch(`/api/users/${userEmail}/addresses`, addressData);
      toast.success("Endereço salvo com sucesso!");
      setEditing(false);
    } catch (err) {
      toast.error("Erro ao salvar endereço");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja remover seu endereço?")) return;
    setLoading(true);
    try {
      await axios.patch(`/api/users/${userEmail}/addresses`, {
        fullName: addressData.fullName,
        address: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        cep: "",
      });
      setAddressData({
        fullName: addressData.fullName,
        address: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        cep: "",
      });
      toast.success("Endereço removido com sucesso!");
    } catch (err) {
      toast.error("Erro ao remover endereço");
    } finally {
      setLoading(false);
    }
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{5})(\d{3})/, "$1-$2");
  };

  const handleCepChange = async (cep: string) => {
    const formattedCep = formatCep(cep);
    setAddressData({ ...addressData, cep: formattedCep });

    if (formattedCep.length === 9) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${formattedCep.replace("-", "")}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setAddressData(prev => ({
            ...prev,
            address: data.logradouro || prev.address,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
            cep: formattedCep,
          }));
        }
      } catch {}
    }
  };

  return (
    <>
      <div className="items-center justify-between hidden sm:flex">
        <Heading title="Meu Endereço" description="Gerencie seu endereço de entrega" />
        {!editing && (
          <Button onClick={() => setEditing(true)} className="flex items-center gap-2">
            <Edit size={16} />
            {addressData.address ? "Editar" : "Adicionar"}
          </Button>
        )}
      </div>

      {editing ? (
        <Card className="bg-background mt-8 ml-2">
          <CardHeader>
            <Heading title="Endereço" description="Preencha as informações do endereço" />
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                value={addressData.fullName}
                onChange={e => setAddressData({ ...addressData, fullName: e.target.value })}
                placeholder="Nome do destinatário"
                required
              />

              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={addressData.cep}
                onChange={e => handleCepChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                required
              />

              <Label htmlFor="address">Logradouro</Label>
              <Input
                id="address"
                value={addressData.address}
                onChange={e => setAddressData({ ...addressData, address: e.target.value })}
                placeholder="Rua, Avenida, etc."
                required
              />

              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={addressData.number}
                onChange={e => setAddressData({ ...addressData, number: e.target.value })}
                placeholder="123"
                required
              />

              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={addressData.complement}
                onChange={e => setAddressData({ ...addressData, complement: e.target.value })}
                placeholder="Apartamento, sala, etc. (opcional)"
              />

              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={addressData.neighborhood}
                onChange={e => setAddressData({ ...addressData, neighborhood: e.target.value })}
                placeholder="Nome do bairro"
                required
              />

              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={addressData.city}
                onChange={e => setAddressData({ ...addressData, city: e.target.value })}
                placeholder="Nome da cidade"
                required
              />

              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={addressData.state}
                onChange={e => setAddressData({ ...addressData, state: e.target.value })}
                placeholder="UF"
                maxLength={2}
                required
              />

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : addressData.address ? (
        <Card className="bg-background">
          <CardContent className="p-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Home size={20} className="text-primary mt-1" />
              <div className="space-y-1">
                <h3 className="font-medium">{addressData.fullName}</h3>
                <p className="text-sm text-muted-foreground">{addressData.address}, {addressData.number}{addressData.complement && ` - ${addressData.complement}`}</p>
                <p className="text-sm text-muted-foreground">{addressData.neighborhood}, {addressData.city} - {addressData.state}</p>
                <p className="text-sm text-muted-foreground">CEP: {addressData.cep}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(true)} disabled={loading}>
                <Edit size={16} />
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
                <Trash2 size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-20 mr-4">
          <CardContent className="text-center ">
            <MapPin size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum endereço cadastrado</h3>
            <p className="text-muted-foreground mb-4">Adicione seu endereço para facilitar suas compras</p>
            <Button onClick={() => setEditing(true)}>
              <Edit size={16} className="mr-2" />
              Adicionar Endereço
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}