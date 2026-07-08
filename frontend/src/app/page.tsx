import PostCard from "@/components/PostCard";
import AdSlot from "@/components/AdSlot";

export default function Home() {
  const dummyPosts = [
    {
      id: 1,
      author: "Shee_dah",
      content: "I've always struggled with articulating my thoughts. Ironically, I write fairly well, but when it comes to expressing what's in my head out loud, I often find myself stumbling over words. Building on Intasela is going to change that. Excited to earn while I learn!",
      earned: 1250,
    },
    {
      id: 2,
      author: "Salem King",
      content: "Just dropped a new video on how to maximize your points on this platform. The key is consistent, high-quality comments on trending posts.",
      earned: 840,
    },
    {
      id: 3,
      author: "TechSis_Lagos",
      content: "The mint green UI on dark mode is absolutely beautiful. It genuinely feels like a premium workspace rather than a noisy timeline.",
      earned: 2200,
    },
    {
      id: 4,
      author: "UX_Design_God",
      content: "This is exactly what I was talking about in my recent newsletter. Creators need platforms that prioritize aesthetics and monetization seamlessly.",
      earned: 3100,
      resela: {
        author: "TechSis_Lagos",
        content: "The mint green UI on dark mode is absolutely beautiful. It genuinely feels like a premium workspace rather than a noisy timeline."
      }
    }
  ];

  return (
    <div className="w-full max-w-[650px] mx-auto border-x border-border min-h-screen">
      {/* Top Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border p-4 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold">For You</h1>
      </header>

      {/* Composer (What's on your mind?) */}
      <div className="p-4 border-b border-border flex gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 shrink-0"></div>
        <div className="flex-1">
          <input 
            type="text" 
            placeholder="What's on your mind?" 
            className="w-full bg-transparent outline-none text-lg placeholder:text-muted-foreground mt-2"
          />
          <div className="flex justify-between items-center mt-6">
            <button className="flex items-center gap-2 text-primary font-semibold hover:opacity-80 transition-opacity">
              <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADWUlEQVR4nO2Z228MURjAf13b3ZmdnY67uj4I0rrfmqpL4tlf4MED8Uy8CIl4EfHqkQcEIRGCuEZoaV/WJaUa19pqog+ElGJptaojI2dlne7MzmxHO2p+yfew+c45c74zO+e7QUhISDHEgTE5ohSxxnRghrROtMCcGJDAR24Dn4APQs5L+jRgSvIiRz9F/O7IWcOSfdI6jWLuVyADfAMacvTlQJf0nPdeDHkCzGXoSAopRAT4gUdDKgkeo4A+LxOeBtSQUqDXy4Q6YBrBfCPPhnsTIf89UeAOwWQCkHI7WBVOKIhMB9pHgiFTgNcjwZCJwNuRYMg4Eb/984aMBj56CQOsWCuo6cWj4d5EiEQZHmgGSggmHSKTdEU/waXHrSGek5chpk9kiq5ire8El34vg3vFNfy3mAVcBl5KkhaFDqv64kvO3imcz9/Cqp7sBGZKMgvYA5z2y5DjgObPnm03Y3crVjo45BJRTwiMd3YqIMyWamSBYRVwWIQWVpGuG3jjML5cXLGm+LDfAVeBdcW8+mv4ww7gFbAVmA+M9XiJlACTgPXiItjt9dVbpzZYakQ2Z6WnfjBerFftdoJVuvzsw4MPANsc9JFIJLLRMMoeK0o8o+vJdkVRdomDtGMLcMTtBgwvMb8DVpFgjY0urmlaasH8yszxowfNxnv15sULp8yqqqVdyaR21yEEqQBa3G4g6rUsaYP1wEX5FIqi7F69asXXdEuT2dba/FvSLU3myprqTGlp6V6bNTVRtXdNd5E9kVxahYMbgK7rbefOnvjDiKzcrL1kxuOxjIj5Bh0HXvDBkLSdIaqqdN5O1eY1pK212dQ0rUuUfmRi4moeUqy/1px8CsMoe3byxKG8RtxvbDBjsVi3zUc/LPUE29ZENBrdunzZki/plgcDDNm0aUOvrmuHHG7UjBeH+JzB8xiYZ6OLJpOJ2oqK2Z8PHthv3knVmfW3rvwyQlXVNw6+xxAtQdf02HxsXtPlhQUObPNow7iXUNXORELtSCa1YwUc6BgR5rjmg8uenhNNwGL8rzS+8zKhXUSh2bayk7fNVjamSqG/lXOsldrTWdGLs4PJBQLOAdyQ2srXJf3lnHZxjxhjBYfbc8ackdaQpS9Pi9t0IQ+LPISQkBBGAD8BZOg7Dzgq1soAAAAASUVORK5CYII=" alt="Add media" className="w-5 h-5 object-contain invert" />
              <span>Media</span>
            </button>
            <button className="bg-primary text-primary-foreground px-6 py-1.5 rounded-full font-bold text-sm">Post</button>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex flex-col">
        <PostCard {...dummyPosts[0]} />
        
        {/* In-feed AdSense Slot */}
        <div className="px-6 py-2">
          <AdSlot format="horizontal" />
        </div>
        
        <PostCard {...dummyPosts[1]} />
        <PostCard {...dummyPosts[2]} />
        <PostCard {...dummyPosts[3]} />
      </div>
    </div>
  );
}
