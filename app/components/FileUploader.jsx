"use client";

import React from 'react';
import { Button, Image } from 'antd';
import DropboxChooser from 'react-dropbox-chooser';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100vw',
        textAlign: 'center',
    },
    button: {
        marginTop: '20px',
    }
})

function FileUploader({ selectedFiles, handleSuccess, handleCancel, APP_KEY }) {
    const classes = useStyles();
    return (
        <div className={classes.container}>
            <h1>Upload or Choose Your Files From DropBox</h1>
            <DropboxChooser
                appKey={APP_KEY}
                success={handleSuccess}
                cancel={handleCancel}
                multiselect={true}
                extensions={[]}
            >
                <Button className={classes.button} type='primary'>Choose Files From Dropbox</Button>
            </DropboxChooser>

            {selectedFiles.length > 0 && (
                <ul>
                    <h2>Selected Files:</h2>
                    {selectedFiles.map((file, index) => (
                        <div key={index}>
                            {file.thumbnailLink && (
                                <Image src={file.thumbnailLink} alt="image-missing" />
                            )}
                            {file.name}
                        </div>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default FileUploader;
