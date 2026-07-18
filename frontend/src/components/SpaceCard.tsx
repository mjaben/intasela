"use client";

import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@/components/ui/avatar";

interface SpaceCardProps {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  type: string;
  membersCount: number;
  isMember?: boolean;
  sampleMembers?: any[];
}

export default function SpaceCard({ id, name, description, coverUrl, type, membersCount, isMember, sampleMembers = [] }: SpaceCardProps) {
  return (
    <Link href={`/spaces/${id}`} className="block border border-border rounded-xl overflow-hidden hover:border-[#3BC492] transition-colors bg-card/50 backdrop-blur-sm group">
      <div className="h-24 w-full bg-muted relative">
        {coverUrl ? (
          <Image src={coverUrl} alt={name} layout="fill" objectFit="cover" className="group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#3BC492]/20 to-primary/10"></div>
        )}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white border border-white/10 font-geistMono capitalize tracking-wide">
          {type.toLowerCase()}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold truncate group-hover:text-[#3BC492] transition-colors">{name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[40px]">
          {description || "No description provided."}
        </p>
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AvatarGroup>
              {sampleMembers && sampleMembers.length > 0 ? (
                sampleMembers.map((member: any) => (
                  <Avatar key={member.id || member.user.id} className="border-2 border-background size-6">
                    <AvatarImage src={member.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user.username}`} alt={`@${member.user.username}`} />
                    <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                      {(member.user.firstName?.[0] || member.user.username?.[0] || '?').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))
              ) : (
                Array.from({ length: Math.min(3, membersCount) }).map((_, i) => (
                  <Avatar key={i} className="border-2 border-background size-6">
                    <AvatarFallback className="bg-primary/20 text-primary text-[10px]">{String.fromCharCode(65 + i + (id.charCodeAt(0) % 10))}</AvatarFallback>
                  </Avatar>
                ))
              )}
              {membersCount > 3 && (
                <AvatarGroupCount className="border-2 border-background bg-muted text-muted-foreground text-[10px] size-6">
                  +{membersCount - 3}
                </AvatarGroupCount>
              )}
              {membersCount <= 3 && membersCount > 0 && (
                <AvatarGroupCount className="border-2 border-background bg-muted text-muted-foreground text-[10px] size-6 px-1">
                  {membersCount}
                </AvatarGroupCount>
              )}
            </AvatarGroup>
            {membersCount === 0 && <span className="text-muted-foreground font-medium text-xs">0 Members</span>}
          </div>
          {isMember && <span className="text-[#3BC492] bg-[#3BC492]/10 px-2 py-1 rounded font-bold text-xs">Joined</span>}
        </div>
      </div>
    </Link>
  );
}
