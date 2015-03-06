/**
 * @namespace
 * @summary Contains Kwik-E-Marks toolbar button functionality.
 * @author Jacob Stair
 */
var kwikemarks_extension_functions = kwikemarks_extension_functions || {
    /**
     * @summary Creates a new tab in the browser which loads the Kwik-E-Marks page.
     * @retval undefined
     */
    'open': function () {
        gBrowser.selectedTab = gBrowser.addTab('about:kwikemarks');
    }//end kwikemarks_extension_functions.open()
};//end kwikemarks_extension_functions
