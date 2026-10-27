"use client"


import { User } from "lucide-react";
import { CiLogout } from "react-icons/ci";

import { CiSettings } from "react-icons/ci";
import { logout } from "@/actions/logout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Avatar,
  AvatarFallback,
  AvatarImage 
  } from "@/components/ui/avatar";

import { useCurrentUser } from "@/data/hooks/use-current-user";
import { useSettingsModal } from "@/hooks/use-settings-modal";
import { CommandItem } from "../ui/command";
import { useState } from "react";



export const ProfileOptions = () => {
  const settings = useSettingsModal();
  const user = useCurrentUser();
  const onClick = () => {
    logout();
  };
 
const [open, setOpen] = useState(false)
  return (
    <DropdownMenu>
  <div className="flex items-center">

  <DropdownMenuTrigger className="rounded-full h-10"> 
 
    <Avatar className="w-10 h-10 hover:border-2 hover:border-primary" >
    <AvatarImage src={user?.image || ""}/>
    <AvatarFallback>
  <User  className="hover:text-primary"/>
    </AvatarFallback>
    </Avatar>
  
 
    </DropdownMenuTrigger>
    </div>
  <DropdownMenuContent className="box-content mx-6">

    
         
           <DropdownMenuItem>
          <button  className="flex jus" type="submit" onClick={() => {settings.onOpen()}}>
          <CiSettings className="mr-2"/>
          Configurações
          </button>
          
        
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem>
            <button className="flex " type="submit" onClick={onClick} >
            <CiLogout className="mr-2"/> Sair
            </button>
            
        </DropdownMenuItem>
        
  </DropdownMenuContent>
</DropdownMenu>

  )
}