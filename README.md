
## Dependencies:

1. Node ^8.0.0

## Installation

1. Install dependencies: `npm install`
2. Create a npm link for the file: `npm link`
3. Checkout the directory: `cd <dirToBeChecked>`
4. Run the command: `clear-app`

### Optional

You can also create a file named `.obsolete.config.js` with personalized params, such as
```json
{
    "checkFileExtensions": ["ts","tsx","js","jsx"], // fileExtensions checked
	"preDelimiter": "/",
	"postDelimiter": "'",
    "protected": ["scss","svg","png"], // protected files that are handled differently
    "whiteList": ["node_modules"], // whiteList folders
    "whiteListFiles": ["index"], //whiteList files
    "onlyEmpty": true, // get only the unused files
	"verbose": true, // list all the files checked
	"andDelete": false // delete unused files
}
```