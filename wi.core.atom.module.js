/**
 *  __          __  _    _____ _____  ______ 
 *  \ \        / / | |  |_   _|  __ \|  ____|
 *   \ \  /\  / /__| |__  | | | |  | | |__   
 *    \ \/  \/ / _ \ '_ \ | | | |  | |  __|  
 *     \  /\  /  __/ |_) || |_| |__| | |____ 
 *      \/  \/ \___|_.__/_____|_____/|______|
 *                                                                            
 *  @author André Ferreira <andrehrf@gmail.com>
 *  @license MIT
 */

"use strict";

let SystemException = require("../wi.core.exception.js"),
    fs = require("fs"),
    path = require("path"),
    glob = require("glob"),
    CSON = require("cson"),
    async = require("async");

module.exports = {
    /**
     * Function to load Atom packages
     * 
     * @param string dirname
     * @return void
     */
    parsePackages: function(dirname, __this, cb){
        let _this = this;
        let asyncList = [];
        
        glob(dirname + "/*", {stat: true, cache: true, nodir: true, realpath: true}, (err, files) => {
            for(let key in files){
                let stats = fs.statSync(files[key]);
                
                if(stats.isDirectory()){
                    try{
                        if(fs.statSync(files[key] + "/package.json").isFile()){
                            var packageJSON = require(files[key] + "/package.json");

                            if(typeof packageJSON.engines == "object"){
                                for(let keyEngines in packageJSON.engines){
                                    if(keyEngines == "atom")
                                        asyncList.push((cb) => {
                                            _this.parsePackage(files[key], packageJSON, __this, cb);
                                        });
                                }
                            }
                        }
                    }
                    catch(e){}
                }
            }
            
            if(typeof cb == "function")
                async.series(asyncList, cb);
            else
                async.series(asyncList);
        });
    },
    
    /**
     * Function to load Atom package
     * 
     * @param string dirname
     * @param string package
     * @return void
     */
    parsePackage: function(dirname, packageJSON, __this, cb){
        let _this = this;
        
        if(!packageJSON){
            if(fs.statSync(dirname + "/package.json").isFile())
                packageJSON = require(files[key] + "/package.json");
        }
        
        let packageName = path.basename(dirname);
        
        try{
            if(fs.statSync(dirname + "/config.cson").isFile())
                var config = CSON.parseCSONFile(dirname + "/config.cson");
        }
        catch(e){
            console.warn(packageName + ": The package does not have the config.cson file");
        }
                
        if(fs.statSync(dirname + "/menus").isDirectory()){
            glob(dirname + "/menus/*", {realpath: true}, function(err, menusFiles){
                menusFiles.forEach((filename, index) => {
                    var menuFile = CSON.parseCSONFile(filename);
                    __this.navbar.addAtomMenu(menuFile);
                });
            });
        }
        
        if(typeof cb == "function")
            setTimeout(() => { cb(); }, 2000);
    },
    
    parseTheme: function(){
        
    }
};