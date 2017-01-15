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

//Functions and compatibility classes

var atom = {
    packages: [],
    
    /**
     * Config compatibility
     * @type class
     */
    config: {
        events: {},
        
        onDidChange: function(namespace, fn){ 
            this.events[namespace] = fn;            
            return [namespace, fn];
        },
        
        get: function(namespace){
            return webide.settings.get(namespace);
        },
        
        set: function(namespace, value){            
            webide.settings.set(namespace, value);
            
            if(typeof this.events[namespace] == "function")
                this.events[namespace]();
            
            //atom.update();
            return true;
        }
    },
    
    /**
     * Commands compatibility
     * @type class
     */
    commands: {
        add: function(element, commands){
            for(var namespace in commands){
                webide.commands.map[namespace] = {
                    name: namespace,
                    event: commands[namespace]
                }
            }
        }
    },
        
    /**
     * CompositeDisposable compatibility
     * @type class
     */
    CompositeDisposable: function(){
        return {
            itens: {},
            
            add: function(item){
                if(item)
                    this.itens[item[0]] = item[1];
            }
        };
    },
    
    /**
     * IDE Elements
     */
    statusBar: {
        addRightTile: function(item){
            webide.statusbar.addRight(item.item);
        }
    },
    
    /**
     * Function to add packages
     * 
     * @param string namespace
     * @param object obj
     * @return void
     */
    addPackages: function(namespace, obj){
        atom.packages[namespace] = obj;
    },
    
    /**
     * Return package by namespace
     * 
     * @param string namespace
     * @return object
     */
    packageByNamespane: function(namespace){
        return (atom.packages[namespace]) ? atom.packages[namespace] : null;
    },
    
    /**
     * Initialize all packages
     * 
     * @return void
     */
    initialize: function(){
        for(var key in atom.packages){
            var package = atom.packages[key];
            var arguments = /^function .*?\((.*?)\)|.*?/img.exec(package.toString())[1].split(",");
            var argsv = [];

            for(var key in arguments){
                if(atom[trim(arguments[key])]){
                    argsv.push(atom[trim(arguments[key])]);
                    package.prototype[trim(arguments[key])] = atom[trim(arguments[key])];
                }
                else{
                    argsv.push(null);
                    package.prototype[trim(arguments[key])] = null;
                }
            }

            if(typeof package.prototype.constructor == "function"){
                package.prototype.constructor.apply(package, argsv);
                package.prototype.constructor.apply(package.prototype, argsv);
            }
            
            if(typeof package.prototype.start == "function")
                package.prototype.start();
        }
    },
    
    /**
     * Update all packages
     * 
     * @return void
     */
    update: function(){
        for(var key in atom.packages){
            var package = atom.packages[key];
            
            if(typeof package.prototype.initialize == "function")
                package.prototype.initialize();
        }
    }
};

(function(){
    webide.onload(atom.initialize);
    webide.atom = {
        /**
         * Function to call internal Atom function
         * @return void
         */
        call: function(namespace){
            
        },
        
        setAtomConfig: function(key, value){
            atom.config.set(key, value);
        }
    };
})();