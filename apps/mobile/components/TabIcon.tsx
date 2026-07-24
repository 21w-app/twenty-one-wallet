import Svg, { Circle, Path, Rect } from "react-native-svg";

type TabIconName =
  | "wallet"
  | "activity"
  | "lightning"
  | "contacts"
  | "settings";

type TabIconProps = {
  color: string;
  focused: boolean;
  name: TabIconName;
  size?: number;
};

const strokeProps = (color: string) => ({
  stroke: color,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 2.1,
});

export const TabIcon = ({ color, focused, name, size = 31 }: TabIconProps) => {
  const softFill = focused ? color : "transparent";

  return (
    <Svg
      accessibilityRole="image"
      fill="none"
      height={size}
      viewBox="0 0 28 28"
      width={size}
    >
      {name === "wallet" ? (
        <>
          <Rect
            fill={softFill}
            fillOpacity={focused ? 0.18 : 0}
            height="15.2"
            rx="4.2"
            width="19"
            x="4.5"
            y="8.2"
            {...strokeProps(color)}
          />
          <Path
            d="M7.2 8.3 16.8 4.8a3 3 0 0 1 3.8 1.8l.6 1.7"
            {...strokeProps(color)}
          />
          <Path
            d="M18.5 13.1h5v5.4h-5a2.7 2.7 0 0 1 0-5.4Z"
            {...strokeProps(color)}
          />
          <Circle cx="18.8" cy="15.8" fill={color} r="0.9" />
        </>
      ) : null}

      {name === "activity" ? (
        <>
          <Circle
            cx="14"
            cy="14"
            fill={softFill}
            fillOpacity={focused ? 0.18 : 0}
            r="9"
            {...strokeProps(color)}
          />
          <Path d="M14 8.6v5.6l4 2.4" {...strokeProps(color)} />
          <Path d="M7.4 7.6a9.4 9.4 0 0 1 13.2 0" {...strokeProps(color)} />
        </>
      ) : null}

      {name === "lightning" ? (
        <>
          <Path
            d="M15.8 3.4 7.2 15h6.2l-1.3 9.6 8.7-12.2h-6Z"
            fill={softFill}
            fillOpacity={focused ? 0.16 : 0}
            {...strokeProps(color)}
          />
        </>
      ) : null}

      {name === "contacts" ? (
        <>
          <Circle
            cx="11.8"
            cy="8.8"
            fill="none"
            r="4.4"
            {...strokeProps(color)}
          />
          <Path
            d="M4.3 23.6v-2.1c0-4.7 3.3-8.4 7.5-8.4s7.5 3.7 7.5 8.4v2.1"
            {...strokeProps(color)}
          />
          <Path d="M18.3 5.1a4.5 4.5 0 0 1 0 7.4" {...strokeProps(color)} />
          <Path
            d="M19.1 13.5c2.8 1.1 4.6 4.2 4.6 8v2.1"
            {...strokeProps(color)}
          />
        </>
      ) : null}

      {name === "settings" ? (
        <>
          <Path d="M5.8 8.2h16.4" {...strokeProps(color)} />
          <Path d="M5.8 14h16.4" {...strokeProps(color)} />
          <Path d="M5.8 19.8h16.4" {...strokeProps(color)} />
          <Circle
            cx="10"
            cy="8.2"
            fill={softFill}
            r="2.6"
            {...strokeProps(color)}
          />
          <Circle
            cx="18.4"
            cy="14"
            fill={softFill}
            r="2.6"
            {...strokeProps(color)}
          />
          <Circle
            cx="12.8"
            cy="19.8"
            fill={softFill}
            r="2.6"
            {...strokeProps(color)}
          />
        </>
      ) : null}
    </Svg>
  );
};
