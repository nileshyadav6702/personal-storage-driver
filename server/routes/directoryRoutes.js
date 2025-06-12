import express from "express"
const directoryRouter = express.Router();

import { files, folders, users } from "../readDB.js";
import { writeFolders } from "../writeDB.js";
import { v4 as uuidv4 } from 'uuid';

function getFilesRecursive(fileIds = [], folderIds = [], allFiles = [], allFolders = []) {
  const data = [];

  // Map file IDs to actual file objects
  fileIds.forEach(fileId => {
    const file = allFiles.find(f => f.id === fileId);
    if (file) {
      data.push({
        name: file.name,
        size: file.size,
        type: "file",
        id: file.id
      });
    }
  });

  // Map folder IDs to actual folder objects
  folderIds.forEach(folderId => {
    const folder = allFolders.find(f => f.dirID === folderId);
    if (folder) {
      data.push({
        name: folder.name,
        type: "folder",
        dirID: folder.dirID,
        children: getFilesRecursive(
          folder.content?.files || [],
          folder.content?.folders || [],
          allFiles,
          allFolders
        )
      });
    }
  });

  return data;
}


//create a folder
directoryRouter.post('/create', async (req, res) => {
  try {
    const { parentDirId , foldername } = req.body;
    let folderId = uuidv4()
    if (!foldername) {
      throw new Error('Error occured in creating a folder')
    }
    folders.map(el => {
      if (el.dirID == parentDirId) {
        el.content.folders.push(folderId)
      }
      return el
    })
    folders.push({
      name: foldername,
      dirID: folderId,
      parentDir: parentDirId,
      content: {
        "files": [],
        "folders": []
      }
    })
    console.log(folders)
    await writeFolders(folders)
    return res.status(200).json({ msg: "Folder created successfully" })
  }
  catch (error) {
    console.log(error)
    return res.status(500).json({ msg: "Error occured in creating the folder" })
  }
})

//Reading the files
directoryRouter.get('/', async (req, res) => {
  try {
    console.log(req.cookies)
    let {id: userId} = req.cookies;
    if(!userId) {
      return res.status(404).json({
        msg: "id not found"
      })
    }
    let user = users.find(el=>el.id == userId)
    const mainFolder = folders.find(el => el.dirID == user.rootDirId);
    console.log(mainFolder)
    const result = getFilesRecursive(
      mainFolder?.content?.files || [],
      mainFolder?.content?.folders || [],
      files,  // make sure this is available
      folders
    );
    return res.status(200).json({ files: !mainFolder?[]:[
      {name: mainFolder.name,
      type: "folder",
      dirID: mainFolder.dirID,
      children: result}
    ]});
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
});


export default directoryRouter