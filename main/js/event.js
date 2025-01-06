/** Can be used to attach event listeners and emitters on the client side similar pattern
 * to Node JS events  */
class emitter {
    constructor() {
        this.events = {};
      }
      on(event, listener) {
        if (!this.events[event]) {
          this.events[event] = [];
        }
        this.events[event].push(listener);
      }
    
      emit(event, ...args) {
        if (this.events[event]) {
          this.events[event].forEach(listener => listener(...args));
        }
    }
}

const Emitter = new emitter();

export default Emitter;