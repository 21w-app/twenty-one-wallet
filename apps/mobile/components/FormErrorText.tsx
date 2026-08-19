import { type StyleProp, type TextStyle } from "react-native";

import { Text } from "@/components/Text";
import { formErrorTextStyles } from "@/lib/formErrorTextStyle";

type FormErrorTextProps = {
  message: string;
  style?: StyleProp<TextStyle>;
};

export const FormErrorText = ({ message, style }: FormErrorTextProps) => {
  return (
    <Text
      style={[formErrorTextStyles.block, formErrorTextStyles.text, style]}
      variant="caption"
    >
      {message}
    </Text>
  );
};
