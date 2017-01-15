
class CompositeDisposable {
    /**
     * Contructor function
     * @return void
     */
    constructor() {
        this.itens = {};
    }
    
    add() {
        
    }
}

module.exports = {
    /**
     * CompositeDisposable compatibility interface
     * 
     * @see https://atom.io/docs/api/v1.9.0/CompositeDisposable
     * @return object
     */
    CompositeDisposable: CompositeDisposable
}

