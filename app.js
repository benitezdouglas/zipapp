var express = require('express')

const app = express()
const bodyParser = require('body-parser');
const multer = require('multer');

const AdmZip = require("adm-zip");

const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');

var path = require('path');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = 10000;
var router = express.Router();
let files = [];
let file = {};
let componentsFile = {};
let textt = '';

function getChildrenEntries(children) {
  if(!children) return;
  
  children.forEach((child) => {
    if(child.namedChildren.length) {
      getChildrenEntries(child.namedChildren);
    }
    if(
      child.type == 'jsx_opening_element' || 
      child.type == 'jsx_self_closing_element' || 
      child.type == 'import_statement'
    ) {
      textt = child.text;
      if(child.type != 'import_statement') {
        
        textt = child.text.split('.')[0];
        textt = textt.replace(/[^a-zA-Z0-9.]/g, "");
      }
       file.nodes = [
        ...file.nodes, 
        {type: child.type, text: textt}
      ];
    }
  });
}

async function readZipArchive(filepath) {
  try {

    const zip = new AdmZip(filepath);
    const entries = zip.getEntries();

    const parser = new Parser();
    parser.setLanguage(JavaScript);

    let tree;

    entries.forEach(zipEntry => {
      file = {};
      componentsFile = {};
      file.fileName = zipEntry.entryName;
      file.nodes = [];
      file.components = [];
      let extension = path.extname(zipEntry.name);
      if(extension == '.js' || extension == '.ts') {    
        tree = parser.parse(zipEntry.getData().toString("utf8"));
        
        const firstChildren = tree.rootNode.namedChildren;

        getChildrenEntries(firstChildren);

        file.nodes.forEach((nodeComponent) => {
          if (nodeComponent.type != 'import_statement') {
            const component = nodeComponent.text;
            file.nodes.forEach(nodeImport => {
              if(component != "" && nodeImport.type == 'import_statement' && RegExp('\\b'+component+'\\b').test(nodeImport.text)) {
                //replace nodeImport.text to get only text after from
                nodeImport.text = nodeImport.text.split('from')[1];
                if (nodeImport.text) {
                  nodeImport.text = nodeImport.text.replace(/[^a-zA-Z0-9.\/]/g, "");
                } 
                  
                componentsFile = {
                    component: component,
                    import: nodeImport.text
                  };
                  file.components = [
                    ...file.components, 
                    componentsFile
                  ];
                
              }
            }
            )
          }
        });

        if(file.components.length > 0) {
          delete file.nodes;
          files = [...files, file];
        }

        
      }
    });
    return files;
  } catch (e) {
    console.log(`Something went wrong. ${e}`);
    return;
  }
}

//Multer Configuração
var storage = multer.memoryStorage({
    destination: function(req, file, callback) {
       callback(null, '');
    }
 });

 var upload = multer({ storage: storage }).any();

app.use('/enviadas', express.static(__dirname + '/uploads'));
app.use('/api', router);

router.post('/upload', (req, res) => {
    upload(req, res, async(err) => {
        res.json(await readZipArchive(req.files[0].buffer));
    });
    file = {};
    files = [];
});

app.listen(port);

console.log('conectado a porta' + " " + port);