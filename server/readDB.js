import { readFile } from "fs/promises";
let folders;
let files;
let users;
try {
  const jsonFolderText = await readFile(new URL("./folderDB.json", import.meta.url), "utf-8");
  const jsonFileText = await readFile(new URL("./filesDB.json", import.meta.url), "utf-8");
  const jsonUsersText = await readFile(new URL("./usersDB.json", import.meta.url), "utf-8");
  folders = JSON.parse(jsonFolderText);
  files = JSON.parse(jsonFileText);
  users = JSON.parse(jsonUsersText);
} catch (err) {
  console.error("Failed to read folderDB.json:", err);
}

export {
    folders,
    files,
    users
}