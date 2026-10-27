"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import SingleImageUpload from "@/components/ui/SingleImageUpload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountSettings } from "@/components/auth/account-settings";
import { ChangePasswordDrawer } from "@/components/auth/change-password-drawer";
import { User, Mail, Shield } from "lucide-react";

const OrdersPage = () => {
  const { data: session, update } = useSession();
  const userImage = session?.user?.image ?? "";
  const [loading, setLoading] = useState(false);

  const handleImageChange = async (url: string) => {
    setLoading(true);
    try {
      await fetch("/api/user/image", {
        method: "POST",
        body: JSON.stringify({ image: url }),
        headers: { "Content-Type": "application/json" },
      });
      // Força o refresh da sessão para atualizar a imagem
      await update?.();
      // Refresh adicional para garantir que a sessão seja atualizada
      window.location.reload();
    } catch (error) {
      console.error("Erro ao atualizar imagem:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 -mt-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight hidden md:block">Meu Perfil</h1>
        <p className="text-muted-foreground hidden md:block">
          Gerencie suas informações pessoais e configurações de conta
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Image Section */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm bg-background">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <User className="h-5 w-5" />
                Foto do Perfil
              </CardTitle>
              <CardDescription>
                Atualize sua foto de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <SingleImageUpload value={userImage} onChange={handleImageChange} />
              {loading && (
                <p className="text-sm text-muted-foreground">
                  Atualizando imagem...
                </p>
              )}
              <div className="text-center">
                <h3 className="font-semibold text-lg">{session?.user?.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Mail className="h-3 w-3" />
                  {session?.user?.email}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Actions */}
          <Card className="shadow-sm mt-6 bg-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança
              </CardTitle>
              <CardDescription>
                Ações relacionadas à segurança da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordDrawer />
            </CardContent>
          </Card>
        </div>

        {/* Account Settings Section */}
        <div className="lg:col-span-2">
          <AccountSettings />
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;