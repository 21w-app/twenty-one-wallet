import { BitcoinSymbolIcon } from "@/components/BitcoinSymbolIcon";
import { useTheme } from "@/hooks/useTheme";
import { APP_HEADER_ACTION_ICON_SIZE } from "@/lib/screenHeaderLayout";

type FundingHeaderIconProps = {
  size?: number;
};

export const FundingHeaderIcon = ({
  size = APP_HEADER_ACTION_ICON_SIZE,
}: FundingHeaderIconProps) => {
  const { colors } = useTheme();

  return <BitcoinSymbolIcon color={colors.text} size={size} />;
};
