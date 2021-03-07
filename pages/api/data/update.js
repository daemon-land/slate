import * as Data from "~/node_common/data";
import * as Utilities from "~/node_common/utilities";
import * as LibraryManager from "~/node_common/managers/library";
import * as ViewerManager from "~/node_common/managers/viewer";
import * as SearchManager from "~/node_common/managers/search";

export default async (req, res) => {
  console.log(req.body.data);
  const id = Utilities.getIdFromCookie(req);
  if (!id) {
    return res.status(500).send({ decorator: "SERVER_EDIT_DATA", error: true });
  }

  const user = await Data.getUserById({ id });
  if (!user || user.error) {
    return res.status(403).send({ decorator: "SERVER_EDIT_DATA_USER_NOT_FOUND", error: true });
  }

  let newUserData = LibraryManager.editItem({ user, update: req.body.data });
  let response = await Data.updateUserById({
    id: user.id,
    data: newUserData,
  });
  if (!response || response.error) {
    return res.status(500).send({ decorator: "SERVER_EDIT_DATA_NOT_UPDATED", error: true });
  }

  let slates = await Data.getSlatesByUserId({ userId: id });
  if (!slates || slates.error) {
    return res.status(500).send({ decorator: "SERVER_SLATES_NOT_FOUND", error: true });
  }

  let slatesChanged = false;
  for (let slate of slates) {
    let edited = false;
    let objects = slate.data.objects.map((obj) => {
      if (obj.id === req.body.data.id) {
        edited = true;
        slatesChanged = true;
        obj = { ...obj, ...req.body.data };
      }
      return obj;
    });

    if (edited) {
      await Data.updateSlateById({
        id: slate.id,
        updated_at: new Date(),
        data: {
          ...slate.data,
          objects,
        },
      });
      SearchManager.updateSlate(slate, "EDIT");
    }
  }

  if (slatesChanged) {
    let userSlates = await Data.getSlatesByUserId({ userId: id });
    if (!userSlates || userSlates.error) {
      return res.status(500).send({ decorator: "SERVER_SLATES_NOT_FOUND", error: true });
    }
    ViewerManager.hydratePartialSlates(userSlates, id);
  }

  if (newUserData && newUserData.library) {
    ViewerManager.hydratePartialLibrary(newUserData.library, id);
  }

  return res.status(200).send({
    decorator: "SERVER_EDIT_DATA",
    data: {},
  });
};
