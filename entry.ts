import { enable as e, disable as d } from "./app"

// GJS import system
declare function registerExtension(i:Function, e:Function, d:Function);

registerExtension(function() {}, e, d);
