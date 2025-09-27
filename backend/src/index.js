"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var app = (0, express_1.default)();
app.get('/', function (req, res) {
    console.log('get page');
});
app.listen(3000);
