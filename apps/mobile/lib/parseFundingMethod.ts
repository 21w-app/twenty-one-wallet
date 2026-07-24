import type { FundingMethod } from "@/components/FundingMethodSegmentControl";

export const parseFundingMethod = (
  value: string | string[] | undefined,
): FundingMethod => {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw === "bitcoin" || raw === "lightning") {
    return raw;
  }

  return "lightning";
};
