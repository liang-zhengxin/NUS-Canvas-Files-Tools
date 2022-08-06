/* NUS Canvas Files Tools Chrome Extension
 * main.js - The javascript file driving main.html
 */

// Global Variables
var cID // Course ID
var file = new Map(); // Map { fileId (String) : File Object (Map) }
var debug = false; // Debugging Flag

chrome.storage.local.get(['courseId'], function(result) { // Async getting of courseId in chrome storage stored by background.js
    if (debug) console.log('courseId is currently ' + result.courseId);
    document.getElementById("course").innerHTML = "Course ID: "+result.courseId; // Show courseId in HTML file
    cID = result.courseId // Set courseId as global variable

    // Loading this course file database from local storage
    if (localStorage.getItem(`${cID}`) != null) {
        if (debug) console.log("Importing data from Local Storage")
        file = new Map(Object.entries(JSON.parse(localStorage.getItem(`${cID}`)))) // Parse the JSON String into JSON. Then convert JSON into Map

        // Convert each JSON String of each File Object into JSON then into Map
        for (const f of file) {
            file.set(f[0],new Map(Object.entries(JSON.parse(f[1]))))
        }
    }
    canvasAPI() // Call canvasAPI after the script is initialised. 
  });


function canvasAPI () {
    var myHeaders = new Headers();

    var requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
    };

    // Get details of Course
    fetch("https://canvas.nus.edu.sg/api/v1/courses/"+cID, requestOptions)
    .then(response => response.json())
    .then(result => {if (debug) console.log(result.name); document.getElementById("courseName").innerHTML = result.name;}) // Show course name in HTML
    .catch(error => console.log('error', error));

    // Get files of Course. Last 100 files sorted based on their updated time in descending order.
    fetch("https://canvas.nus.edu.sg/api/v1/courses/"+cID+"/files?per_page=100&sort=updated_at&order=desc", requestOptions)
    .then(response => response.json())
    .then(result => getFile(result)) // Call getFile(result) if successful. 
    .catch(error => console.log('error', error));

}


function getFile(result) {
    for (const r of result) {
        if (!r.locked_for_user) { // Check if it is available for download
            if (debug) console.log(r.filename)
            if (!file.has(r.id.toString())) { // Not in local storage, add into local storage
                const f = new Map();
                f.set("filename", r.filename)
                f.set("id", r.id)
                f.set("updated_at", r.updated_at)
                f.set("url", r.url)
                f.set("uuid", r.uuid)
                f.set("downloaded",false)
                file.set(r.id.toString(),f)
            }
            else { // In local storage
                const f = file.get(r.id.toString()); // Get data from local storage and compare. Update only if newer file on Canvas
                if ((Date.parse(r.updated_at)-Date.parse(f.get('updated_at')))> 0) {
                    f.set("filename", r.filename)
                    f.set("id", r.id)
                    f.set("updated_at", r.updated_at)
                    f.set("url", r.url)
                    f.set("uuid", r.uuid)
                    f.set("downloaded",false)
                }
            }
        }
    }
    buildTable(); // Call buildTable() after updating file database in local storage
}

function buildTable() {
    let gotFile = false // Flag to show no file to download message
    if (debug) console.log("Start building table")

    const element = document.getElementById("table"); // Get HTML Table Element

    // When stored in local storage, the order of the file object is changed.
    // Hence, the file database is sorted to show the last updated on top.
    if (debug) console.log(file)
    const fileArray = Array.from(file.values())
    fileArray.sort((a,b) => (Date.parse(b.get('updated_at'))-Date.parse(a.get('updated_at'))))
    if (debug) console.log(fileArray)

    for (const f of fileArray) {
        if (!f.get('downloaded')) { // Check if it has been downloaded
            if (debug) console.log(f);
            const d = new Date(Date.parse(f.get("updated_at")))  // Parse the date into UNIX time
            if (debug) console.log(d.toLocaleString());
            const para = document.createElement("li"); // Create A List element
            const node = document.createTextNode("  "+f.get("filename")); // Add the file name into the list
            const time = document.createTextNode(" "+d.toLocaleString()); // Add the updated date into the same row
            const link = document.createElement("a"); // Create a Download button and a onClick eventListener to call download(fileId (String)) when clicked
            link.href = f.get("url");
            link.innerHTML = "Download"
            link.addEventListener('click', function() {download(f.get('id').toString())})
            
            para.appendChild(link);
            para.appendChild(time);
            para.appendChild(node);
            element.appendChild(para); // Add to HTML Table element

            gotFile = true; // Update flag to show got file to download
        }
        
    }

    if (!gotFile) { // Show alert if no file to download
        document.getElementById("alert").innerHTML = "No available files to download "
    }

    // After building the table, save the updated file database into local storage
    let fileString = new Map()
    for (const f of file) { // Converting each file object into JSON string
        fileString.set(f[1].get('id').toString(),JSON.stringify(Object.fromEntries(f[1])))
    }
    localStorage.setItem(cID,JSON.stringify(Object.fromEntries(fileString))) // Converting the Map of file object string into JSON String
    if (debug) console.log(Object.fromEntries(file))
}


function download(fileId) {
    file.get(fileId).set("downloaded",true); // Update the file downloaded flag
    

    let fileString = new Map()
    for (const f of file) {
        fileString.set(f[0],JSON.stringify(Object.fromEntries(f[1])))
    }
    localStorage.setItem(cID,JSON.stringify(Object.fromEntries(fileString)))
    console.log('courseId '+cID+' files data are saved into local storage');

}


document.getElementById("reset").addEventListener('click', function() {reset()}) // Add reset button
function reset() {
    localStorage.clear()
    console.log("Local Storage Cleared")
    location.reload()
}