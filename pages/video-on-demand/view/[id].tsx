import { VideoOnDemandPage } from "@components/VideoOnDemandPage";
import { getLayout } from "@layouts/main";
import { useRouter } from "next/router";

const Viewer = () => {
  const { query } = useRouter();

  const ipfsHash = String(query?.id || "");

  return <VideoOnDemandPage originalIpfsHash={ipfsHash} />
};

Viewer.getLayout = getLayout;

export default Viewer;
