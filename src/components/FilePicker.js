import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Unzipper from './Unzipper';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import mimeTypes from './mimeType';

const FilePicker = () => {
  const [zipFile, setZipFile] = useState(null);
  const [destinationFolder, setDestinationFolder] = useState('');
  const [files, setFiles] = useState([]);
  const [processedFiles, setProcessedFiles] = useState([]);
  const [pausedProcessedFiles, setPausedProcessedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pause, setPause] =  useState(false);
  const [filesLength, setFilesLength] = useState(0);
  const [countProgress, setCountProgress] = useState(0);

  const onFilesSelected = (file, destination) => {
    setZipFile(file);
    setDestinationFolder(destination);
  };

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFilesSelected(acceptedFiles[0], destinationFolder);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleDestinationChange = (e) => {
    setDestinationFolder(e.target.value);
  };

  const getFileType = (fileName) => {
    const name = fileName.split('/').pop();
    const index = name.lastIndexOf(".")
    const ext = name.slice(index + 1)
    
    return mimeTypes[ext] || "text/plain"
  }
  const formatName = (fileName) => {
    const name = fileName.split('/').pop();
    const index = name.lastIndexOf(".");
      
    return name.slice(0, index)
  }

  const handleUnzipFiles = useCallback(async(status) => {
    setFiles([]);
    setIsProcessing(true);
    if (!zipFile) return alert('Must select a zip file to extract.');
    try {
      const zip = new JSZip();
      
      const zipFileContents = await zip.loadAsync(zipFile);
      const processed = await Promise.all(
        Object.keys(zipFileContents.files).map(async (fileName) => {
          if (processedFiles.includes(fileName)) return; // Skip already processed files
            
            const file = zipFileContents.files[fileName];
            if (!file.dir) {
              const content = await file.async('blob');
              const newFileName = formatName(file.name);
              const type = getFileType(file.name);
              const newFile = await new Response(content).blob().then((blob) => {

                  return new File([blob], newFileName, { type: blob.type?.length ? blob.type : type  })
              });

              return newFile
            }
            setProcessedFiles(prevFiles => [...prevFiles, fileName]); // Update processed files   
        })
      );
      const filteredFiles =  processed.filter(item => item)
      const filesLength = filteredFiles?.length || 2
      setFilesLength(filesLength)
      setTimeout(() => {
          const paused = localStorage.getItem("pause");
          if (paused && JSON.parse(paused)) return
          setFiles(filteredFiles);
          setIsProcessing(false);
          setProcessedFiles([])
          setPausedProcessedFiles([])
        }, status?.continue ? (filesLength - countProgress) * 100 : filesLength * 100)

    } catch (error) {
      alert('Error unzipping files. Please try only for zip files');
      setIsProcessing(false);
    }
  }, [pause, zipFile, destinationFolder, pausedProcessedFiles]) 

  
  const handlePause = () => {
    // Add pause logic here if needed
    setPause(true)
    localStorage.setItem("pause", "true")
    setPausedProcessedFiles(processedFiles)
  };
  const handleContinue = () => {
    setPause(false);
    localStorage.setItem("pause", "false")
    handleUnzipFiles({continue: true});
  }
  
  const handleDownload = async () => {
    if (files) {
      files.forEach((file, index) => {
        setTimeout(() => saveAs(file, file.name), (index + 1) * 500)  
      })
    } else {
      alert('Please select a file to download.');
    }
  };


  console.log("dsd", files)
  return (
    <div className='wrapper'>
      {!zipFile ? 
        <div {...getRootProps({ className: 'dropzone' })}>
          <input {...getInputProps()} 
          accept="zip,application/octet-stream,application/zip,application/x-zip,application/x-zip-compressed"/>
          <p>Drag 'n' drop a ZIP file here, or click to select a file</p>
        </div>
      :
        <div {...getRootProps({ className: 'dropzone' })}>
          You selected {zipFile.name}
        </div>
      }
      <label htmlFor="destination">Destination Folder:</label>
      <input
        type="text"
        id="destination"
        value={destinationFolder}
        onChange={handleDestinationChange}
      />
      <button onClick={handleUnzipFiles}>Submit</button>
      
      {zipFile && (
        <Unzipper files={files} 
        setFiles={setFiles}  
        isProcessing={isProcessing}
        handlePause={handlePause} 
        handleContinue={handleContinue} 
        handleDownload={handleDownload}
        pause={pause}
        filesLength={filesLength}
        countProgress={countProgress}
        setCount={setCountProgress}
         />
      )}
    </div>
  );
};

export default FilePicker;