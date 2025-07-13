import express from "express"
import { ObjectId } from "mongodb";
const directoryRouter = express.Router();
import { v4 as uuidv4 } from 'uuid';

async function getFolderInfo(id, files, folders) {
  try {
    let Mainfolders = await folders.find({ parentDir: new ObjectId(id) }).toArray()
    let mainFiles = await folders.findOne({ _id: new ObjectId(id) })
    let secFiles = []
    console.log(Mainfolders)
    console.log(mainFiles)
    if (mainFiles?.content?.files.length != 0) {
      mainFiles = mainFiles?.content?.files
      for (let fileId of mainFiles) {
        let fileinfo = await files.findOne({ _id: fileId })
        secFiles.push(
          {
            name: fileinfo.name,
            type: 'file',
            id: fileinfo._id,
            size: fileinfo.size
          }
        )
      }
    }
    let fol = Mainfolders.map((el) => {
      return {
        name: el.name,
        type: "folder",
        dirID: el._id
      }
    })
    console.log('modified folders', fol)
    return [...fol, ...secFiles]
  }
  catch(error) {
    console.log(error)
  }
}

//create a folder
directoryRouter.post('/create', async (req, res) => {
  try {
    const { parentDirId, foldername } = req.body;
    let db = req.db;
    let folderId = new ObjectId();
    let folders = db.collection("folders")
    let { id: userId} = req.cookies;
    await folders.findOneAndUpdate({ _id: new ObjectId(parentDirId) }, {
      $push: { "content.folders": folderId }
    })
    if (!foldername) {
      throw new Error('Error occured in creating a folder')
    }
    await folders.insertOne({
      _id: folderId,
      name: foldername,
      parentDir: new ObjectId(parentDirId),
      userId: new ObjectId(userId),
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
    let user = await users.findOne({ _id: new ObjectId(userId) })
    if (dirId == 'root') {
      const mainFolder = await  folders.findOne({ _id: user.rootDirId })
      return res.status(200).json({ success: true, message: "Successfully completed request", data: [{ name: mainFolder.name, dirID: mainFolder._id, type: "folder" }] });
    }
    else {
      let data = await getFolderInfo(dirId, files, folders)
      console.log('Data ',data)
      return res.status(200).json({ success: true, message: "Successfully completed request", data });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
});


export default directoryRouter