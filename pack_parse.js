
var TypeInfos={
    //This is a funtion table for Reader and Write of pack_parse.
    //The field name is function name of Reader and Writer object.
    //The bufferFunc is corresponding to reading or writting functions of BuFfer class of Nodejs.
    //The size is the length in byte of the fixed length data type
    UInt8:{bufferFunc:'UInt8', size:1},
    byte:{bufferFunc:'UInt8', size:1},
    uint8:{bufferFunc:'UInt8', size:1},
    UInt16:{bufferFunc:'UInt16', size:2},
    uint16:{bufferFunc:'UInt16', size:2},
    ushort:{bufferFunc:'UInt16', size:2},
    UInt32:{bufferFunc:'UInt32', size:4},
    uint32:{bufferFunc:'UInt32', size:4},
    
    Int8:{bufferFunc:'Int8', size:1},
    int8:{bufferFunc:'Int8', size:1},
    Int16:{bufferFunc:'Int16', size:2},
    int16:{bufferFunc:'Int16', size:2},
    short:{bufferFunc:'Int16', size:2},
    Int32:{bufferFunc:'Int32', size:4},
    int32:{bufferFunc:'Int32', size:4},

/* 64bit integer is some problem, Nodjs Buffer does not provide reading or writting function
    UInt64:{bufferFunc:'Double', size:8},
    uint64:{bufferFunc:'Double', size:8},
    Int64:{bufferFunc:'Double', size:8},
    int64:{bufferFunc:'Double', size:8}, 
*/
    
    Float:{bufferFunc:'Float', size:4},
    float:{bufferFunc:'Float', size:4},
    Double:{bufferFunc:'Double', size:8},
    double:{bufferFunc:'Double', size:8},
    
    //string and fstring(Fixed length string), size is invalid
    string:{bufferFunc:'string', size:0},
    fstring:{bufferFunc:'fstring', size:0},
    buffer:{bufferFunc:'buffer', size:0}
};


var Writer = function(){
    var _encoding = 'utf8';
    var _targetList = [];
    var _endian = 'B';
    var self = this;
    
    this.getEncoding = function(){
        return _encoding;
    };
    
    //Set encoding of string
    this.setEncoding = function(encode){
        _encoding = encode;
        return this;
    };
    
    //Set number fields endian: bigEndian
    this.bigEndian = function(){
       _endian = 'B';
        return self;
    };

    //Set number fields endian: littleEndian
    this.littleEndian = function(){
       _endian = 'L';
        return self;
    };

    function add(typeName, val, len){
        
        var typeInfo = TypeInfos[typeName];
        if(!typeInfo){//undefined
            throw("Type name is not validate: " + typeName); 
            return;            
        } 
        
        if(len == undefined){
            
            if(typeName == 'string' || (typeName == 'fstring')){
                len = Buffer.byteLength(val, _encoding);
            }else if(typeName == 'buffer'){
                len = val.length;
            }else{
                len = typeInfo.size;
            }
        }
        
        _targetList.push( {typeInfo:typeInfo, data:val, len:len} );
        return self;
    };

    this.pack = function(){
        
        //Get total length of result Buffer first
        var len = 0;
        for(var i=0; i<_targetList.length; i++){
            var item = _targetList[i];
            var typeInfo = item.typeInfo;
            if(typeInfo.bufferFunc == 'string'){ //string with 4 bytes length field at beginning
                len += 4;
            }
            len += item.len;
        }
        
        var ret = new Buffer(len); //Alloc result
        var offset = 0;
        
        //Package result
        for(var i=0; i<_targetList.length; i++){
            var item = _targetList[i];
            var typeInfo = item.typeInfo;
            var writeFunc;
            if(typeInfo.bufferFunc == 'string'){
                //Write string length as UInt32 before string body
                ret['writeUInt32' + _endian + 'E'](item.len, offset);
                offset += 4;
                ret.write(item.data, offset, item.len, _encoding);
            }else if((typeInfo.bufferFunc == 'fstring') || (typeInfo.bufferFunc == 'buffer')){ //fixed length string
                
                if(typeInfo.bufferFunc == 'fstring'){
                    tmpBuff = Buffer.from(item.data, _encoding);
                }else{ //buffer
                    tmpBuff = Buffer.from(item.data);
                }
                ret.fill(0, offset, item.len);
                if(item.len > tmpBuff.length)
                    tmpBuff.copy(ret, offset, 0);
                else
                    tmpBuff.copy(ret, offset, 0, item.len);
            }else{
                
                if(typeInfo.size == 1) //1 byte data
                    writeFunc = 'write' + typeInfo.bufferFunc;
                else
                    writeFunc = 'write' + typeInfo.bufferFunc + _endian + 'E';
                //console.log("function name: " + writeFunc);
                ret[writeFunc](item.data, offset);   
            }
            offset += item.len;
        }
        self.clear();
        return ret;
    };
    
    this.clear = function(){
        _targetList = [];
    };
    
    //Traverse TypeInfos, add name as function to this writer object, such as UInt16, short...
    for(var i in TypeInfos){
        //Get a function, this function will call add()
        //For example, type name is 'short', and the function is: function(v){ return add("short", v); }
        //Attaching this function to writer object by calling eval() with script: 
        //  this["short"] = function(v){ return add("short", v); }
        var addFuncScript;
        if((i == 'fstring') || (i == 'buffer')) //Add field function: writer.type(fieldName, len), such as writer.fstring(str, 10);
            addFuncScript = 'this["' + i + '"] = function(v, len){ return add("'+ i +'", v, len ); }'
        else //Add field function: writer.type(fieldName), such as: writer.UInt32(val)
            addFuncScript = 'this["' + i + '"] = function(v){ return add("'+ i +'", v); }'
        eval(addFuncScript); 
    }
    
}

function CreateWriter()
{
    return new Writer();
}

var Reader = function(srcBuffer){
    var _srcBuffer = srcBuffer;
    var _encoding = 'utf8';
    var _targetList = [];
    var _endian = 'B';
    var _offset = 0;
    var self = this;
    var _result = {};
    
    this.set = function(srcBuffer){
        _srcBuffer = srcBuffer;
        _result = {};
        _offset = 0;
        return this;
    };
    
    //Append a buffer to Reader as source data
    this.append = function(buff){
        _srcBuffer = Buffer.concat([_srcBuffer, buff]);
        //console.log(_srcBuffer);
        return this;
    };
    
    this.getEncoding = function(){
        return _encoding;
    };
    
    //setEncoding() & getEncoding() set/get string encoding mode such as 'utf8', 'ascii', 'hex', 'base64', etc., 
    //the more detail can reference to nodeJs docment for Buffer: Buffers and Character Encodings.
    this.setEncoding = function(encode){
        _encoding = encode;
        return this;
    };
    
    //Set endian format, bigEndian or LittleEndian
    this.bigEndian = function(){
       _endian = 'B';
        return self;
    };

    this.littleEndian = function(){
       _endian = 'L';
        return self;
    };

    function parseField(fieldName, typeName, len){
        
        var typeInfo = TypeInfos[typeName];
        if(!typeInfo){//undefined
            throw("Type name is not validate: " + typeName); 
            return;            
        } 
        
        if(len == undefined)
            len = typeInfo.size;
        
        var readFunc;
        if(typeInfo.bufferFunc == 'string'){
            
            //先读出string长度
            len = _srcBuffer['readUInt32' + _endian + 'E'](_offset);
            _offset += 4;
            _result[fieldName] = _srcBuffer.toString(_encoding, _offset, _offset + len);
        }else if(typeInfo.bufferFunc == 'fstring'){ //fixed length string, 定长字符串，空余部分填0
               
            var strlen = 0;//Get string bytes length           
            for(var i = _offset; i<_offset +len; i++){
                
                if(_srcBuffer[i] == 0)
                    break;
                strlen++;
            }
            
            _result[fieldName] = _srcBuffer.toString(_encoding, _offset, _offset + strlen);
        }else if(typeInfo.bufferFunc == 'buffer'){ //buffer, must specify len
            
            //_result[fieldName] = new Buffer(len);
            _result[fieldName] = Buffer.alloc(len);
            _srcBuffer.copy(_result[fieldName], 0, _offset, len);
        }else{
            
            if(typeInfo.size == 1) //1 byte data
                readFunc = 'read' + typeInfo.bufferFunc;
            else
                readFunc = 'read' + typeInfo.bufferFunc + _endian + 'E';
            //console.log("readFunc name: " + readFunc);
            _result[fieldName] = _srcBuffer[readFunc](_offset);   
        }
        _offset += len;

        return self;
    };

    this.unpack = function(){
        
        return _result;
    };
    
    /*!
    Reader unpack with description table
    Description table likes as following:
    var descTable = [
     {name: 'field0', type: 'uint16'},
     {name: 'field1', type: 'fstring', length: 10},
     {name: 'field2', type: 'buffer', length: 10},
     {name: 'field3', type: 'string'}
    ];
    reader.unpackWithDescTable(descTable);
    */
    this.unpackWithDescTable = function(descTable){
        for(var i=0; i<descTable.length; i++){
            parseField(descTable[i].name, descTable[i].type, descTable[i].length);
        }
        return self.unpack();
    };
    
    //Traverse TypeInfos, add name as function to this writer object, such as UInt16, short...
    for(var i in TypeInfos){
        //Get a function, this function will call add()
        //For example, type name is 'short', and the function is: function(v){ return parseField(name, "short"); }
        //Attaching this function to reader object by calling eval() with script: 
        //  this["short"] = function(v){ return parseField(name, "short"); }
        var addFuncScript;
        if((i == 'fstring') || ( i == "buffer")) //Add field function: reader.type(fieldName, len)
            addFuncScript = 'this["' + i + '"] = function(name, len){ return parseField(name, "'+ i +'", len ); }'
        else //Add field function: reader.type(fieldName)
            addFuncScript = 'this["' + i + '"] = function(name){ return parseField(name, "'+ i +'" ); }'
        eval(addFuncScript); 
    }
}

function CreateReader(data)
{
    return new Reader(data);
}

module.exports = {
    CreateWriter: CreateWriter,
    CreateReader: CreateReader
};