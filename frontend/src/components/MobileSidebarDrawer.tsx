"use client";

import Link from "next/link";
import { useUserStore } from "@/store/useUserStore";
import { useRouter } from "next/navigation";

interface MobileSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSidebarDrawer({ isOpen, onClose }: MobileSidebarDrawerProps) {
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const logout = useUserStore((state) => state.logout);
  const router = useRouter();

  if (!isOpen) return null;

  const handleLogout = () => {
    logout();
    onClose();
    router.push("/login");
  };

  const navItems = [
    {
      name: "Creator Studio",
      href: "/creator-studio",
      icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFVUlEQVR4nO2ZeWwUVRyAv63dzs7szOx0oxweERGkoiYiEM/oH4palQAGigpGDFIhkFBAWzQQDZQERUShRG7EcihGy02RmxZQg7RcQa4KoihHgEBbDinPvOaRNJvZbbd0y27Cl7xs+t70zfzm/e6BmyQmh4GjQDHwLTAGsEhAtgK9gSeB14G5wAZAJ8EYB3xU428PMBX4CdBIILoAa0PmktTJFADJJAi3AhVASsj8LcAC4BslWEKwB+joMi+FWwpMJkGYCgwIsyaNvgjYASwEVgIbgW1AZ+KMt4AZEdaDyk1LVUsHngHaAz7ijIeBklquuQ34HXiPOEZTBl/bG74H+EudYNyyE3i0Dtc9APwLvEicMjeCwYfyuBJG2kmjkQy0BJ4F3gE+UMYbSjbwZRT7vgz8rfZuFI4CfwLrgJlAPrAfSAu5TqrKsij3HqT2kkE15vzoYpzyZE4AL9SYuxvYW4/9JwKbGiMvywAKXeZlJC9T6uRVKcl59RsN8vrFwBxijAGcUXEglCbAalWLyBM5pH6jRdYvpcBwYsy8CB5JJoRDlBc6pbLh1AjDH2afu5Q9douhHLyi8iM37khOThpuWWZJUlJSlaalXNZ9vos+n3Yh3PB4PFcBEW5oKSmVhmGcsm3riOMEdjuOs9lxAits28zXNW088CHQH3geuDcaQaQNnAxRm46WZa01DL0yI6PbhRnTJondO7eKsoM7rnuUbi8WxZsKReGKH8T3380Rs2ZOFhO//FSMyR0pcrKzxID+fa/26N61okP7dmccJ1BuGPopv98vPeoTdRFmOjBMnoBtmitSU53y3NEjru7d82uDPPz1jLWrl4ic7CFVTZs2OW/blswwXookiAyIB3Xdd27QwMz/4kGAspBx6ECpmPLVBHF782bllmXKqrWFmyBSF88Zhl4+JGvg5YZSo1iM0u3FolWrlle83uQ/3ATJUurVwjTNxX6/vyKzX59LRRsLb/iDl6mxe9fP0oaumKa/0jRNWfvc6SbIOuW9rtHCMHx5mqadT2vT+uzwnKFV0jjl8Ta2AMuXLhS9e/W8pOt6pWX5ZSbyYDj7kP7/bJhelUwqn/P7/V+bpnlMerG2bdPKM3p0vZjZr0/VsKGDRPb7g8XoUSOqvc6kieNE3qRxIn/OVDEvf7pYsmiBWLZ0odiwfrnYXLRKlPxWJHaUbK7+3bplTfW8XF9cML/6f2bNyBPjPxsjsgYPqEpP7ySNu8KyzCOapo0NdwI16QUsqu0i4DFgi4oHs4Ac2Xk0DGOCruuzg44z37bN5cFgcE0gYP0SDKaW2La9P2Dbhw3DOG4Yxmmv11sp40yK13tB1/Uzpmkcl+u2be8LBlO3OU6g2HGcAo/HMwp4M9o4IpsGb0dYT1U1u6z+MoHT9cxobVUyy4DX4GgRci3J08ARYDbgAPcBu+pxH6/qTkqHEhPSVZrtZhsfq1OQ+dU15InkRXkPj3oR61wafQ1GrmpUt6ox11T1qlYqtarJfKBnlPcYrbJfqVoxw690VhZSU1QxJVVprEvtId/sMaB5FPtnqgq0Vo/TUMg6/ROVrod74/cD+6LYU8alf1zK5hvOYGBaHa99SgnRgThkVYjhR4o3J1U9EXf4VfwIVwFeo50SojtxSmdgSR2EOKEyhbhlNtA3wvpDqj+8RX2G+BwYWY+uS0zRlFo1C7PeRgXOXPXBVLrcoao0iCtBuqg37UaaEkJ++Y17FqjebyiPqP7uGyQAhiyBXepjmUweB14lQXgNWO/SaZfeqRMJRAEwSj30u8AXKmK7feWNaw6oZvYalZ7I7yetb/RD3eQmxJ7/AdrfHEZjypLQAAAAAElFTkSuQmCC"
    },
    {
      name: "Bookmarks",
      href: "/bookmarks",
      icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAACRklEQVR4nO2ZuU9UURTGf4DgArI5yqIgUCiNMZFSY2IsrSxsLe2oaemgNjb+C7aUtiSWhFAAKpvKDI9xZpxhEQdZcpNTEMK8PPWcew15X3IyyZv3vnu/u54FUqRIoYlLQAcwCAzVsPvAiNi9mPc6algTxpgHSkBRbB1YirGFmP+iEzynrQociRUshDgRGfzi0IK0GEDIAVCnTfoduI5f/AbqtUnzwA38Yh+4oE3qNmgXflEFGrVJcwGE/LI4jrNAN36xB1zUJv0G9OAXP+USVsVXoBe/2AUua5OuBRCyA1zRJl0FbuIX20CzNukycAu/2AKuapN+BvrwiwrQqk36KYCQMtCmTfoRuI1flCRGUV9a50LIEjCAXxSBTm3SlQBCCsA1i3vExdo+kbeIgb4EmJG8RQzkfK1+/GLTQsh6gHskshCSDeCi5CyEbATwfiOLzR4FiBAjCyEhsiibFkJC5LXyFm0WLW7ZBEIyFg6cut+TYBVkLGKDds6BkIpFtBbCady2iJ9D7MsdoOUPv2kAngPP/mFGMhgky5LmmJzgUYkqp4FZ4APw9H+Ykb0E6UuX5B6Xi2wKeCjPXbHmBbAowh4nbPOHxUlZjcmMuwLoWzn33e+dGu+5WsdLyZG9Bx6EELJ/Rq3ikYx8VmYiaaNuQF7Jd++AuzFHficG9bwG6YQb1TlgRjr0txlzlw4dk03tBA35EHIoo56TWXiiyO06Oymb+/UJL7tsceQvy/ofxg49wBsRNCF7RL2q6xO9MkNu6aZIQUAcA5x4jYk8OqYWAAAAAElFTkSuQmCC"
    },
    {
      name: "Settings and privacy",
      href: "/settings",
      icon: "data:image/png;base64,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"
    }
  ];

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 z-[60] sm:hidden transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed top-0 left-0 bottom-0 w-[280px] bg-background z-[70] sm:hidden shadow-xl transform transition-transform flex flex-col">
        {/* Header section */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5" onClick={onClose}>
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center font-bold text-primary-foreground text-sm">
              In
            </div>
            <span className="text-xl font-bold tracking-tight">tasela</span>
          </Link>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* User Info (if logged in) */}
        {isAuthenticated && user && (
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted overflow-hidden border border-border">
                <img 
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.username}`} 
                  alt={user.username} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[15px]">{user.name || user.username}</span>
                <span className="text-muted-foreground text-sm">@{user.username}</span>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <nav className="p-4 flex-1 space-y-1">
          {isAuthenticated ? (
            navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-4 px-4 py-3.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors font-medium text-[15px]"
              >
                <div className="w-[20px] h-[20px] flex items-center justify-center relative">
                  <img src={item.icon} alt={item.name} className="w-full h-full object-contain invert opacity-80" />
                </div>
                {item.name}
              </Link>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Please log in to access more features.
            </div>
          )}
        </nav>

        {/* Bottom Actions */}
        {isAuthenticated && (
          <div className="p-4 border-t border-border mt-auto">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors text-[14px] font-bold"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              Logout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
