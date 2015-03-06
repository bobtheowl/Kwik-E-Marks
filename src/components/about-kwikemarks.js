const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

function AboutKwikEMarks() { }
AboutKwikEMarks.prototype = {
    'classDescription': 'about:kwikemarks',
    'contractID':       '@mozilla.org/network/protocol/about;1?what=kwikemarks',
    'classID':          Components.ID('{78e53d02-2132-4dfb-94ad-17e4d1daaab4}'),
    'QueryInterface':   XPCOMUtils.generateQI([Ci.nsIAboutModule]),
    
    'getURIFlags': function (aURI) {
        return Ci.nsIAboutModule.ALLOW_SCRIPT;
    },
    'newChannel': function (aURI) {
        let ios = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
        let kwikemarks_uri = 'chrome://kwikemarks/content/kwikemarks.html';
        let channel = ios.newChannel(kwikemarks_uri, null, null);
        channel.originalURI = aURI;
        return channel;
    }
};

const NSGetFactory = XPCOMUtils.generateNSGetFactory([AboutKwikEMarks]);
