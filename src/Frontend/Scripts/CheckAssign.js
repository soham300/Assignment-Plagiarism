import {
    addfiles,
    processEntry,
    createChunksLinear,
    buildthegrams,
    applyalgo
} from "../../Backend/CheckBackend";

// const pdfParse = require('pdf-parse');
// const mammoth = require('mammoth');

const dropZone = document.getElementById('drop-zone');

// this the events which is happening on the page basically on the event object so that will not refresh the page so this function is written
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
});

const fileList = [];
dropZone.addEventListener('drop', async function(event) {
 
  event.preventDefault();


  const items = event.dataTransfer.items;
  // give the list of all the items of things which happend or comes on the page like all the files which comes on the page a list of items 
 
 

  for (let i = 0; i < items.length; i++) {
    console.log("soham");   
   
    const entry = items[i].webkitGetAsEntry();
    //  convert that items in the fileformat object
    // console.log(entry);
   

    if (entry) {
      // fileformat goes to the recursion function so that if there is a folder is given convert them into the files and shows
      await processEntry(entry, fileList);
    }
  }
 

//   console.log(fileList);
    addfiles(event,fileList,itemstosave);

});


let itemstosave=document.getElementById("itemstosave")


let submitbutton = document.getElementById("submit-btn");
submitbutton.addEventListener("click", async function extractTextFromFile() {
    for (let i = 0; i < fileList.length; i++) {

        let arrresult=[];
        const file = fileList[i];
        const fileName = file.name.toLowerCase(); // Use .name instead of .originalname
       
        if (fileName.endsWith('.txt')) {
            // Use .text() to read the file content in the browser
            const fileContent = await file.text(); 
            // console.log("Text file content:", fileContent);
            arrresult=createChunksLinear(fileContent);
            for(let x=0;x<arrresult.length;x++){
              let gramsfinal=buildthegrams(arrresult[x]);
              arrresult[x].grams=gramsfinal;
            }
           
            // console.log(gramsfinal);
            // console.log(arrresult);
            // console.log(fileContent.length);
            // console.log(typeof fileContent)

        }

        let obj={
            filename:fileList[i].name,
            filesize:fileList[i].size,
            chunks:arrresult
        }

        await fetch("http://localhost:3000/users",{
            method:"POST",
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify(obj)
        }) 
    }

    console.log("luthra");
    console.log(fileList);
    applyalgo(fileList);

}
);