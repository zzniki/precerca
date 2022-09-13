const PORT = 8000;

var http = require("http");
var fs = require("fs");

function onRequest(request, response) {

    var filePath = "./" + __dirname + "/src" + request.url;

    fs.readFile(filePath, null, (error, data) => {

        if (error) { 
                
            fs.readFile(filePath + "/index.html", null, (error2, data2) => {

                if (error2) { 
                    
                    response.writeHead(404); 
                    console.log("a");
    
                } else {
    
                    response.writeHead(200);
                    console.log("b");
                    response.write(data2);
    
                }
        
            });

        } else {

            response.writeHead(200);
            console.log("c");
            response.write(data);

        }
    
    });

    response.end();

}

http.createServer(onRequest).listen(PORT);