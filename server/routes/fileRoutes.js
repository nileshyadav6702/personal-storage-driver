import fs from "node:fs/promises";
import express from "express";
import path from "node:path";
import { v4 as uuidv4 } from 'uuid';
import multer from "multer";
import { ObjectId } from "mongodb";
import { extension } from "mime-types";

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
      console.log('Size received:', size);
      let fileId = new ObjectId();

      // Validate parentDir exists
      const parentFolder = await folders.findOne({ _id: new ObjectId(parentDir) });
      if (!parentFolder) {
        return cb(new Error("Parent directory not found"));
      }

      // Update in-memory structures
      await folders.updateOne({ _id: new ObjectId(parentDir) }, { $push: { "content.files": fileId } })

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

      console.log('Formatted size:', formattedSize);

      await files.insertOne({
        _id: fileId,
        extension: path.extname(file.originalname),
        name: file.originalname,
        dirId: new ObjectId(parentDir),
        size: formattedSize
      })
      cb(null, fileId.toString() + path.extname(file.originalname)) // Convert ObjectId to string for filename
    }
    catch (error) {
      console.log('Multer filename error:', error)
      cb(error) // Properly handle the error
    }
  }
})

// Add file size and type validation
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: function (req, file, cb) {
    // Add file type validation if needed
    // const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    // if (allowedTypes.includes(file.mimetype)) {
    //   cb(null, true);
    // } else {
    //   cb(new Error('Invalid file type'));
    // }
    cb(null, true); // Accept all files for now
  }
})

const fileRouter = express.Router();

// Utility to log and return server error
function handleServerError(res, message, error) {
  console.error(`${message}:`, error.message || error);
  return res.status(500).json({ msg: message, error: error.message || error });
}

// Recursive folder deletion
async function removeFilesAndDirectoryFromFolder(folderId, files, folders) {
  try {
    const folderToBeRemoved = await folders.findOne({ _id: new ObjectId(folderId) });
    if (!folderToBeRemoved) {
      throw new Error(`Folder not found: ${folderId}`);
    }

    // Delete all files in the folder
    const fileIds = folderToBeRemoved.content?.files || [];
    if (fileIds.length > 0) {
      await files.deleteMany({ _id: { $in: fileIds.map(id => new ObjectId(id)) } })

      // Delete physical files
      for (const fileId of fileIds) {
        try {
          await fs.rm(path.resolve('./storage', fileId.toString()));
        } catch (err) {
          console.error(`Error deleting physical file ${fileId}:`, err.message);
        }
      }
    }

    // Remove this folder's ID from its parent folder (if not root)
    const parentFolderId = folderToBeRemoved.parentDir !== "null" ? folderToBeRemoved.parentDir : null;
    if (parentFolderId) {
      const parentFolder = await folders.findOne({ _id: new ObjectId(parentFolderId) });
      if (parentFolder) {
        await folders.updateOne({ _id: parentFolder._id }, { $pull: { "content.folders": folderToBeRemoved._id } })
      }
    }

    // Recursively remove subfolders
    const subFolderIds = folderToBeRemoved.content?.folders || [];
    for (const subFolderId of subFolderIds) {
      await removeFilesAndDirectoryFromFolder(subFolderId, files, folders);
    }

    // Remove the current folder itself - FIX: use _id instead of dirID
    await folders.deleteOne({ _id: folderToBeRemoved._id })
  } catch (error) {
    console.error("Error deleting folder:", error.message);
    throw error; // Re-throw to handle in calling function
  }
}

fileRouter.param("filename", (req, res, next) => {
  const { filename } = req.params;
  const cleanFilename = filename.split('.')[0];

  // Validate ObjectId format
  if (!ObjectId.isValid(cleanFilename)) {
    return res.status(400).json({ msg: "Invalid file ID format" })
  }

  console.log(req.method, cleanFilename)
  next()
})

// GET file endpoint
fileRouter.get('/:filename', async (req, res) => {
  try {
    let { filename } = req.params;
    let db = req.db;
    let files = db.collection("files")

    const query = req.query;
    
    // FIX: Use _id with ObjectId instead of id
    let file = await files.findOne({ _id: new ObjectId(filename) })
    if (!file) {
      return res.status(404).json({ msg: "File not found in database" });
    }
    filename += file?.extension
    let filePath = path.resolve('./storage', filename);

    console.log(filePath)

    // Check if physical file exists
    try {
      await fs.stat(filePath);
    } catch (statError) {
      return res.status(404).json({ msg: "Physical file not found" });
    }
    
    if (query?.download === 'true') {
      res.download(filePath, file.name)
    } else {
      res.sendFile(filePath);
    }
  } catch (error) {
    return handleServerError(res, "Error retrieving the file", error);
  }
});

// Upload file
fileRouter.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }
    return res.status(200).json({ msg: "File uploaded successfully!", fileId: req.file.filename })
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

    if (!fileId && !dirId) throw new Error("File ID or directory ID is required!")

    if (fileId && fileId !== 'null') {
      // FIX: Convert string to ObjectId
      const fileObjectId = new ObjectId(fileId);
      let file = await files.findOne({ _id: fileObjectId })

      if (!file) {
        return res.status(404).json({ msg: "File not found" });
      }

      await files.deleteOne({ _id: fileObjectId })
      await folders.updateOne({ _id: file.dirId }, {
        $pull: {
          "content.files": fileObjectId
        }
      })

      // Delete physical file
      await fs.rm(path.resolve('./storage', fileId)).catch(err => {
        console.error("File deletion error:", err.message);
      });
    }

    if (dirId && dirId !== 'null') {
      const dirObjectId = new ObjectId(dirId);
      let dir = await folders.findOne({ _id: dirObjectId, userId: new ObjectId(id) })

      if (!dir) {
        return res.status(404).json({ success: false, message: "Directory not found in your folders!" })
      }

      await removeFilesAndDirectoryFromFolder(dirObjectId, files, folders);
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

    if (filename !== "null" && fileid !== "null") {
      // FIX: Convert string to ObjectId
      const result = await files.updateOne({ _id: new ObjectId(fileid) }, {
        $set: {
          name: filename
        }
      })

      if (result.matchedCount === 0) {
        return res.status(404).json({ msg: "File not found" });
      }
    }

    if (dirname !== "null" && dirid !== "null") {
      // FIX: Convert string to ObjectId
      const result = await folders.updateOne({ _id: new ObjectId(dirid) }, {
        $set: {
          name: dirname
        }
      })

      if (result.matchedCount === 0) {
        return res.status(404).json({ msg: "Folder not found" });
      }
    }

    return res.json({ msg: 'Renamed successfully' });
  } catch (error) {
    console.log(error)
    return handleServerError(res, "Error renaming file/folder", error);
  }
});

export default fileRouter;