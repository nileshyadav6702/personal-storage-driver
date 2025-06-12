import { writeFile } from 'fs/promises';

async function writeFolders(data) {
    await writeFile('./folderDB.json', JSON.stringify(data, null, 2), 'utf-8');
    return "folder written successfully"
}
async function writeFiles(data) {
    await writeFile('./filesDB.json', JSON.stringify(data, null, 2), 'utf-8');
    return "folder written successfully"
}

async function writeUsers(data) {
    await writeFile('./usersDB.json', JSON.stringify(data, null, 2), 'utf-8');
    return "folder written successfully"
}
export {
    writeFiles,
    writeFolders,
    writeUsers
}