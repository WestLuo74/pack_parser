var PackParser = require('../pack_parse');

var writer = PackParser.CreateWriter();

var pack = writer.ushort(10).byte(20).pack();

console.log("Pack ushort(10).byte(20) :");
console.log(pack);
console.log();


var pack = writer.string('abc').fstring('1234', 10).pack();

console.log("Pack string('abc').fstring('123456789012345', 10) :");
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
 "uint32",
 "int8",
 "int8",
 "Int16",
 "int16",
 "short",
 "Int32",
 "int32",

/*Buffer提供的Int编码函数需要带byteLength，应该是作为可变长度的整数的写入，暂时不适应
 "UInt",
 "uint",
 "Int",
 "int",
*/
    
/* 64bit整数有问题，Buffer未提供处理函数，暂时去掉
 "UInt64",
 "uint64",
 "Int64",
 "int64",
*/
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

var pack = writer.fstring('1234567890123', 10).pack();
var out = Reader.set(pack).fstring('fstr_name', 10).unpack();
console.log(out);

var pack = writer.string('1234567890123').pack();
var out = Reader.set(pack).string('str_name').unpack();
console.log(out);
