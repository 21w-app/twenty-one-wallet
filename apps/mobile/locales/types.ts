import type { en } from "@/locales/en";

type StringValues<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends object
      ? StringValues<T[K]>
      : T[K];
};

export type Messages = StringValues<typeof en>;

type DotNestedKeys<T, Prefix extends string = ""> = T extends string
  ? Prefix extends ""
    ? never
    : Prefix
  : {
      [K in keyof T & string]: T[K] extends string
        ? Prefix extends ""
          ? K
          : `${Prefix}.${K}`
        : DotNestedKeys<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>;
    }[keyof T & string];

export type MessageKey = DotNestedKeys<Messages>;
