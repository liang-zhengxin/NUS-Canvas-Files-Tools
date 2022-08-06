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