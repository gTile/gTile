import { enable, disable } from "./app"

// GJS import system
declare function registerExtension(i:Function, e:Function, d:Function): void;

registerExtension(function() {}, enable, disable);
