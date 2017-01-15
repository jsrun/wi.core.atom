/**
 *  __          __  _    _____ _____  ______           _                  
 *  \ \        / / | |  |_   _|  __ \|  ____|     /\  | |                 
 *   \ \  /\  / /__| |__  | | | |  | | |__       /  \ | |_ ___  _ __ ___  
 *    \ \/  \/ / _ \ '_ \ | | | |  | |  __|     / /\ \| __/ _ \| '_ ` _ \ 
 *     \  /\  /  __/ |_) || |_| |__| | |____ _ / ____ \ || (_) | | | | | |
 *      \/  \/ \___|_.__/_____|_____/|______(_)_/    \_\__\___/|_| |_| |_|
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
    async = require("async"),
    mkdirp = require("mkdirp"),
    lessCssStream = require('less-css-stream'),
    babel = require("babel-core"),
    serialize = require('node-serialize');

module.exports = {
    /**
     * List module assets
     * @type object
     */
    assets: {
        js: [__dirname + "/wi.core.atom.events.js"]
    },
    
    /**
     * Function to associate Atom static files
     * 
     * @param object app
     * @return void
     */
    static: function(app){
        app.use(require('serve-static')(__dirname + '/atom/static', {index: false, dotfiles: "deny"}));
    },
    
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
        let packageName = path.basename(dirname);
        
        try{
            var packageJSON = require(dirname + "/package.json");
            __this.pluginsPackages.push(packageJSON);
        }
        catch(e){
            console.warn(packageName + ": The package does not have the package.json file");
        }
        
        if(typeof packageJSON.dependencies == "object"){
            for(let keyDependencies in packageJSON.dependencies){
                console.log("Load dependencies: ",keyDependencies);
                
                try{
                    var packageDependenciesJSON = require(dirname + "/node_modules/" + keyDependencies + "/package.json");
                    
                    if(typeof packageDependenciesJSON.main == "string")
                        __this.insertJs(dirname + "/node_modules/" + keyDependencies + "/" + packageDependenciesJSON.main);
                }
                catch(e){
                    console.warn(packageName + ": The package does not have the package.json file");
                }
            }
        }
                
        try{
            var config = CSON.parseCSONFile(dirname + "/config.cson");
        }
        catch(e){
            console.warn(packageName + ": The package does not have the config.cson file");
        }
                
        //Converting menus
        glob(dirname + "/menus/*", {realpath: true}, function(err, menusFiles){
            menusFiles.forEach((filename, index) => {
                var menuFile = CSON.parseCSONFile(filename);
                __this.navbar.addAtomMenu(menuFile);
            });
        });
        
        //Converting keymaps
        glob(dirname + "/keymaps/*", {realpath: true}, function(err, keymapsFiles){
            keymapsFiles.forEach((filename, index) => {
                var keymapsFile = CSON.parseCSONFile(filename);
                __this.commands.addAtomKeymaps(keymapsFile);
            });
        });
        
        //Builds
        mkdirp(dirname + "/.webide/styles");
        mkdirp(dirname + "/.webide/lib");
        
        //Build CSS
        if(fs.statSync(dirname + "/styles").isDirectory()){
            glob(dirname + "/styles/*.css", {realpath: true}, function(err, stylesFiles){
                stylesFiles.forEach((filename, index) => {
                    __this.insertCss(dirname + "/.webide/styles/" + path.basename(filename));
                    
                    if(__this.build)
                        console.log("Build CSS: ", dirname + "/.webide/styles/" + path.basename(filename));
                });
            });
        }
        
        //Build LESS
        if(fs.statSync(dirname + "/styles").isDirectory()){
            glob(dirname + "/styles/*.less", {realpath: true}, function(err, stylesFiles){
                stylesFiles.forEach((filename, index) => {
                    if(__this.build)
                        console.log("Convert LESS: ", filename);
                    
                    fs.createReadStream(filename).pipe(lessCssStream(filename, {compress: true, paths : [__dirname + '/atom/static', __dirname + '/atom/static/variables']})).pipe(fs.createWriteStream(dirname + "/.webide/styles/" + path.basename(filename, ".less") + ".css"));
                    __this.insertCss(dirname + "/.webide/styles/" + path.basename(filename, ".less") + ".css");
                    
                    if(__this.build)
                        console.log("Build CSS: ", dirname + "/.webide/styles/" + path.basename(filename, ".less") + ".css");
                });
            });
        }
                
        //Build Javascript
        if(fs.statSync(dirname + "/lib").isDirectory()){
            glob(dirname + "/lib/*.js", {realpath: true}, function(err, javascriptFiles){
                javascriptFiles.forEach((filename, index) => {
                    if(__this.build)
                        console.log("Convert Babel: ", filename);
                    
                    babel.transformFile(filename, {filename: filename, presets: ["babel-preset-es2015"].map(require.resolve)}, function(err, result){
                        if(err) console.log(err);
                        else{ 
                            let out = dirname + "/.webide/lib/" + path.basename(filename);
                            let namespace = path.basename(filename, ".js");
                            result.code = "if(!exports)var exports = {};\n\n" + result.code;         
                            result.code = "if(!require)var require = function(n){ return window[n]; };\n\n" + result.code;     
                            result.code = result.code.replace(/require\([\"']atom[\"']\)/img, "require(\"../../../../.core/wi.core.atom/atom-compatibility.js\");");
                            result.code = result.code.replace(/_classCallCheck\(.*?\);/img, "");//Fix Babel
                            result.code = result.code.replace(/function  } }/i, "");//Fix Babel
                            result.code = result.code.replace(/exports.default = (.*?);/i, function(e, r){//Fix Babel
                                return `if(typeof atom == "object") atom.addPackages('${namespace}', ${r}); else exports.default = ${r};`;
                            });
                                                                                   
                            if(!/\-view\.js/.test(out)){
                                fs.writeFileSync(out, result.code);
                                let module = require(dirname + "/.webide/lib/" + path.basename(filename));
                                
                                //Loading settings
                                if(module.default){
                                    if(module.default.config){
                                        if(typeof module.default.config == "object"){
                                            for(let key in module.default.config){
                                                switch(module.default.config[key].type){
                                                    case "string": var type = "text"; break;
                                                    case "integer": var type = "number"; break;
                                                    case "boolean": var type = "boolean"; break;
                                                    default: var type = "text"; break;
                                                }    
                                                
                                                try{
                                                    __this.settings.addSettingItem("Atom", path.basename(filename, ".js"), namespace + "." + key, module.default.config[key].title, type, module.default.config[key].default, null, "webide.atom.setAtomConfig");
                                                }
                                                catch(e) { if(__this.build) console.log(e.message);  }
                                            }
                                        }
                                    }
                                }
                            }
                            else{   
                                result.code = result.code.replace(/new _atom.*?/i, function(e, r){//Fix Babel
                                    return `(function(){ return (typeof atom == "object") ? atom : _atom; })()`;
                                });
                                
                                fs.writeFileSync(out, result.code);                            
                                __this.insertJs(out);
                            }
                        }
                    });
                    
                    if(__this.build)
                        console.log("Build Javascript: ", dirname + "/.webide/lib/" + path.basename(filename));
                });
            });
        }
        
        if(typeof cb == "function")
            setTimeout(() => { cb(); }, 5000);
    },
    
    parseTheme: function(){
        
    }
};