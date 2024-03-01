import React, { useState, useEffect } from 'react';

const Unzipper = ({ 
  files, 
  setFiles, 
  isProcessing, 
  handleContinue, 
  handlePause,
  pause,
   handleDownload,
   filesLength,
   countProgress,
   setCount
}) => {

  const [renameValue, setRename] = useState({});

  


  const handleCopyFile = async (fileName, index) => {
      let newFiles = [...files]
      newFiles.splice(index, 0, fileName)

      setFiles(newFiles)
  }

    const handleRenameFile = async (originalFile, newFileName, index) => {
      let newFiles = [...files]
      let renameFile = new File([originalFile], newFileName, {
        type: originalFile.type,
        lastModified: originalFile.lastModified,
      });
    
      newFiles.splice(index, 1, renameFile)
      setFiles(newFiles)
    }

    useEffect(() => {
      
      if (isProcessing && filesLength > 0 && !pause) {
        const timer = setInterval(() => setCount(prev => (prev >= filesLength) ? filesLength : prev + 1), 110)

        return () => clearInterval(timer);
      } else if (isProcessing && filesLength > 0 && pause) {
        setCount(prev => prev);
      } else if (!isProcessing) setCount(0)
    }, [isProcessing, filesLength, pause])
  
  return (
    <div>
      <h2>Unzipped Files:</h2>
      {isProcessing && filesLength > 0 && <p>
          Extracting {countProgress} files out of {filesLength}...
      </p>}
      {isProcessing && <p>{pause ? "The extraction is paused. You can resume its extraction": "Processing..."}</p>}
      {files.length > 0 && !pause && <button onClick={handleDownload}>Download Files</button> }
      <ul>
        {files.length > 0 && !pause && files.map((file, index) => {
          return (
          <li key={index}>
            {file.name}
             <button onClick={() => handleCopyFile(file, index)}>Copy</button>
              <input 
                type="text" 
                value={renameValue.index === index ? renameValue.value : ''}
                placeholder="New filename" 
                onChange={e => setRename({index: index, value: e.target.value})} 
              />
              <button onClick={(e) => handleRenameFile(file, renameValue.value, index)}>Rename</button>
            </li>
        )})}
      </ul>
      { isProcessing && (
        <>
          {!pause && <button onClick={handlePause}>PAUSE</button>}
          {pause && <button onClick={handleContinue}>RESUME</button>}
        </>
      )}
       
    </div>
  );
};

export default Unzipper;