import fs from "node:fs/promises";
import express from "express";
import path from "node:path";
import { v4 as uuidv4 } from 'uuid';
import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './storage')
  },
  filename: async function (req, file, cb) {
    try {
      let db = req.db;
      let files = db.collection("files")
      let folders = db.collection("folders")
      const { parentdir: parentDir, size } = req.headers;
      console.log('Size received:', size); // Add this to debug
      let fileId = uuidv4() + path.extname(file.originalname);

      // Update in-memory structures
      await folders.updateOne({ dirID: parentDir },{$push:{"content.files": fileId}})

      // Assume size is already in bytes (most common case)
      const sizeInBytes = parseInt(size);
      let formattedSize;

      if (sizeInBytes < 1024 * 1024) { // Less than 1 MB
        formattedSize = `${(sizeInBytes / 1024).toFixed(2)}kb`;
      } else if (sizeInBytes < 1024 * 1024 * 1024) { // Less than 1 GB
        formattedSize = `${(sizeInBytes / (1024 * 1024)).toFixed(2)}mb`;
      } else { // 1 GB or more
        formattedSize = `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)}gb`;
      }

      console.log('Formatted size:', formattedSize); // Add this to debug

      await files.insertOne({
        id: fileId,
        name: file.originalname,
        dirId: parentDir,
        size: formattedSize
      })
      cb(null, fileId)
    }
    catch(error) {
      console.log(error)
    }
  }
})

const upload = multer({ storage: storage })

const fileRouter = express.Router();

// Utility to log and return server error
function handleServerError(res, message, error) {
  console.error(`${message}:`, error.message || error);
  return res.status(500).json({ msg: message, error: error.message || error });
}

// Recursive folder deletion
async function removeFilesAndDirectoryFromFolder( folderId, files, folders ) {
  try {
    const folderToBeRemoved =await  folders.findOne({ dirID: folderId });
    if (!folderToBeRemoved) {
      throw new Error(`Folder not found: ${folderId}`);
    }

    // Delete all files in the folder
    const fileIds = folderToBeRemoved.content?.files || [];
    await files.deleteMany({ id:{ $in: fileIds }})

    // Remove this folder's ID from its parent folder (if not root)
    const parentFolderId = folderToBeRemoved.parentDir !== "null" ? folderToBeRemoved.parentDir : null;
    if (parentFolderId) {
      // const parentFolder = folders.find(f => f.dirID === parentFolderId);
      const parentFolder = await  folders.findOne({ dirID: parentFolderId });
      if (parentFolder) {
        await folders.updateOne({ dirID: parentFolder.dirID },{$pull:{"content.folders": folderToBeRemoved.dirID}})
      }
    }

    // Recursively remove subfolders
    const subFolderIds = folderToBeRemoved.content?.folders || [];
    for (const subFolderId of subFolderIds) {
      await removeFilesAndDirectoryFromFolder(subFolderId, files, folders);
    }

    // Remove the current folder itself
    await folders.deleteOne({ dirID: folderToBeRemoved.dirID})
  } catch (error) {
    console.error("Error deleting folder:", error.message);
  }
}


fileRouter.param("filename", (req, res, next) => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let { filename } = req.params;
  filename = filename.split('.')[0]
  if(!uuidPattern.test(filename)) {
    return res.status(401).json({msg:"the id is not valid"})
  }
  console.log(req.method, filename)
  next()
})
// GET file endpoint
fileRouter.get('/:filename', async (req, res) => {
  try {
    let { filename } = req.params;
    let db = req.db;
    let folders = db.collection("folders")
    let files = db.collection("files")
    filename = filename.replaceAll('%20', ' ');
    const filePath = path.resolve('./storage', filename);
    const query = req.query;
    let file = await files.findOne({ id: filename })
    await fs.stat(filePath); // Ensure file exists

    if (query?.download === 'true') {
      return res.download(filePath, file.name ,(err) => {
        res.status(404).end('File not found');
      })
    } else {
      return res.sendFile(filePath, (err) => {
        if (err) {
          console.error('SendFile error:', err.message);
          res.status(404).end('File not found');
        }
      });
    }
  } catch (error) {
    return handleServerError(res, "Error retrieving the file", error);
  }
});
// Upload file
fileRouter.post('/upload' ,upload.single('file'),async (req, res) => {
  try {
    return res.status(200).json({msg: "file uploaded successfully!"})
  } catch (error) {
    return handleServerError(res, "Error uploading file", error);
  }
});

// Delete file/folder
fileRouter.delete('/delete-file', async (req, res) => {
  try {
    let db = req.db;
    let { id } = req.cookies;
    let folders = db.collection("folders")
    let files = db.collection("files")
    const { fileid: fileId, dirid: dirId } = req.headers;
    if(!fileId && !dirId) throw new Error("Name of file or directory in not found!")

    if (fileId && fileId !== 'null') {
      let file = await files.findOne({ id: fileId })
      await files.deleteOne({ id: fileId })
      await folders.updateOne({ dirID: file.dirId }, {
        $pull: {
          "content.files": fileId
        }
      })

      await fs.rm(path.resolve('./storage', fileId)).catch(err => {
        console.error("File deletion error:", err.message);
      });
    }

    if (dirId && dirId !== 'null') {
      let dir = await folders.findOne({ dirId, userId: id })
      if(!dir) {
        return res.status(404).json({success: false, message: "Directory does not found from your folders!"})
      }
      await removeFilesAndDirectoryFromFolder(dirId, files, folders);
    }

    return res.json({ msg: 'File/folder deleted successfully' });
  } catch (error) {
    return handleServerError(res, "Error deleting file/folder", error);
  }
});

// Rename file/folder
fileRouter.put('/rename-file', async (req, res) => {
  try {
    const { filename, fileid, dirname, dirid } = req.headers;
    let db = req.db;
    let folders = db.collection("folders")
    let files = db.collection("files")
    // console.log(filename, fileid, dirname, dirid)
    // return
    // if((!filename && !fileid) || (!dirname && !dirid)) throw new Error("Something in missing in the headers!")
    if (filename !== "null" && fileid !== "null") {
      await files.updateOne({id: fileid }, {
        $set: {
          name: filename
        }
      })
      // const file = files.find(f => f.id === fileid);
      // if (!file) return res.status(404).json({ msg: "File not found" });

      // file.name = filename;
      // await writeFiles(files);
    }

    if (dirname !== "null" && dirid !== "null") {
      await folders.updateOne({ dirID: dirid }, {
        $set: {
          name: dirname
        }
      })
      // const folder = folders.find(f => f.dirID === dirid);
      // if (!folder) return res.status(404).json({ msg: "Folder not found" });

      // folder.name = dirname;
      // await writeFolders(folders);
    }

    return res.json({ msg: 'Renamed successfully' });
  } catch (error) {
    console.log(error)
    return handleServerError(res, "Error renaming file/folder", error);
  }
});

export default fileRouter;
