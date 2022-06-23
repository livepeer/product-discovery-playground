import { VideoOnDemandPage } from "@components/VideoOnDemandPage";
import { getLayout } from "@layouts/main";

const Viewer = () => {
  return <VideoOnDemandPage />
};

Viewer.getLayout = getLayout;

export default Viewer;
