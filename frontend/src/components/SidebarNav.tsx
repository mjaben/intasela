"use client";

import Link from "next/link";
import { useFeedStore } from "@/store/useFeedStore";
import { useUserStore } from "@/store/useUserStore";
import { useRouter, usePathname } from "next/navigation";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useEffect } from "react";

export default function SidebarNav() {
  const { openComposer } = useFeedStore();
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const logout = useUserStore((state) => state.logout);
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount, setUnreadCount } = useNotificationStore();

  useEffect(() => {
    if (isAuthenticated) {
      if (pathname === '/activity') {
        setUnreadCount(0);
      } else {
        const fetchCount = async () => {
          try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/notifications/unread-count`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              setUnreadCount(data.count);
            }
          } catch (e) {
            console.error(e);
          }
        };
        fetchCount();
      }
    }
  }, [isAuthenticated, pathname, setUnreadCount]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADtklEQVR4nO2ZTWhUVxTHfzPz3n1vJk4mY2KDNvULrV9oCW3V1gq2uhHqwpXgquBKBF26ddmtiKvSlQguFMSFYEX8iPEziVFb2yJ+1W9TjfiVaK1PnhxhDC9v7hnnTSaQHxwyeW/u4f7v3HvuuefCGGOMMdI0Aj8DnzGKmQb8DvwG/AO0Mwr5BrgNbJT/VwMPgB8ZRawB7kd0eqGI2xDT9jzwaIhdBVqoISlgC3AFmBsz3S4BW4F0xPuXQCtQFGsGbgDTqRE+sBM4AXxS5rthBw8De4DskIF4I39LuQZMpQZMBE4Du4Z0LA4D7ABOlQg38osM5TowhYRZICO2JWIkNVNxNjAOeBrxvRtJh++VsqjXfqSfn4B7wCrgYcT7MHS3kRCbgJvA11XytxzoAx5HvLsFfEqVcYDtEiYnV9n3fPmFw+mWqJDxwCFgv6QeSQWOLuBXwJVnd+R5VZgB/BkT/6tJA7APOAgUgLuyt3w038morKd2ZIBtwEXgX4u9qSzrJKJ8z8iwCXgFLK3UwfsYf1li/EiyutKEM9yY9gIdtU7WYlgk0zsu4fyAMMx1A7+URI16YZptwFkkMXsz9UsROALsHi6vy0h0CMRC1fXGZElMj0kfw89lw224RuqNHyQcrwCW2ORf3wKd1B/L5BxjzWKgh/pjKXBU0yA8W/dSfywBjmsafCXZrZaUMeamMea5jWV9/2+l/8XASU2DdllUWjKpVOpNT9exoJx1dhwIXNcZVPpfKEdqa74A/kCPk06n/79yuTcoZxd6OwPXdbVCvpQUX3XACXdQLW4mk3mtEDKg9N+uDULzAO38DTG2Qs6fq0jIAu3anSNZrxbfcTL/2Qjp7TkeGKMWMk+7dmdJiUZL1nGcJIXMkSql6lgb1qq05FzXeWUj5Fx3R2CMeaH0/znwl6bBdCmKaWlwXTdJITO0U36qFMW0jDPGTki4l4SbYgXnkavadDk8l2jJG2NeJihkitSBrWmTY6WWRs+zE9LddTTwPLWQNqluWjNJKidaCr7vDSYoZJJcFFnTKlULLUXf9+2EnD0SeJ73TOm/VTvAE+TYq2V8NusPJCikRTvAzXJ3p6U5m81aCek6805I1F1Iudpz1LVDbKUiqrxfjpZcLlEhBaBf2+AJeiY05HIvbIScPX048H21kLy2Xx7wTEouAxHXxcPZ9XQ6PdiYz/cVCvmHpVYsNvWXWlNT4UkqlXotOV2p9cX475f7k4rJlVwXl7OJkuLY2MxhnrfG+Le9bB2DkeQtlWgtgAZKr/YAAAAASUVORK5CYII="
    },
    {
      name: "Activity",
      href: "/activity",
      icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAE9klEQVR4nO2Ze2xTVRzHv71b23PPfbWbyhgwCBB1bmG6THkNxkSMixlPgSBIoqIEDBMHTh6JEaeGgJIYgQTBEWVkEIToGAxBHgqMp9s6dby6a9DEIBqLgw3Wdj3m6NXMBda1a3cr4Zt8k/5xcnI/t/f3O7/f7wDR10oAGm4D/XE7gFgAeAHE4zbQTwD64X+mRACTJImuczjUGkWRL4oi8RJCmmRZ/lnT1LMOh7oDwHwADyMGlSHL8ha73XYjK+uhKwsXFLSWfvIhq9z1KTtW9SU7efwA27+vnO3YXspWLF/Gnp42uTk5uWcjpeIlq9X6JgCH2QBUkqQ1kkSbC+bN9p06cZDpblenvbtiG5syeXyzKJLG+Pj4BQAEMyB6USq6c3Kym08c2x8SQHsfOlDBMjMzrsqyfBTA3d0JMUAUyeWXC+b4uwLQ1u7zNeyluS/ckCTpIoCk7oDQJEn6cfGiwohBtPXSJQt9lNIfAChRpZBlunfihPyWaEDohp97dvp1TVMqjXMo8hIEYVqv5J7NZ+tPRQ1Cd7vYhXPV7IHUexsFQZgRDQ5KCPFsKSuJKoRu+IvKHYxS6ol4eUMIKcoZOby5OyB0w1OnTGwSRfsbkeSwiiLxlH9W1m0QutvFjny9h1FR5EWnGCmQSelp91/tTgjdcO6oETxWnokIhaaph1euKO52CN3tYiUfrWEOh+NURDhsNltLXW2VKSDnzpxmhJDrkQj6yYMfyWo0A0I3nJ099BqACV2iUBRl/eJFhQEzQYqXLWWKIpd2CcTpdDRs2/qxaRC628UO7t/JRFG81BUOyWq1es98f9JUkIYLtf/EiTNckJEDB/T3mAmhG05PS+XnyahwQV4cP+5JU84PvZ1nTJ96A8ArYVFQSt9/dWGBqYGuG37n7dcZpWJ4Ae90Og6sXf2e6RC628U2l25gqqpWhwWiKHJD+edbTIfQ3S5WdWQvD3heDYcuQsiV41Vd68cjmbmsVisf9kmhcsQJguDnTY7ZELrh5OQknrkGhQrSg495zHjgb11V7PBXe9jO8q1sY8navwJ91vMzWzVN9QMoDBXkMUEQWFJSj9aUPr39Awf296enpXozMzN8I0YM845+dKRvbH5ey03sHZuf58vLG+PLzc3+j7OHD2nJGJTuS0tL9fbrm+Ln+yYmJrQmJDgDhJAAIXYWFxfHREICsiz5FUW5rqqKR5alcxaLpQLAIQCrQwXhOXsbgMcB8N55DoClAIoBrDJcAmBTO68HsM7wB23Wci8HUGSMTGfyghTAGABDAdwHICHIM/HPqj5UkD0AnkDsqQFA384uvgvArwBsiD2tCiVOZgHYjNhUDgA+Wu2U9vE+HbGpOACXAfQOtvAeAJ5ITi6ioI0A5gVbxLNTGWJb44xU3KF4vn4KsS3RuGTtcasFVuOzMv0GqRPabiSlmyrFyNPOMJ0MoI/xO1jqVoPslQigfwcu6iiz8n/CDeD3MB0AwML0lSB7/2K8ZO46AKcBrEE05HRqLj4ZvFkhWP/dSVbzzeF//VrR/ICmqbsQi4qPF2ZnZT3YFKy6ra0+whITE/jQbQhiVDZJks4vWbzgltdyfLQ0bNjga4qibECMK0WSaENubvZV3me7ao7+3aoe3cfeXflWgN+vy7K8yTihY16iIAhzNU2ts9ttTRaLpZVS+puqyrsBjDb74e7ojtB5/QkvNRsGwWTkOwAAAABJRU5ErkJggg=="
    },
    {
      name: "Creator Studio",
      href: "/creator-studio",
      icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFVUlEQVR4nO2ZeWwUVRyAv63dzs7szOx0oxweERGkoiYiEM/oH4palQAGigpGDFIhkFBAWzQQDZQERUShRG7EcihGy02RmxZQg7RcQa4KoihHgEBbDinPvOaRNJvZbbd0y27Cl7xs+t70zfzm/e6BmyQmh4GjQDHwLTAGsEhAtgK9gSeB14G5wAZAJ8EYB3xU428PMBX4CdBIILoAa0PmktTJFADJJAi3AhVASsj8LcAC4BslWEKwB+joMi+FWwpMJkGYCgwIsyaNvgjYASwEVgIbgW1AZ+KMt4AZEdaDyk1LVUsHngHaAz7ijIeBklquuQ34HXiPOEZTBl/bG74H+EudYNyyE3i0Dtc9APwLvEicMjeCwYfyuBJG2kmjkQy0BJ4F3gE+UMYbSjbwZRT7vgz8rfZuFI4CfwLrgJlAPrAfSAu5TqrKsij3HqT2kkE15vzoYpzyZE4AL9SYuxvYW4/9JwKbGiMvywAKXeZlJC9T6uRVKcl59RsN8vrFwBxijAGcUXEglCbAalWLyBM5pH6jRdYvpcBwYsy8CB5JJoRDlBc6pbLh1AjDH2afu5Q9douhHLyi8iM37khOThpuWWZJUlJSlaalXNZ9vos+n3Yh3PB4PFcBEW5oKSmVhmGcsm3riOMEdjuOs9lxAits28zXNW088CHQH3geuDcaQaQNnAxRm46WZa01DL0yI6PbhRnTJondO7eKsoM7rnuUbi8WxZsKReGKH8T3380Rs2ZOFhO//FSMyR0pcrKzxID+fa/26N61okP7dmccJ1BuGPopv98vPeoTdRFmOjBMnoBtmitSU53y3NEjru7d82uDPPz1jLWrl4ic7CFVTZs2OW/blswwXookiAyIB3Xdd27QwMz/4kGAspBx6ECpmPLVBHF782bllmXKqrWFmyBSF88Zhl4+JGvg5YZSo1iM0u3FolWrlle83uQ/3ATJUurVwjTNxX6/vyKzX59LRRsLb/iDl6mxe9fP0oaumKa/0jRNWfvc6SbIOuW9rtHCMHx5mqadT2vT+uzwnKFV0jjl8Ta2AMuXLhS9e/W8pOt6pWX5ZSbyYDj7kP7/bJhelUwqn/P7/V+bpnlMerG2bdPKM3p0vZjZr0/VsKGDRPb7g8XoUSOqvc6kieNE3qRxIn/OVDEvf7pYsmiBWLZ0odiwfrnYXLRKlPxWJHaUbK7+3bplTfW8XF9cML/6f2bNyBPjPxsjsgYPqEpP7ySNu8KyzCOapo0NdwI16QUsqu0i4DFgi4oHs4Ac2Xk0DGOCruuzg44z37bN5cFgcE0gYP0SDKaW2La9P2Dbhw3DOG4Yxmmv11sp40yK13tB1/Uzpmkcl+u2be8LBlO3OU6g2HGcAo/HMwp4M9o4IpsGb0dYT1U1u6z+MoHT9cxobVUyy4DX4GgRci3J08ARYDbgAPcBu+pxH6/qTkqHEhPSVZrtZhsfq1OQ+dU15InkRXkPj3oR61wafQ1GrmpUt6ox11T1qlYqtarJfKBnlPcYrbJfqVoxw690VhZSU1QxJVVprEvtId/sMaB5FPtnqgq0Vo/TUMg6/ROVrod74/cD+6LYU8alf1zK5hvOYGBaHa99SgnRgThkVYjhR4o3J1U9EXf4VfwIVwFeo50SojtxSmdgSR2EOKEyhbhlNtA3wvpDqj+8RX2G+BwYWY+uS0zRlFo1C7PeRgXOXPXBVLrcoao0iCtBuqg37UaaEkJ++Y17FqjebyiPqP7uGyQAhiyBXepjmUweB14lQXgNWO/SaZfeqRMJRAEwSj30u8AXKmK7feWNaw6oZvYalZ7I7yetb/RD3eQmxJ7/AdrfHEZjypLQAAAAAElFTkSuQmCC"
    },
    {
      name: "Orbit",
      href: "/orbit",
      icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAC/klEQVR4nO2Z3UsUURjGn/2YPOPM4rrjV7UaWWvhhVCBmEUXEQX1PwRRYDdd1WV3dR/dFHVZd31cRARBUBEFBRaUmmZ+pKXlx662rqtmOTHx7nA6jYvmGeHA/OC5edl9z3l233PmnHeAgICAgIAAOdwA8AjACwDtpG4A/aQxABnSTwD2KpXnvi9qkhunn1O7hx7TPB3dBhARjcwDOAJgD2k3gHpO5ZzWQpmQy9EmYax6AA3cXHgdBHCINAfAEAdwfuUw1GIGQEwM/oJ6TNM/7BKmf0Q1MgASfEADsAD1mABQyQcY7Sqq8Q1ANR8waOGoxijteC4xWjiq8RlALR+IA0hLSh6ORCJZXS+5CGAD/GUIwBY+YNHCkYHzpLX3tbbMGobxCUAr/GOAHp4uVbRwZBAJhUJLA31v7evXLi9ZVmLG0PX7AOogn48AUnxgI4ARScnDmqYtOkYcdXW8stvaTvxgjOUZY+cB6JDHBzrKuCQBDEtKzhhj8wUjBT1/9tA+dvRwrrRUz0Sj4dNeh73/oEc04iyYQcghYZrGrGikoLt3btp1dck5Xde7JJjpFY04C6YPckjG42UzXiY6O17ap04en2eMZaPRcJuEsfoA7OADKXIng1RVZUVWNHH1yiXbshL5WCx2izYXGfSLRnbSJUoGTbXJzdMFA0+fPLD3tjTnTNNwtsr9kMugaKQRQKek5M2p1LZMb89r+9zZM392K03TLvj0cBzy08iBigprrqaqMmea5j3xLCSZYaomlwbaymTQxFhJN11J/eaLaGQrLRzVGBGN1FK9qcZXANvFI4pztleNMaomF+e6OA71mPC6j0xBPSbFXdEEkIN6pMU7e4miXZRpuhS6hAAsQT2+iw06h0Xqb3lRvkLVePRwV6PqIrn/mTCALC2Lvxgt0kmfKtJJ5zW2TFd9pRovknvBY17ZdWhwBKwrUaF+rWVqfpfH+41Gj89ZXK5Svyf/jqvNRaF+08vU/BuPN05dHp9Lc7ny3Djv/TYVEBAQEIC18BvtcU0NFIX/0wAAAABJRU5ErkJggg=="
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
    },
    {
      name: isAuthenticated ? "Profile" : "Login",
      href: isAuthenticated && user ? `/@${user.username}` : "/login",
      icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADa0lEQVR4nO2Za2gUVxiGH9dxdy5ndjZixRatRSwFQSzaBNEixYqiBRUawURag4WiJTHYG+SHKAiCVLwmWkSjIKgo2qKY9d5sQlI3jU3TuF6TViRt1VZtNZvEWDrl1MmfgmJmdzMj7gMvu7Ccb+bdOd/5vnMGsmTJ4gUvKUqgLCcn8p2h67eCwWDSNEV7JBI+BRQCIXxOSNf1zZqmJQvm53ftrNxi18aO2U3nau1jVQftjRvW2LlvjL8nhNEOvIlPGSx0vXna2291NjZU2z+1Nj9WlTsq7HDYvA/MwGcMEsKIFy0s7Gm7+sMTTfTq60N7bE3TOoAR+AVNC62aPHlisvVK01OZ6NUnHxc/NE0zik8YoqpqR6y6qk8mpBItcVsII+mLpxIIBD6aNXN6sq8mepX/7pxuRQl85rUPLMuKVZSvdWVCavOmL+xIJHLCax8Yhn6rpjrq2siJ41/Zpil+9doHiqL0XEw0uDbyfWONHQqFOp55I4mWuC1jeO0DXddu19eddG1ETktD13/32geRiBWv3F7u2ois8rIn88PUWl60cMEDt0YKC+Z1K4ri/fILjBaGkbxwvsFVohuGLgvicPyAECJaunRJT5+LYf6cLtMwKvARw1VV/Wvf3sqnNrFyRdnfQhhX5XqBz5gmu9mtW9Y/0cD5lrN20fsFXUIYP/uix3oME3Vdv56XN+G+bFvO1p+2ZVvf3FT3X9teUvzhQysc7jBNcw9g4nOCwCLLCtdrmvon8E8wGOy0TLNNC4XWAmO8vsEsWbI8x7wGlADlwBHgDNAIJIA24A/gpvNdqtX5vQbYB2wAPgdmAzleGHgdOAz8AmwDlgJzZVEEcoFxwCjgReezV68CE4ApzonjMkAuyd8AncABZ2zGCQArgRvA4jQffVrAp8BtYDUwkAwWugPOvzc0UxcBXgBiwC5gQLqDy4C7gUPyVJHMowFVTg6llSXAj4BK/2EB15y8SwvDnHnbL0n4P6YCl9OVi+uBdXhHFHgv1SAyH34DXsE7ZgB1qQZ5BziKtwx0lvuRqQT50qncXrMf+CCVAPK8aSzeU+rUFdePNOmTF5eTgG9TqbDypaUfeNlpPl13trJj9QNBoNvtYNmpXsIfDAIeuB08BOgCbBeSuXUnjbrr7HH6Dc3ZIGVCan8ayZKFR/wL2mi+pmPniNsAAAAASUVORK5CYII="
    },
  ];

  const getNavHref = (item: any) => {
    return item.href;
  };

  return (
    <aside className="hidden sm:flex w-[280px] h-screen sticky top-0 flex-col pt-4 pr-6 pb-6">
      {/* Brand Logo */}
      <div className="px-4 mb-8">
        <Link href="/" className="flex items-center gap-1">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center font-bold text-primary-foreground">
            In
          </div>
          <span className="text-xl font-bold tracking-tight">tasela</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems
          .filter(item => isAuthenticated || item.name === "Home" || item.name === "Orbit")
          .map((item) => (
          <Link
            key={item.name}
            href={getNavHref(item)}
            className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors font-medium text-[15px] relative"
          >
            <div className="w-[22px] h-[22px] flex items-center justify-center relative">
              <img src={item.icon} alt={item.name} className="w-full h-full object-contain invert" />
              {item.name === "Activity" && unreadCount > 0 && (
                <div className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 border border-background">
                  {unreadCount > 20 ? "20+" : unreadCount}
                </div>
              )}
            </div>
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Actions */}
      <div className="mt-auto flex flex-col gap-3">
        <button
          onClick={() => {
            if (!isAuthenticated) return router.push("/login");
            openComposer('CREATE');
          }}
          className="w-full bg-[#3BC492]/5 backdrop-blur-md border border-[#3BC492]/10 text-[#3BC492] py-2.5 rounded-full font-bold shadow-lg hover:bg-[#3BC492]/20 transition-all transform hover:scale-[1.02] text-[13px]"
        >
          Create Post
        </button>

        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors text-[13px] font-bold"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Logout
          </button>
        )}
      </div>
    </aside>
  );
}
