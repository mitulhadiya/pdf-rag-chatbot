import path from "node:path" ; 
import {fileURLToPath} from "node:url" ;

const currentFile = fileURLToPath(import.meta.url) ;
const currentDirectory = path.dirname(currentFile) ; 

const projectRoot = path.resolve(currentDirectory,"../..") ; 
export const ragDirectory = path.join(projectRoot,"rag") ; 

export function getPythonExecutable() {
    const configuredPython = process.env.PYTHON_EXECUTABLE ; 

    if(configuredPython){
        return path.isAbsolute(configuredPython)
            ? configuredPython
            : path.resolve(ragDirectory,configuredPython)
    } 
    return process.platform === "win32"
        ? path.join(ragDirectory,".venv","Scripts","python.exe")
        : "python3" ; 
}