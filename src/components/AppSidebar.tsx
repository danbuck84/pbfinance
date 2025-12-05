import { Home, Wallet, CreditCard, Gift, BarChart3, Settings, Menu, ChevronDown, ChevronsUpDown, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Config } from '@/lib/firebase';

const mainMenuItems = [
  { title: 'Lançamentos', url: '/', icon: Home },
  { title: 'Visão Geral', url: '/visao-geral', icon: BarChart3 },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

interface AppSidebarProps {
  config: Config;
}

export function AppSidebar({ config }: AppSidebarProps) {
  const { state, setOpen } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === 'collapsed';

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = () => {
    // Fecha o sidebar em mobile após navegar
    if (window.innerWidth < 768) {
      setOpen(false);
    }
  };

  const { currentUser, currentHousehold, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const contas = [...(config.contas || [])].sort((a, b) => a.nome.localeCompare(b.nome));
  const beneficios = [...(config.beneficios || [])].sort((a, b) => a.nome.localeCompare(b.nome));
  const cartoes = [...(config.cartoes || [])].sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <Sidebar collapsible="icon">
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <span className="font-semibold text-primary">Menu</span>
        )}
        <SidebarTrigger className="ml-auto">
          <Menu className="h-4 w-4" />
        </SidebarTrigger>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} onClick={handleNavigation}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Contas com submenu */}
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <div className="flex items-center w-full relative">
                    <SidebarMenuButton asChild isActive={isActive('/contas')} className="flex-1">
                      <Link to="/contas" onClick={handleNavigation}>
                        <Wallet className="h-4 w-4" />
                        <span>Contas</span>
                      </Link>
                    </SidebarMenuButton>
                    <CollapsibleTrigger asChild>
                      <button className="absolute right-2 p-1 hover:bg-accent rounded">
                        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {contas.map((conta) => (
                        <SidebarMenuSubItem key={conta.nome}>
                          <SidebarMenuSubButton asChild>
                            <Link to={`/contas/${encodeURIComponent(conta.nome)}`} onClick={handleNavigation}>
                              <span>{conta.nome}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                      {contas.length === 0 && (
                        <SidebarMenuSubItem>
                          <div className="px-3 py-2">
                            <span className="text-muted-foreground text-xs">Nenhuma conta</span>
                          </div>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Benefícios com submenu */}
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <div className="flex items-center w-full relative">
                    <SidebarMenuButton asChild isActive={isActive('/beneficios')} className="flex-1">
                      <Link to="/beneficios" onClick={handleNavigation}>
                        <Gift className="h-4 w-4" />
                        <span>Benefícios</span>
                      </Link>
                    </SidebarMenuButton>
                    <CollapsibleTrigger asChild>
                      <button className="absolute right-2 p-1 hover:bg-accent rounded">
                        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {beneficios.map((beneficio) => (
                        <SidebarMenuSubItem key={beneficio.nome}>
                          <SidebarMenuSubButton asChild>
                            <Link to={`/beneficios/${encodeURIComponent(beneficio.nome)}`} onClick={handleNavigation}>
                              <span>{beneficio.nome}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                      {beneficios.length === 0 && (
                        <SidebarMenuSubItem>
                          <div className="px-3 py-2">
                            <span className="text-muted-foreground text-xs">Nenhum benefício</span>
                          </div>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Cartões com submenu */}
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <div className="flex items-center w-full relative">
                    <SidebarMenuButton asChild isActive={isActive('/cartoes')} className="flex-1">
                      <Link to="/cartoes" onClick={handleNavigation}>
                        <CreditCard className="h-4 w-4" />
                        <span>Cartões</span>
                      </Link>
                    </SidebarMenuButton>
                    <CollapsibleTrigger asChild>
                      <button className="absolute right-2 p-1 hover:bg-accent rounded">
                        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {cartoes.map((cartao) => (
                        <SidebarMenuSubItem key={cartao.nome}>
                          <SidebarMenuSubButton asChild>
                            <Link to={`/cartoes/${encodeURIComponent(cartao.nome)}`} onClick={handleNavigation}>
                              <span>{cartao.nome}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                      {cartoes.length === 0 && (
                        <SidebarMenuSubItem>
                          <div className="px-3 py-2">
                            <span className="text-muted-foreground text-xs">Nenhum cartão</span>
                          </div>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={currentUser?.photoURL || ''} alt={currentUser?.displayName || ''} />
                    <AvatarFallback className="rounded-lg">
                      {currentUser?.displayName?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{currentUser?.displayName || 'Usuário'}</span>
                    <span className="truncate text-xs">{currentHousehold?.name || 'Minha Família'}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={currentUser?.photoURL || ''} alt={currentUser?.displayName || ''} />
                      <AvatarFallback className="rounded-lg">
                        {currentUser?.displayName?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{currentUser?.displayName || 'Usuário'}</span>
                      <span className="truncate text-xs">{currentUser?.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}