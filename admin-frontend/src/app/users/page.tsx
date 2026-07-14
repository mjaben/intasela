import prisma from "@/lib/prisma";
import UserTable from "./UserTable";

export default async function UsersModule(props: { searchParams?: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams || {};
  
  const page = parseInt(searchParams.page || "1");
  const limit = parseInt(searchParams.limit || "10");
  const skip = (page - 1) * limit;
  const sort = searchParams.sort === "asc" ? "asc" : "desc";

  const where: any = {};

  if (searchParams.search) {
    where.OR = [
      { username: { contains: searchParams.search } },
      { firstName: { contains: searchParams.search } },
      { lastName: { contains: searchParams.search } },
      { email: { contains: searchParams.search } }
    ];
  }

  if (searchParams.status === "active") where.isActive = true;
  if (searchParams.status === "inactive") where.isActive = false;
  if (searchParams.suspended === "true") where.isSuspended = true;
  if (searchParams.shadowbanned === "true") where.isShadowBanned = true;
  if (searchParams.gender && searchParams.gender !== "all") where.gender = searchParams.gender;
  if (searchParams.state && searchParams.state !== "all") where.state = searchParams.state;

  const totalSystemUsers = await prisma.user.count();
  const totalUsers = await prisma.user.count({ where });

  const users = await prisma.user.findMany({
    where,
    include: { role: true },
    orderBy: { createdAt: sort },
    skip,
    take: limit
  });

  const roles = await prisma.role.findMany();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-200 tracking-tight">User Directory</h1>
          <p className="text-sm text-gray-400 mt-1">Manage platform users, roles, and system access.</p>
        </div>
        <button className="px-4 py-2 bg-brand text-brand-bg font-semibold text-sm rounded-lg hover:bg-brand-hover transition-colors">
          Export Users
        </button>
      </div>
      
      <UserTable initialUsers={users} roles={roles} totalUsers={totalUsers} totalSystemUsers={totalSystemUsers} currentPage={page} pageSize={limit} />
    </div>
  );
}
