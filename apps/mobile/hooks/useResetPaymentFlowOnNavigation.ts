import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";

type UseResetPaymentFlowOnNavigationOptions = {
  step: string;
  isPaying: boolean;
  onReset: () => void;
};

const isTerminalPaymentFlowStep = (step: string): boolean => {
  return step === "success" || step === "failure";
};

export const useResetPaymentFlowOnNavigation = ({
  step,
  isPaying,
  onReset,
}: UseResetPaymentFlowOnNavigationOptions): void => {
  const stepRef = useRef(step);
  stepRef.current = step;

  const isPayingRef = useRef(isPaying);
  isPayingRef.current = isPaying;

  const onResetRef = useRef(onReset);
  onResetRef.current = onReset;

  useFocusEffect(
    useCallback(() => {
      const resetIfTerminal = () => {
        if (isPayingRef.current) {
          return;
        }

        if (isTerminalPaymentFlowStep(stepRef.current)) {
          onResetRef.current();
        }
      };

      resetIfTerminal();

      return resetIfTerminal;
    }, []),
  );
};
