/*global Components*/
'use strict';

/**
 * @file
 * @author Jacob Stair (jacob.stair@gmail.com)
 * @description
 * ###Version###
 * 1.0.0 - 2015-03-05 - Jacob Stair
 * * Initial version.
 */

/**
 * @summary Object used to access Firefox bookmarks.
 * @namespace
 * @author Jacob Stair
 */
var BookmarkViewer = function BookmarkViewerObject () {
    // Private properties
    var self = this,
        ffPreferences,
        ffBookmarks,
        ffHistory,
        ffFavicon;

    // Private methods

    /**
     * @summary Sets up connections to the Firefox bookmarks and history services.
     * @retval undefined
     */
    function initFirefoxServices() {
        // Setup connection to the Firefox bookmarks service
        ffBookmarks = Components.classes['@mozilla.org/browser/nav-bookmarks-service;1']
            .getService(Components.interfaces.nsINavBookmarksService);
        // Setup connection to the Firefox history service
        ffHistory = Components.classes['@mozilla.org/browser/nav-history-service;1']
            .getService(Components.interfaces.nsINavHistoryService);
    }//end initFirefoxServices()

    /**
     * @summary Builds an array of directory objects.
     * @description Recursively calls itself on any child directories.
     * Returns an object in the following form:
     *
     *     [
     *         {
     *             'id': x,
     *             'name': 'xxxxxx',
     *             'subdirectories': [...]
     *         },
     *         ...
     *     ]
     *
     * @param number parentDirectoryId ID of the parent directory to build the subdirectory array for
     * @retval array
     */
    function buildSubdirectoryArray(parentDirectoryId) {
        var subdirectories = [], query, result, parentNode, i = 0, childNode;

        // Get sub-directories
        query = ffHistory.getNewQuery();
        query.setFolders([parentDirectoryId], 1);
        result = ffHistory.executeQuery(query, ffHistory.getNewQueryOptions());

        // Loop through subdirectories
        parentNode = result.root;
        parentNode.containerOpen = true;
        for (i; i < parentNode.childCount; i++) {
            childNode = parentNode.getChild(i);
            // If the current child is a directory, add it to the array
            if (childNode.type === Components.interfaces.nsINavHistoryResultNode.RESULT_TYPE_FOLDER) {
                subdirectories.push({
                    'id': childNode.itemId,
                    'name': childNode.title,
                    'subdirectories': buildSubdirectoryArray(childNode.itemId)
                });
            }
        }//end for

        return subdirectories;
    }//end buildSubdirectoryArray()

    /**
     * @summary Initializes the Firefox services. Called when the object is created.
     * @retval undefined
     */
    function construct() {
        initFirefoxServices();
    }//end construct()

    // Public methods

    /**
     * @summary Get an array of all directories stored in the Bookmarks Menu.
     * @description Array is returned in the following form:
     *
     *     [
     *         {
     *             'id': (number) Directory ID,
     *             'name': (string) Directory Name,
     *             'subdirectories': (array) Contains objects in the same form as this object
     *         },
     *         ...
     *     ]
     *
     * @retval array Bookmark directories
     * @note This does not include any directories stored in the Bookmarks Toolbar.
     */
    this.getAllDirectories = function () {
        var directories,
            rootId = ffBookmarks.bookmarksMenuFolder;

        directories = buildSubdirectoryArray(rootId);

        // Add loose bookmarks separate so all directories don't have to be nested under 'Bookmarks Menu'
        directories.push({
            'id': rootId,
            'name': 'Bookmarks Menu',
            'subdirectories': []
        });

        return directories;
    };//end BookmarkViewer.getAllDirectories()

    /**
     * @summary Get an array of all bookmarks in the specified directory.
     * @description Returns an array in the following format:
     *
     *     [
     *         {
     *             'href': (string) URL that the bookmark points to,
     *             'name': (string) Displayed title of the bookmark
     *         },
     *         ...
     *     ]
     *
     * @param number directoryId ID of the directory to get bookmarks from
     * @retval array Bookmarks
     * @note This does not pull bookmarks from any subdirectories.
     * @note This also does not pull favicon data. Favicon data has to be pulled from a separate asynchronous service.
     */
    this.getBookmarksInDirectory = function (directoryId) {
        var bookmarks = [],
            query = ffHistory.getNewQuery(),
            result,
            parentNode,
            childNode,
            i = 0;

        // Get children of directory
        query.setFolders([directoryId], 1);
        result = ffHistory.executeQuery(query, ffHistory.getNewQueryOptions());

        // Loop through children
        parentNode = result.root;
        parentNode.containerOpen = true;
        for (i; i < parentNode.childCount; i++) {
            childNode = parentNode.getChild(i);
            // If the current child is a bookmark, add it to the array
            if (childNode.type === Components.interfaces.nsINavHistoryResultNode.RESULT_TYPE_URI) {
                bookmarks.push({
                    'href': childNode.uri,
                    'name': childNode.title
                });
            }//end if
        }//end for

        return bookmarks;
    };//end BookmarkViewer.getBookmarksInDirectory()

    // Run constructor
    construct();
};//end BookmarkViewer

//end file bookmark-viewer.js
