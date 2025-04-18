const AdmZip = require("adm-zip");
var path = require('path')

async function readZipArchive(filepath) {
  try {
    const zip = new AdmZip(filepath);

    for (const zipEntry of zip.getEntries()) {
    //   console.log(zipEntry.name);
    let extension = path.extname(zipEntry.name);
    if(extension == '.js' || extension == '.ts') {
        console.log(zipEntry.name);
        console.log(zipEntry.getData().toString("utf8"));
    }
    // console.log(zipEntry.toString());
    }
  } catch (e) {
    console.log(`Something went wrong. ${e}`);
  }
}

readZipArchive("./zipfile.zip");