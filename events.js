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
            var packageItem = atom.packages[key];
            var argumentsArr = /^function .*?\((.*?)\)|.*?/img.exec(packageItem.toString());
                        
            if(argumentsArr.length > 1)
                if(argumentsArr[1])
                    argumentsArr[1].split(",");
                        
            var argsv = [];

            for(var key in argumentsArr){
                if(atom[trim(argumentsArr[key])]){
                    argsv.push(atom[trim(argumentsArr[key])]);
                    packageItem.prototype[trim(arguments[key])] = atom[trim(argumentsArr[key])];
                }
            }

            if(packageItem.prototype){
                if(typeof packageItem.prototype.constructor == "function"){
                    packageItem.prototype.constructor.apply(packageItem, argsv);
                    packageItem.prototype.constructor.apply(packageItem.prototype, argsv);
                }

                if(typeof packageItem.prototype.start == "function")
                    packageItem.prototype.start();

                if(typeof packageItem.prototype.activate == "function")
                    packageItem.prototype.activate();
            }
        }
    },
    
    /**
     * Update all packages
     * 
     * @return void
     */
    update: function(){
        for(var key in atom.packages){
            var packageItem = atom.packages[key];
            
            if(typeof packageItem.prototype.initialize == "function")
                packageItem.prototype.initialize();
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