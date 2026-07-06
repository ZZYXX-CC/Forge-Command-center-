Option Explicit
On Error Resume Next

Dim fso
Dim sourceRoot
Dim targets
Dim files
Dim targetIndex
Dim fileIndex
Dim sourcePath
Dim targetRoot
Dim targetPath

Set fso = CreateObject("Scripting.FileSystemObject")

sourceRoot = "C:\Users\umari\.openclaw\antfarm\shared\comm"
targets = Array( _
  "C:\Users\umari\.openclaw\workspaces\dev\comms", _
  "C:\Users\umari\.openclaw\workspaces\design\comms", _
  "C:\Users\umari\.openclaw\workspaces\trading-futures\comms", _
  "C:\Users\umari\.openclaw\workspaces\p2p-marketplace\comms" _
)
files = Array("team-communication-protocol.md", "sync-pattern.md")

For fileIndex = 0 To UBound(files)
  sourcePath = fso.BuildPath(sourceRoot, files(fileIndex))
  If Not fso.FileExists(sourcePath) Then
    Fail "Missing source file: " & sourcePath
  End If
Next

For targetIndex = 0 To UBound(targets)
  targetRoot = targets(targetIndex)
  Err.Clear
  EnsureFolder targetRoot
  If Err.Number <> 0 Then
    Fail "Failed to create folder: " & targetRoot & " | " & Err.Description
  End If

  For fileIndex = 0 To UBound(files)
    sourcePath = fso.BuildPath(sourceRoot, files(fileIndex))
    targetPath = fso.BuildPath(targetRoot, files(fileIndex))
    Err.Clear
    fso.CopyFile sourcePath, targetPath, True
    If Err.Number <> 0 Then
      Fail "Failed to copy " & sourcePath & " -> " & targetPath & " | " & Err.Description
    End If
  Next
Next

WScript.Quit 0

Sub EnsureFolder(path)
  Dim parentPath

  If fso.FolderExists(path) Then
    Exit Sub
  End If

  parentPath = fso.GetParentFolderName(path)
  If Len(parentPath) > 0 And Not fso.FolderExists(parentPath) Then
    EnsureFolder parentPath
  End If

  If Not fso.FolderExists(path) Then
    fso.CreateFolder path
  End If
End Sub

Sub Fail(message)
  Dim logFile
  Dim logPath

  logPath = "C:\Users\umari\.openclaw\logs\sync-comms-hidden.log"
  Set logFile = fso.OpenTextFile(logPath, 8, True)
  logFile.WriteLine Now & " | ERROR | " & message
  logFile.Close

  WScript.Quit 1
End Sub
