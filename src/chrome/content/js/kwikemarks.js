/*global jQuery, BsEnhancedTable, DateDisplay, TimeDisplay, Components*/
'use strict';
Components.utils.import('resource://gre/modules/Services.jsm');

/**
 * @file
 * @author Jacob Stair (jacob.stair@gmail.com)
 * @description
 * ###Version###
 * 1.0.0 - 2015-03-05 - Jacob Stair
 * * Initial version.
 */

/**
 * @namespace
 * @summary Front-end functionality for the Kwik-E-Marks extension.
 * @author Jacob Stair
 */
var kwikemarks = new function ($) {
    // Private properties
    var self = this,
        isInit = false,
        bookmarkHandler,
        preferencesHandler,
        faviconHandler,
        // Directory Table
        directoryTableObj,
        $directoryTable = $('#kwikemarks-directory-table'),
        $searchInput = $('#kwikemarks-directory-search'),
        // Bookmarks panel
        $bookmarksPanel = $('#kwikemarks-bookmarks-panel'),
        $directoryLabel = $('#kwikemarks-displayed-directory'),
        $dateDisplay = $('#kwikemarks-date'),
        $timeDisplay = $('#kwikemarks-time'),
        // Templates
        $tableRowTemplate = $('#kwikemarks-directory-template'),
        $bookmarkTemplate = $('#kwikemarks-bookmark-template');

    // Private methods

    /**
     * @summary Removes all bookmark links from the right bookmark panel.
     * @retval undefined
     */
    function clearDirectoryBookmarks() {
        $bookmarksPanel.find('.kwikemarks-bookmark-container').remove();
    }//end clearDirectoryBookmarks()

    /**
     * @summary Generates a bookmark link and adds it to the right bookmark panel.
     * @description The Favicon service is used to pull the icon for the link. Once the icon data is ready,
     * then the link is added to the panel. If icon data can't be retrieved for the link, a generic icon
     * is used instead.
     *
     * @param object bookmark Object containing bookmark data
     * @retval undefined
     */
    function generateBookmarkElement(bookmark) {
        faviconHandler.getFaviconDataForPage(
            Services.io.newURI(bookmark.href, null, null),
            {'onComplete': function (uri, dataLength, data, mimeType) {
                var imgsrc = 'data:' + mimeType + ';base64, ',
                    imgdata = btoa(String.fromCharCode.apply(null, data)),
                    html = $bookmarkTemplate.html(),
                    $newBookmark;

                imgsrc = (imgdata !== '') ? imgsrc + imgdata : 'chrome://kwikemarks/skin/kwikemarks-icon-16x16.png';
                html = html.replace(new RegExp('{href}', 'g'), bookmark.href);
                html = html.replace(new RegExp('{icon}', 'g'), imgsrc);
                html = html.replace(new RegExp('{name}', 'g'), bookmark.name);

                $bookmarksPanel.append(html);
            }}
        );
    }//end loadBookmarkFavicon()

    /**
     * @summary Loads all bookmarks for the specified directory.
     * @description Updates the panel header with the directory name as well.
     *
     * @param number directoryId ID of directory to pull bookmarks for
     * @param string directoryName Name of directory to display in the header
     * @retval undefined
     */
    function loadDirectoryBookmarks(directoryId, directoryName) {
        var bookmarks = bookmarkHandler.getBookmarksInDirectory(directoryId),
            i = 0,
            length = bookmarks.length,
            bookmark,
            $newBookmark,
            html;

        $directoryLabel.text(directoryName);
        for (i; i < length; i++) {
            generateBookmarkElement(bookmarks[i]);
        }//end for

    }//end loadDirectoryBookmarks()

    /**
     * @summary Clears the existing bookmarks and loads new ones.
     * @description Called when a row in the table is selected. This also stores the directory
     * ID in the preferences so this directory is auto-loaded the next time the page is loaded
     * (as long as a default directory isn't set).
     *
     * @param jQuery $row jQuery object containing the row which was selected
     * @retval undefined
     */
    function handleRowSelect($row) {
        var directoryId = $row.data('directory-id'),
            directoryName = $row.data('directory-name');

        clearDirectoryBookmarks();
        loadDirectoryBookmarks(directoryId, directoryName);
        // Store ID of selected directory so it's selected by default the next time
        // the Kwik-E-Marks page is loaded
        preferencesHandler.setCharPref('lastdir', directoryId);
    }//end handleRowSelect()

    /**
     * @summary Removes all rows from the directory table.
     * @retval undefined
     */
    function clearDirectoryTable() {
        $directoryTable.find('tbody tr').remove();
    }//end clearDirectoryTable()

    /**
     * @summary Adds new table rows to the directories table.
     * @description Recursively calls itself, so child directories can be added as a single-element
     * unordered list. This allows them to be indented and show they are child directories.
     *
     * @param array directoryArray Array of directory objects
     * @param string cellBefore Content to add before the displayed directory name
     * @param string cellAfter Content to add after the displayed directory name
     * @retval undefined
     */
    function addTableRows(directoryArray, cellBefore, cellAfter) {
        var i = 0, length = directoryArray.length, directoryObj, $newRow, html;

        for (i; i < length; i++) {
            directoryObj = directoryArray[i];
            html = $tableRowTemplate.html();
            html = html.replace(new RegExp('{directoryid}', 'g'), directoryObj.id);
            html = html.replace(new RegExp('{directoryname}', 'g'), directoryObj.name);
            html = html.replace(
                new RegExp('{directorydisplayedname}', 'g'),
                cellBefore + directoryObj.name + cellAfter
            );
            $newRow = $(html);
            $directoryTable.find('tbody').append($newRow);
            addTableRows(directoryObj.subdirectories, '<ul><li>' + cellBefore, cellAfter + '</li></ul>');
        }//end for
    }//end addTableRows()

    /**
     * @summary Clears the directories table, repopulates it, and updates the row click events.
     * @retval undefined
     */
    function populateDirectoryTable() {
        var directories = bookmarkHandler.getAllDirectories();
        clearDirectoryTable();
        addTableRows(directories, '', '');
        directoryTableObj.refreshEvents();
    }//end populateDirectoryTable()

    /**
     * @summary Updates the background color if the preference is changed while the page is open.
     * @description Called by an observer on the Firefox preferences service.
     *
     * @param string subject Not used, but included since it's the first argument passed
     * @param string topic Event which triggered the observer
     * @param string data Firefox preference which fired the event
     * @retval undefined
     */
    function handlePreferencesChange(subject, topic, data) {
        if (topic !== 'nsPref:changed') {
            return;
        }//end if
        if (data === 'bgcolor') {
            document.body.style.backgroundColor = preferencesHandler.getCharPref('bgcolor');
        }//end if
    }//end handlePreferencesChange()

    /**
     * @summary Sets up connection to the Firefox preferences service and sets up the observer on it.
     * @retval undefined
     */
    function initPreferencesHandler() {
        var observerObj = {'observe': handlePreferencesChange};
        // Create connection to Firefox preferences and limit usage to Kwik-E-Marks preferences
        preferencesHandler = Components.classes['@mozilla.org/preferences-service;1']
            .getService(Components.interfaces.nsIPrefService)
            .getBranch('extensions.kwikemarks.');
        preferencesHandler.QueryInterface(Components.interfaces.nsIPrefBranch);
        // Register observer for changes to preferences
        preferencesHandler.addObserver('', observerObj, false);
        // Disable preferences observer when the window is closed
        window.addEventListener('unload', function () {
            preferencesHandler.removeObserver('', observerObj);
        }, false);
    }//end initPreferencesHandler()

    /**
     * @summary Sets up connection to the Firefox favicon service.
     * @retval undefined
     */
    function initFaviconHandler() {
        faviconHandler = Components.classes["@mozilla.org/browser/favicon-service;1"]
            .getService(Components.interfaces.nsIFaviconService);
    }//end initFaviconHandler()

    /**
     * @summary Runs a search on the directory table based on the value of the search input element.
     * @description Hides all table rows, then loops through them and un-hides the ones which contain
     * the search string in their name.
     *
     * @retval undefined
     */
    function runTableSearch() {
        var query = $searchInput.val().trim().toLowerCase(),
            $rows = $directoryTable.find('tbody tr');

        if (query !== '') {
            $rows.addClass('hidden');
            $rows.each(function () {
                var $this = $(this),
                    name = $this.data('directory-name').toLowerCase();
                if (name.indexOf(query) !== -1) {
                    $this.removeClass('hidden');
                }//end if
            });
        } else {
            $rows.removeClass('hidden');
        }//end if/else
    }//end runTableSearch()

    /**
     * @summary Initializes table select and input keyup events.
     * @retval undefined
     */
    function initEvents() {
        directoryTableObj.on('select', handleRowSelect);
        $searchInput.on('keyup.kwikemarks', runTableSearch);
    }//end initEvents()

    /**
     * @summary Runs commands as needed for the existing settings stored in the Firefox preferences.
     * @description Sets the background color of the document, and loads either the last-viewed
     * directory or the default directory if a default is set.
     *
     * @retval undefined
     */
    function initDefaultSettings() {
        var bgcolor = preferencesHandler.getCharPref('bgcolor'),
            defaultdir = preferencesHandler.getCharPref('defaultdir').trim(),
            lastdir = preferencesHandler.getCharPref('lastdir').trim(),
            $row;

        // Set default background color
        document.body.style.backgroundColor = bgcolor;
        // Find row containing the default directory to display
        if (defaultdir != '') {
            $row = $directoryTable.find('tr[data-directory-id="' + defaultdir + '"]');
        } else {
            $row = $directoryTable.find('tr[data-directory-id="' + lastdir + '"]');
        }//end if/else
        if ($row.length > 0) {
            directoryTableObj.selectRow($row);
        }//end if
    }//end initDefaultSettings()

    // Public methods

    /**
     * @summary Initializes the Kwik-E-Marks page functionality.
     * @retval undefined
     */
    this.init = function () {
        if (!isInit) {
            initPreferencesHandler();
            initFaviconHandler();
            bookmarkHandler = new BookmarkViewer;
            directoryTableObj = new BsEnhancedTable($directoryTable);
            new DateDisplay($dateDisplay);
            new TimeDisplay($timeDisplay);
            initEvents();
            populateDirectoryTable();
            initDefaultSettings();
            isInit = true;
        }//end if
    };//end kwikemarks.init()
}(jQuery);//end kwikemarks

//end file kwikemarks.js
