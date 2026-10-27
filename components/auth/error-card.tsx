
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { CardWrapper } from "@/components/auth/card-wrapper";

export const ErrorCard = () => {
  return (
    <CardWrapper
    headerLabel="Opa, algo deu errado"
    description="Não conseguimos concluir seu acesso. Tente entrar de novo."
    backButtonHref="/auth/login"
    backButtonLabel="Voltar para o Login"
    >
    <div className="w-full flex justify-center items-center">
      <ExclamationTriangleIcon className="text-primary size-8"/>
    </div>
    </CardWrapper>
  )
}