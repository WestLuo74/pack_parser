# [stream_reader](https://www.npmjs.com/package/stream_reader) and [pack_parser](https://www.npmjs.com/package/pack_parser)
Stream_reader handles continuous data blocks from sock or file. It will buffering the data blocks you pushed in. When the data reached the length you want, it contact data to a Buffer object and call back the function you registered.

Pack_parser pack or unpack nodejs Buffer with specified format.

# pack_parser

## Install
```
$ npm install pack_parser
```

## Usage of pack_parser
Pack_parser pack or unpack nodejs Buffer with specified format, is used to handle data package with special fomat.

###  Create a writer or reader
Writer is used to packaging data, and reader unpackaging data pack.
```js
var PackParser = require('pack_parser');
var writer = PackParser.CreateWriter();
var Reader = PackParser.CreateReader(pack);
```
### pack()
Package data to nodeJs Buffer:
```js
var writer = PackParser.CreateWriter();

//Package 1 byte with value 3 and 4 bytes with value 12 to a nodejs Buffer
var buff = writer.byte(3).UInt32(12).bigEndian().pack();
console.log(buff);
```
Output as following:
```
< Buffer 03 00 00 00 0c >
```
### unpack()
The function unpack() will unpackage nodeJs Buffer to a javascript object with fields you gave with field functions such as byte(), UInt32(), etc.
```js
//buff value: < Buffer 03 00 00 00 0c >
var reader = PackParser.CreateReader(buff);
var ret = reader.byte('Field0').UInt32('Field1').bigEndian().unpack();
console.log(ret);

```
Output as following:  
```
{  
  Field0: 3,
  Field1: 12  
}
```
### Field functions
Now field functions include:   
```
Int8(), int8(),  
UInt8(), byte(), uint8(),  
UInt16(), uint16(), ushort(), 
UInt32(), uint32(),  
Int16(), int16(), short(),  
Int32(), int32(),  
Float(), float(),  
Double(), double(),  
string(),  
fstring(),
vbuffer(),
buffer() .  
```
In these field functions:  
```
Int8(), int8() are equivalent.  
UInt8(), byte(), uint8() are equivalent.  
UInt16(), uint16(), ushort() are equivalent.  
UInt32(), uint32() are equivalent.  
Int16(), int16(), short() are equivalent.  
Int32(), int32() are equivalent.  
Float(), float() are equivalent.  
Double(), double() are equivalent.
```
In writer, call field functions with the value you want to package into.
In reader, call field functions with the field name.
### string()
Field function string() in writer will pack/unpack a string beginning with 4 bytes string length into/from result buffer.
```js
var pack = writer.string('1234567890123').bigEndian().pack();
console.log(pack);
```
Output as following:  
```
< Buffer 00 00 00 0d 31 32 33 34 35 36 37 38 39 30 31 32 33 >
```
For a reader, function string() will read 4 byte string length(in bytes) firstly, and then read string body according to this length.
```js
var out = reader.set(pack).string('str_name').bigEndian().unpack();
console.log(out);

```
Output as following:  
```
{ str_name: '1234567890123' }
```
### fstring()
fstring(string, length) means fixed length string.  
```js
writer.fstring(string, [fixedLength])

reader.fstring(fieldName, fixedLength)
```
Call this function in writer will package a fixed length（in bytes） string according to argument length.
If string is shorter than length, zero(s) will be padding at the end of string.
If string is longer than length, it will be truncated.
```js
var pack = writer.fstring('1234', 10).bigEndian().pack();
console.log(pack);

var pack = writer.fstring('1234567890123', 10).bigEndian().pack();
console.log(pack);
```
Output as following:  
```
< Buffer 31 32 33 34 00 00 00 00 00 00 >
< Buffer 31 32 33 34 35 36 37 38 39 30 >
```
For writer, if fixedLength is undefined, fixedLength is the string's length(in bytes); and for the the reader, fixedLength must be specified when calling this function. 

### vbuffer()
vbuffer() function likes string, it pack/unpack a nodeJs Buffer object with its length into/from result.

### buffer()
buffer() function likes fstring(), it pack/unpack a nodeJs Buffer object into/from result.
```js
writer.buffer(Buffer, [fixedLength])

reader.buffer(Buffer, fixedLength)
```
### bigEndian() & littleEndian()
bigEndian() & littleEndian() set number encoding mode: big endian or little endian.

### setEncoding() & getEncoding()
setEncoding() & getEncoding() set/get string encoding mode such as 'utf8', 'ascii', 'hex', 'base64', etc., the more detail can reference to nodeJs docment for Buffer: Buffers and Character Encodings.

### set() & append() for Reader
The Reader function set() will clear Reader object and set source data object to Reader. And append() will append a buffer to source data.
```js
reader.set(Buffer)

reader.append(Buffer)
```

### unpackWithDescTable() for Reader
Reader unpack with description table. 
Description table is a array of description, each description must has 'name', 'type' field, and 'length' for fstring or buffer field. 
Example is as following:
```js
console.log(pack);

var descTable = [
     {name: 'field0', type: 'uint16'},
     {name: 'field1', type: 'fstring', length: 10},
     {name: 'field3', type: 'string'},
     {name: 'field4', type: 'uint32'}
    ];

reader.set(pack).bigEndian().unpackWithDescTable(descTable);
```

Output as following:  
```
<Buffer 00 0a 31 32 33 34 35 36 37 38 39 30 00 00 00 0d 31 32 33 34 35 36 37 38 39 30 31 32 33 00 00 00 64>
{ field0: 10,
  field1: '1234567890',
  field3: '1234567890123',
  field4: 100 
}
```

# stream_reader
## Install

```
$ npm install stream_reader
```
## Usage of stream_reader
stream_reader can be used to handle continuous data blocks from sock or file. It will buffering the data blocks you pushed in. When the data reached the length you want, it contact data to a Buffer object and call back the function you registered.
### Create a stream rader
```js
var StreamReader = require('stream_reader');
var sockStreamReader = new StreamReader();
```
### Push data into reader
When data block come in from socket, file, etc., push into StreamReader
```js
sock.on("data", function(data){ 
               //When socket data come in, push into StreamReader
        sockStreamReader.push(data);
    });
```
### Register data reading function
You can register how long data you want, and when the buffering data reached the length, the callback function will bo called:
```js
   //Read pack head with fixed length 9 bytes
   sockStreamReader.read(9, function(headData){
            console.info("Pack head received");
    });
```
and you can register multi functions as the following:
```js
    var flag, type;
    sockStreamReader.read(4, function(flagData){
        flag = flagData;
        console.info("Pack flag received");
    }).read(1, function(typeData){
        type = typeData;
        console.info("Pack type received");
    })
```
Each reading function is called a **reading task**.
### Check the StreamReader has reading task
After a data reading function be called, it will be erased from StreamReader. So, we maybe need check if the StreamReader has reading task by calling function taskEmpty().
```js
sock.on("data", function(data){ 
    if(sockStreamReader.taskEmpty()){
        //If the sockStreamReader has no task any more, register pack head reading function again
        sockStreamReader.read(9, function(headData){
            console.info("Pack head received");
            ... //To read pack body ...
    });
               //When socket data come in, push into StreamReader
    sockStreamReader.push(data);
});
```
### loopRead()
The StreamReader will buffering the data blocks until they reached the length you want, so, if you want read a large data chunk, it will occupy large memory, that's not a good idea.
So you maybe need the this function: loopRead(totalLen, unitLen, cb).
Calling this function will create a loop task in StreamReader, it will call *cb* function repetitiously when buffering data reached unitLen; and until totalLen being read, the task will finish.
This is example for read 2M data, the reading unit is 2K:
```js
var total = 0;
sockStreamReader.loopRead(1024*2048, 1024, function(data){
    var dataStr = data.toString();                        
    console.info("Long data unit come in: " + dataStr);
    total += data.length;
    if(total == (1024 * 2048))
        console.info("Long data finished!");
}
```

# Example
A client and server communicat with the pack format as the following format:
```
    |------------------------------------------------------|
    | Flag(4 bytes) | Type(1 byte) | Length(4 byte) | Data |
    |------------------------------------------------------|
Flag: pack flag, must be string "Test"
Type:  1 -- Echo, 2 -- Long string data
Length: Length for data
Data: Data
```
## Full example as a TCP client
```js
//This is a full example for a tcp client using stream_reader and pack_parser package.
//The pack format is: 
//
//    |------------------------------------------------------|
//    | Flag(4 bytes) | Type(1 byte) | Length(4 byte) | Data |
//    |------------------------------------------------------|
//
// Flag: pack flag, must be string "Test"
// Type:  1 -- Echo, 2 -- Long string data
// Length: Length for data
// Data: Data

var net = require('net');
var PackParser = require('pack_parser');
var StreamReader = require('stream_reader');

var PACK_TYPE_ECHO = 1;
var PACK_TYPE_STR = 2;

var HOST = '127.0.0.1';
var PORT = 8888;

var client = new net.Socket();

var sockStreamReader = new StreamReader();
                      
client.connect(PORT, HOST, function() {

    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
    
    //Build a echo pack to send
    var paserWriter = PackParser.CreateWriter().bigEndian();
    var dataStr = "Hello, world!"
    var outPack = paserWriter.fstring("Test").byte(PACK_TYPE_ECHO).UInt32(dataStr.length).fstring(dataStr).pack();
    console.log('Send ' + outPack.length + ' bytes TO: ' + HOST + ':' + PORT);
    client.write(outPack);
    
    var loopStr = "This is a test loop string";
    var dataLen = Buffer.byteLength(loopStr, paserWriter.getEncoding()) * 1024;
    
    //Pack and send head
    outPack = paserWriter.fstring("Test").byte(PACK_TYPE_STR).UInt32(dataLen).pack();    
    console.log('Send ' + outPack.length + ' head bytes TO: ' + HOST + ':' + PORT);
    client.write(outPack);
    
    //Send data
    for(var i = 0; i < 1024; i++){
        var data = new Buffer(loopStr, paserWriter.getEncoding());
        client.write(data);
    }

    setTimeout(function(){ //Close after 10 seconds
        
        client.end();
    }, 10 * 1000);
});


client.on('data', function(data) {
    
    //If no more task in StreamReader, register protocol handle body
    if( sockStreamReader.taskEmpty() )
        registerProtocolBody();
    
     //When socket data coming, push to StreamReader
    sockStreamReader.push(data);    
});

client.on('close', function() {
    console.log('Connection closed');
});
    
client.on("error",function(err){
    console.error('Error occurred:', err.message);
});

function registerProtocolBody(){
    
    sockStreamReader.read(9, function(headData){

        //Parse head to object head
        var parserReader = PackParser.CreateReader(headData).bigEndian();
        var head = parserReader.fstring('flag', 4).byte('type').UInt32('length').unpack(); 

        //Check flag field
        if(head.flag != "Test"){ 
            console.error("Bad pack flag" + head.flag);
            return;
        }

        switch( head.type ){
            case PACK_TYPE_ECHO:

                //Read data according head.length
                sockStreamReader.read(head.length, function(data){

                    var dataStr = data.toString();
                    console.info("Echo pack coming with string: " + dataStr);
                });
                break;
            default:
                console.error("Unrecongized pack type: " + head.type);                                
        }
    });
}
```
## Full example as a TCP server
```js
//This is a full example for a tcp server using stream_reader and pack_parser package.
//The pack format is: 
//
//    |------------------------------------------------------|
//    | Flag(4 bytes) | Type(1 byte) | Length(4 byte) | Data |
//    |------------------------------------------------------|
//
// Flag: pack flag, must be string "Test"
// Type:  1 -- Echo, 2 -- Long string data
// Length: Length for data
// Data: Data

var server = require('net').createServer();
var StreamReader = require('stream_reader');
var PackParser = require('pack_parser');

var PACK_TYPE_ECHO = 1;
var PACK_TYPE_STR = 2;

function newConn(sock)
{
    var sockStreamReader = new StreamReader();
    
    sock.on("data", function(data){ 
        
        console.info("Data come in: " + data.length + " bytes");
        
        //If no more task in StreamReader, register protocol handle body
        if( sockStreamReader.taskEmpty() )
            registerProtocolBody();
        
        //When socket data coming, push to StreamReader
        sockStreamReader.push(data);
                
    });
  
    sock.on("error",function(err){
        console.error('Error occurred:', err.message);
    });
    
    sock.on("close",function(){
        console.error('connection closed');
    });
    
    function registerProtocolBody(){
        
        //Read pack head with fixed length 9 bytes
        sockStreamReader.read(9, function(headData){

            console.info("Pack head received");

            //Parse head to object head
            var parserReader = PackParser.CreateReader(headData).bigEndian();
            var head = parserReader.fstring('flag', 4).byte('type').UInt32('length').unpack(); 

            //Check flag field
            if(head.flag != "Test"){ 
                console.error("Bad pack flag" + head.flag);
                return;
            }

            switch( head.type ){
                case PACK_TYPE_ECHO:

                    //Read data according head.length
                    sockStreamReader.read(head.length, function(data){

                        var dataStr = data.toString();
                        console.info("Echo pack coming with string: " + dataStr);

                        //Build a echo pack to send
                        var paserWriter = PackParser.CreateWriter().bigEndian();
                        var outPack = paserWriter.fstring(head.flag).byte(head.type).UInt32(data.length).fstring(dataStr).pack();
                        sock.write(outPack);
                    });
                    break;

                case PACK_TYPE_STR:

                    var total = 0;
                    sockStreamReader.loopRead(head.length, 1024, function(data){

                        var dataStr = data.toString();                        
                        console.info("Long data pack come in: " + dataStr);
                        
                        total += data.length;
                        if(total == head.length)
                            console.info("Long data finished!");
                        //So you can handle data as your wish
                    }); 
                    break;
            }
        });
    }
   
}

function createSrv(port){
    
    server.on('listening', function() {
        console.info('Server is listening on port ' + port);
    });
    
    server.on('connection', function(socket) {
        newConn(socket);
        console.info('Server has a new connection');
    });
    
    server.on('close', function() {
        console.info('Server is now closed');
    });
    
    server.on('error', function(err) {
        console.error('Error occurred:', err.message);
    });
    
    server.listen(port);    
}


createSrv(8888);

```

