import * as Environment from "~/node_common/environment";
import * as Data from "~/node_common/data";
import * as Utilities from "~/node_common/utilities";
import * as SlateManager from "~/node_common/managers/slate";
import * as LibraryManager from "~/node_common/managers/library";
import * as Monitor from "~/node_common/monitor";
import * as Validations from "~/common/validations";
import * as Strings from "~/common/strings";

import BCrypt from "bcrypt";

import { PrivateKey } from "@textile/hub";

export default async (req, res) => {
  if (!Strings.isEmpty(Environment.ALLOWED_HOST) && req.headers.host !== Environment.ALLOWED_HOST) {
    return res.status(403).send({ decorator: "YOU_ARE_NOT_ALLOWED", error: true });
  }

  if (Strings.isEmpty(req.body.data.accepted)) {
    return res.status(403).send({ decorator: "YOU_MUST_ACCEPT_TERMS", error: true });
  }

  const existing = await Data.getUserByUsername({
    username: req.body.data.username,
  });

  if (existing) {
    return res.status(403).send({ decorator: "SERVER_EXISTING_USER_ALREADY", error: true });
  }

  if (!Validations.username(req.body.data.username)) {
    return res.status(500).send({ decorator: "SERVER_INVALID_USERNAME", error: true });
  }

  // only check password if DID is absent as well
  if (!Validations.password(req.body.data.password) && Strings.isEmpty(req.body.data.data.did)) {
    return res.status(500).send({ decorator: "SERVER_INVALID_PASSWORD", error: true });
  }

  const rounds = Number(Environment.LOCAL_PASSWORD_ROUNDS);
  const salt = await BCrypt.genSalt(rounds);
  // here we just fake out any potential hackers by always pretending to have a password, even when we dont need one.
  const hash = await Utilities.encryptPassword(req.body.data?.password || salt, salt);

  // TODO(jim):
  // Single Key Textile Auth.
  const identity = await PrivateKey.fromRandom();
  const api = identity.toString();

  // TODO(jim):
  // Don't do this once you refactor.
  const newUsername = req.body.data.username.toLowerCase();

  const { buckets, bucketKey, bucketName } = await Utilities.getBucketAPIFromUserToken({
    user: {
      username: newUsername,
      data: { tokens: { api } },
    },
  });

  if (!buckets) {
    return res.status(500).send({ decorator: "SERVER_BUCKET_INIT_FAILURE", error: true });
  }

  const photo = await SlateManager.getRandomSlateElementURL({
    id: Environment.AVATAR_SLATE_ID,
    fallback:
      "https://slate.textile.io/ipfs/bafkreick3nscgixwfpq736forz7kzxvvhuej6kszevpsgmcubyhsx2pf7i",
  });

  const user = await Data.createUser({
    password: hash,
    salt,
    username: newUsername,
    data: {
      did: req.body.data.data?.did || "",
      photo,
      body: "",
      settings_deals_auto_approve: false,
      allow_filecoin_directory_listing: false,
      allow_automatic_data_storage: true,
      allow_encrypted_data_storage: true,
      tokens: { api },
      library: LibraryManager.init({ bucketName, readableName: "Data" }),
    },
  });

  if (!user) {
    return res.status(404).send({ decorator: "SERVER_USER_CREATE_USER_NOT_FOUND", error: true });
  }

  if (user.error) {
    return res.status(500).send({ decorator: "SERVER_USER_CREATE_USER_NOT_FOUND", error: true });
  }

  Monitor.createUser({
    userId: user.id,
    data: {
      actorUserId: user.id,
      context: {
        username: user.username,
        did: user.data.did,
      },
    },
  });

  return res.status(200).send({
    decorator: "SERVER_USER_CREATE",
    user: { username: user.username, id: user.id, did: user.data.did },
  });
};
