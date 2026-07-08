import Link from "next/link";

export default function SidebarNav() {
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
      name: "Wallet", 
      href: "/wallet", 
      icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAD+0lEQVR4nO2ZX2wUVRTGv9nZ+XNn5s4spe2qFCyN4RHalAeCgJr0YRMMGmNEo8gLvhgSAkY0QRKRByEaeEEJ4UVCTIwiGg0I1ooKLIg2BQmkULogIFqo2rK27JZ2rrnk0jRLd2a2yO6s2V/yJftwcvd+uX/OOXeAChUqhBkdwEwAT0cikTUx297tOHanrmtpyzR7KTV3AYghJEgApgFoAfCyYRjbYrHYEcMwrsmyPByP16bnPTyn/6VlS4c3vr2O7fp4Bzt29FuWPNzKHl+YyJqm8UmxJ2wAaALwnCRJ6x3H2eM4tDsajWYJ0TMzZjx0/YlFC2+sfnUF2/r+Zta6/3N2trOdpc6dyKujyTZGiN5/ryY8CUAzgBcVRXknFovto5RekiTJtW062NQ0q3/xM0/dXPvGarZzxzb23YE9rLvruOeE86nrTAeTJGnkbifMt0MCwCpCyAe2bR/XNC2tqmqmoWH634lES/qVVcvd97a8y/bt/ZR1nv5pQpP1EwBXbM+CaaDU6qCWNdDcNKvvhecXZ9avW8M+3LmdHUl+c08m66VIJMJXRCnYhW3TX15/beUIX9ZiTzo1jqJR+aa43QqDEDLCD1mpDaSEVFUZAmAVbETX9Wwi0eKeOvljyU2kzp1gmqZlADgFGwFw3TSMg4qiuHV1U9xpU+smrHhtjVtdPXlUVVWTRmVZpkuIzm5L1zX3tmRZ5of8lsb+BtAD4CMA8SBG+L1tAzABzAfwWAGaI3JJPjUCmO6jOAAtz9xqAGwEsDfQigCgCC8KgIEgN9k/YjXCTF+Qc1MORv4EUOUXNCjqpv+FEYJw0wtgsl/QjQll0uJyDUC1X1DG4/oLC1fFVexJFoCKcNMDoNYvaKgMjPwR1EjhZXNx+T1ImcLL5ihKj+Rx6VwBcJ/fAMMAZJQO3TTN7YqiZFVVydo2/WGcbfQbgPv9BuIdWQQlwrKMzQvmzx3saD94q2dfsuTZIUrpZzlhlwE84DeWW2IjPQfavhztR9p//p73JLxsGsslAFP8xppws/9fQCm9vP+r3aNGkoe+Zrp+x5PQRQB1fmPxBqZkEELeam5uHGhr/YJxQ7NnNw5YlrEpJ+xXAFNDbQRA1DTJBr7F+OoQor05Tjq4IJ6r8iKJrRV2zgN40CuAH/K7ftkrAikA9V4BcpkY6Rb9vacRnhDDThd/EfUKiIoSpRzOSL1XgCKKxrBz0S+PqKIfCTtX/KpfrUyMXPXr2TXR6oadv/zetRTx+BCGfsQraQ8FaTWSAJ5EeKkSK+LLo6JxeQThZC0A/tk6EItEhdkn3I9Vr8isxdD5nP9OAzgWpBfJxRFfcceqRmTVYqg+578L/3JVoUIFcP4F9/S1kclkFTcAAAAASUVORK5CYII=" 
    },
    { 
      name: "Orbit", 
      href: "/orbit", 
      icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAC/klEQVR4nO2Z3UsUURjGn/2YPOPM4rrjV7UaWWvhhVCBmEUXEQX1PwRRYDdd1WV3dR/dFHVZd31cRARBUBEFBRaUmmZ+pKXlx662rqtmOTHx7nA6jYvmGeHA/OC5edl9z3l233PmnHeAgICAgIAAOdwA8AjACwDtpG4A/aQxABnSTwD2KpXnvi9qkhunn1O7hx7TPB3dBhARjcwDOAJgD2k3gHpO5ZzWQpmQy9EmYax6AA3cXHgdBHCINAfAEAdwfuUw1GIGQEwM/oJ6TNM/7BKmf0Q1MgASfEADsAD1mABQyQcY7Sqq8Q1ANR8waOGoxijteC4xWjiq8RlALR+IA0hLSh6ORCJZXS+5CGAD/GUIwBY+YNHCkYHzpLX3tbbMGobxCUAr/GOAHp4uVbRwZBAJhUJLA31v7evXLi9ZVmLG0PX7AOogn48AUnxgI4ARScnDmqYtOkYcdXW8stvaTvxgjOUZY+cB6JDHBzrKuCQBDEtKzhhj8wUjBT1/9tA+dvRwrrRUz0Sj4dNeh73/oEc04iyYQcghYZrGrGikoLt3btp1dck5Xde7JJjpFY04C6YPckjG42UzXiY6O17ap04en2eMZaPRcJuEsfoA7OADKXIng1RVZUVWNHH1yiXbshL5WCx2izYXGfSLRnbSJUoGTbXJzdMFA0+fPLD3tjTnTNNwtsr9kMugaKQRQKek5M2p1LZMb89r+9zZM392K03TLvj0cBzy08iBigprrqaqMmea5j3xLCSZYaomlwbaymTQxFhJN11J/eaLaGQrLRzVGBGN1FK9qcZXANvFI4pztleNMaomF+e6OA71mPC6j0xBPSbFXdEEkIN6pMU7e4miXZRpuhS6hAAsQT2+iw06h0Xqb3lRvkLVePRwV6PqIrn/mTCALC2Lvxgt0kmfKtJJ5zW2TFd9pRovknvBY17ZdWhwBKwrUaF+rWVqfpfH+41Gj89ZXK5Svyf/jqvNRaF+08vU/BuPN05dHp9Lc7ny3Djv/TYVEBAQEIC18BvtcU0NFIX/0wAAAABJRU5ErkJggg==" 
    },
    { 
      name: "Profile", 
      href: "/profile", 
      icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADa0lEQVR4nO2Za2gUVxiGH9dxdy5ndjZixRatRSwFQSzaBNEixYqiBRUawURag4WiJTHYG+SHKAiCVLwmWkSjIKgo2qKY9d5sQlI3jU3TuF6TViRt1VZtNZvEWDrl1MmfgmJmdzMj7gMvu7Ccb+bdOd/5vnMGsmTJ4gUvKUqgLCcn8p2h67eCwWDSNEV7JBI+BRQCIXxOSNf1zZqmJQvm53ftrNxi18aO2U3nau1jVQftjRvW2LlvjL8nhNEOvIlPGSx0vXna2291NjZU2z+1Nj9WlTsq7HDYvA/MwGcMEsKIFy0s7Gm7+sMTTfTq60N7bE3TOoAR+AVNC62aPHlisvVK01OZ6NUnHxc/NE0zik8YoqpqR6y6qk8mpBItcVsII+mLpxIIBD6aNXN6sq8mepX/7pxuRQl85rUPLMuKVZSvdWVCavOmL+xIJHLCax8Yhn6rpjrq2siJ41/Zpil+9doHiqL0XEw0uDbyfWONHQqFOp55I4mWuC1jeO0DXddu19eddG1ETktD13/32geRiBWv3F7u2ois8rIn88PUWl60cMEDt0YKC+Z1K4ri/fILjBaGkbxwvsFVohuGLgvicPyAECJaunRJT5+LYf6cLtMwKvARw1VV/Wvf3sqnNrFyRdnfQhhX5XqBz5gmu9mtW9Y/0cD5lrN20fsFXUIYP/uix3oME3Vdv56XN+G+bFvO1p+2ZVvf3FT3X9teUvzhQysc7jBNcw9g4nOCwCLLCtdrmvon8E8wGOy0TLNNC4XWAmO8vsEsWbI8x7wGlADlwBHgDNAIJIA24A/gpvNdqtX5vQbYB2wAPgdmAzleGHgdOAz8AmwDlgJzZVEEcoFxwCjgReezV68CE4ApzonjMkAuyd8AncABZ2zGCQArgRvA4jQffVrAp8BtYDUwkAwWugPOvzc0UxcBXgBiwC5gQLqDy4C7gUPyVJHMowFVTg6llSXAj4BK/2EB15y8SwvDnHnbL0n4P6YCl9OVi+uBdXhHFHgv1SAyH34DXsE7ZgB1qQZ5BziKtwx0lvuRqQT50qncXrMf+CCVAPK8aSzeU+rUFdePNOmTF5eTgG9TqbDypaUfeNlpPl13trJj9QNBoNvtYNmpXsIfDAIeuB08BOgCbBeSuXUnjbrr7HH6Dc3ZIGVCan8ayZKFR/wL2mi+pmPniNsAAAAASUVORK5CYII=" 
    },
  ];

  return (
    <aside className="w-[280px] h-screen sticky top-0 flex flex-col pt-4 pr-6 pb-6 border-r border-border">
      {/* Brand Logo */}
      <div className="px-4 mb-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center font-bold text-primary-foreground">
            In
          </div>
          <span className="text-xl font-bold tracking-tight">Intasela</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors font-medium text-[15px]"
          >
            <div className="w-[22px] h-[22px] flex items-center justify-center">
              {/* Added 'invert' class so black icons turn white in dark mode */}
              <img src={item.icon} alt={item.name} className="w-full h-full object-contain invert" />
            </div>
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Create Button */}
      <button className="w-full bg-primary text-primary-foreground py-3.5 rounded-full font-bold shadow-[0_0_20px_rgba(59,196,146,0.3)] hover:shadow-[0_0_25px_rgba(59,196,146,0.5)] transition-all transform hover:scale-[1.02] mt-auto">
        Create Post
      </button>
    </aside>
  );
}
