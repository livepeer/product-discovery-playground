import Layout from "@layouts/main";
import Main from "./main"


const Viewer = () => {
  return <Main networkType="eth"></Main>
}

Viewer.getLayout = (page) => {
  return (
    <Layout networkType="eth">
      {page}
    </Layout>
  )
}

export default Viewer;
