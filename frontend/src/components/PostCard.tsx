export default function PostCard({ 
  content, 
  author, 
  earned,
  resela
}: { 
  content: string;
  author: string;
  earned: number;
  resela?: {
    author: string;
    content: string;
  };
}) {
  return (
    <article className="border-b border-border p-6 hover:bg-accent/30 transition-colors cursor-pointer">
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-muted shrink-0 overflow-hidden">
          <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${author}`} alt={author} className="w-full h-full" />
        </div>
        
        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="font-bold mr-2 text-[15px]">{author}</span>
              <span className="text-muted-foreground text-sm">2h</span>
            </div>
            {/* Top Right Actions */}
            <div className="flex items-center gap-4">
              <button className="text-primary font-bold text-sm hover:underline">
                Follow
              </button>
              <button className="text-muted-foreground hover:opacity-80 transition-opacity" title="Bookmark">
                {/* Added 'invert' class so black icons turn white in dark mode */}
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAACRklEQVR4nO2ZuU9UURTGf4DgArI5yqIgUCiNMZFSY2IsrSxsLe2oaemgNjb+C7aUtiSWhFAAKpvKDI9xZpxhEQdZcpNTEMK8PPWcew15X3IyyZv3vnu/u54FUqRIoYlLQAcwCAzVsPvAiNi9mPc6algTxpgHSkBRbB1YirGFmP+iEzynrQociRUshDgRGfzi0IK0GEDIAVCnTfoduI5f/AbqtUnzwA38Yh+4oE3qNmgXflEFGrVJcwGE/LI4jrNAN36xB1zUJv0G9OAXP+USVsVXoBe/2AUua5OuBRCyA1zRJl0FbuIX20CzNukycAu/2AKuapN+BvrwiwrQqk36KYCQMtCmTfoRuI1flCRGUV9a50LIEjCAXxSBTm3SlQBCCsA1i3vExdo+kbeIgb4EmJG8RQzkfK1+/GLTQsh6gHskshCSDeCi5CyEbATwfiOLzR4FiBAjCyEhsiibFkJC5LXyFm0WLW7ZBEIyFg6cut+TYBVkLGKDds6BkIpFtBbCady2iJ9D7MsdoOUPv2kAngPP/mFGMhgky5LmmJzgUYkqp4FZ4APw9H+Ykb0E6UuX5B6Xi2wKeCjPXbHmBbAowh4nbPOHxUlZjcmMuwLoWzn33e+dGu+5WsdLyZG9Bx6EELJ/Rq3ikYx8VmYiaaNuQF7Jd++AuzFHficG9bwG6YQb1TlgRjr0txlzlw4dk03tBA35EHIoo56TWXiiyO06Oymb+/UJL7tsceQvy/ofxg49wBsRNCF7RL2q6xO9MkNu6aZIQUAcA5x4jYk8OqYWAAAAAElFTkSuQmCC" alt="Bookmark" className="w-5 h-5 object-contain invert" />
              </button>
            </div>
          </div>
          
          {/* Body */}
          <div className="text-[15px] leading-relaxed mb-4 text-foreground/90 break-words">
            {content}
            
            {resela && (
              <div className="mt-4 border border-border rounded-xl p-4 bg-background hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-muted">
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${resela.author}`} alt={resela.author} className="w-full h-full" />
                  </div>
                  <span className="font-bold text-[14px]">{resela.author}</span>
                  <span className="text-muted-foreground text-[13px]">· 5h</span>
                </div>
                <p className="text-[14px] text-foreground/90">{resela.content}</p>
              </div>
            )}
          </div>

          {/* Engagement Bar - Linear and Standard Spacing */}
          <div className="flex items-center justify-between text-muted-foreground text-sm max-w-md">
            
            {/* 1. Heart (Like) */}
            <button className="flex items-center gap-3 hover:text-red-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-red-500/10 -ml-2 transition-colors">
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAC6UlEQVR4nO3ZS+hVVRTH8c9fU1FII3wPwhfZQElMExQHIhL4ljQqSkgHIqKGEkqp4EgTMgeRSIiIz4k6sAahSKYW+ILKCEPxhWbhg3ImDWTDEv74uOfc+z/3/s8f7hfu5J69z977rLX3Xuu3aNKkSZMGMBiLsAV74rcZSzGs3oO/hNcxAv1q6N+Ct/Ez7mEnVuMDvI8V+Aa3cR4zi5p4d7yLg/gH/+IXXIiJ/IUdmJTjXcNxHL/HYrpWaNsZ03ARh9GrLYt4B1fxHeZjwDPaJBdYiUs4hTcqvOtufPE0ybx0w1acRe9azP8FfsX4nH3S5D7CLazFC62eLYv/x1Y7kVbz+RI/oJMq2IATNZqzbwx4FC/iQ1zBEG2jM37Cx3k7TMQNvNyGQbtgW+yFtGlfVQyvhXumD5RJssTcggb+DJMVywEsyWo0Eteq3IyNZnJs/IqswefKTRc8yHKvbzFL+TmOKZUapDtjkPLzVdY+SSbrofysx7rnPUwX2MO4fMrO8gg0n0k6qf7vIAtZGZHHc/kPPZWfTVhVqUGKakcrP8fwVqUGu7BAuemJ+1lx4ELsVW4W4lBWo4G4EzlAGWmJhC5X/PY93lNea5zI23gOTpfwGO4bKUHSCnLRKcyXUtMysQcbq+00J3LwSuJAo13qQq3h05EQCtqbCaHU1KxzDcXf1fhkHXgFN7MuvzwkCei30LYazUD8mSetzcs+fK2x9MMfERwWRq946WKNYUBs7E/rJTYnX52uvgzDZXxSz0HeDO23VrUwixR13wy1su5Mj6Ow6FB/RpyQszSQqREqjC0wbb1RR0tXZHYsJrlbrXSL2siZOGrbjWnhDslCtRyvqQSxv53uqKcYF+WCajboqNDP1pUtwh4eR2YSrLOYF1YsSiQvnP44h+1PFHge0xKqx3WM0QFEgSORT7f2++5Rf/wRfXQQumJ3VJZ6R7HoZJxOZcltctMSAtrFqFhtLtumrpZFcdk1aaID8wjW3oTKnMqi9AAAAABJRU5ErkJggg==" alt="Like" className="w-5 h-5 object-contain opacity-70 group-hover:opacity-100 transition-opacity invert" />
              </div>
              <span className="font-medium">42</span>
            </button>

            {/* 2. Comment */}
            <button className="flex items-center gap-3 hover:text-blue-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-500/10 -ml-2 transition-colors">
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADh0lEQVR4nO3Ze4inUxzH8dfuGLus2qzrbmMtxcS65bpbbsuuW2E3/CGS61JbaFxWJKuEtca6RRapdSv+4A/l9geNP+S2YluXGCyLRSktalPo1Ef9mmKfZ+Y383vUvOvUNHOec84z5zyf7/f7OYwzzv+WbvTgIOyJ3bGNhjMBc3EdXsD32Ixv8B4G8RV+w+d4HldjlobQgxuz0A/Qj4WYkZcbSvndTJyB+/Oib+McTOzA+u2IlfgJ9+b4DIcunIwX8REWGUMuwY+4Gzu1cdzjsAarMdUosj2ezZnfexQFoh9foHc0Jihnfl2O09ZGn4URh4PbOWiRzc9wjbHlJPyA2e0YbLvsxBU6wyJ8gmkjHehJPKKz3IyX/0XOK3Eu3sdknaUb7+LC4Ty8Lb7GHM1gX2xI/KrF9Xhas7gT99V5oKQK63FAxf6TE2NmRfsPwbE4EWcl/Vic1oelycluTytxo0rM2AEb6wThBQl6VV+66P3P+BIf5zy/hpfwTATjobS7Wl5gadqVmF5xvnuwrOqLlNzpWs1kv2TPlXgHR2omXfi9ipJ2p+MUzWVdlWi/czLbJvNclXS/t84Z7BAP4rIqH1PZujpMivzOSG2+fyT4cMxvaQsix63t4tQ3u9SY77ao3X8yPVptGPL7bUreDyPBpYR9taW9EjlubQ9HlmfXmLPEoFu31KnUGn90qn6uSDEtVlTpODha1VmbWIabqnR8ChdoLitwVZWOl+NRzeUJnFel426xecaiNh8Oa3Bo1c5v4NQag09NWTwWKcqvdeZaHFtzS0yM7Bb53YQ/8/P6xKO3hkjwSHO4o1K11gpypSI7sOZEExIcexIci51zREtQHKnx1l9VsVrpiyHXFLqz0yVzqMUpcdWH7V60mfNzPGuxB77DMZrBJHyaEroyRRHWYonmcEfdYz4x+X5J5prC/AhPMR8qsxwDDQqGc+L/1pLtJblsGbHP2sad2IgT6tr4Gxpyp7dVrvPKeo6u8+Dc1Omlqus08yI0xRPbte7Da3OReSn2MvYUgSlmwuu5hzl9uAMVC/JsPJbtLOb144ns85JytJspqeEfSNAdwJlJCttGb/zalZlgU+70ynavwg25cihKsk9yqmlDMtJ/cq6ZybVOS4m6KvX8L7FV+8byu+zKYo/HRbglfu5AFjWY/2pZ3F9pm5MFl7+9mdi0PK7JYfmgxxlnHKPP3/f5ueKem89DAAAAAElFTkSuQmCC" alt="Comment" className="w-5 h-5 object-contain opacity-70 group-hover:opacity-100 transition-opacity invert" />
              </div>
              <span className="font-medium">12</span>
            </button>

            {/* 3. Resela */}
            <button className="flex items-center gap-3 hover:text-green-500 transition-colors group" title="Resela (Repost)">
              <div className="p-2 rounded-full group-hover:bg-green-500/10 -ml-2 transition-colors">
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEdElEQVR4nO2Ze0yVZRzHP57De3/PAcSUBVRbzVIGkSy62JYt/mBs2rq5gQayjC6glViaKy3LpVZSaQY5hVjLUbZUxiovNdTSNCFrVIqpzZVmtbjLTd720kOjQsfhnBcP7Hy2Z+fs7Hl+z/s9z+V9nu8PQoQIEWKQXAakAQ8DC0R5DLgbuAHQCWImAauBY8BpYBtQDCwX5VXgA+AA0ATsAZ4Frhxg/JsURbHrO8YtwGfAcWAJED+ANhpwG7BKiLbb336B+m7D0OtkWW6xvxNgPMB64CcgGwgbZBwJyACOiFG85r8VwsJcc69LSmyKi4tpAFIIIFcA3wDrhKBAYAvKB86ItTVK/B6laWrjR5WbrJycmR2SJD0XoP56FusvQB7OMF6so1J7MHRdfyc7K7Pt2NFD1tulRVZ4uNf+A/3mWjGn03EWHagAqjweT+uhms8tW8j3tfstWZbbgXB/go8DTgJ3MTRcr+tay8oVS7ttEb0leVJSgz/P4AJ2iO3SaUYbhrbBNM3mlcuXnusrwi5PLZzXbRhGyWCDPwTsFoKcwuVyuXIVRanPzLi39evqPf8S0FsqtpZbpmnaM8NnooBfgYk4R5Ku67Xx8RMaKyve61dAb6k7XGOpqtIGjPW1k2XAGziI/Z4wTeOUqqptyclJ9fl5uV3r162xDh6o6ldMSkpyI3CPL32YwG9AHEODPfrpkiS9EBkZsVdRlJYxY6KaUlOnND75xKPdJRvWWvu+2GkVzMs/J0nSS74Eng1s4uIyHpipqmpxZGREta7rf0pSWIeu6+W+BNkJTCX40AF1oJUNoEF8DmumALsYATwCrGUEsAxYxAigEJhL8JEkrtEDxr7gRBN8PC5ulsOeRWLaD3tWB+mU95nKIH1J+8QocRIfqrOfY0wQtpPPxAXZEeVp4HWfW2madlySpA6v13tYluXFQAIXd1p9B0z2uaXHY57Y8uG7VllpkTUjc3pnVNToVkPXz6iqatufyQwtU4GvBtUyMjJi31vFr/3vzvxgbk6nfeExDOOUokgrgEScxQ3UDNo9MU2zbMnihee9P2/dvNGafX+WLarF6/X8rGnK84AScBn0OJCf+hNgQc6sGe0XMgNst2N+wZwuRZY7PR7DPvZ7CSwJwka92p8g0yfffGN9fwJ2V31sZWdltGuaetbj8bzv0EYwDqizr7r+BkqMjh7b2FdA7bdfWmlpqWcVRWlWVdU+IcfgDJeIdfFMIIKpbre768gPB/8Rcse09HbhKxXgHBOBo0DAnHdMUz+9/ZPNPSIKV73YrevqSWFmV4sM1OUB6+xvJ3OOWBNZAYxrb8Hhu4reLLR2bNtiaZrWLEQgXAzbC/4dsLfgWD8FTBM5lyphAQUWRVEK8/Me6I6NjWmWJFdOP1UuBdYAf4hUwH0iGTqQh08W6bofgf3AnThIjtvt7jZNc+MAvCY7BVcucigngO1ASZ+E6MtAmTDEG8WR45VAp9POR4Isy3sHkVK+CkgFZvVJUc8XYm8V9miIECFC4DN/AetW2sTrKgqoAAAAAElFTkSuQmCC" alt="Resela" className="w-5 h-5 object-contain opacity-70 group-hover:opacity-100 transition-opacity invert" />
              </div>
              <span className="font-medium">3</span>
            </button>

            {/* 4. Impressions */}
            <button className="flex items-center gap-3 hover:text-primary transition-colors group" title="Post Impressions">
              <div className="p-2 rounded-full group-hover:bg-primary/10 -ml-2 transition-colors">
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEDElEQVR4nO2ZS2wUdRzHP/5nZndnO4/StVgea2mxgDHEizcPHoyJBkNiNB40XnyERI0HjYl66sFED3pQikZaWrUWRPtIMVjwgBQSxEotSEvtAxTqA0FrtdtgU+Fv/mZsuhWzO9OJnW72k8xlZr4z85v5/X+vgSJFivhlADAoAKaBGAXAZUCwxBHAFQqAmOdaS54kMEUB4AC/ESEMQzxk29aIYRiXHMce1DTt3nx0ZcAvRARd1x9Pp1dldu9qkl8dPyLfbnpTVlSUZwzDeCSXdjnwExHBsqyxjrYWeWb0xOzW3vaetKyS73NpVwI5T/q/0HV9uv/k0SxDTvX3SE3TZnJprwfOEhEcxxpufuetLEM6O3bm9UWqgdNEh02lpe50445tcuDk53+7VTq9OqPr+pO5hOuAIaLDRmDCKin5RrmTZVnnhBAP5yO8EThFNNCBHiCvB4+yIU8DnwDXBBFvAAZZfFYAFzxXD8R64GsWnw+A2oVcoAYYDiLUNO0e17VHVOy3bUstzvsCPsMdwLde3ReYG4CRALq7U6myTEtzvVQJbNfOHTKVKpsSQjzo8zpxL2puYoGsBUb9ilzXOd7YUJeVuJQxlmX5Ta7PAJ2EQKCEaJqJ8cPd+7IMGRnqk0KIyz6iTspb4GqdLpgq4IxfkW1bvdvqXsky5NDBLhmPxyd9XOY1YCshUektNL/c5Tj2TP3212XvF92yrbVZVlevmTF0/SJwUx76dV77cB0hEbRofF7lH8dxTiQS8Unbtk/ruv4E8JjXFjyQQ98KPEeIpIFzPjWbPY1qAf6rXlJJtkl54VWO3wx8p5YaIbIaGPNx/kbvjd+S4zwLqPci4q2mGa9NJpMXVDAwTfMPIURb0FIkjMYq5eWcXG4zlzs1TZuoqVk7s7+rXQ4O9Mg9ne/LDetrMolE4gVCrnF+yHNs1A286PcGyWTy4v59HVkR7uCne6VpJn4lRCqAH+fv1HV9i2ma54UQf6quDfgYaA8ykTQMY1p9ibmGjA73/dO+irAMUeHvfLYRYktlZXpStZiqS1Mh1jRNNY28LcgNHMcaUqXMXENaP3xXqvqMECn3susstm2dnT/JePml2iuO4xwIcgMhxP0rV1RMqlyjvkzX3lZZVVWZMQzxaGhWANcCKonNEo/Hpr48dijLkL7ewzIWiwWeSKqHtqySMeWqKnrFYrFnCZkU8PPcHa7j9Dds35plyEd7dqtJxr/WUpRYBozP27fZdZ2pN+pelT1HD0g1nqlYXq4mGU8RYUqBq4XB213X/cw0ExOO4wwKIfzkjkXBVeMXCgAb+J0CwAL89BCRRQMuFcI/RLzGahUFQCPQ4rW9y7xN/clacpQCDd58a9xzNRmxbWixX1KRIiwx/gKKBNNZ2qrGqAAAAABJRU5ErkJggg==" alt="Impressions" className="w-5 h-5 object-contain opacity-70 group-hover:opacity-100 transition-opacity invert" />
              </div>
              <span className="font-medium">{earned}</span>
            </button>

            {/* 5. Share */}
            <button className="p-2 rounded-full hover:bg-accent hover:text-foreground transition-colors group" title="Share">
              <div className="p-2 rounded-full group-hover:bg-accent -ml-2 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
              </div>
            </button>

          </div>
        </div>
      </div>
    </article>
  );
}
