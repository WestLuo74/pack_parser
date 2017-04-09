var PackParser = require('../pack_parse');

var writer = PackParser.CreateWriter();

var pack = writer.ushort(10).byte(20).pack();

console.log("Pack ushort(10).byte(20) :");
console.log(pack);
console.log();


var pack = writer.string('abc').fstring('1234', 10).pack();

console.log("Pack string('abc').fstring('1234', 10) :");
console.log(pack);
console.log();

var funclist = 
[
 "UInt8",
 "byte",
 "uint8",
 "UInt16",
 "uint16",
 "ushort",
 "UInt32",
 "uint32",
 "int8",
 "int8",
 "Int16",
 "int16",
 "short",
 "Int32",
 "int32",
 "Float",
 "float",
 "Double",
 "double"/*,
 "string",
 "fstring"*/
];

console.log("==== Set to bigEndian:");
writer.bigEndian();
for(var i in funclist){

    funcName = funclist[i];
    console.log("Pack " + funcName + "(10) :");
    var pack = writer[funcName](10).pack();
    console.log(pack);
    console.log();
}

console.log("==== Set to littleEndian:");
writer.littleEndian();
for(var i in funclist){

    funcName = funclist[i];
    console.log("Pack " + funcName + "(10) :");
    var pack = writer[funcName](10).pack();
    console.log(pack);
    console.log();
}


//-------------Test reader
for(var i in funclist){

    funcName = funclist[i];
    console.log("Pack " + funcName + "(10) :");
    writer[funcName](10);
}

console.log("==== Data to reade:");
var pack =writer.pack();
console.log(pack);
console.log();

var Reader = PackParser.CreateReader(pack).littleEndian();

for(var i in funclist){

    funcName = funclist[i];
    Reader[funcName]('Field' + i);
}
var out = Reader.unpack();
console.log(out);

var pack = writer.fstring('1234', 10).bigEndian().pack();
console.log(pack);
var out = Reader.set(pack).fstring('fstr_name', 10).bigEndian().unpack();
console.log(out);


var pack = writer.fstring('1234567890123', 10).bigEndian().pack();
console.log(pack);
var out = Reader.set(pack).fstring('fstr_name', 10).bigEndian().unpack();
console.log(out);

var pack = writer.string('1234567890123').bigEndian().pack();
console.log(pack);
var out = Reader.set(pack).string('str_name').bigEndian().unpack();
console.log(out);

var testBuff = new Buffer("abcdef");
var pack = writer.buffer(testBuff).fstring('1234').pack();
console.log(pack);
var out = Reader.set(pack).buffer('buffer_name', 6).fstring('fstring_name', 4).bigEndian().unpack();
console.log(out);

var testBuff = new Buffer("abcd");
var pack = writer.buffer(testBuff, 10).fstring('1234', 10).pack();
console.log(pack);
var out = Reader.set(pack).buffer('buffer_name', 10).fstring('fstring_name', 10).bigEndian().unpack();
console.log(out);

var testBuff = new Buffer("abcdefghijklmopqrst");
var pack = writer.buffer(testBuff, 10).fstring('123456789012345', 10).pack();
console.log(pack);
var out = Reader.set(pack).buffer('buffer_name', 10).fstring('fstring_name', 10).bigEndian().unpack();
console.log(out);

/*
Test reader unpack with description table
Description table likes as following:
var descTable = [
     {name: 'field0', type: 'uint16'},
     {name: 'field1', type: 'fstring', length: 10},
     {name: 'field2', type: 'buffer', length: 10},
     {name: 'field3', type: 'string'}
    ];
reader.unpackWithDescTable(descTable);
*/
console.log("=== Reader.unpackWithDescTable");
var pack = writer.uint16(10).fstring('1234567890123', 10).string('1234567890123').bigEndian().pack();
var pack2 = writer.uint32(100).bigEndian().pack();
console.log(pack);

var descTable = [
     {name: 'field0', type: 'uint16'},
     {name: 'field1', type: 'fstring', length: 10},
     {name: 'field3', type: 'string'},
     {name: 'field4', type: 'uint32'}
    ];
var out = Reader.set(pack).append(pack2).bigEndian().unpackWithDescTable(descTable);
console.log(out);

