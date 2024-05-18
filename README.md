# NUS Canvas Files Tools

__Update: As at 18 May 2024, this project has been discontinued.__

__Current Version:  1.1 (Updated 11 Jan 2023)__

LumiNUS used to have a feature that allow us to download files not yet downloaded. This chrome extension add this functionality into Canvas Files.

This chrome extension has been tested on Chrome and Edge browsers.

The basic operation of this extension is as follows:
1. Open the course page
2. Click on the extension icon. A page with a list of files not yet downloaded would be displayed. The list is sorted based on the "updated_at" attribute given by Canvas API. Only the last 100 files are displayed.
*If the file has been updated since last download, it will be displayed.*
3. Click on the download button beside the file you want to download to download it.
4. Your download will then be saved.


*Cavets: Only files that are downloaded by clicking the download button at extension page will be recorded. This record is stored locally on the broswer using localStorage.*

Feel free to add on this project by opening a pull request.

Features:
1. Show all files not yet downloaded.
2. Notifications badges at course page
3. Ability to mark files as downloaded without actually downloading the file.

__DISCLAIMER: USE THIS EXTENSION AT YOUR OWN RISK. DO NOT RUN CODE YOU DO NOT UNDERSTAND__
