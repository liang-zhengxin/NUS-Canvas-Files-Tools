/* NUS Canvas Files Tools Chrome Extension
 * background.js - The service worker for the Chrome Extension
 */


chrome.action.onClicked.addListener( tabs => { // When the extension icon is clicked
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => { // Get url of active tab when icon is clicked
        let url = tabs[0].url;
        const regex = /(?<=canvas.nus.edu.sg\/courses\/)\d*/;
        let courseId;

        // Check if it is a canvas course url.
        if ((courseId = url.match(regex)) !== null) { 
            chrome.storage.local.set({"courseId": courseId[0]}, function() { // If yes, set courseId in chrome storage
                console.log('courseId value is set to: ' + courseId[0]);
              });

            // Check if there is a chrome extension tab
            chrome.tabs.query({'url': 'chrome-extension://'+chrome.runtime.id+'/main.html'}, function(tabs) {
                if ( tabs.length > 0 ) { // If yes, reload the tab with current courseId and move to the tab
                    chrome.tabs.reload(tabs[0].id)
                    chrome.tabs.update(tabs[0].id,{'active':true});
                } else { // If no, open a new chrome extension tab
                    chrome.tabs.create({ url: 'main.html'});
                }
            });
        }
        else { // If not canvas course url, ignore.
            console.log('wrong url: '+ url )
        }
    });
  });

chrome.tabs.onUpdated.addListener( function(tabId, changeInfo, tab) {
    if (tab.status == "complete") {
        const regex = /(?<=canvas.nus.edu.sg\/courses\/)\d*/;
        if (tab.url.match("https:\/\/canvas\.nus\.edu\.sg\/courses\/[0-9]+$")) {
            console.log(tab.url)
            
            if ((courseId = tab.url.match(regex)) !== null) { 
                console.log(courseId[0])
                badge(courseId[0])
            };
        };
    }
    else {
        chrome.action.setBadgeText({text: ""})
    };
});



// ----------------------------------------------------------------------
/* NUS Canvas Files Tools Chrome Extension
 * The javascript code driving the badge counter
 */
function badge(cID) {
    var file = new Map(); // Map { fileId (String) : File Object (Map) }
    // Loading this course file database from Chrome local storage
    const ccID = "C" + cID
    chrome.storage.local.get([ccID], result => {
        if (result[ccID] != null) {
            file = new Map(Object.entries(JSON.parse(result[ccID]))) // Parse the JSON String into JSON. Then convert JSON into Map.
            // Convert each JSON String of each File Object into JSON then into Map
            for (const f of file) {
                file.set(f[0],new Map(Object.entries(JSON.parse(f[1]))))
            }
            canvasAPI(file, cID) // Call canvasAPI after the script is initialised.
        }

    })
}

function canvasAPI (file, cID) {
    var myHeaders = new Headers();

    var requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
    };

    // Get files of Course. Last 100 files sorted based on their updated time in descending order.
    fetch("https://canvas.nus.edu.sg/api/v1/courses/"+cID+"/files?per_page=100&sort=updated_at&order=desc", requestOptions)
    .then(response => response.json())
    .then(result => getFile(file, result)) // Call getFile(result) if successful. 
    .catch(error => console.log('error', error));

}


function getFile(file, result) {
    for (const r of result) {
        if (!r.locked_for_user) { // Check if it is available for download
            if (!file.has(r.id.toString())) { // Not in local storage, add into local storage
                const f = new Map();
                f.set("filename", r.filename)
                f.set("display_name", r.display_name)
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
                    f.set("display_name", r.display_name)
                    f.set("id", r.id)
                    f.set("updated_at", r.updated_at)
                    f.set("url", r.url)
                    f.set("uuid", r.uuid)
                    f.set("downloaded",false)
                }
                f.set("display_name", r.display_name) // Temporarily fixed to add file display name into existing file local storage. WILL BE DEPRECIATED IN LATER VERSIONS
            }
        }
    }
    getNotDownloadedCount(file); // Call getNotDownloadedCount() after updating file database in local storage
}

function getNotDownloadedCount(file) {
    let notDownloadedCount = 0 // Counter for number of files not yet downloaded
    const fileArray = Array.from(file.values()) // Convert file Map into an Array

    for (const f of fileArray) {
        if (!f.get('downloaded')) { // Check if it has been downloaded
            notDownloadedCount += 1; // Add count if file is not yet downloaded
        }
    }
    console.log(notDownloadedCount)

    chrome.action.setBadgeText({text: notDownloadedCount.toString()})
}
// ----------------------------------------------------------------------