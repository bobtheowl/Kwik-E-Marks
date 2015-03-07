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

// Exception objects

/**
 * @exception InvalidActionException
 * @summary Exception thrown when an invalid event action is requested.
 */
var InvalidActionException = function InvalidActionException(action) {
    this.message = 'The requested action "' + action + '" is invalid.';
    this.name = 'InvalidActionException';
};//end InvalidActionException

/**
 * @exception InvalidCallbackException
 * @summary Exception thrown when an argument is expected to be a function and a non-function is passed.
 */
var InvalidCallbackException = function InvalidCallbackException() {
    this.message = 'The callback sent is not a function.';
    this.name = 'InvalidCallbackException';
};//end InvalidCallbackException

/**
 * @exception InvalidIndexException
 * @summary Exception thrown when an invalid event callback ID is requested.
 */
var InvalidIndexException = function InvalidIndexException(index) {
    this.message = 'The requested index "' + index + '" is invalid.';
    this.name = 'InvalidIndexException';
};//end InvalidIndexException

// Additional functions

/**
 * @summary Generates an RFC4122 Version 4-compliant UUID.
 * @retval string UUID (not surrounded in curly-braces)
 * @see http://stackoverflow.com/a/2117523
 */
function generate_uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}//end generate_uuid()

// Bootstrap Enhanced Table object

/**
 * @class
 * @summary Adds simple row selection and event firing to a standard <table> styled with Bootstrap.
 * @author Jacob Stair
 */
var BsEnhancedTable = function BsEnhancedTableObject(elem) {
    // Private properties
    var self = this,
        $ = jQuery,
        $elem = $(elem),
        $tbody = $elem.find('tbody'),
        activeClass = 'success',
        actions = {
            'click': {},
            'select': {},
            'deselect': {}
        };

    // Private methods

    /**
     * @summary Calls all callback functions stored for the requested event and passes them the given row.
     * @param string action Name of action to fire event callbacks for
     * @param jQuery $row jQuery object containing the row affected by the event
     * @retval undefined
     */
    function fireEvent(action, $row) {
        var callbackId;

        if (typeof actions[action] === 'undefined') {
            throw new InvalidActionException(action);
        }//end if

        for (callbackId in actions[action]) {
            if (actions[action].hasOwnProperty(callbackId)) {
                actions[action][callbackId].apply($row, [$row]);
            }//end if
        }//end for
    }//end fireEvent()

    /**
     * @summary Removes the active class from the given row and fires the 'deselect' event for it.
     * @param jQuery $row jQuery object containing row to deselect
     * @retval undefined
     */
    function doDeselectRow($row) {
        $row.removeClass(activeClass);
        fireEvent('deselect', $row);
    }//end deselectRow()

    /**
     * @summary Deselects any rows marked as active.
     * @description An individual 'deselect' event is fired for each row affected.
     * @retval undefined
     */
    function deselectActiveRows() {
        $tbody.find('tr.' + activeClass).each(function () {
            doDeselectRow($(this));
        });
    }//end deselectActiveRows()

    /**
     * @summary Deselects any active row, then selects the given row and fires a 'select' event for it.
     * @param jQuery $row jQuery object containing row to select
     * @retval undefined
     */
    function doSelectRow($row) {
        deselectActiveRows();
        $row.addClass(activeClass);
        fireEvent('select', $row);
    }//end selectRow()

    /**
     * @summary Ensures no rows are active to begin with and sets up row click events.
     * @retval undefined
     */
    function construct() {
        deselectActiveRows();
        self.refreshEvents();
    }//end construct()

    // Public methods

    /**
     * @summary Clears and recreates row click events.
     * @retval undefined
     */
    this.refreshEvents = function () {
        $tbody.find('tr').each(function () {
            var $this = $(this);
            $this.off('click.bset');
            $this.on('click.bset', function () {
                var $this = $(this);
                fireEvent('click', $this);
                if ($this.hasClass(activeClass)) {
                    deselectActiveRows();
                } else {
                    doSelectRow($this);
                }
            });
        });
    };//end BsEnhancedTableObject.refreshEvents()

    /**
     * @summary Add a callback to the specified action.
     *
     * @param string action Action to add callback to
     * @param function callback Callback to add
     * @retval string Unique ID to added callback. This is used to remove it with .off() later
     * @throws InvalidActionException
     * @throws InvalidCallbackException
     */
    this.on = function (action, callback) {
        var id;

        if (typeof actions[action] === 'undefined') {
            throw new InvalidActionException(action);
        }//end if
        if (typeof callback !== 'function') {
            throw new InvalidCallbackException;
        }//end if

        id = generate_uuid();
        actions[action][id] = callback;

        return id;
    };//end BsEnhancedTableObject.on()

    /**
     * @summary Remove one/all event callback(s) from the specified action
     *
     * @param string action Action to remove event callback(s) from
     * @param string index (optional) Index of callback to remove, or remove all if not specified
     * @retval undefined
     * @throws InvalidActionException
     * @throws InvalidIndexException
     */
    this.off = function (action, index) {
        var prop;
        if (typeof actions[action] === 'undefined') {
            throw new InvalidActionException(action);
        }//end if
        if (typeof index === 'undefined') {
            for (prop in actions[action]) {
                if (actions[action].hasOwnProperty(prop)) {
                    delete actions[action][prop];
                }//end if
            }//end for
        } else {
            if (typeof actions[action][index] === 'undefined') {
                throw new InvalidIndexException(index);
            }//end if
            delete actions[action][index];
        }//end if/else
    };//end BsEnhancedTableObject.off()

    /**
     * @summary Return a jQuery object containing the selected row, or null if no row is selected.
     * @retval mixed jQuery object containing selected row if one is selected, or null otherwise
     */
    this.getSelectedRow = function () {
        var $selected = $tbody.find('tr.' + activeClass);
        return ($selected.length > 0) ? $selected.first() : null;
    };//end BsEnhancedTableObject.getSelectedRow()

    /**
     * @summary Programmatically select a row in the table.
     * @description Take a jQuery object containing the row to select. Will only select the first element
     * stored in the jQuery object, and that element must be a <tr> element in the <tbody> of this table.
     *
     * @param jQuery $row jQuery object containing row to select
     * @retval undefined
     */
    this.selectRow = function ($row) {
        if ($.contains($tbody[0], $row[0]) && $row.is('tr')) {
            doSelectRow($row.first());
        }//end if
    };//end BsEnhancedTableObject.selectRow()

    // Run constructor
    construct();
};//end BsEnhancedTableObject

//end file bs-enhanced-table.js
