var  Db = require('./db');
const express = require("express");
const bodyParser = require ("body-parser");
const sql = require('mssql');
const mysql = require('mysql');
const app = express();
var cors = require('cors')
var cookieParser = require('cookie-parser')
var fs = require('fs');
var https = require('https');
const crypto = require('crypto');
const path = require('path');
const NodeCache = require( "node-cache" );
const myCache = new NodeCache( { stdTTL: 3000, checkperiod: 3000} );
const key = Buffer.from('', 'base64');
const iv = Buffer.from('', 'base64');
var os = require('os');
function encrypt(data) {
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encryptedData = cipher.update(data, 'utf8', 'base64') + cipher.final('base64');
  return encryptedData;
}

function decrypt(data) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decripted = decipher.update(data, 'base64', 'utf8') + decipher.final('utf8');
  return decripted;
}

 var options2 = {
  key: fs.readFileSync('/var/www/html/node/private.key'),
  cert: fs.readFileSync('/var/www/html/node/certificate.crt')
};

// Create a service (the app object is just a callback).

const httpsServer = https.createServer({
 key: fs.readFileSync('/var/www/html/node/private.key'),
  cert: fs.readFileSync('/var/www/html/node/certificate.crt')
}, app);

var options2 = {
  key: fs.readFileSync('/etc/letsencrypt/live/site.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/site.com/cert.pem')
};

// Create a service (the app object is just a callback).

const httpsServer2 = https.createServer({
  key: fs.readFileSync('/etc/letsencrypt/live/site.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/site.com/cert.pem')
}, app);
const jwt = require('jsonwebtoken');
const JsonTokenVerifier = function (req, res, next) 
{
  fs.appendFile('Output.txt', "JsonTokenVerifier called", (err) => 
  {			
	if (req.headers.authorization=="Bearer null" || req.headers.authorization=="" || req.headers.authorization==null) 
	{
		return res.status(200).send({ 'status':{'code':'301','message': 'Please make sure your request has an Authorization header'},"result":{}});
	}
	let token = req.headers.authorization;		
	token=token.replace('Bearer ',''); 		
	try
	{
		if(token)
		{		
			let decodedToken = jwt.decode(token);
			jwt.verify(token, process.env.TOKEN_SECRET)	
			if(decodedToken==null)
			{
				return res.status(200).send({ 'status':{'code':'301','message': 'Please make sure your request has an Authorization header and it is correct'},"result":{}});
			}			
			next()
		}
		else
		{
			fs.appendFile('Output.txt', "JsonTokenVerifier called", (err) => 
			  {		

			  if (err) throw err;
			  })
			return res.status(200).send({ 'status':{'code':'301','message': 'Please make sure your request has an Authorization header'+req.params.toString()},"result":{}});
		}		
	}
	catch(e)
	{		
		return res.status(200).send({ 'status':{'code':'201','message': 'JWT Exception'},"result":{}});
	}
	if (err) throw err;
  })  
}

app.use(cookieParser())
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())
app.use(function(res, req, next){
    res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Origin", "https://site.com");
    res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS, POST, PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType, Content-Type, Accept, Authorization");
    next();
});
app.options('/api/auth', cors()) 
app.post("/api/auth", function(req , res)
{
	 var username=req.body.username;
     var pwd=req.body.password;	
	 response=handleAuth(username,pwd, res);
	 
});
app.use(JsonTokenVerifier)
require('dotenv').config({ path:path.join(__dirname, '.env') });

const sqlConfig = {
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      server: process.env.SERVER,
	  database:process.env.DATABASE,
	  pool: {
		max: 10,
		min: 0,
		idleTimeoutMillis: 30000
	  },
	  options: {
		encrypt: false, // for azure
		trustServerCertificate: false // change to true for local dev / self-signed certs
	  }
}
app.post("/api/auth", function(req , res)
{	
	
	 var username=req.body.username;
     var pwd=req.body.password;		
	 response=handleAuth(username,pwd, res);
	 
});


var con;
let response ="";
function handleAuth(username,pwd,res) {
  con = mysql.createConnection({
	  host: process.env.SQLSERVER,
	  user: process.env.SQLUSERNAME,
	  password: process.env.SQLPASSWORD
	}); 
    
   con.connect(function(err) {            
    if(err) {                             
      console.log('error when connecting to db:', err);
      setTimeout(handleAuth, 2000); 
    }
    var md5 = require('md5');
	var hash = md5(username+":"+"test.ca"+":"+pwd)
     con.query("SELECT * FROM `"+process.env.SQLDATABASE+"`.`users` where username='"+username+"' and HEX(hash)='"+hash+"' limit 1", async function (err, result, fields) {
	if (err) throw err;
	
	if(result[0])	
	{
		
		if(result[0].userid!="")
		{			
			 	const accessToken = jwt.sign( {username: username}, process.env.TOKEN_SECRET, { expiresIn: 60 * 60 * 8});
				const refreshToken = jwt.sign( {username: username}, process.env.TOKEN_SECRET, { expiresIn: 60 * 60 * 24});
				let response = 
				{ 
					"result":{"token":accessToken,"refreshToken":refreshToken,"username":username}, 
					"status":{
						"code":0,
						"message":"success",
					} 			
				}		
				res.json(response);	
					
		}
		else
		{			
			let response = 
			{ 
				"result":{}, 
				"status":{
					"code":102,
					"message":"password does not match",
				} 			
			}
			 res.json(response);
		}
	}
	else
	{			
		let response = 
		{ 
			"result":{}, 
			"status":{
				"code":102,
				"message":"password does not match",
			} 			
		}
		 res.json(response);
	}
  });
	// to avoid a hot loop, and to allow our node script to
  });
  // process asynchronous requests in the meantime.
// If you're also serving http, display a 503 error.
  con.on('error', function(err) {
    console.log('db error', err);
  
  });
}
app.post("/api/uploadfile", function(req , res)
{	
	var filetype=req.body.filetype;	
	Db.upload(req,res,filetype).then((data) => 
	{
		
	});
});
app.post("/api/modules", function(req , res)
{	
	
	
	let token = req.headers.authorization;
	token=token.replace('Bearer ',''); 	
	
	try
	{
		let decodedToken = jwt.decode(token);				
		var Id=req.body.Id?req.body.Id:""				
		var SortBy=req.body.SortBy?req.body.SortBy:"";	
		var SortType=req.body.SortType?req.body.SortType:"";	
		var limit=req.body.limit ? req.body.limit :"25";		
		var offset=req.body.page? req.body.page :"0";
		Db.searchByDevice("","",limit,offset,SortBy,SortType).then((data) => 
		{
			res.json(data);
		})
	}
	catch(e)
	{		
		return res.status(200).send({ 'status':{'code':'201','message': 'JWT Exception'},"result":{}});
	}
});



if(!module.parent){
  httpsServer2.listen(8080, () => {
    console.log('HTTPS Server running on port 8080');
});
}

module.exports = app
