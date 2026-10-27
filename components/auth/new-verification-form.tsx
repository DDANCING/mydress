'use client'; // ✅ Necessário para permitir uso de useSearchParams()

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScaleLoader } from "react-spinners";

import { newVerification } from "@/actions/new-verification";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-sucess";

export const NewVerificationForm = () => {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const onSubmit = useCallback(() => {
    if (success || error) return;
    if (!token) {
      setError("Link de confirmação inválido. Peça um novo e-mail de confirmação.");
      return;
    }

    newVerification(token)
      .then((data) => {
        setSuccess(data.success);
        setError(data.error);
      })
      .catch(() => {
        setError("Não conseguimos confirmar seu e-mail. Tente novamente.");
      });
  }, [token, success, error]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <div>
      <CardWrapper
        headerLabel="Confirmando seu e-mail"
        backButtonLabel="Voltar para o login"
        backButtonHref="/auth/login"
      >
        <div className="flex items-center w-full justify-center">
          {!success && !error && <ScaleLoader color="var(--primary)" />}
          <FormSuccess message={success} />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </CardWrapper>
    </div>
  );
};
