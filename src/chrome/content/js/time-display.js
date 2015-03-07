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
 * @summary Updates the given element once per second with the current time.
 * @author Jacob Stair
 */
var TimeDisplay = function TimeDisplayObject ($elem) {
    // Private properties
    var self = this,
        hours = ['12','01','02','03','04','05','06','07','08','09','10','11',
                '12','01','02','03','04','05','06','07','08','09','10','11'],
        meridiems = ['AM','AM','AM','AM','AM','AM','AM','AM','AM','AM','AM','AM',
                    'PM','PM','PM','PM','PM','PM','PM','PM','PM','PM','PM','PM'],
        intervalObj;

    // Private methods

    /**
     * @summary Updates the displayed time in the element.
     * @retval undefined
     */
    function update() {
        var now = new Date(),
            timeString = '',
            minutes = (now.getMinutes() < 10) ? ('0' + now.getMinutes()) : now.getMinutes(),
            seconds = (now.getSeconds() < 10) ? ('0' + now.getSeconds()) : now.getSeconds();
        
        timeString += hours[now.getHours()] + ':' + minutes + ':' + seconds + ' ' + meridiems[now.getHours()];
        $elem.text(timeString);
    }//end update()

    /**
     * @summary Sets up the interval to update the displayed time.
     * @retval undefined
     */
    function construct() {
        update();
        intervalObj = setInterval(update, 1000);
    }//end construct()

    // Run constructor
    construct();
};//end TimeDisplay

//end file time-display.js
