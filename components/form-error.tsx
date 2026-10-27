
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
import Link from "next/link";
import { Button } from "./ui/button";


interface FormErrorProps {
  message?: string;
};

export const FormError = ({
  message,
}: FormErrorProps) => {
  if (!message) return null;

  return(
    <div>
    <div className=" p-3 rounded-lg flex flex-col items-center gap-x-2 text-md ">
      <ExclamationTriangleIcon className="h-20 w-20 text-red-600"/>
    <p>{message}</p>
   
    </div>
     <Link href="/">
     <Button className="bg-muted-foreground rounded-full">
    Retornar para tela inicial
    </Button>
    </Link>
    </div>
  )
}