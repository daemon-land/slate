import * as React from "react";
import * as Constants from "~/common/constants";
import * as System from "~/components/system";

import { css } from "@emotion/react";

const STYLES_CONTAINER = css`
  padding: 24px;
  border-radius: 4px;
  background-color: ${Constants.system.white};
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  border: 1px solid ${Constants.system.border};
  max-width: 320px;
  width: 100%;
`;

const STYLES_FILE_HIDDEN = css`
  height: 1px;
  width: 1px;
  opacity: 0;
  visibility: hidden;
  position: fixed;
  top: -1px;
  left: -1px;
`;

const STYLES_FOCUS = css`
  font-size: ${Constants.typescale.lvl1};
  font-family: ${Constants.font.medium};
  overflow-wrap: break-word;
  width: 100%;

  strong {
    font-family: ${Constants.font.semiBold};
    font-weight: 400;
  }
`;

const STYLES_SUBTEXT = css`
  margin-top: 8px;
  font-size: 12px;
`;

const STYLES_ITEM = css`
  margin-top: 16px;
`;

export class CreateFilecoinStorageDeal extends React.Component {
  static defaultProps = {
    onSubmit: () => alert("onSubmit"),
  };

  state = { file: null };

  _handleUpload = (e) => {
    e.persist();
    let file = e.target.files[0];

    if (!file) {
      alert("Something went wrong");
      return;
    }

    this.setState({ file });
  };

  _handleSubmit = (e) => {
    this.props.onSubmit({ file });
  };

  render() {
    return (
      <div css={STYLES_CONTAINER}>
        <input
          css={STYLES_FILE_HIDDEN}
          type="file"
          id="file"
          onChange={this._handleUpload}
        />
        {this.state.file ? (
          <div style={{ marginBottom: 24 }}>
            <div css={STYLES_ITEM}>
              <div css={STYLES_FOCUS}>{this.state.file.name}</div>
              <div css={STYLES_SUBTEXT}>Name</div>
            </div>

            <div css={STYLES_ITEM}>
              <div css={STYLES_FOCUS}>{this.state.file.size}</div>
              <div css={STYLES_SUBTEXT}>File size</div>
            </div>
          </div>
        ) : null}
        <System.ButtonSecondaryFull type="label" htmlFor="file">
          Add file
        </System.ButtonSecondaryFull>
        {this.state.file ? (
          <System.ButtonPrimaryFull
            style={{ marginTop: 24 }}
            onClick={this._handleSubmit}
          >
            Make storage deal
          </System.ButtonPrimaryFull>
        ) : null}
      </div>
    );
  }
}
