#!/usr/bin/env node

const fs = require('fs')
const eol = require('eol')

class Obsolete {
    constructor() {
        try {
            this.config = JSON.parse(fs.readFileSync(process.cwd() + '/.obsolete.config.json').toString())
        } catch (e) {
            this.config = JSON.parse(fs.readFileSync(__dirname + '/.obsolete.config.json').toString())
        }
    }

    /**
     * Find all files in the root directory of the project
     * 
     * @param {String} fileList 
     * @param {Array<Object>} files 
     */
    readFile(fileList, files) {
        const fileSystemSrc = fs.readdirSync(fileList)
        fileSystemSrc.filter(() => this.isWhiteListed).forEach((file) => {

            const filePath = fileList + '/' + file
            if (fs.statSync(filePath).isDirectory()) {
                this.readFile(filePath, files);
            } else {
                files.push({
                    filePath: filePath,
                    fileName: file,
                    found: []
                })
            }
        })

        return files
    }

    isWhiteListed(fileToCheck) {
        let notFound = true;
        this.config.whiteList.forEach((file) => {
            if( fileToCheck.indexOf(file) >= 0 ){
                notFound = false;
            }
        })

        return notFound
    } 

    /**
     * Find usages for each file in each file
     * 
     * @param {String} fileName 
     * @param {String} fileList 
     * @param {Object} fileObject 
     */
    calcCoverage(fileName, fileList, fileObject) {
        const fileSystemSrc = fs.readdirSync(fileList)
        fileSystemSrc.filter(() => this.isWhiteListed).forEach((file) => {
            const filePath = fileList + '/' + file
            if (fs.statSync(filePath).isDirectory()) {
                this.calcCoverage(fileName, filePath, fileObject);
            } else {
                const fileToAnalyze = fs.readFileSync(filePath)
                if (fileToAnalyze.toString().indexOf(fileName) > 0) {
                    const lines = eol.split(fileToAnalyze.toString())

                    // find the line in which it was found
                    let lineFound = 0
                    lines.forEach((line, i) => {
                        if (line.indexOf(fileName) > 0) {
                            lineFound = i + 1;
                        }
                    })

                    // persist into an object
                    fileObject.found.push({
                        location: filePath,
                        characterNumber: fileToAnalyze.toString().indexOf(fileName),
                        lineNumber: lineFound
                    })
                }
            }
        })

        return fileObject
    }

    getFiles() {
        const files = this.readFile(process.cwd(), [])
        const fileCoverage = []

        files.forEach((fileObject) => {
            let fileName = this.config.preDelimiter + fileObject.fileName.substring(0, fileObject.fileName.lastIndexOf('.')).replace('_', '') + this.config.postDelimiter;
            const fileExtension = fileObject.fileName.substring(fileObject.fileName.lastIndexOf('.') + 1, fileObject.fileName.length);

            if (this.config.checkFileExtensions.indexOf(fileExtension) < 0) {
                return;
            }

            if (fileName.indexOf('test') >= 0 || fileName.indexOf('spec') >= 0) {
                return;
            }

            if (this.config.whiteListFiles.indexOf(fileObject.fileName.substring(0, fileObject.fileName.lastIndexOf('.')).replace('_', '')) >= 0) {
                return;
            }

            if (this.config.protected.indexOf(fileExtension) >= 0) {
                fileName = this.config.preDelimiter + fileObject.fileName.substring(0, fileObject.fileName.lastIndexOf('.'));
            }

            fileObject = this.calcCoverage(fileName, process.cwd(), fileObject);
            if (this.config.onlyEmpty) {
                if (fileObject.found.length === 0) {
                    fileCoverage.push(fileObject);
                }
            } else {
                fileCoverage.push(fileObject);
            }

            if (fileObject.found.length === 0 && this.config.andDelete) {
                fs.unlinkSync(fileObject.filePath);
            }

            if (this.config.verbose)
                console.log(fileObject.found.length === 0 ? "\x1b[31m" : "\x1b[32m", "Finished checking file: ", fileObject.filePath, "\x1b[0m");
        });

        console.log("\x1b[0m")
        console.log('--------------------------------------------------------------------------------------------------------------')
        console.log("\x1b[1m","\x1b[32m", "Summary: ", "\x1b[0m")
        console.log('--------------------------------------------------------------------------------------------------------------')
        fileCoverage.forEach((file) => {
            console.log("\x1b[4m", "File path: ", "\x1b[0m", file.filePath);
            console.log("\x1b[4m", "File name: ", "\x1b[0m", file.fileName);
            console.log("\x1b[1m", "\x1b[33m", "Found:", "\x1b[0m");
            file.found.forEach(foundElement => {
                console.log("---| File path: ", foundElement.location);
                console.log("---| Character: ", foundElement.characterNumber);
                console.log("---| Line: ", foundElement.lineNumber);
            });
            console.log('--------------------------------------------------------------------------------------------------------------');
        });
    }
}

const obsolete = new Obsolete()
obsolete.getFiles();