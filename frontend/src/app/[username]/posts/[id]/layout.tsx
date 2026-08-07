import { Metadata, ResolvingMetadata } from "next";

type Props = {
  params: Promise<{ username: string; id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { username: rawUsername, id } = await props.params;
  const username = decodeURIComponent(rawUsername).replace('@', '');
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error("Not found");
    const post = await res.json();
    
    let imageUrl = '/icon-512x512.png';
    if (post.mediaType === 'IMAGE' && post.mediaUrls && post.mediaUrls.length > 0) {
      imageUrl = post.mediaUrls[0];
    } else if (post.mediaType === 'IMAGE' && post.mediaUrl) {
      imageUrl = post.mediaUrl;
    } else if (post.mediaType === 'VIDEO' && post.thumbnailUrl) {
      imageUrl = post.thumbnailUrl;
    } else if (post.author?.avatarUrl) {
      imageUrl = post.author.avatarUrl;
    }

    const rawContent = post.content || '';
    const description = rawContent.length > 150 ? rawContent.substring(0, 147) + '...' : rawContent;
    const authorName = post.author?.firstName || username;
    const title = `${authorName} on Intasela`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [imageUrl],
        type: 'article',
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      }
    }
  } catch (err) {
    return {
      title: `Post by @${username} | Intasela`,
    }
  }
}

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
