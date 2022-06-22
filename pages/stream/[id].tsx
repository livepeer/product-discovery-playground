import { useRouter } from "next/router";
import { getLayout } from "@layouts/main";
import { StreamPage } from "@components/StreamPage";

const ViewStream = () => {
  const { query } = useRouter();

  const originalEthAddress = String(query?.id || "");

  return <StreamPage originalEthAddress={originalEthAddress} />;
};

ViewStream.getLayout = getLayout;

export default ViewStream;
