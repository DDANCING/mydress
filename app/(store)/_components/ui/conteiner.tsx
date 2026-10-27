import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
}


const Conteiner = ({
     children, className
}: Props) => {
    return (
        <div  className={cn(className)}>
            {children}
        </div>
    )
}

export default Conteiner;