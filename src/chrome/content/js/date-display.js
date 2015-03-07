/*global jQuery*/
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
 * @class
 * @summary Updates the given element once per minute with the current date.
 * @author Jacob Stair
 */
var DateDisplay = function DateDisplayObject ($elem) {
    // Private properties
    var self = this,
        days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        months = ['January', 'February', 'March', 'April', 'May', 'June',
                 'July', 'August', 'September', 'October', 'November', 'December'],
        ordinals = ['','st','nd','th','th','th','th','th','th','th','th','th','th','th','th','th','th',
                   'th','th','th','th','st','nd','rd','th','th','th','th','th','th','th','st'],
        intervalObj;

    // Private methods

    /**
     * @summary Updates the displayed date in the element.
     * @retval undefined
     */
    function update() {
        var now = new Date(),
            dateString = '';

        dateString += days[now.getDay()] + ', ';
        dateString += months[now.getMonth()] + ' ';
        dateString += now.getDate() + ordinals[now.getDate()] + ' ';
        dateString += now.getFullYear();

        $elem.text(dateString);
    }//end update()

    /**
     * @summary Sets up the interval to update the displayed date.
     * @retval undefined
     */
    function construct() {
        update();
        intervalObj = setInterval(update, 60 * 1000);
    }//end construct()

    // Run constructor
    construct();
};//end DateDisplay

//end file date-display.js
