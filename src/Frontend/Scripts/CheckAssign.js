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
    addfiles(event,fileList);

});




let itemstosave=document.getElementById("itemstosave")

async function addfiles(event,filelist){
    event.preventDefault();
    for(let a=0;a<filelist.length;a++){
        const fileDiv = document.createElement('div');
        fileDiv.className = 'file-card';
        // let formattedSize=formatFileSize(file.size);
        fileDiv.innerHTML+=`
            
                <div class="file-info">
                <span class="file-name">📄 ${filelist[a].name}</span>
                <span class="file-size">${filelist[a].size}</span>
                </div>
            
        `
        // now make form data object which is used for transmit the data inside the files
          

        
        // let hwlll=document.getElementById("hwlll");
        fileDiv.addEventListener('click', () => {
            const fileURL = URL.createObjectURL(filelist[a]);
            window.open(fileURL, '_blank');
        });
        
        itemstosave.appendChild(fileDiv);
        

    }
    
}










async function processEntry(entry, fileList) {
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file((file) => {
        fileList.push(file);
        resolve();
      });
    });
  } else if (entry.isDirectory) {
    const dirReader = entry.createReader();
    const entries = await new Promise((resolve) => dirReader.readEntries(resolve));
    
    for (const childEntry of entries) {
      await processEntry(childEntry, fileList);
    }
  }
}



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


function createChunksLinear(text, wordsPerChunk = 100) {
  const words = text.trim().split(/\s+/);
  const totalWords = words.length;

  if (totalWords === 0 || words[0] === "") return [];

  const chunks = [];
  let chunkIndex = 0;

  for (let i = 0; i < totalWords; i += wordsPerChunk) {
    const chunkWords = words.slice(i, i + wordsPerChunk);
    
    chunks.push({
      chunkIndex: chunkIndex,
      text: chunkWords.join(" "),
      wordCount: chunkWords.length
    });

    chunkIndex++;
  }

  return chunks;

}


// siliding window of size 4
function buildthegrams(chunk, n = 4) {

  const text = typeof chunk === 'string' ? chunk : chunk.text;

  if (!text) return [];

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "") 
    .trim()
    .split(/\s+/);


  const noofgrams = words.length - n + 1;

  if (noofgrams <= 0) return [];

  const grams = [];


  for (let i = 0; i < noofgrams; i++) {
      const gramvalue = words.slice(i, i + n);
      grams.push(gramvalue.join(" "));
  }
  


  return grams;
}



// console.log(fileList);

async function applyalgo(fileList){
    // let response=await fetch(`http://localhost:3000/users?filename:eq=${fileList[]}`);
    // let data=await response.json();
    // if(!data){
    //   alert("server is not responsding error");
    // }
    // console.log(data);
    // console.log(fileList);


    let chunksarr=[];
    for(let i=0;i<fileList.length;i++){
      let response=await fetch(`http://localhost:3000/users/?filename:eq=${fileList[i].name}`);
      let data=await response.json();
      console.log("soham")
      chunksarr[i]=data[0].chunks;
      console.log(data);


    }

          let totalmaxsimlarity=0;
          let firstlength=chunksarr[0].length;
          let secondlength=chunksarr[1].length;
          let count=0;
          for(let i=0;i<firstlength;i++){
              let similarity=0;
              const firstset=new Set(chunksarr[0][i].grams);
              for(let j=0;j<secondlength;j++){
                const secondset=new Set(chunksarr[1][j].grams);
               if (firstset.size === 0 || secondset.size === 0) continue; 

                let intersectioncount=0;
                for(const a of firstset){
                    if(secondset.has(a)){
                      intersectioncount++;
                    }
                }
                count++;

                const unionSize = firstset.size + secondset.size - intersectioncount;
                const similarityvalue = intersectioncount / unionSize;
                // console.log("first set:"+[...firstset])
                // console.log("second set:" +[...secondset]);
                // console.log(similarityvalue);
                similarity=Math.max(similarityvalue,similarity);
              }  
              totalmaxsimlarity+=similarity;
          }
          console.log("final");
          console.log((totalmaxsimlarity/firstlength)*100);
          // console.log(similarity/count);  

    
    // console.log(chunksarr);


    
}





// is id ki is name pa jo last file ha vo dedo this add on the email id

