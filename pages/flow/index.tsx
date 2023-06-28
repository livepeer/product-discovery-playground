import Layout from "@layouts/main";
import Main from "../main"

const Viewer = () => {
  return <Main networkType="flow"></Main>
}

Viewer.getLayout = (page) => {
  return (
    <Layout networkType="flow">
      {page}
    </Layout>
  )
}

export default Viewer;
