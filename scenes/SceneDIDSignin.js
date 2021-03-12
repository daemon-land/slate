import * as React from "react";
import Router from "next/router";
import * as NavigationData from "~/common/navigation-data";
import * as Actions from "~/common/actions";
import * as Strings from "~/common/strings";
import * as State from "~/common/state";
import * as Credentials from "~/common/credentials";
import * as Constants from "~/common/constants";
import * as Validations from "~/common/validations";
import * as FileUtilities from "~/common/file-utilities";
import * as Window from "~/common/window";
import * as Store from "~/common/store";
import * as Websockets from "~/common/browser-websockets";
import * as UserBehaviors from "~/common/user-behaviors";
import * as Events from "~/common/custom-events";

import { css } from "@emotion/react";

import { announcements } from "~/components/core/OnboardingModal";
import { GlobalModal } from "~/components/system/components/GlobalModal";
import { DIDSignin } from "~/components/core/DIDSignin";
import WebsitePrototypeWrapper from "~/components/core/WebsitePrototypeWrapper";
import WebsitePrototypeHeader from "~/components/core/WebsitePrototypeHeader";
import WebsitePrototypeFooter from "~/components/core/WebsitePrototypeFooter";

const STYLES_ROOT = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  text-align: center;
  font-size: 1rem;

  min-height: 100vh;
  width: 100vw;
  position: absolute;
  overflow: hidden;
  background-size: cover;
  background-position: 50% 50%:
`;

const STYLES_MIDDLE = css`
  position: relative;
  min-height: 10%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: left;
  padding: 24px;
`;

export default class SceneDIDSignin extends React.Component {
  _handleSetupWebsocket = async () => {
    let wsclient = Websockets.getClient();
    if (wsclient) {
      await Websockets.deleteClient();
      wsclient = null;
    }
    if (this.props.resources && !Strings.isEmpty(this.props.resources.pubsub)) {
      if (!this.state.viewer) {
        console.log("WEBSOCKET: NOT AUTHENTICATED");
        return;
      }

      wsclient = Websockets.init({
        resource: this.props.resources.pubsub,
        viewer: this.state.viewer,
        onUpdate: this._handleUpdateViewer,
        onNewActiveUser: this._handleNewActiveUser,
      });
    }
    if (!wsclient) {
      Events.dispatchMessage({
        message:
          "We cannot connect to our live update server. You may have to refresh to see updates.",
      });
    }
    return;
  };

  _handleCreateUser = async (state) => {
    let response = await Actions.createUser(state);

    if (Events.hasError(response)) {
      return;
    }
    // here we need the USER id to authenticate properly
    return this._handleAuthenticate({ ...state, id: response.user.id }, true, true);
  };

  _handleNavigateTo = (next, data = null, redirect = false) => {
    if (redirect) {
      window.history.replaceState(
        { ...next, data },
        "Slate",
        `/_${next.id ? `?scene=${next.id}` : ""}`
      );
      // HACK because i couldnt figure out how to get the state to update .... eeeeeek
      window.location.reload();
    } else {
      window.history.pushState(
        { ...next, data },
        "Slate",
        `/_${next.id ? `?scene=${next.id}` : ""}`
      );
      window.location.reload();
    }

    if (!this.state.loaded) {
      this.setState({ loaded: true });
    }

    let body = document.documentElement || document.body;
    if (data) {
      this.setState(
        {
          data,
          sidebar: null,
        },
        () => body.scrollTo(0, 0)
      );
    } else {
      this.setState(
        {
          sidebar: null,
        },
        () => body.scrollTo(0, 0)
      );
    }
  };

  _handleAction = (options) => {
    if (options.type === "NAVIGATE") {
      // NOTE(martina): The `scene` property is only necessary when you need to display a component different from the one corresponding to the tab it appears in
      // + e.g. to display <SceneProfile/> while on the Home tab
      // + `scene` should be the decorator of the component you want displayed
      return this._handleNavigateTo(
        {
          ...options,
          id: options.value,
          redirect: null,
        },
        options.data,
        options.redirect
      );
    }
  };

  _handleAuthenticate = async (state, newAccount, isDIDSignIn) => {
    let response = await UserBehaviors.authenticate(state, isDIDSignIn);
    if (!response) {
      return;
    }
    let viewer = await UserBehaviors.hydrate();
    if (!viewer) {
      return viewer;
    }

    this.setState({ viewer });
    await this._handleSetupWebsocket();

    let redirected = this._handleURLRedirect();
    if (!redirected) {
      this._handleAction({ type: "NAVIGATE", value: "NAV_DATA" });
    }
    return response;
  };

  _handleURLRedirect = () => {
    const id = Window.getQueryParameterByName("scene");
    const user = Window.getQueryParameterByName("user");
    const slate = Window.getQueryParameterByName("slate");
    const cid = Window.getQueryParameterByName("cid");

    if (!Strings.isEmpty(id) && this.state.viewer) {
      this._handleNavigateTo({ id, user, slate, cid }, null, true);
      return true;
    }
    if (!this.state.loaded) {
      this.setState({ loaded: true });
    }
    return false;
  };
  render() {
    // bleh, idk about all these other components, but i copied the core application component as close as i thought possible
    return (
      <WebsitePrototypeWrapper>
        <div css={STYLES_ROOT}>
          <WebsitePrototypeHeader style={{ background: `none` }} />
          <div css={STYLES_MIDDLE}>
            <DIDSignin
              onCreateUser={this._handleCreateUser}
              onAuthenticate={this._handleAuthenticate}
              {...this.props}
            />
            <GlobalModal />
          </div>
          <WebsitePrototypeFooter />
        </div>
      </WebsitePrototypeWrapper>
    );
  }
}
