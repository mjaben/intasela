import prisma from "@/lib/prisma";
import ContentTable from "../ContentTable";

export const dynamic = "force-dynamic";

export default async function RepliesModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  
  const search = params.search || "";
  const sort = params.sort === "asc" ? "asc" : "desc";
  const status = params.status || "all";
  
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const pageSize = 10;

  // Query conditions for Replies (posts with a parentId)
  const where: any = {
    parentId: { not: null }
  };

  // Search filter
  if (search) {
    where.AND = [
      {
        OR: [
          { content: { contains: search } },
          { author: { username: { contains: search } } },
          { author: { firstName: { contains: search } } },
          { author: { lastName: { contains: search } } }
        ]
      }
    ];
  }

  // Status filter
  if (status === "flagged") {
    where.isFlagged = true;
  } else if (status === "eligible") {
    where.isEligible = true;
  } else if (status === "ineligible") {
    where.isEligible = false;
  }

  // Fetch total count and paginated replies
  const [totalPosts, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: { createdAt: sort },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        content: true,
        mediaUrl: true,
        mediaType: true,
        earned: true,
        viewsCount: true,
        isEligible: true,
        isFlagged: true,
        createdAt: true,
        author: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          }
        }
      }
    })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Replies Moderation</h1>
        <p className="text-sm text-gray-400 mt-1">Review user replies on Selas and Orbits.</p>
      </div>
      
      <ContentTable 
        posts={posts} 
        totalPosts={totalPosts} 
        currentPage={page} 
        pageSize={pageSize}
        contentType="Replies"
      />
    </div>
  );
}
