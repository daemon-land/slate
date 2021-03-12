import * as React from "react";
import SceneDIDSignin from "~/scenes/SceneDIDSignin";

export const getServerSideProps = async ({ query }) => {
  return {
    props: {
      user: query.user,
      mobile: query.mobile,
      did: query.did,
    },
  };
};

export default class DIDLoginPage extends React.Component {
  render() {
    return <SceneDIDSignin {...this.props} />;
  }
}
