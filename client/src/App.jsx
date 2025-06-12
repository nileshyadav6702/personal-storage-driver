"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import {
  Folder,
  FileText,
  Upload,
  Search,
  Plus,
  Download,
  Edit2,
  Trash2,
  Eye,
  MoreVertical,
  FolderPlus,
  AlertCircle,
  X,
  Check,
  LogOut,
  Settings,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function App() {
  const navigate = useNavigate()
  const [currentPath, setCurrentPath] = useState("/")
  const [files, setFiles] = useState([])
  const [expandedFolders, setExpandedFolders] = useState({})
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const fileInputRef = useRef(null)
  const url = "http://3.87.94.244:5000/"

  const [user, setUser] = useState(null)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  // Custom popup states
  const [popup, setPopup] = useState({
    isOpen: false,
    type: null, // 'confirm', 'prompt'
    title: "",
    message: "",
    inputValue: "",
    onConfirm: () => { },
    onCancel: () => { },
    data: null,
  })

  const fetchFiles = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${url}directory`, {
        credentials: "include", // This is essential
      })
      const data = await response.json()
      console.log(data)
      if (!response.ok) {
        setTimeout(() => {
          navigate("/login")
        }, 1000)
      }
      setCurrentPath(data.files[0].dirID)
      setFiles(data.files)
      setError(null)
    } catch (err) {
      setError("Failed to load files. Please try again.")
      console.error("Fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [url])

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetch(`${url}users/profile`, {
        credentials: "include",
      })
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.data)
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err)
    }
  }, [url])

  const handleLogout = () => {
    showConfirmPopup("Are you sure you want to logout?", async () => {
      const response = await fetch(`${url}users/logout`, {
        method: "post",
        credentials: "include",
      })
      const data = response.json()
      console.log(data)
      setUser(null)
      setFiles([])
      window.location.href = "/login"
    })
  }

  useEffect(() => {
    fetchFiles()
    fetchUserProfile()
  }, [fetchFiles, fetchUserProfile])

  const toggleFolder = (folderPath) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }))
  }

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0])
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("No file selected")
      return
    }

    const formData = new FormData()
    formData.append("file", selectedFile)
    formData.append("parentDir", currentPath)
    try {
      const xhr = new XMLHttpRequest()
      xhr.open("POST", `${url}file/upload`, true)
      xhr.responseType = "json"
      xhr.setRequestHeader("parentDir", currentPath)
      xhr.setRequestHeader("size", selectedFile.size)

      xhr.upload.addEventListener("progress", (e) => {
        const percentage = Math.round((e.loaded / e.total) * 100)
        setUploadProgress(percentage)
      })

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          fetchFiles()
          setTimeout(() => {
            setUploadProgress(0)
          }, 1000)
          fetch(`${url}directory`, {
            credentials: "include", // This is essential
          })
            .then((res) => res.json())
            .then((data) => {
              setCurrentPath(data.files[0].dirID)
            })
          setSelectedFile(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
          setError(null)
        } else {
          setError("Upload failed. Please try again.")
        }
      })

      xhr.addEventListener("error", () => {
        setError("Upload failed. Please check your connection.")
        setUploadProgress(0)
      })

      xhr.send(formData)
    } catch (error) {
      setError("Upload failed. Please try again.")
      console.error("Upload error:", error)
    }
  }

  const showConfirmPopup = (message, onConfirm) => {
    setPopup({
      isOpen: true,
      type: "confirm",
      title: "Confirm Action",
      message,
      inputValue: "",
      onConfirm,
      onCancel: () => setPopup((prev) => ({ ...prev, isOpen: false })),
      data: null,
    })
  }

  const showPromptPopup = (title, defaultValue, onConfirm, data = null) => {
    setPopup({
      isOpen: true,
      type: "prompt",
      title,
      message: "",
      inputValue: "",
      onConfirm,
      onCancel: () => setPopup((prev) => ({ ...prev, isOpen: false })),
      data,
    })
  }

  const handleDeleteFile = async (fileId, dirId) => {
    showConfirmPopup("Are you sure you want to delete this item?", async () => {
      try {
        const response = await fetch(`${url}file/delete-file`, {
          method: "DELETE",
          headers: {
            fileId: fileId || "",
            dirId: dirId || "",
          },
        })

        if (response.ok) {
          fetchFiles()
          setError(null)
        } else {
          throw new Error("Delete failed")
        }
      } catch (error) {
        setError("Failed to delete item. Please try again.")
        console.error("Delete error:", error)
      }
    })
  }

  const handleRenameFile = async (filename, fileid, dirid, dirname) => {
    const currentName = filename || dirname

    showPromptPopup(`Rename: ${currentName}`, currentName, (newName) => {
      if (!newName || newName === currentName) return

      let finalName = newName
      if (filename) {
        const splitFormat = filename.split(".")
        if (splitFormat.length > 1) {
          finalName = `${newName}.${splitFormat[splitFormat.length - 1]}`
        }
      }

      const performRename = async () => {
        try {
          const response = await fetch(`${url}file/rename-file`, {
            method: "PUT",
            headers: {
              fileid: fileid || null,
              filename: filename ? finalName : null,
              dirid: dirid || null,
              dirname: dirname ? finalName : null,
            },
          })

          if (response.ok) {
            fetchFiles()
            setError(null)
          } else {
            throw new Error("Rename failed")
          }
        } catch (error) {
          setError("Failed to rename item. Please try again.")
          console.error("Rename error:", error)
        }
      }

      performRename()
    })
  }

  const handleCreateFolder = async (parentDirId) => {
    showPromptPopup("Enter folder name:", "", (folderName) => {
      if (!folderName?.trim()) return

      const createFolder = async () => {
        try {
          const response = await fetch(`${url}directory/create`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              parentDirId: parentDirId,
              foldername: folderName.trim(),
            }),
          })

          if (response.ok) {
            fetchFiles()
            setError(null)
          } else {
            throw new Error("Folder creation failed")
          }
        } catch (error) {
          setError("Failed to create folder. Please try again.")
          console.error("Create folder error:", error)
        }
      }

      createFolder()
    })
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      setSelectedFile(droppedFiles[0])
    }
  }

  const DropdownMenu = ({ options, file }) => {
    const [open, setOpen] = useState(false)
    const menuRef = useRef()

    useEffect(() => {
      const handler = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setOpen(false)
        }
      }
      document.addEventListener("mousedown", handler)
      return () => document.removeEventListener("mousedown", handler)
    }, [])

    return (
      <div className="relative" ref={menuRef}>
        <button
          className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200 opacity-100 hover:scale-105 touch-manipulation"
          onClick={(e) => {
            e.stopPropagation()
            setOpen(!open)
          }}
          aria-label="More options"
        >
          <MoreVertical size={16} className="text-slate-500 hover:text-slate-700" />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 py-2 min-w-48 max-w-xs sm:max-w-none z-50 backdrop-blur-sm">
            {options.map(({ label, onClick, icon: IconComponent, color = "text-slate-700" }, index) => (
              <button
                key={index}
                onClick={() => {
                  onClick()
                  setOpen(false)
                }}
                className={`w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 ${color} transition-all duration-200 hover:translate-x-1 touch-manipulation`}
              >
                {IconComponent && <IconComponent size={16} className="flex-shrink-0" />}
                <span className="font-medium truncate">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    const iconClass = "w-4 h-4 sm:w-5 sm:h-5"

    const iconMap = {
      pdf: <FileText className={`${iconClass} text-red-500`} />,
      doc: <FileText className={`${iconClass} text-blue-600`} />,
      docx: <FileText className={`${iconClass} text-blue-600`} />,
      jpg: <FileText className={`${iconClass} text-emerald-500`} />,
      jpeg: <FileText className={`${iconClass} text-emerald-500`} />,
      png: <FileText className={`${iconClass} text-emerald-500`} />,
      gif: <FileText className={`${iconClass} text-emerald-500`} />,
      mp4: <FileText className={`${iconClass} text-purple-500`} />,
      avi: <FileText className={`${iconClass} text-purple-500`} />,
      mov: <FileText className={`${iconClass} text-purple-500`} />,
    }

    return iconMap[extension] || <FileText className={`${iconClass} text-slate-500`} />
  }

  const filteredFiles = (fileList) => {
    if (!searchTerm) return fileList
    return fileList.filter((file) => file.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  const renderFiles = (files, parentPath = "", depth = 0) => {
    const filtered = filteredFiles(files)

    return (
      <div className={`${depth > 0 ? "ml-3 sm:ml-6 border-l border-slate-200 pl-2 sm:pl-4" : ""}`}>
        {filtered.map((file, index) => {
          const fullPath = parentPath ? `${parentPath}/${file.name}` : file.name
          const isExpanded = expandedFolders[fullPath]

          return (
            <div key={`${fullPath}-${index}`} className="mb-1 sm:mb-2">
              <div
                className={`flex items-center justify-between p-3 sm:p-4 rounded-xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 transition-all duration-300 group border border-transparent hover:border-slate-200 hover:shadow-sm ${file.type === "folder" ? "cursor-pointer" : ""} touch-manipulation`}
              >
                <div
                  className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0"
                  onClick={file.type === "folder" ? () => toggleFolder(fullPath) : undefined}
                >
                  {file.type === "folder" ? (
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex-shrink-0">
                        <Folder
                          className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${isExpanded ? "text-blue-600 rotate-0" : "text-amber-600"}`}
                        />
                      </div>
                      <span className="font-semibold text-sm sm:text-base text-slate-800 truncate group-hover:text-blue-700 transition-colors duration-200">
                        {file.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0">
                        {getFileIcon(file.name)}
                      </div>

                      <a
                        href={`${url}file/${file.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-700 hover:text-blue-600 transition-all duration-200 truncate flex-1 font-medium group-hover:text-blue-700 text-sm sm:text-base"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {file.name}
                      </a>
                      <span className="text-xs sm:text-sm text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-md flex-shrink-0">
                        {file.size}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <DropdownMenu
                    file={file}
                    options={
                      file.type === "file"
                        ? [
                          {
                            label: "Preview",
                            icon: Eye,
                            onClick: () => window.open(`${url}file/${file.id}`, "_blank", "noopener,noreferrer"),
                          },
                          {
                            label: "Download",
                            icon: Download,
                            onClick: () => window.open(`${url}file/${file.id}?download=true`, "_blank"),
                          },
                          {
                            label: "Rename",
                            icon: Edit2,
                            onClick: () => handleRenameFile(file.name, file.id, null, null),
                          },
                          {
                            label: "Delete",
                            icon: Trash2,
                            color: "text-red-600",
                            onClick: () => handleDeleteFile(file.id, null),
                          },
                        ]
                        : [
                          {
                            label: "Rename",
                            icon: Edit2,
                            onClick: () => handleRenameFile(null, null, file.dirID, file.name),
                          },
                          {
                            label: "Add Folder",
                            icon: FolderPlus,
                            onClick: () => handleCreateFolder(file.dirID),
                          },
                          {
                            label: "Upload File",
                            icon: Upload,
                            onClick: () => {
                              fileInputRef.current?.click()
                              setCurrentPath(file.dirID)
                            },
                          },
                          {
                            label: "Delete",
                            icon: Trash2,
                            color: "text-red-600",
                            onClick: () => handleDeleteFile(null, file.dirID),
                          },
                        ]
                    }
                  />
                </div>
              </div>

              {file.type === "folder" && isExpanded && file.children && (
                <div className="mt-2 sm:mt-3 animate-in slide-in-from-top-2 duration-300">
                  {renderFiles(file.children, fullPath, depth + 1)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Custom popup component
  const CustomPopup = () => {
    if (!popup.isOpen) return null

    const handleConfirm = () => {
      if (popup.type === "prompt") {
        popup.onConfirm(popup.inputValue)
      } else {
        popup.onConfirm()
      }
      setPopup((prev) => ({ ...prev, isOpen: false }))
    }

    const handleInputChange = (e) => {
      setPopup((prev) => ({ ...prev, inputValue: e.target.value }))
    }

    useEffect(() => {
      if (popup.isOpen) {
        // Focus the popup container for keyboard navigation
        const popupContainer = document.querySelector('[tabindex="-1"]')
        if (popupContainer && popup.type === "confirm") {
          popupContainer.focus()
        }
      }
    }, [popup.isOpen, popup.type])

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300 p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform animate-in zoom-in-95 duration-300 border border-slate-200"
          onKeyDown={(e) => {
            if (e.key === "Enter" && popup.type === "confirm") {
              e.preventDefault()
              handleConfirm()
            } else if (e.key === "Escape") {
              e.preventDefault()
              popup.onCancel()
            }
          }}
          tabIndex={-1}
        >
          <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">{popup.title}</h3>
          </div>

          <div className="p-4 sm:p-6">
            {popup.message && (
              <p className="text-slate-600 mb-4 leading-relaxed text-sm sm:text-base">{popup.message}</p>
            )}

            {popup.type === "prompt" && (
              <input
                type="text"
                value={popup.inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleConfirm()
                  } else if (e.key === "Escape") {
                    e.preventDefault()
                    popup.onCancel()
                  }
                }}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 text-slate-800 font-medium text-sm sm:text-base"
                autoFocus
                placeholder="Enter value..."
              />
            )}
          </div>

          <div className="flex justify-end gap-2 sm:gap-3 p-4 sm:p-6 bg-slate-50">
            <button
              onClick={popup.onCancel}
              className="px-4 sm:px-6 py-2 sm:py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-all duration-200 font-medium text-sm sm:text-base touch-manipulation"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base touch-manipulation"
            >
              <Check size={14} className="sm:w-4 sm:h-4" />
              {popup.type === "confirm" ? "Confirm" : "Save"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const ProfileDropdown = () => {
    const dropdownRef = useRef()

    useEffect(() => {
      const handler = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowProfileDropdown(false)
        }
      }
      document.addEventListener("mousedown", handler)
      return () => document.removeEventListener("mousedown", handler)
    }, [])

    if (!user) return null

    const getInitials = (name, email) => {
      if (name) {
        return name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      }
      return email ? email[0].toUpperCase() : "U"
    }

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          className="flex items-center gap-2 sm:gap-3 p-2 hover:bg-white/60 rounded-xl transition-all duration-200 border border-transparent hover:border-slate-200 hover:shadow-sm touch-manipulation"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white font-semibold text-xs sm:text-sm">{getInitials(user.name, user.email)}</span>
          </div>
          <div className="text-left hidden lg:block">
            <p className="text-sm font-semibold text-slate-800 truncate max-w-32">
              {user.name || user.email?.split("@")[0] || "User"}
            </p>
            <p className="text-xs text-slate-500">View Profile</p>
          </div>
        </button>

        {showProfileDropdown && (
          <div className="absolute right-0 top-full mt-3 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 w-80 max-w-[calc(100vw-2rem)] z-50 animate-in slide-in-from-top-2 duration-200">
            {/* Profile Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                  <span className="text-white font-bold text-sm sm:text-lg">{getInitials(user.name, user.email)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-base sm:text-lg truncate">{user.name || "User"}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-slate-500">Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  setShowProfileDropdown(false)
                  // Add profile edit functionality here if needed
                }}
                className="w-full px-4 sm:px-6 py-3 text-left hover:bg-slate-50 flex items-center gap-3 sm:gap-4 text-slate-700 transition-all duration-200 group touch-manipulation"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-200 flex-shrink-0">
                  <Settings size={16} className="sm:w-[18px] sm:h-[18px] text-slate-600 group-hover:text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm sm:text-base">Profile Settings</div>
                  <div className="text-xs text-slate-500">Manage your account</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowProfileDropdown(false)
                  handleLogout()
                }}
                className="w-full px-4 sm:px-6 py-3 text-left hover:bg-red-50 flex items-center gap-3 sm:gap-4 text-red-600 transition-all duration-200 group touch-manipulation"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors duration-200 flex-shrink-0">
                  <LogOut size={16} className="sm:w-[18px] sm:h-[18px] text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm sm:text-base">Logout</div>
                  <div className="text-xs text-red-400">Sign out of your account</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0">
                <Folder className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-slate-800 truncate">My Files</h1>
                <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">Manage your documents and folders</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Mobile Search Toggle */}
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="p-2 hover:bg-white/60 rounded-lg transition-all duration-200 sm:hidden touch-manipulation"
              >
                <Search className="w-5 h-5 text-slate-600" />
              </button>

              {/* Desktop Search Bar */}
              <div className="relative hidden sm:block w-64 lg:w-80">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search files and folders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700 shadow-sm"
                />
              </div>

              {/* Profile Dropdown */}
              <ProfileDropdown />
            </div>
          </div>

          {/* Mobile Search Bar */}
          {showMobileSearch && (
            <div className="mt-4 sm:hidden animate-in slide-in-from-top-2 duration-200">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search files and folders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700 shadow-sm"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl flex items-center gap-3 shadow-sm">
            <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg flex-shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            </div>
            <p className="text-red-700 font-medium flex-1 text-sm sm:text-base">{error}</p>
            <button
              onClick={() => setError(null)}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-200 touch-manipulation"
              aria-label="Dismiss error"
            >
              <X size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        )}

        {/* Upload Section */}
        <section
          className={`mb-6 sm:mb-8 p-4 sm:p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ${isDragging
            ? "border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 scale-[1.02] shadow-lg"
            : "border-slate-300 hover:border-slate-400 bg-white/50 backdrop-blur-sm"
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <input
                  type="file"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                  aria-label="Choose file to upload"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                  className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 rounded-xl transition-all duration-200 text-slate-700 font-medium shadow-sm hover:shadow-md text-sm sm:text-base touch-manipulation flex-shrink-0"
                >
                  <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                  Choose File
                </button>
                {selectedFile && (
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 rounded-lg border border-blue-200 min-w-0 flex-1">
                    <FileText size={14} className="sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-blue-700 font-medium truncate">{selectedFile.name}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleUpload}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleUpload()
                  }
                }}
                disabled={!selectedFile || uploadProgress > 0}
                className="flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none font-medium text-sm sm:text-base touch-manipulation"
              >
                <Upload size={16} className="sm:w-[18px] sm:h-[18px]" />
                {uploadProgress > 0 ? "Uploading..." : "Upload File"}
              </button>
            </div>

            {uploadProgress > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                  <span className="font-medium">Uploading file...</span>
                  <span className="font-bold text-blue-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 sm:h-3 overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300 ease-out shadow-sm"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Files Section */}
        <section className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-8">
          {error && error.includes("sign in") ? (
            <div className="text-center py-12 sm:py-16">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                <Folder className="w-8 h-8 sm:w-10 sm:h-10 text-slate-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">Authentication Required</h3>
              <p className="text-slate-600 mb-4 sm:mb-6 text-sm sm:text-base">
                Please sign in to access your files and folders
              </p>
              <a
                href="/login"
                className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm sm:text-base touch-manipulation"
              >
                Sign In to Continue
              </a>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12 sm:py-16">
              <div className="animate-spin w-8 h-8 sm:w-10 sm:h-10 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4 sm:mb-6"></div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-700 mb-2">Loading your files...</h3>
              <p className="text-slate-500 text-sm sm:text-base">Please wait while we fetch your documents</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                <Folder className="w-8 h-8 sm:w-10 sm:h-10 text-slate-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">No files found</h3>
              <p className="text-slate-600 text-sm sm:text-base">
                Upload your first file to get started with organizing your documents
              </p>
            </div>
          ) : (
            <div className="space-y-1">{renderFiles(files)}</div>
          )}
        </section>
      </main>

      {/* Custom Popup */}
      <CustomPopup />
    </div>
  )
}
