import { Metadata, ResolvingMetadata } from "next";

type Props = {
  params: Promise<{ username: string }>;
  children: React.ReactNode;
};

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { username: rawUsername } = await props.params;
  const username = decodeURIComponent(rawUsername).replace('@', '');
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/profile/${username}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error("Not found");
    const profile = await res.json();
    
    return {
      title: `${profile.name} (@${profile.username})`,
      description: profile.bio || profile.occupation || `See @${profile.username}'s posts and activity on Intasela.`,
      openGraph: {
        title: `${profile.name} (@${profile.username})`,
        description: profile.bio || profile.occupation || `See @${profile.username}'s posts and activity on Intasela.`,
        images: [profile.avatarUrl || '/icon-512x512.png'],
        type: 'profile',
      },
      twitter: {
        card: "summary_large_image",
        title: `${profile.name} (@${profile.username})`,
        description: profile.bio || profile.occupation || `See @${profile.username}'s posts and activity on Intasela.`,
        images: [profile.avatarUrl || '/icon-512x512.png'],
      }
    }
  } catch (err) {
    return {
      title: `@${username} | Intasela`,
    }
  }
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
