import { Redirect } from "expo-router";

const LightningWithdrawRedirect = () => {
  return (
    <Redirect
      href={{
        pathname: "/funding/withdraw",
        params: { method: "lightning" },
      }}
    />
  );
};

export default LightningWithdrawRedirect;
