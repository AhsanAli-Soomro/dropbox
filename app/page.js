"use client";
import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import FolderCreator from './components/FolderCreator';

function Page() {
  const APP_KEY = process.env.NEXT_PUBLIC_DROPBOX_APP_KEY;
  const ACCESS_TOKEN = process.env.NEXT_PUBLIC_DROPBOX_ACCESS_TOKEN;
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleSuccess = (files) => {
    setSelectedFiles(files);
  };

  const handleCancel = () => {
    console.log('File selection canceled.');
  };

  return (
    <div>
      <FileUploader
        selectedFiles={selectedFiles}
        handleSuccess={handleSuccess}
        handleCancel={handleCancel}
        APP_KEY={APP_KEY}
      />
      <FolderCreator ACCESS_TOKEN={ACCESS_TOKEN} />
    </div>
  );
}

export default Page;
