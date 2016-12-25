
var TypeInfos={
    //本表格为pack_parse的Reader和Writer要提供的函数表
    //字段名byte、ushort等为最终要提供的函数名，name对应 Nodejs的Buffer类提供的标准编解码函数，size为数据所占字节数。
    UInt8:{name:'UInt8', size:1},
    byte:{name:'UInt8', size:1},
    uint8:{name:'UInt8', size:1},
    UInt16:{name:'UInt16', size:2},
    uint16:{name:'UInt16', size:2},
    ushort:{name:'UInt16', size:2},
    UInt32:{name:'UInt32', size:4},
    uint32:{name:'UInt32', size:4},
    
    Int8:{name:'Int8', size:1},
    int8:{name:'Int8', size:1},
    Int16:{name:'Int16', size:2},
    int16:{name:'Int16', size:2},
    short:{name:'Int16', size:2},
    Int32:{name:'Int32', size:4},
    int32:{name:'Int32', size:4},

/* Buffer提供的Int编码函数需要带byteLength，应该是作为可变长度的整数的写入，暂时不适应
    buf.writeUIntBE(value, offset, byteLength[, noAssert])
        byteLength <Number> 0 < byteLength <= 6
    UInt:{name:'UInt', size:4},
    uint:{name:'UInt', size:4},
    Int:{name:'Int', size:4},
    int:{name:'Int', size:4},
*/
    
/* 64bit整数有问题，Buffer未提供处理函数，暂时去掉
    UInt64:{name:'Double', size:8},
    uint64:{name:'Double', size:8},
    Int64:{name:'Double', size:8},
    int64:{name:'Double', size:8}, 
*/
    
    Float:{name:'Float', size:4},
    float:{name:'Float', size:4},
    Double:{name:'Double', size:8},
    double:{name:'Double', size:8},
    
    //string和fstring（Fixed length string），单独处理，仅仅size无效
    string:{name:'string', size:0},
    fstring:{name:'fstring', size:0},
    buffer:{name:'buffer', size:0}
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
            if(typeInfo.name == 'string'){ //string with 4 bytes length field at beginning
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
            if(typeInfo.name == 'string'){
                //Write string length as UInt32 before string body
                ret['writeUInt32' + _endian + 'E'](item.len);
                offset += 4;
                ret.write(item.data, offset, item.len, _encoding);
            }else if((typeInfo.name == 'fstring') || (typeInfo.name == 'buffer')){ //fixed length string, 定长字符串，空余部分填0
                
                if(typeInfo.name == 'fstring'){
                    //tmpBuff = new Buffer(item.data, _encoding);
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
                    writeFunc = 'write' + typeInfo.name;
                else
                    writeFunc = 'write' + typeInfo.name + _endian + 'E';
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
    
    //遍历TypeInfos，根据表中的名称，添加所有的名称命名的函数，如UInt16, short等
    for(var i in TypeInfos){
        //根据类型名称得到一个匿名函数，函数的作用是以类型名称去调用add，如：
        //类型名称：'short',得到函数 function(v){ return add("short", v); }
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
    
    this.append = function(buff){
        _srcBuffer = Buffer.concat([_srcBuffer, buff]);
        return this;
    };
    
    this.getEncoding = function(){
        return _encoding;
    };
    
    //指定文字编码
    this.setEncoding = function(encode){
        _encoding = encode;
        return this;
    };
    
    //指定字节序 为BigEndian
    this.bigEndian = function(){
       _endian = 'B';
        return self;
    };

    //指定字节序 为LittleEndian
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
        if(typeInfo.name == 'string'){
            
            //先读出string长度
            var strlen = _srcBuffer['readUInt32' + _endian + 'E']();
            _offset += 4;
            _result[fieldName] = _srcBuffer.toString(_encoding, _offset, _offset + strlen);
        }else if(typeInfo.name == 'fstring'){ //fixed length string, 定长字符串，空余部分填0
               
            var strlen = 0;//Get string bytes length           
            for(var i = _offset; i<_offset +len; i++){
                
                if(_srcBuffer[i] == 0)
                    break;
                strlen++;
            }
            
            _result[fieldName] = _srcBuffer.toString(_encoding, _offset, _offset + strlen);
        }else if(typeInfo.name == 'buffer'){ //buffer, must specify len
            
            //_result[fieldName] = new Buffer(len);
            _result[fieldName] = Buffer.alloc(len);
            _srcBuffer.copy(_result[fieldName], 0, _offset, len);
        }else{
            
            if(typeInfo.size == 1) //1 byte data
                readFunc = 'read' + typeInfo.name;
            else
                readFunc = 'read' + typeInfo.name + _endian + 'E';
            //console.log("readFunc name: " + readFunc);
            _result[fieldName] = _srcBuffer[readFunc](_offset);   
        }
        _offset += len;

        return self;
    };

    this.unpack = function(){
        
        return _result;
    };
    
    
    //遍历TypeInfos，根据表中的名称，添加所有的名称命名的函数，如UInt16, short等
    for(var i in TypeInfos){
        //根据类型名称得到一个匿名函数，函数的作用是以类型名称去调用add，如：
        //类型名称：'short',得到函数 function(v){ return parseField("name"); }
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