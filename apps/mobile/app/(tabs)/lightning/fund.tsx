import { Redirect } from "expo-router";

const LightningFundRedirect = () => {
  return (
    <Redirect
      href={{
        pathname: "/funding/fund",
        params: { method: "lightning" },
      }}
    />
  );
};

export default LightningFundRedirect;
