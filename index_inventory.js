const Neos = require('./Neos.js/Neos.js')
const neos = new Neos()

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

var fs = require("fs").promises;

async function SaveDataGlobal(obj) {
  await SaveData(obj, "data/backup_"+global_index.toString());
  global_index += 1;
}

async function SaveData(obj, filename) {
  var json = JSON.stringify(obj);
  await fs.writeFile(filename, json, 'utf8');
}

async function LinkToUserAndPath(recurl) {
  let s = recurl.slice(11);
  let arr = s.split("/");
  // return arr[0], arr[1];
  res = await neos.CloudXInterface.FetchRecord(arr[0], arr[1]);
  res = res.Content
  // console.log(res)
  let ownerId = res.ownerId;
  let dirPath = res.path + "\\" + res.name;
  return [ownerId, dirPath];
}

async function MaybeGetFolderContentsRecursive(ownerId,dirPath) {
    let directory_hash = ownerId+"///"+dirPath;
    if (!visitedDirectories.has(directory_hash)) {
      visitedDirectories.add(directory_hash);
      await GetFolderContentsRecursive(ownerId,dirPath);
    }
}

async function GetFolderContentsRecursive(ownerId, dirPath) {
  await sleep(300);
  console.log(ownerId+"/"+dirPath)
  // if (global_index % 200 == 0)
  //   await SaveDataGlobal(allRecords,"data/backup_"+global_index.toString());
  res = await neos.CloudXInterface.GetRecordsFull(ownerId,tag=null,path=dirPath)

  console.log("Status: ",res.State)
  if (Array.isArray(res.Content)) {
    for(const record of res.Content) {
      // console.log(record.name)
      if (record.recordType == "directory") {
        // allRecords.push(record);
        let dirPathNew = dirPath+"\\"+record.name;
        // let recordId = path+"\\"+record.name;
        await MaybeGetFolderContentsRecursive(record.ownerId,dirPathNew);
      } else if (record.recordType == "object") {
        // allRecords.push(record)
      } else if (record.recordType == "link") {
        allRecords.push(record);
        // console.log("Found recordType of type link");
        values = await LinkToUserAndPath(record.assetUri);
        let ownerIdNew = values[0];
        let dirPathNew = values[1];
        // console.log(record.assetUri);
        // console.log(ownerIdNew,dirPathNew);
        await MaybeGetFolderContentsRecursive(ownerIdNew,dirPathNew);
      } else {
        console.log("Found recordType of type "+record.recordType);
        console.log(record)
      }
    }
  }
  console.log("TOTAL RECORDS: ", allRecords.length)
}
allRecords = []
const visitedDirectories = new Set();
let global_index = 0;

async function IndexInventory () {
  console.log("start");
  data = await fs.readFile("inventory_links.txt");
  let file_list_index = 0;
  for (const line of data.toString().split("\n")) {
    if (line === "") continue;
    console.log(line)
    values = await LinkToUserAndPath(line);
    let ownerId = values[0];
    let dirPath = values[1];
    console.log("Indexing");
    console.log(ownerId, dirPath);
    await MaybeGetFolderContentsRecursive(ownerId,dirPath);
    // await SaveData(allRecords,"data/intermediate_"+file_list_index.toString());
    await SaveData(allRecords,"data/links_intermediate_"+file_list_index.toString());
    file_list_index += 1;
  }
}

IndexInventory();
