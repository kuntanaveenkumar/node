var config = require('./dbconfig');
const sql = require('mssql');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
var request = require('request');
const NodeCache = require('node-cache');
const Mollitia = require('mollitia');
const httpRequest = require('request')
const { Circuit, Fallback, SlidingCountBreaker, BreakerState } = Mollitia
const config = {
  name: 'makeCounter',
  slidingWindowSize: 6, 
  minimumNumberOfCalls: 3, 
  failureRateThreshold: 60, 
  slowCallDurationThreshold: 500, 
  slowCallRateThreshold: 50, 
  permittedNumberOfCallsInHalfOpenState: 2, 
  openStateDelay: 10000,
  halfOpenStateMaxDelay: 30000,
}
const myCache = new NodeCache({
    stdTTL: 600
});
const uploadFile = require("./upload");
const fs = require('fs');
const crypto = require('crypto');
const devices = require('./devices/devices')
require('dotenv').config({
    path: '/var/www/html/node/.env'
});
const nodemailer = require("nodemailer");
var connection = new sql.ConnectionPool(config);
connection.connect();
let transporter = nodemailer.createTransport({
    host: process.env.EMAILSERVER,
    port: process.env.EMAILPORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAILUSERNAME,
        pass: process.env.EMAILPASSWORD,
    },
    tls: {
        rejectUnauthorized: false
    }
});

const slidingCountBreaker = new SlidingCountBreaker(config)
  

 const fallback = new Fallback({
  callback(err) {
    
    if (err) {
      return err.message
    }
  },
})
  

const makeCircuit = new Circuit({
  name: 'Make Operations',
  options: {
    prometheus: {
      name: 'makeCircuit',
    },
    modules: [slidingCountBreaker, fallback],
  },
})


const makeController = {
  getMakes: (makeid) => {
    return new Promise((resolve, reject) => {
      httpRequest(
        {
          uri: `http://localhost:9191/makes`,
          method: 'GET',
          agentOptions: {
            rejectUnauthorized: false, 
          },
        },
        (error, response, body) => {
          if (error) {
              console.log(error)
            reject(error)
          } else if (response) {
            if (response.statusCode === 200) {
              resolve(JSON.parse(body))
            } else {
              resolve(response.body)
            }
          }
        }
      )
    })
  },
}


async function upload(req, res, filetype) {    
    filetype = (filetype == undefined || line == "undefined") ? "type1" : filetype
    try {

        await uploadFile(req, res);
        if (req.file == undefined) {
            return res.status(400).send({
                message: "Please upload a file!"
            });
        }

        try {
            const data = fs.readFileSync('/var/www/html/node/assets/tmp/' + req.file.filename, 'utf8');
            let arr;
            let name;
            let Id;
            var insertarr = new Array(data.split(/\r?\n/).length);
            for (var i = 0; i < insertarr.length; i++) {
                insertarr[i] = new Array(4);
            }
            let s = 0;
            const table = new sql.Table('[Table].[dbo].[serials]');
            table.create = false;
            table.columns.add('name', sql.VarChar(255), {
                nullable: true
            });
            table.columns.add('Id', sql.VarChar(255), {
                primary: true
            });

            table.columns.add('processed', sql.Int, {
                nullable: true
            });
            //insertarr.forEach(arr => table.rows.add.apply(null, arr));
            data.split(/\r?\n/).forEach(line => {
                if (line != "" && (line != undefined || line != "undefined")) {
                    var str = line.toString().trim();
                    arr = str.split(/(\s+)/);
                    arr[0] = Buffer.from(arr[0], 'utf-8').toString();
                    name = arr[0] + " " + arr[2];
                    Id = "";
                    Id = arr[4];
                    if (Id != "") {
                        if (insertarr[s] != "" && typeof insertarr[s] !== "undefined") {
                            if (typeof name === "undefined")
                                console.log(name)
                            else
                                insertarr[s][0] = Buffer.from(name.toString(), 'utf-8').toString().replace(/[^a-zA-Z0-9 ]/g, "");

                            if (typeof Id === "undefined")
                                insertarr[s][1] = ""
                            else
                                insertarr[s][1] = Buffer.from(arr[6].toString()).toString().replace(/[^a-zA-Z0-9 ]/g, "");
                            insertarr[s][2] = "0"
                        }
                    }

                    s++;
                }
            });

            // insertarr.forEach(arr => table.rows.add.apply(null, arr));		
            for (let j = 0; j < insertarr.length; j += 1) {
                if (insertarr[j][1] != null && insertarr[j][2] != null && insertarr[j][1] !== "" && insertarr[j][2] !== "") {
                    table.rows.add(insertarr[j][0],
                        insertarr[j][1],
                        insertarr[j][2],
                        insertarr[j][3]
                    );
                }
            }

            //console.log(insertarr)
            /**/
            let pool = await sql.connect(config);
            const request = pool.request();
            const results = await request.bulk(table);
            let result2 = await pool.request().execute('[removeDuplicates]')
            await pool.close();

        } catch (err) {
            console.error(err);
        }

        /*
        
        */
        return res.status(200).send({
            message: "Uploaded the file successfully: " + req.file.filename,
        });
    } catch (err) {
        return res.status(500).send({
            message: `Could not upload the file:  ${err}`,
        });
    }

}

async function searchByDevice(Id, limit, offset, SortBy, SortType) {
    return await devices(Id, limit, offset, SortBy, SortType);
}
module.exports = {

    upload: upload,
    searchByDevice: searchByDevice
}