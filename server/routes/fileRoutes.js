  import fs from "node:fs/promises";
  import { createReadStream, createWriteStream } from "node:fs";
  import express from "express";
  import path from "node:path";
  import mime from "mime-types";
  import { files, folders } from "../readDB.js";
  import { writeFiles, writeFolders } from "../writeDB.js";
  import { v4 as uuidv4 } from 'uuid';
  import multer from "multer";

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './storage')
    },
    filename: async function (req, file, cb) {
      const { parentdir: parentDir, size } = req.headers;
      console.log('Size received:', size); // Add this to debug
      let fileId = uuidv4() + path.extname(file.originalname);

      // Update in-memory structures
      const folder = folders.find(el => el.dirID === parentDir);
      if (!folder) return res.status(404).json({ msg: "Parent folder not found" });

      folder.content.files.push(fileId);

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

      files.push({
        id: fileId,
        name: file.originalname,
        dirId: parentDir,
        size: formattedSize
      });

      await writeFiles(files);
      await writeFolders(folders);
      cb(null, fileId)
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
  async function removeFilesAndDirectoryFromFolder(folderId) {
    try {
      const folderToBeRemoved = folders.find(f => f.dirID === folderId);
      if (!folderToBeRemoved) {
        throw new Error(`Folder not found: ${folderId}`);
      }

      // Delete all files in the folder
      const fileIds = folderToBeRemoved.content?.files || [];
      for (const fileId of fileIds) {
        try {
          await fs.rm(path.join('./storage', fileId), { force: true });
          console.log("Deleted file:", fileId);
        } catch (err) {
          console.error("Failed to delete file:", fileId, err.message);
        }

        const index = files.findIndex(f => f.id === fileId);
        if (index !== -1) files.splice(index, 1);
      }

      // Remove this folder's ID from its parent folder (if not root)
      const parentFolderId = folderToBeRemoved.parentDir !== "null" ? folderToBeRemoved.parentDir : null;
      if (parentFolderId) {
        const parentFolder = folders.find(f => f.dirID === parentFolderId);
        if (parentFolder) {
          parentFolder.content.folders = parentFolder.content.folders.filter(id => id !== folderId);
        }
      }

      // Recursively remove subfolders
      const subFolderIds = folderToBeRemoved.content?.folders || [];
      for (const subFolderId of subFolderIds) {
        await removeFilesAndDirectoryFromFolder(subFolderId);
      }

      // Remove the current folder itself
      const folderIndex = folders.findIndex(f => f.dirID === folderId);
      if (folderIndex !== -1) {
        folders.splice(folderIndex, 1);
        console.log("Deleted folder:", folderId);
      }

      // Save changes to "DB"
      await writeFiles(files);
      await writeFolders(folders);

    } catch (error) {
      console.error("Error deleting folder:", error.message);
    }
  }


  // GET file endpoint
  fileRouter.get('/:filename', async (req, res) => {
    try {
      let { filename } = req.params;
      filename = filename.replaceAll('%20', ' ');
      const filePath = path.resolve('./storage', filename);
      const query = req.query;

      await fs.stat(filePath); // Ensure file exists

      if (query?.download === 'true') {
        const mimeType = mime.lookup(filePath) || 'application/octet-stream';
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);

        const stream = createReadStream(filePath);
        stream.pipe(res);

        stream.on('error', err => {
          console.error('Stream error:', err.message);
          res.status(500).end('Stream failed');
        });
      } else {
        res.sendFile(filePath, (err) => {
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
      const { fileid: fileId, dirid: dirId } = req.headers;
      if(!fileId && !dirId) throw new Error("Name of file or directory in not found!")

      if (fileId && fileId !== 'null') {
        const fileIndex = files.findIndex(f => f.id === fileId);
        if (fileIndex === -1) return res.status(404).json({ msg: "File not found" });

        files.splice(fileIndex, 1);

        folders.forEach(folder => {
          folder.content.files = folder.content.files.filter(f => f !== fileId);
        });

        await fs.rm(path.resolve('./storage', fileId)).catch(err => {
          console.error("File deletion error:", err.message);
        });

        await writeFolders(folders);
        await writeFiles(files);
      }

      if (dirId && dirId !== 'null') {
        await removeFilesAndDirectoryFromFolder(dirId);
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
      // console.log(filename, fileid, dirname, dirid)
      // return
      // if((!filename && !fileid) || (!dirname && !dirid)) throw new Error("Something in missing in the headers!")
      if (filename !== "null" && fileid !== "null") {
        const file = files.find(f => f.id === fileid);
        if (!file) return res.status(404).json({ msg: "File not found" });

        file.name = filename;
        await writeFiles(files);
      }

      if (dirname !== "null" && dirid !== "null") {
        const folder = folders.find(f => f.dirID === dirid);
        if (!folder) return res.status(404).json({ msg: "Folder not found" });

        folder.name = dirname;
        await writeFolders(folders);
      }

      return res.json({ msg: 'Renamed successfully' });
    } catch (error) {
      console.log(error)
      return handleServerError(res, "Error renaming file/folder", error);
    }
  });

  export default fileRouter;
