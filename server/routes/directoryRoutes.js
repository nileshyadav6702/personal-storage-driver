import express from "express"
const directoryRouter = express.Router();
import { v4 as uuidv4 } from 'uuid';

async function getFolderInfo(id, files, folders) {
  let Mainfolders = await  folders.find({ parentDir: id}).toArray()
  let mainFiles =await  folders.findOne({dirID: id })
  if (mainFiles?.content?.files.length == 0) {
    return []
  }
  mainFiles = mainFiles?.content?.files
  let secFiles = []
  for(let fileId of mainFiles) {
    let fileinfo = await files.findOne({ id: fileId })
    secFiles.push(
      {
        name: fileinfo.name,
        type: 'file',
        id: fileinfo.id,
        size: fileinfo.size
      }
    )
  }
  Mainfolders = Mainfolders.map(el => {
    return {
      name: el.name,
      type: "folder",
      dirID: el.dirID
    }
  })
  return [...Mainfolders, ...secFiles]
}

//create a folder
directoryRouter.post('/create', async (req, res) => {
  try {
    const { parentDirId, foldername } = req.body;
    let folderId = uuidv4();
    let db = req.db;
    let folders = db.collection("folders")
    await folders.findOneAndUpdate({ _id: parentDirId }, {
      $push: { "content.folders": folderId }
    })
    if (!foldername) {
      throw new Error('Error occured in creating a folder')
    }
    await folders.insertOne({
      name: foldername,
      dirID: folderId,
      parentDir: parentDirId,
      content: {
        "files": [],
        "folders": []
      }
    })
    return res.status(200).json({ msg: "Folder created successfully" })
  }
  catch (error) {
    console.log(error)
    return res.status(500).json({ msg: "Error occured in creating the folder" })
  }
})

//Reading the files
directoryRouter.get('/:dirId', async (req, res) => {
  try {
    let { dirId } = req.params;
    let { id: userId } = req.cookies;
    let db = req.db;
    let folders = db.collection("folders")
    let files = db.collection("files")
    let users = db.collection("users")
    if (!userId) {
      return res.status(404).json({
        msg: "id not found"
      })
    }
    let user = await users.findOne({ id: userId })
    if (dirId == 'root') {
      const mainFolder = await  folders.findOne({ dirID: user.rootDirId })
      return res.status(200).json({ success: true, message: "Successfully completed request", data: [{ name: mainFolder.name, dirID: mainFolder.dirID, type: "folder" }] });
    }
    else {
      let data = await getFolderInfo(dirId, files, folders)
      return res.status(200).json({ success: true, message: "Successfully completed request", data });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
});


export default directoryRouter