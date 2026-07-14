import prisma from "@/lib/prisma";
import ContentTable from "../ContentTable";

export const dynamic = "force-dynamic";

export default async function FlaggedContentPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  
  const search = params.search || "";
  const sort = params.sort || "desc";
  const status = params.status || "all";
  
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const pageSize = 10;

  // Base query: ONLY flagged content
  const where: any = {
    isFlagged: true
  };

  // Search filter
  if (search) {
    where.content = { contains: search };
  }

  // Status filter (Mapping to eligibility)
  if (status === "eligible") {
    where.isEligible = true;
  } else if (status === "ineligible") {
    where.isEligible = false;
  }

  // Sort logic
  let orderBy: any = { createdAt: "desc" };
  if (sort === "asc") orderBy = { createdAt: "asc" };
  else if (sort === "highest") orderBy = { earned: "desc" };
  else if (sort === "lowest") orderBy = { earned: "asc" };

  const [totalPosts, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy,
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
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Flagged Content</h1>
          <p className="text-sm text-gray-400 mt-1">Review content that has been flagged by users or automated filters.</p>
        </div>
      </div>
      
      <ContentTable 
        posts={posts} 
        totalPosts={totalPosts} 
        currentPage={page} 
        pageSize={pageSize}
        contentType="Flagged Content"
      />
    </div>
  );
}
