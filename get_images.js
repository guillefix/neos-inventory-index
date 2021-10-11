
const Neos = require('./Neos.js/Neos.js')
const neos = new Neos()

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

var fs = require("fs").promises;
var fs2 = require("fs");

const stream = require('stream');
const { promisify } = require('util');
const got = require('got');
const pipeline = promisify(stream.pipeline);

async function downloadImage(url, name) {
  await pipeline(
    got.stream(url),
    fs2.createWriteStream(name)
  );
}

async function main() {
  let rawdata = await fs.readFile('data/intermediate_159');
  let data = JSON.parse(rawdata);
  // console.log(data[0])
  for(let d of data) {
    if ("thumbnailUri" in d) {
      await sleep(200);
      neosdb = d["thumbnailUri"]
      thing = await neos.NeosDBToHttp(neosdb, 2)
      console.log(thing)
      downloadImage(thing,"thumbnails/"+d["id"]+".webp")
    }
  }
}
main()
