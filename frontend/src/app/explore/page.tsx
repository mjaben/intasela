"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import PostCard from "@/components/PostCard";
import AdSlot from "@/components/AdSlot";
import { motion } from "framer-motion";

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const [activeTab, setActiveTab] = useState<"Top" | "Latest" | "People" | "Media">("Top");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [exploreTab, setExploreTab] = useState<"For You" | "Trending" | "News" | "Sports" | "Entertainment">("For You");
  const [categoryResults, setCategoryResults] = useState<any[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);

  const ALL_TRENDING_TOPICS = [
    { topic: "#CreatorEconomy", posts: "12.5K selas" },
    { topic: "Web3 Monetization", posts: "8,432 selas" },
    { topic: "#TechTwitter", posts: "5,210 selas" },
    { topic: "NextJS 15", posts: "3,100 selas" },
    { topic: "Nigeria Election", posts: "45K selas" },
    { topic: "#Afrobeats", posts: "22K selas" },
    { topic: "Lagos Traffic", posts: "1,200 selas" },
    { topic: "Premier League", posts: "98K selas" },
    { topic: "#EndSARS", posts: "500K selas" },
    { topic: "Bitcoin", posts: "88K selas" }
  ];

  // Advanced search states
  const [advAllWords, setAdvAllWords] = useState("");
  const [advExactPhrase, setAdvExactPhrase] = useState("");
  const [advAnyWords, setAdvAnyWords] = useState("");
  const [advNoneWords, setAdvNoneWords] = useState("");
  const [advHashtags, setAdvHashtags] = useState("");
  const [advLanguage, setAdvLanguage] = useState("any");

  const [advFromAccount, setAdvFromAccount] = useState("");
  const [advToAccount, setAdvToAccount] = useState("");
  const [advMentioningAccount, setAdvMentioningAccount] = useState("");

  const [advRepliesToggle, setAdvRepliesToggle] = useState(true);
  const [advRepliesType, setAdvRepliesType] = useState<"include" | "only">("include");

  const [advLinksToggle, setAdvLinksToggle] = useState(true);
  const [advLinksType, setAdvLinksType] = useState<"include" | "only">("include");

  const [advMinReplies, setAdvMinReplies] = useState("");
  const [advMinLikes, setAdvMinLikes] = useState("");
  const [advMinReposts, setAdvMinReposts] = useState("");

  const [advDateFrom, setAdvDateFrom] = useState("");
  const [advDateTo, setAdvDateTo] = useState("");

  useEffect(() => {
    if (showAdvanced) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showAdvanced]);

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

        let endpoint = "";
        if (activeTab === "People") {
          endpoint = `/users/search?q=${encodeURIComponent(q)}`;
        } else {
          const sort = activeTab === "Latest" ? "latest" : "top";
          const mediaOnly = activeTab === "Media" ? "true" : "false";
          endpoint = `/posts/search?q=${encodeURIComponent(q)}&sort=${sort}&media_only=${mediaOnly}`;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${endpoint}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [q, activeTab]);

  useEffect(() => {
    if (q || exploreTab === "Trending") {
      setCategoryResults([]);
      return;
    }

    const fetchCategory = async () => {
      setCategoryLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

        let endpoint = "";
        
        if (exploreTab === "For You") {
          endpoint = "/posts"; // Recommended feed

          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/suggested`, { headers })
            .then(r => r.json())
            .then(data => setSuggestedUsers(Array.isArray(data) ? data : []))
            .catch(e => console.error(e));
        } else {
          let categoryQuery = "";
          if (exploreTab === "News") categoryQuery = "#news OR #breaking OR election OR politics";
          else if (exploreTab === "Sports") categoryQuery = "#sports OR football OR basketball OR premierleague OR #sports";
          else if (exploreTab === "Entertainment") categoryQuery = "#entertainment OR movies OR music OR #nollywood OR #afrobeats";
          
          endpoint = `/posts/search?q=${encodeURIComponent(categoryQuery)}&sort=top&media_only=false`;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${endpoint}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setCategoryResults(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategory();
  }, [exploreTab, q]);

  const handleAdvancedSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryParts = [];
    if (advAllWords) queryParts.push(advAllWords.trim());
    if (advExactPhrase) queryParts.push(`"${advExactPhrase.trim()}"`);
    if (advAnyWords) queryParts.push(advAnyWords.split(' ').map(w => w.trim()).join(' OR '));
    if (advNoneWords) queryParts.push(advNoneWords.split(' ').map(w => `-${w.trim()}`).join(' '));
    if (advHashtags) queryParts.push(advHashtags.split(' ').map(t => t.startsWith('#') ? t : `#${t}`).join(' '));
    if (advLanguage && advLanguage !== "any") queryParts.push(`lang:${advLanguage}`);

    if (advFromAccount) queryParts.push(`from:${advFromAccount.replace('@', '').trim()}`);
    if (advToAccount) queryParts.push(`to:${advToAccount.replace('@', '').trim()}`);
    if (advMentioningAccount) queryParts.push(`@${advMentioningAccount.replace('@', '').trim()}`);

    if (!advRepliesToggle) {
      queryParts.push('-filter:replies');
    } else if (advRepliesType === 'only') {
      queryParts.push('filter:replies');
    }

    if (!advLinksToggle) {
      queryParts.push('-filter:links');
    } else if (advLinksType === 'only') {
      queryParts.push('filter:links');
    }

    if (advMinReplies) queryParts.push(`min_replies:${advMinReplies}`);
    if (advMinLikes) queryParts.push(`min_faves:${advMinLikes}`);
    if (advMinReposts) queryParts.push(`min_retweets:${advMinReposts}`);

    if (advDateFrom) queryParts.push(`since:${advDateFrom}`);
    if (advDateTo) queryParts.push(`until:${advDateTo}`);

    const finalQuery = queryParts.join(' ').trim();
    if (finalQuery) {
      setShowAdvanced(false);
      router.push(`/explore?q=${encodeURIComponent(finalQuery)}`);
    }
  };

  return (
    <div className="w-full max-w-[650px] mx-auto min-h-screen overflow-x-hidden">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Explore</h1>
          <button 
            onClick={() => setShowAdvanced(true)}
            className="p-2 hover:bg-accent rounded-full transition-colors text-foreground"
            title="Advanced Search"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
        <div className="relative">
          <input 
            type="text" 
            defaultValue={q}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                router.push(`/explore?q=${encodeURIComponent(e.currentTarget.value)}`);
              }
            }}
            placeholder="Search Intasela..." 
            className="w-full bg-white/5 text-white rounded-xl py-2.5 pl-4 pr-4 border border-white/10 focus:outline-none focus:border-[#ACC8A2] transition-colors text-sm placeholder-gray-500"
          />
        </div>

        <div className="flex w-full overflow-x-auto no-scrollbar pt-1">
          {q ? (
            (["Top", "Latest", "People", "Media"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[80px] py-4 text-center text-[15px] font-bold relative hover:bg-white/5 transition-colors whitespace-nowrap ${activeTab === tab ? 'text-white' : 'text-gray-400'}`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="exploreSearchTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-[#ACC8A2] rounded-t-full mx-auto w-12"
                  />
                )}
              </button>
            ))
          ) : (
            (["For You", "Trending", "News", "Sports", "Entertainment"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setExploreTab(tab)}
                className={`flex-1 min-w-[90px] px-4 py-4 text-center text-[15px] font-bold relative hover:bg-white/5 transition-colors whitespace-nowrap ${exploreTab === tab ? 'text-white' : 'text-gray-400'}`}
              >
                {tab}
                {exploreTab === tab && (
                  <motion.div
                    layoutId="exploreTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-[#ACC8A2] rounded-t-full mx-auto w-12"
                  />
                )}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="p-0">
        {!q ? (
          <>
            <AdSlot format="hero" slotId="explore_hero" />
            
            {(exploreTab === "Trending") ? (
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold mb-4 text-white tracking-tight">Trending Topics</h2>
                <p className="text-gray-400 text-sm mb-6">Search for topics or click Advanced Search to find specific posts.</p>
              
                <div className="space-y-2">
                  {ALL_TRENDING_TOPICS.map((item, i) => (
                    <div key={i} onClick={() => router.push(`/explore?q=${encodeURIComponent(item.topic)}`)} className="cursor-pointer hover:bg-white/5 rounded-xl px-6 py-3 transition-colors">
                      <div className="text-[13px] text-gray-400 mb-1 font-mono uppercase tracking-wider">{i + 1} · Trending</div>
                      <div className="font-bold text-[16px] text-white tracking-tight">{item.topic}</div>
                      <div className="text-[13px] text-gray-500 mt-1">{item.posts}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (exploreTab === "For You") ? (
              <>
                <div className="p-6 border-b border-white/10">
                  <h2 className="text-xl font-bold mb-4 text-white tracking-tight">Trending</h2>
                  <div className="space-y-2">
                    {ALL_TRENDING_TOPICS.slice(0, 5).map((item, i) => (
                      <div key={i} onClick={() => router.push(`/explore?q=${encodeURIComponent(item.topic)}`)} className="cursor-pointer hover:bg-white/5 rounded-xl px-6 py-3 transition-colors">
                        <div className="text-[12px] text-gray-400 mb-1 font-mono uppercase tracking-wider">Trending</div>
                        <div className="font-bold text-[15px] text-white">{item.topic}</div>
                        <div className="text-[13px] text-gray-500 mt-1">{item.posts}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {suggestedUsers.length > 0 && (
                  <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold mb-4 text-white tracking-tight">Who to follow</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {suggestedUsers.map(u => (
                        <div key={u.id} onClick={() => router.push(`/@${u.username}`)} className="flex items-center justify-between p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors shadow-sm">
                           <div className="flex items-center gap-3 overflow-hidden">
                             <img src={u.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${u.username}`} className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/10" />
                             <div className="flex-1 min-w-0 pr-2">
                                <div className="font-bold text-[14px] text-white truncate">{u.firstName} {u.lastName}</div>
                                <div className="text-gray-400 text-[13px] truncate">@{u.username}</div>
                             </div>
                           </div>
                           <button className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold shrink-0 hover:bg-white/90 transition-colors">Follow</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="p-6 pb-2">
                   <h2 className="text-xl font-bold">Selas for you</h2>
                </div>
              </>
            ) : null}
            
            {categoryLoading ? (
              <div className="p-6 flex justify-center mt-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : categoryResults.length === 0 ? (
              <div className="p-8 text-center mt-12">
                <h2 className="text-xl font-bold mb-2">Nothing to see here right now</h2>
                <p className="text-muted-foreground">Check back later for more {exploreTab.toLowerCase()}.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {categoryResults.map((post: any) => (
                  <div key={post.id} className="border-b border-border">
                    <PostCard {...post} />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : loading ? (
          <div className="p-6 flex justify-center mt-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center mt-12">
            <h2 className="text-3xl font-bold mb-2">No results for "{q}"</h2>
            <p className="text-muted-foreground">Try searching for something else, or check your spelling.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {activeTab === "People" ? (
              results.map((u: any) => (
                <div key={u.id} onClick={() => router.push(`/@${u.username}`)} className="p-4 border-b border-border hover:bg-accent/50 cursor-pointer flex items-center gap-3">
                  <img src={u.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${u.username}`} className="w-12 h-12 rounded-full bg-muted object-cover" />
                  <div>
                    <div className="font-bold text-[15px] hover:underline">{u.firstName} {u.lastName}</div>
                    <div className="text-muted-foreground text-[14px]">@{u.username}</div>
                  </div>
                </div>
              ))
            ) : (
              results.map((post: any) => (
                <div key={post.id} className="border-b border-border">
                  <PostCard {...post} />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showAdvanced && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-[#18181b] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#18181b]/80 backdrop-blur-xl">
              <h2 className="text-xl font-bold text-white tracking-tight">Advanced search</h2>
              <button onClick={() => setShowAdvanced(false)} className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleAdvancedSearch} className="flex-1 overflow-y-auto p-0 pb-10 divide-y divide-white/5 text-white">
              
              {/* Words Section */}
              <div className="p-6 space-y-4">
                <h3 className="font-bold text-xl mb-6">Words</h3>
                <div className="grid grid-cols-[1fr] gap-2">
                  <label className="text-sm font-medium">All of these words</label>
                  <input type="text" value={advAllWords} onChange={e => setAdvAllWords(e.target.value)} className="w-full bg-white/5 text-white rounded-xl px-3 py-3 border border-white/10 focus:border-[#ACC8A2] focus:ring-1 focus:ring-[#ACC8A2] outline-none transition-colors" />
                  <p className="text-xs text-gray-400">Example: what's happening · contains both "what's" and "happening"</p>
                </div>
                <div className="grid grid-cols-[1fr] gap-2 mt-4">
                  <label className="text-sm font-medium">This exact phrase</label>
                  <input type="text" value={advExactPhrase} onChange={e => setAdvExactPhrase(e.target.value)} className="w-full bg-white/5 text-white rounded-xl px-3 py-3 border border-white/10 focus:border-[#ACC8A2] focus:ring-1 focus:ring-[#ACC8A2] outline-none transition-colors" />
                  <p className="text-xs text-gray-400">Example: happy hour · contains the exact phrase "happy hour"</p>
                </div>
                <div className="grid grid-cols-[1fr] gap-2 mt-4">
                  <label className="text-sm font-medium">Any of these words</label>
                  <input type="text" value={advAnyWords} onChange={e => setAdvAnyWords(e.target.value)} className="w-full bg-white/5 text-white rounded-xl px-3 py-3 border border-white/10 focus:border-[#ACC8A2] focus:ring-1 focus:ring-[#ACC8A2] outline-none transition-colors" />
                  <p className="text-xs text-gray-400">Example: cats dogs · contains either "cats" or "dogs" (or both)</p>
                </div>
                <div className="grid grid-cols-[1fr] gap-2 mt-4">
                  <label className="text-sm font-medium">None of these words</label>
                  <input type="text" value={advNoneWords} onChange={e => setAdvNoneWords(e.target.value)} className="w-full bg-white/5 text-white rounded-xl px-3 py-3 border border-white/10 focus:border-[#ACC8A2] focus:ring-1 focus:ring-[#ACC8A2] outline-none transition-colors" />
                  <p className="text-xs text-gray-400">Example: cats dogs · does not contain "cats" and does not contain "dogs"</p>
                </div>
                <div className="grid grid-cols-[1fr] gap-2 mt-4">
                  <label className="text-sm font-medium">These hashtags</label>
                  <input type="text" value={advHashtags} onChange={e => setAdvHashtags(e.target.value)} className="w-full bg-white/5 text-white rounded-xl px-3 py-3 border border-white/10 focus:border-[#ACC8A2] focus:ring-1 focus:ring-[#ACC8A2] outline-none transition-colors" />
                  <p className="text-xs text-gray-400">Example: #ThrowbackThursday · contains the hashtag #ThrowbackThursday</p>
                </div>
                <div className="grid grid-cols-[1fr] gap-2 mt-4">
                  <label className="text-sm font-medium">Language</label>
                  <select value={advLanguage} onChange={e => setAdvLanguage(e.target.value)} className="w-full bg-white/5 text-white rounded-xl px-3 py-3 border border-white/10 focus:border-[#ACC8A2] focus:ring-1 focus:ring-[#ACC8A2] outline-none appearance-none transition-colors">
                    <option value="any">Any language</option>
                    <option value="en">English</option>
                    <option value="fr">French</option>
                  </select>
                </div>
              </div>

              {/* Accounts Section */}
              <div className="p-6 space-y-4">
                <h3 className="font-bold text-xl mb-6">Accounts</h3>
                <div className="grid grid-cols-[1fr] gap-2">
                  <label className="text-sm font-medium">From these accounts</label>
                  <input type="text" value={advFromAccount} onChange={e => setAdvFromAccount(e.target.value)} className="w-full bg-white/5 text-white rounded-xl px-3 py-3 border border-white/10 focus:border-[#ACC8A2] focus:ring-1 focus:ring-[#ACC8A2] outline-none transition-colors" />
                  <p className="text-xs text-gray-400">Example: @intasela · sent from @intasela</p>
                </div>
                <div className="grid grid-cols-[1fr] gap-2 mt-4">
                  <label className="text-sm font-medium">To these accounts</label>
                  <input type="text" value={advToAccount} onChange={e => setAdvToAccount(e.target.value)} className="w-full bg-white/5 text-white rounded-xl px-3 py-3 border border-white/10 focus:border-[#ACC8A2] focus:ring-1 focus:ring-[#ACC8A2] outline-none transition-colors" />
                  <p className="text-xs text-gray-400">Example: @intasela · sent in reply to @intasela</p>
                </div>
                <div className="grid grid-cols-[1fr] gap-2 mt-4">
                  <label className="text-sm font-medium">Mentioning these accounts</label>
                  <input type="text" value={advMentioningAccount} onChange={e => setAdvMentioningAccount(e.target.value)} className="w-full bg-white/5 text-white rounded-xl px-3 py-3 border border-white/10 focus:border-[#ACC8A2] focus:ring-1 focus:ring-[#ACC8A2] outline-none transition-colors" />
                  <p className="text-xs text-gray-400">Example: @intasela · mentions @intasela</p>
                </div>
              </div>

              {/* Filters Section */}
              <div className="p-6 space-y-6">
                <h3 className="font-bold text-xl mb-6">Filters</h3>
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-bold">Replies</label>
                    <button 
                      type="button" 
                      onClick={() => setAdvRepliesToggle(!advRepliesToggle)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${advRepliesToggle ? 'bg-[#ACC8A2]' : 'bg-white/10'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${advRepliesToggle ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                  </div>
                  {advRepliesToggle && (
                    <div className="space-y-4 pt-2">
                      <div onClick={() => setAdvRepliesType('include')} className="flex items-center justify-between cursor-pointer group">
                        <span className="text-[15px]">Include replies and original posts</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${advRepliesType === 'include' ? 'bg-[#ACC8A2]' : 'border-2 border-gray-500 group-hover:bg-[#ACC8A2]/10 group-hover:border-[#ACC8A2]'}`}>
                          {advRepliesType === 'include' && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" className="text-black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          )}
                        </div>
                      </div>
                      <div onClick={() => setAdvRepliesType('only')} className="flex items-center justify-between cursor-pointer group">
                        <span className="text-[15px]">Only show replies</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${advRepliesType === 'only' ? 'bg-[#ACC8A2]' : 'border-2 border-gray-500 group-hover:bg-[#ACC8A2]/10 group-hover:border-[#ACC8A2]'}`}>
                          {advRepliesType === 'only' && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" className="text-black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4 mt-6">
                    <label className="text-sm font-bold">Links</label>
                    <button 
                      type="button" 
                      onClick={() => setAdvLinksToggle(!advLinksToggle)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${advLinksToggle ? 'bg-[#ACC8A2]' : 'bg-white/10'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${advLinksToggle ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                  </div>
                  {advLinksToggle && (
                    <div className="space-y-4 pt-2">
                      <div onClick={() => setAdvLinksType('include')} className="flex items-center justify-between cursor-pointer group">
                        <span className="text-[15px]">Include posts with links</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${advLinksType === 'include' ? 'bg-[#ACC8A2]' : 'border-2 border-gray-500 group-hover:bg-[#ACC8A2]/10 group-hover:border-[#ACC8A2]'}`}>
                          {advLinksType === 'include' && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" className="text-black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          )}
                        </div>
                      </div>
                      <div onClick={() => setAdvLinksType('only')} className="flex items-center justify-between cursor-pointer group">
                        <span className="text-[15px]">Only show posts with links</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${advLinksType === 'only' ? 'bg-[#ACC8A2]' : 'border-2 border-gray-500 group-hover:bg-[#ACC8A2]/10 group-hover:border-[#ACC8A2]'}`}>
                          {advLinksType === 'only' && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" className="text-black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Engagement Section */}
              <div className="p-6 space-y-4">
                <h3 className="font-bold text-xl mb-6">Engagement</h3>
                <div className="grid grid-cols-[1fr] gap-2">
                  <label className="text-sm font-medium">Minimum replies</label>
                  <input type="number" min="0" value={advMinReplies} onChange={e => setAdvMinReplies(e.target.value)} className="w-full bg-white/5 text-white rounded-xl px-3 py-3 border border-white/10 focus:border-[#ACC8A2] focus:ring-1 focus:ring-[#ACC8A2] outline-none transition-colors" />
                  <p className="text-xs text-gray-400">Example: 280 · posts with at least 280 replies</p>
                </div>
                <div className="grid grid-cols-[1fr] gap-2 mt-4">
                  <label className="text-sm font-medium">Minimum Likes</label>
                  <input type="number" min="0" value={advMinLikes} onChange={e => setAdvMinLikes(e.target.value)} className="w-full bg-white/5 text-white rounded-xl px-3 py-3 border border-white/10 focus:border-[#ACC8A2] focus:ring-1 focus:ring-[#ACC8A2] outline-none transition-colors" />
                  <p className="text-xs text-gray-400">Example: 280 · posts with at least 280 Likes</p>
                </div>
                <div className="grid grid-cols-[1fr] gap-2 mt-4">
                  <label className="text-sm font-medium">Minimum reposts</label>
                  <input type="number" min="0" value={advMinReposts} onChange={e => setAdvMinReposts(e.target.value)} className="w-full bg-white/5 text-white rounded-xl px-3 py-3 border border-white/10 focus:border-[#ACC8A2] focus:ring-1 focus:ring-[#ACC8A2] outline-none transition-colors" />
                  <p className="text-xs text-gray-400">Example: 280 · posts with at least 280 reposts</p>
                </div>
              </div>

              {/* Dates Section */}
              <div className="p-6 space-y-4">
                <h3 className="font-bold text-xl mb-6">Dates</h3>
                <div className="grid grid-cols-[1fr] gap-2">
                  <label className="text-sm font-medium">From</label>
                  <input type="date" value={advDateFrom} onChange={e => setAdvDateFrom(e.target.value)} className="w-full bg-white/5 text-white rounded-xl px-3 py-3 border border-white/10 focus:border-[#ACC8A2] focus:ring-1 focus:ring-[#ACC8A2] outline-none transition-[colors,color] dark:[color-scheme:dark]" />
                </div>
                <div className="grid grid-cols-[1fr] gap-2 mt-4">
                  <label className="text-sm font-medium">To</label>
                  <input type="date" value={advDateTo} onChange={e => setAdvDateTo(e.target.value)} className="w-full bg-white/5 text-white rounded-xl px-3 py-3 border border-white/10 focus:border-[#ACC8A2] focus:ring-1 focus:ring-[#ACC8A2] outline-none transition-[colors,color] dark:[color-scheme:dark]" />
                </div>
              </div>

            </form>
            
            <div className="p-4 border-t border-white/10 bg-[#18181b] flex justify-end sticky bottom-0">
              <button onClick={handleAdvancedSearch} type="button" className="bg-[#ACC8A2] text-[#1A2517] font-bold py-2.5 px-8 rounded-full hover:bg-[#9bb891] transition-colors shadow-lg">
                Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="w-full max-w-[650px] mx-auto min-h-screen"></div>}>
      <ExploreContent />
    </Suspense>
  );
}
