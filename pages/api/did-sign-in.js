import * as Environment from "~/node_common/environment";
import * as Utilities from "~/node_common/utilities";
import * as Strings from "~/common/strings";

import JWT from "jsonwebtoken";

export default async (req, res) => {
  if (!Strings.isEmpty(Environment.ALLOWED_HOST) && req.headers.host !== Environment.ALLOWED_HOST) {
    return res.status(403).send({ decorator: "YOU_ARE_NOT_ALLOWED", error: true });
  }

  // NOTE(jim): We DO need to validate here.
  if (Strings.isEmpty(req.body.data.username)) {
    return res.status(500).send({ decorator: "SERVER_SIGN_IN", error: true });
  }

  const user = req.body.data;

  if (Strings.isEmpty(req.body.data.data.did)) {
    return res.status(404).send({ decorator: "SERVER_SIGN_IN_USER_NOT_FOUND", error: true });
  }

  const authorization = Utilities.parseAuthHeader(req.headers.authorization);
  if (authorization && !Strings.isEmpty(authorization.value)) {
    const verfied = JWT.verify(authorization.value, Environment.JWT_SECRET);
    if (user.username === verfied.username) {
      return res.status(200).send({
        message: "You are already authenticated. Welcome back!",
        viewer: user,
      });
    }
  }

  const token = JWT.sign({ id: user.id, username: user.username }, Environment.JWT_SECRET);

  res.status(200).send({ decorator: "SERVER_SIGN_IN", success: true, token });
  if (req.body.data.redirectURL) {
    // Question - when does this occur?
    console.log(req.body.data.redirectURL);
    res.redirect(req.body.data.redirectURL);
  }
};
