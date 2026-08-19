export async function addfiles(event, filelist, itemstosave){
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


export async function processEntry(entry, fileList) {
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


export function createChunksLinear(text, wordsPerChunk = 100) {
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


export function buildthegrams(chunk, n = 4) {

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

export async function applyalgo(fileList){
    // let response=await fetch(`http://localhost:3000/users?filename:eq=${fileList[0].name}`);
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