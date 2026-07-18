"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useNotificationStore } from "@/store/useNotificationStore";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const { unreadCount } = useNotificationStore();

  const navItems: { name: string; href: string; icon?: string; svg?: React.ReactNode }[] = [
    {
      name: "Home",
      href: "/",
      icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADtklEQVR4nO2ZTWhUVxTHfzPz3n1vJk4mY2KDNvULrV9oCW3V1gq2uhHqwpXgquBKBF26ddmtiKvSlQguFMSFYEX8iPEziVFb2yJ+1W9TjfiVaK1PnhxhDC9v7hnnTSaQHxwyeW/u4f7v3HvuuefCGGOMMdI0Aj8DnzGKmQb8DvwG/AO0Mwr5BrgNbJT/VwMPgB8ZRawB7kd0eqGI2xDT9jzwaIhdBVqoISlgC3AFmBsz3S4BW4F0xPuXQCtQFGsGbgDTqRE+sBM4AXxS5rthBw8De4DskIF4I39LuQZMpQZMBE4Du4Z0LA4D7ABOlQg38osM5TowhYRZICO2JWIkNVNxNjAOeBrxvRtJh++VsqjXfqSfn4B7wCrgYcT7MHS3kRCbgJvA11XytxzoAx5HvLsFfEqVcYDtEiYnV9n3fPmFw+mWqJDxwCFgv6QeSQWOLuBXwJVnd+R5VZgB/BkT/6tJA7APOAgUgLuyt3w038morKd2ZIBtwEXgX4u9qSzrJKJ8z8iwCXgFLK3UwfsYf1li/EiyutKEM9yY9gIdtU7WYlgk0zsu4fyAMMx1A7+URI16YZptwFkkMXsz9UsROALsHi6vy0h0CMRC1fXGZElMj0kfw89lw224RuqNHyQcrwCW2ORf3wKd1B/L5BxjzWKgh/pjKXBU0yA8W/dSfywBjmsafCXZrZaUMeamMea5jWV9/2+l/8XASU2DdllUWjKpVOpNT9exoJx1dhwIXNcZVPpfKEdqa74A/kCPk06n/79yuTcoZxd6OwPXdbVCvpQUX3XACXdQLW4mk3mtEDKg9N+uDULzAO38DTG2Qs6fq0jIAu3anSNZrxbfcTL/2Qjp7TkeGKMWMk+7dmdJiUZL1nGcJIXMkSql6lgb1qq05FzXeWUj5Fx3R2CMeaH0/znwl6bBdCmKaWlwXTdJITO0U36qFMW0jDPGTki4l4SbYgXnkavadDk8l2jJG2NeJihkitSBrWmTY6WWRs+zE9LddTTwPLWQNqluWjNJKidaCr7vDSYoZJJcFFnTKlULLUXf9+2EnD0SeJ73TOm/VTvAE+TYq2V8NusPJCikRTvAzXJ3p6U5m81aCek6805I1F1Iudpz1LVDbKUiqrxfjpZcLlEhBaBf2+AJeiY05HIvbIScPX048H21kLy2Xx7wTEouAxHXxcPZ9XQ6PdiYz/cVCvmHpVYsNvWXWlNT4UkqlXotOV2p9cX475f7k4rJlVwXl7OJkuLY2MxhnrfG+Le9bB2DkeQtlWgtgAZKr/YAAAAASUVORK5CYII=",
    },
    {
      name: "Orbit",
      href: "/orbit",
      icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAC/klEQVR4nO2Z3UsUURjGn/2YPOPM4rrjV7UaWWvhhVCBmEUXEQX1PwRRYDdd1WV3dR/dFHVZd31cRARBUBEFBRaUmmZ+pKXlx662rqtmOTHx7nA6jYvmGeHA/OC5edl9z3l233PmnHeAgICAgIAAOdwA8AjACwDtpG4A/aQxABnSTwD2KpXnvi9qkhunn1O7hx7TPB3dBhARjcwDOAJgD2k3gHpO5ZzWQpmQy9EmYax6AA3cXHgdBHCINAfAEAdwfuUw1GIGQEwM/oJ6TNM/7BKmf0Q1MgASfEADsAD1mABQyQcY7Sqq8Q1ANR8waOGoxijteC4xWjiq8RlALR+IA0hLSh6ORCJZXS+5CGAD/GUIwBY+YNHCkYHzpLX3tbbMGobxCUAr/GOAHp4uVbRwZBAJhUJLA31v7evXLi9ZVmLG0PX7AOogn48AUnxgI4ARScnDmqYtOkYcdXW8stvaTvxgjOUZY+cB6JDHBzrKuCQBDEtKzhhj8wUjBT1/9tA+dvRwrrRUz0Sj4dNeh73/oEc04iyYQcghYZrGrGikoLt3btp1dck5Xde7JJjpFY04C6YPckjG42UzXiY6O17ap04en2eMZaPRcJuEsfoA7OADKXIng1RVZUVWNHH1yiXbshL5WCx2izYXGfSLRnbSJUoGTbXJzdMFA0+fPLD3tjTnTNNwtsr9kMugaKQRQKek5M2p1LZMb89r+9zZM392K03TLvj0cBzy08iBigprrqaqMmea5j3xLCSZYaomlwbaymTQxFhJN11J/eaLaGQrLRzVGBGN1FK9qcZXANvFI4pztleNMaomF+e6OA71mPC6j0xBPSbFXdEEkIN6pMU7e4miXZRpuhS6hAAsQT2+iw06h0Xqb3lRvkLVePRwV6PqIrn/mTCALC2Lvxgt0kmfKtJJ5zW2TFd9pRovknvBY17ZdWhwBKwrUaF+rWVqfpfH+41Gj89ZXK5Svyf/jqvNRaF+08vU/BuPN05dHp9Lc7ny3Djv/TYVEBAQEIC18BvtcU0NFIX/0wAAAABJRU5ErkJggg==",
    },
    {
      name: "Spaces",
      href: "/spaces",
      icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAH30lEQVR4nO2aC5CVZRnHf+ec75w952PPntPuFncEgYhIlDXLJBC1MW9QIlEBIrfCCFd0FxBlQQcxMG2qAcopZhMNpDIuQcklpYYYETRRFAYQS7BALtEu11U5zbP9D/N55twWzzLZ8J/5Zs6e9/2+732e93n+z/95z8J5nMf/DBxgMDAZ+AYQ4iMIp7i4xeaKiovrxowefrJz5057fT7fEj6CGNSrV8+63bu2JOza/vqmhN/vb9AuGeJAyVk+uwhoB5RzDlA5dMjgk15DgkHnFBDU+BBgL3BLHs/yA9cCc4HNQD3wD6AO2ANMbc6w7V5cXHx0+dJFjUaMHnVrQzQa/WPKnF5a2O/k4VTEgGnAW8BLWvAlnl01XAys1TPM4MIjEAgMct3IfsdxGmKx6BrgE2mm2Q7dC+wHbtJ3IRHEPuAJ4LM5XuUAG4GRNDN8ecz5AvA2MB94DVgKfLIJ77gG2EQz4Mt6eL4wr/4IsDx6xpNL+SIAHP4QBJIRlphj8pxbBqwDlgGttRsrxU5NwfNANwoM82qfPOZ1ArYBD3qSNSRDlqYkdi48C/SmwHgZ6JFjTkfgb8C4NGNhYBXw0ya8c61CuqAwFrk0y3grYDcwA7gOGA1MElvZ9YCo1whgHnBBHqSxAagosB38SUUsNYy+BdQCx4B3gdfl+YXAHBlghkwBZgMmaxpEz0eAP2isR5p3vgO0KbQhC4BhwOeBR5UHfwceV2KvbEI1NhWwU0TQH/gB8KaccBdQquJZL/YqGOyFq0WHL6ngJdnEYngL0KKJz1yoHUrCp9pjDjsELFIUFAQ9FDYWBr8FXk1Ds7vTUOSVus9YaoU+VwGdPXPayjGfSvPetiKXo8DwPAtwWrjAwzJggrxdJE/ZtifxFDDd83d5MOj8Ph6P1QcCgRPAKOAGLWaenvcTT3G8Tw5Khxd0//OifnNak2A6aJcS1btow6+Asfp8GbBDtGoodRxn14jbhhzcsf3FxE03Xnfccfx3eG8uKiq6IxQKNrRq1dIKJarahyUUvTBGO6CaE1QIvgH0JE8Ybf5LSZ0OXwX+rM9r5O1G+Hy+p4d8c9C+pMyvqLikLhQKeCX9qJKS6PFlSxYl4vHYMSllw0PSY15MVTh6MVDGWdhmRYW80zfLHEf9wm3Ai57YvSgSiRza9toLjUbUTJ102nXd7R5JUh4KBetWPbOkcfy748acCgQCsz3eN8OMpZLYmmEdX1J4dsm0QJ8SOR8tNV1N0Fc839XcMrD/ruRulJZ+7N1wOOxdSO+2bVrXvbHz5cbxuXMeSZSXl9mOeqXICH3uJWrPlOBDga9nWlwf5UU+nG1z31MlT2Lz1Vf1PdMGz3jgvkQ0WmzdXgeNB+Px2Laqu8e/b+OLF9WaISbtkzAySDZp81RLzgrj08RpJvwYeE5FLIlfW+g8PHtG40LtmnDnd063b9/OqDeJfl27dj5iYwt/OT9RVlZqtScJY8V/azcsRz9+toZUihZzIQL8U9y/3yMfHgFmRSKR+rWrlzUa8uCMqadcN7zc64Dbx448YGPTp92TKC2NG3V7USsHpSa5PxQKVcbj8U2u664H7s7WAl8jUZgLXzPve2pAchdvB35RVlY2uUP7dg33TqlKlESj5uHLPfeuX/jk/PctT7p0ufCYl/GEQdJgF37Ac5HIzE9373b0iccfS9TOn3u6vLxsr87WsrJRLu2/wPOQiCT75doZo8ZW8Xh8QOuWLRcEAoEBKff+8Oqr+hyYWH3n6VhJydY0yTwNOCE5dAauGzm07rmVjbts18TqylM+n+/7ubz9ZoYDBUQE+1KK5AjRcEAL2ZhFrcZ9Pt9mxwnUiXK9aKmQtSr/7Q8a4h5IhqtdQ4cMPuX3+6vJg1qNvS5KM/ZFC4+U7/w6IBgrD9cABy3MROX9dZlM3yqVnGQyLywvvqeiZyr6DMLh8D2dOnWsnzfn0UR1VeV74XD4SL7SfqQ0VY00VxI18noqeqquJLVQGxn2c/Xsy8Vw/TK8r5/agajY66BH9vzXW37/sHg8trq4uLg2RXjmhHntSS1wggxakaaxSuJ+4GmaDld9ibe4rmniaU1esNZ2sbxkiXhzhsMDa6i2ZNFomTBPjZkXD8mJk9QDvUIBcZnCbb0K1nK1r9d6WOZSGZyayKkG21Hq59QmvKMaZE3WBvXzb6tGzVR+WcgVDLbgZJW2E3NTtbN0ymG0fVwhskeGrpXRdg68XRLcBOlJheur+rxYRHCrnGU50l6GNAvGqj/J5ulO6mWsOj8lpWq67DPq+FyPI3aqb08HnxxT8BNGRI0T85wb1SHCyAxjG3Wykg17muP0BB2qXd+E+d2VL1emGLFeR6+5cCBbz3GucYOqdVepATPiZ3n85uFTaJ21As4XTTlnGi5jrODNzvM0pJvY7KxPTrIiFApVh8NFppNOO05gZ54H2sPEYodFufmgWj8GNQuub9261dF1z65I7Nrx18SsmdOPBIPBbLK/s45CX9FPazcq7qtyeNr1KOrCo0UL97FpNZPPKNANf1mTCIfD5uVUWBvwGxXPu1JUQAfJjy3quVNzpUgyxzRa88BxnCkDBw4484uuKdFYLGbFzov2Ok4dn6Ua+1StV6kwLpIksRq1R/WnWf8JIea67lv9+vauHzz45hPW0gJXfMhndlRFv19y5wrOEVyx0Lgceuo8zoP/E/wH/i1X1yA/9/oAAAAASUVORK5CYII="
    },

    {
      name: "Activity",
      href: "/activity",
      icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAE9klEQVR4nO2Ze2xTVRzHv71b23PPfbWbyhgwCBB1bmG6THkNxkSMixlPgSBIoqIEDBMHTh6JEaeGgJIYgQTBEWVkEIToGAxBHgqMp9s6dby6a9DEIBqLgw3Wdj3m6NXMBda1a3cr4Zt8k/5xcnI/t/f3O7/f7wDR10oAGm4D/XE7gFgAeAHE4zbQTwD64X+mRACTJImuczjUGkWRL4oi8RJCmmRZ/lnT1LMOh7oDwHwADyMGlSHL8ha73XYjK+uhKwsXFLSWfvIhq9z1KTtW9SU7efwA27+vnO3YXspWLF/Gnp42uTk5uWcjpeIlq9X6JgCH2QBUkqQ1kkSbC+bN9p06cZDpblenvbtiG5syeXyzKJLG+Pj4BQAEMyB6USq6c3Kym08c2x8SQHsfOlDBMjMzrsqyfBTA3d0JMUAUyeWXC+b4uwLQ1u7zNeyluS/ckCTpIoCk7oDQJEn6cfGiwohBtPXSJQt9lNIfAChRpZBlunfihPyWaEDohp97dvp1TVMqjXMo8hIEYVqv5J7NZ+tPRQ1Cd7vYhXPV7IHUexsFQZgRDQ5KCPFsKSuJKoRu+IvKHYxS6ol4eUMIKcoZOby5OyB0w1OnTGwSRfsbkeSwiiLxlH9W1m0QutvFjny9h1FR5EWnGCmQSelp91/tTgjdcO6oETxWnokIhaaph1euKO52CN3tYiUfrWEOh+NURDhsNltLXW2VKSDnzpxmhJDrkQj6yYMfyWo0A0I3nJ099BqACV2iUBRl/eJFhQEzQYqXLWWKIpd2CcTpdDRs2/qxaRC628UO7t/JRFG81BUOyWq1es98f9JUkIYLtf/EiTNckJEDB/T3mAmhG05PS+XnyahwQV4cP+5JU84PvZ1nTJ96A8ArYVFQSt9/dWGBqYGuG37n7dcZpWJ4Ae90Og6sXf2e6RC628U2l25gqqpWhwWiKHJD+edbTIfQ3S5WdWQvD3heDYcuQsiV41Vd68cjmbmsVisf9kmhcsQJguDnTY7ZELrh5OQknrkGhQrSg495zHjgb11V7PBXe9jO8q1sY8navwJ91vMzWzVN9QMoDBXkMUEQWFJSj9aUPr39Awf296enpXozMzN8I0YM845+dKRvbH5ey03sHZuf58vLG+PLzc3+j7OHD2nJGJTuS0tL9fbrm+Ln+yYmJrQmJDgDhJAAIXYWFxfHREICsiz5FUW5rqqKR5alcxaLpQLAIQCrQwXhOXsbgMcB8N55DoClAIoBrDJcAmBTO68HsM7wB23Wci8HUGSMTGfyghTAGABDAdwHICHIM/HPqj5UkD0AnkDsqQFA384uvgvArwBsiD2tCiVOZgHYjNhUDgA+Wu2U9vE+HbGpOACXAfQOtvAeAJ5ITi6ioI0A5gVbxLNTGWJb44xU3KF4vn4KsS3RuGTtcasFVuOzMv0GqRPabiSlmyrFyNPOMJ0MoI/xO1jqVoPslQigfwcu6iiz8n/CDeD3MB0AwML0lSB7/2K8ZO46AKcBrEE05HRqLj4ZvFkhWP/dSVbzzeF//VrR/ICmqbsQi4qPF2ZnZT3YFKy6ra0+whITE/jQbQhiVDZJks4vWbzgltdyfLQ0bNjga4qibECMK0WSaENubvZV3me7ao7+3aoe3cfeXflWgN+vy7K8yTihY16iIAhzNU2ts9ttTRaLpZVS+puqyrsBjDb74e7ojtB5/QkvNRsGwWTkOwAAAABJRU5ErkJggg==",
    },
    {
      name: "Profile",
      href: isAuthenticated && user ? `/@${user.username}` : "/login",
      icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADa0lEQVR4nO2Za2gUVxiGH9dxdy5ndjZixRatRSwFQSzaBNEixYqiBRUawURag4WiJTHYG+SHKAiCVLwmWkSjIKgo2qKY9d5sQlI3jU3TuF6TViRt1VZtNZvEWDrl1MmfgmJmdzMj7gMvu7Ccb+bdOd/5vnMGsmTJ4gUvKUqgLCcn8p2h67eCwWDSNEV7JBI+BRQCIXxOSNf1zZqmJQvm53ftrNxi18aO2U3nau1jVQftjRvW2LlvjL8nhNEOvIlPGSx0vXna2291NjZU2z+1Nj9WlTsq7HDYvA/MwGcMEsKIFy0s7Gm7+sMTTfTq60N7bE3TOoAR+AVNC62aPHlisvVK01OZ6NUnHxc/NE0zik8YoqpqR6y6qk8mpBItcVsII+mLpxIIBD6aNXN6sq8mepX/7pxuRQl85rUPLMuKVZSvdWVCavOmL+xIJHLCax8Yhn6rpjrq2siJ41/Zpil+9doHiqL0XEw0uDbyfWONHQqFOp55I4mWuC1jeO0DXddu19eddG1ETktD13/32geRiBWv3F7u2ois8rIn88PUWl60cMEDt0YKC+Z1K4ri/fILjBaGkbxwvsFVohuGLgvicPyAECJaunRJT5+LYf6cLtMwKvARw1VV/Wvf3sqnNrFyRdnfQhhX5XqBz5gmu9mtW9Y/0cD5lrN20fsFXUIYP/uix3oME3Vdv56XN+G+bFvO1p+2ZVvf3FT3X9teUvzhQysc7jBNcw9g4nOCwCLLCtdrmvon8E8wGOy0TLNNC4XWAmO8vsEsWbI8x7wGlADlwBHgDNAIJIA24A/gpvNdqtX5vQbYB2wAPgdmAzleGHgdOAz8AmwDlgJzZVEEcoFxwCjgReezV68CE4ApzonjMkAuyd8AncABZ2zGCQArgRvA4jQffVrAp8BtYDUwkAwWugPOvzc0UxcBXgBiwC5gQLqDy4C7gUPyVJHMowFVTg6llSXAj4BK/2EB15y8SwvDnHnbL0n4P6YCl9OVi+uBdXhHFHgv1SAyH34DXsE7ZgB1qQZ5BziKtwx0lvuRqQT50qncXrMf+CCVAPK8aSzeU+rUFdePNOmTF5eTgG9TqbDypaUfeNlpPl13trJj9QNBoNvtYNmpXsIfDAIeuB08BOgCbBeSuXUnjbrr7HH6Dc3ZIGVCan8ayZKFR/wL2mi+pmPniNsAAAAASUVORK5CYII=",
    },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-background/95 backdrop-blur-md border-t border-border z-50 flex items-center justify-around px-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.name === "Profile" && pathname.startsWith("/@"));
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center w-12 h-12 relative transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="w-[24px] h-[24px] flex items-center justify-center relative">
              {item.icon ? (
                <img 
                  src={item.icon} 
                  alt={item.name} 
                  className={`w-full h-full object-contain ${isActive ? "" : "invert opacity-70"}`} 
                />
              ) : (
                <div className={`${isActive ? "text-primary" : "opacity-70"}`}>{item.svg}</div>
              )}
              
              {item.name === "Activity" && unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 border border-background min-w-[18px] flex justify-center">
                  {unreadCount > 20 ? "20+" : unreadCount}
                </div>
              )}
            </div>
            <span className="text-[10px] font-medium mt-1">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
