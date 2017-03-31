/**
 *
 * emoncms adapter - Heikostenverteiler
 * 
 * the adapter creates counter objects for each radiator, which has to be set periodically via vis
 * statistics can be done afterwards
 * 
 */

/* jshint -W097 */// jshint strict:false
/*jslint node: true */
"use strict";

// you have to require the utils module and call adapter function
var utils =   require(__dirname + '/lib/utils'); // Get common adapter utils
var needle = require('needle'); // For sending POST requests to emoncms

// you have to call the adapter function and pass a options object
// name has to be set and has to be equal to adapters folder name and main file name excluding extension
// adapter will be restarted automatically every time as the configuration changed, e.g system.adapter.emoncms.0
var adapter = utils.adapter('emoncms');

// is called when adapter shuts down - callback has to be called under any circumstances!
adapter.on('unload', function (callback) {
    try {
        adapter.log.info('cleaned everything up...');
        callback();
    } catch (e) {
        callback();
    }
});

// is called if a subscribed object changes
adapter.on('objectChange', function (id, obj) {
    // Warning, obj can be null if it was deleted
    adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
});

function getConfigObjects(Obj, where, what){
    var foundObjects = [];
    for (var prop in Obj){
        if (Obj[prop][where] == what){
            foundObjects.push(Obj[prop]);
        }
    }
    return foundObjects;
}

// is called if a subscribed state changes
adapter.on('stateChange', function (id, state) {
    // Warning, state can be null if it was deleted
    adapter.log.info('stateChange ' + id + ' ' + JSON.stringify(state));

    // you can use the ack flag to detect if it is status (true) or command (false)
    if (state && !state.ack) {
        //adapter.log.info('ack is not set!');
        var array=getConfigObjects(adapter.config.states, 'iobrokerstate', id);
        adapter.log.info('send to emoncms variable : ' + array[0].emonname + ' new value : ' + JSON.stringify(state.val));

        //send https://emoncms.org/input/post.json?json={power:200}&apikey=WRITE_APIKEY
        //send https://emoncms.org/input/post.json?node=1&csv=100,200,300&apikey=WRITE_APIKEY

        //nodejs libraries: needle, request, restler, requestify , unirest
        //http://stackoverflow.com/questions/6158933/how-to-make-an-http-post-request-in-node-js
    /*
        var options = {
            headers: { 'Authorization': 'Bearer APIKEY' }
        }

        needle.post('adapter.config.emonweb', 'array[0].emonname=state.val', options, function(err, resp) {
                    if (!err && resp.statusCode == 200) {
                    console.log(resp.body);
                }
        });
    */
    }
});

// Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
adapter.on('message', function (obj) {
    if (typeof obj == 'object' && obj.message) {
        if (obj.command == 'send') {
            // e.g. send email or pushover or whatever
            console.log('send command');

            // Send response in callback if required
            if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Message received', obj.callback);
        }
    }
});

// is called when databases are connected and adapter received configuration.
// start here!
adapter.on('ready', function () {
    main();
});


function main() {
    var obj = adapter.config.estates;
    for (var anz in obj){
        adapter.subscribeForeignStates(obj[anz].iobrokerstate);
        adapter.log.debug('emoncms subscribed to : ' + obj[anz].iobrokerstate);
    }

    // in this emoncms all states changes inside the adapters namespace are subscribed
    adapter.subscribeStates('*');
    //adapter.subscribeForeignStates('hkv.0.radiator_1.countNorm','hkv.0.radiator_2.countNorm'); //muss string sein deswegen for_next schleife
}
