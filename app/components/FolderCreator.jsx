"use client";
import React, { useState, useEffect } from "react";
import { List, Button, message, Spin, Modal, Input, Tooltip, Progress, Upload, Checkbox, Row, Flex } from "antd";
import { UploadOutlined, DeleteOutlined, FolderAddOutlined, MoreOutlined, FolderOutlined, FileOutlined, LeftOutlined, DownloadOutlined } from "@ant-design/icons";
import { createUseStyles } from "react-jss";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { NextResponse } from 'next/server';

const useStyles = createUseStyles({
    container: {
        padding: "20px",
        backgroundColor: "#f9f9f9",
        color: "black",
        borderRadius: "8px",
        maxWidth: "800px",
        margin: "auto",
        marginTop: "20px",
        position: "relative",
    },
    listItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px",
        backgroundColor: "#fff",
        borderRadius: "4px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        marginBottom: "8px",
        cursor: "pointer",
        transition: "background-color 0.2s",
        "&:hover": {
            backgroundColor: "#f0f0f0",
        },
    },
    folderIcon: {
        color: "#1890ff",
        marginRight: "8px",
    },
    fileIcon: {
        color: "#a5a5a5",
        marginRight: "8px",
    },
    addButton: {
        marginBottom: "20px",
    },
    backButton: {
        marginBottom: "15px",
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "14px",
    },
    progressBar: {
        marginTop: "10px",
    },
    listItemContent: {
        display: "flex",
        alignItems: "center",
    },
    checkbox: {
        marginRight: "10px",
    },
    selectAll: {
        marginBottom: "20px",
    }
});

function FolderCreator({ ACCESS_TOKEN }) {
    const classes = useStyles();
    const [folders, setFolders] = useState([]);
    const [currentPath, setCurrentPath] = useState('');
    const [pathHistory, setPathHistory] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedItems, setSelectedItems] = useState({});
    const [selectAll, setSelectAll] = useState(false);

    useEffect(() => {
        fetchFolders();
    }, []);

    const fetchFolders = async (path = '') => {
        setUploading(true);
        try {
            const response = await fetch('/api/dropbox/list_folder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path }),
            });

            const result = await response.json();
            if (response.ok) {
                setFolders(result.entries);
                setCurrentPath(path);
            } else {
                throw new Error(result.error || 'Failed to fetch folders');
            }
        } catch (error) {
            console.error('Error fetching folders:', error.message);
            message.error(`Error fetching folders: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleBackClick = () => {
        const previousPath = pathHistory.pop();
        setPathHistory([...pathHistory]);
        fetchFolders(previousPath || '');
    };

    const handleDeleteSelected = async () => {
        const selectedPaths = Object.keys(selectedItems).filter((key) => selectedItems[key]);

        if (selectedPaths.length === 0) {
            message.error("No items selected.");
            return;
        }

        const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedPaths.length} items?`);
        if (!confirmDelete) return;

        try {
            for (const path of selectedPaths) {
                const response = await fetch('/api/dropbox/delete_item', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ path }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error_summary || "Failed to delete item.");
                }
            }

            message.success(`Deleted ${selectedPaths.length} items successfully!`);
            fetchFolders(currentPath);
            setSelectedItems({});
            setSelectAll(false);

        } catch (error) {
            message.error(`Failed to delete items: ${error.message}`);
        }
    };

    const handleUpload = async ({ file, onProgress }) => {
        setUploading(true);
        setUploadProgress(0);

        try {
            if (file.webkitRelativePath) {
                const relativePath = file.webkitRelativePath;
                const folderPath = currentPath ? `${currentPath}/${relativePath}` : `/${relativePath}`;
                await uploadFileToDropbox(file, folderPath, onProgress);
            } else {
                const filePath = currentPath ? `${currentPath}/${file.name}` : `/${file.name}`;
                await uploadFileToDropbox(file, filePath, onProgress);
            }

            message.success(`${file.name} uploaded successfully!`);
        } catch (error) {
            console.error("Upload error:", error.message);
            message.error(`Upload failed: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const uploadFileToDropbox = async (file, filePath, onProgress) => {
        const reader = new FileReader();

        reader.onloadend = async () => {
            const fileContent = reader.result;

            const response = await fetch("/api/dropbox/upload_file", {
                method: "POST",
                headers: {
                    "Content-Type": "application/octet-stream",
                    "Authorization": `Bearer ${ACCESS_TOKEN}`,
                    "Dropbox-API-Arg": JSON.stringify({
                        path: filePath,
                        mode: "add",
                        autorename: true,
                        mute: false,
                    }),
                },
                body: fileContent,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }
            simulateProgress(onProgress);
        };

        reader.onerror = (error) => {
            console.error("Error reading file:", error);
            message.error(`Error uploading ${file.name}`);
        };
        reader.readAsArrayBuffer(file.originFileObj || file);
    };

    const simulateProgress = (onProgress) => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            onProgress({ percent: progress });
            setUploadProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
            }
        }, 200);
    };

    const handleCreateFolder = async () => {
        if (!newFolderName) {
            message.error("Please enter a folder name.");
            return;
        }

        try {
            const folderPath = currentPath ? `${currentPath}/${newFolderName}` : `/${newFolderName}`;
            const response = await fetch('/api/dropbox/create_folder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path: folderPath }),
            });

            if (!response.ok) {
                throw new Error('Failed to create folder');
            }

            message.success(`Folder "${newFolderName}" created successfully!`);
            setNewFolderName('');
            setIsModalVisible(false);
            fetchFolders(currentPath);

        } catch (error) {
            message.error(`Failed to create folder: ${error.message}`);
        }
    };

    const handleItemClick = (item) => {
        if (item[".tag"] === "folder") {
            setPathHistory((prev) => [...prev, currentPath]);
            fetchFolders(item.path_lower);
        }
    };

    const handleSelectionChange = (item) => {
        setSelectedItems((prev) => ({
            ...prev,
            [item.path_lower]: !prev[item.path_lower],
        }));
    };

    const handleSelectAll = () => {
        const allSelected = {};
        if (!selectAll) {
            folders.forEach((item) => {
                allSelected[item.path_lower] = true;
            });
        }
        setSelectedItems(allSelected);
        setSelectAll(!selectAll);
    };

    const handleDownloadSelected = async () => {
        const selectedPaths = Object.keys(selectedItems).filter((key) => selectedItems[key]);

        if (selectedPaths.length === 0) {
            message.error("No items selected.");
            return;
        }

        const zip = new JSZip();

        try {
            for (const path of selectedPaths) {
                const fileName = path.split('/').pop();
                const response = await fetch(`/api/dropbox/download_file?path=${encodeURIComponent(path)}`);

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to download ${fileName}: ${errorText}`);
                }

                const fileBlob = await response.blob();
                zip.file(fileName, fileBlob);
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });

            saveAs(zipBlob, "selected_files.zip");

            message.success(`Downloaded ${selectedPaths.length} items successfully!`);
        } catch (error) {
            message.error(`Failed to download items: ${error.message}`);
        }
    };

    return (
        <div className={classes.container}>
            <h1>Your Dropbox Folders</h1>

            {pathHistory.length > 0 && (
                <div className={classes.backButton} onClick={handleBackClick}>
                    <LeftOutlined style={{ marginRight: "8px" }} />
                    Back
                </div>
            )}
            <Flex>
                <Button type="primary" onClick={() => setIsModalVisible(true)} className={classes.addButton}>
                    Create Folder
                </Button>
                <Upload directory multiple customRequest={handleUpload}>
                    <Button icon={<FolderAddOutlined />}>Upload Folder</Button>
                </Upload>
                <Upload multiple customRequest={handleUpload}>
                    <Button icon={<UploadOutlined />}>Upload Files</Button>
                </Upload>
            </Flex>

            <Button className={classes.selectAll} onClick={handleSelectAll}>
                {selectAll ? "Deselect All" : "Select All"}
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleDeleteSelected}>
                Delete
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadSelected}>
                Download
            </Button>

            {uploading && <Spin size="large" style={{ marginTop: 20 }} />}

            {folders.length > 0 ? (
                <List
                    bordered
                    dataSource={folders}
                    renderItem={(item) => (
                        <List.Item
                            className={classes.listItem}
                            onClick={() => handleItemClick(item)}
                        >
                            <div className={classes.listItemContent}>
                                <Checkbox
                                    className={classes.checkbox}
                                    checked={!!selectedItems[item.path_lower]}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={() => handleSelectionChange(item)}
                                />
                                {item[".tag"] === "folder" ? (
                                    <FolderOutlined className={classes.folderIcon} />
                                ) : (
                                    <FileOutlined className={classes.fileIcon} />
                                )}
                                {item.name}
                            </div>
                        </List.Item>
                    )}
                />
            ) : (
                <p style={{ textAlign: 'center' }}>No folders or files found.</p>
            )}
            <Modal
                title="Create New Folder"
                visible={isModalVisible}
                onOk={handleCreateFolder}
                onCancel={() => setIsModalVisible(false)}
                okText="Create"
                cancelText="Cancel"
            >
                <Input
                    placeholder="Enter folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                />
            </Modal>
            {uploading && (
                <Progress
                    percent={uploadProgress}
                    status={uploadProgress === 100 ? "success" : "active"}
                    className={classes.progressBar}
                />
            )}
        </div>
    );
}

export default FolderCreator;
