module("GftLib", {
    setup: function() {
		this.gft = new GftLib();
		this.publicMethods = [
			'execSql',
			'execSelect',
			'execInsert',
			'getTableDescription',
			'convertToObject',
			'__sendRequest',
			'__readRequest',
			'__writeRequest',
			'__auth',
			'__getAccessToken',
			'__scopedDataCallback'
		];
		this.privateMethods = [
			'sendRequest',
			'readRequest',
			'writeRequest',
			'auth',
			'getAccessToken',
			'scopedDataCallback',
		];
		this.constants = [
			'GFT_PATH',
			'ACCESS_TOKEN_URL',
			'clientId',
			'apiKey',
			'scope',
			'accessToken'
		];
		this.testGftTable = '1R9FMod3LN7UO3R6jp7gJeSQ9hbEVOwLqF0AZFQg';
		this.testGftInsertTable = '1uMyelq7qaA9htJLYIcEdD9jyV3MYjB_PrMUiwmE';
	},
	teardown: function(){}
});

test("Construtor", function() {
	ok(this.gft instanceof GftLib, 'Object should be of GftLib or one of it\'s childs');
});

test("Public Methods", function() {
	for (var i in this.publicMethods) {
		var fn = this.publicMethods[i];
		ok(this.gft.hasOwnProperty(fn), 'Public function ' + fn + ' should exist');
		deepEqual(typeof this.gft[fn], 'function', 'Public function ' + fn + ' should be a function');
	}
});

test("Public API", function() {
	var publicApi = this.publicMethods.concat(this.constants);
	for (var prop in this.gft) {
		ok(publicApi.indexOf(prop) > -1, 'Public property ' + prop + ' is in API');
	}
});

test("Private Methods", function() {
	for (var i in this.privateMethods) {
		var fn = this.privateMethods[i];
		var ut_fn = '__' + fn;
		ok(!this.gft.hasOwnProperty(fn), 'Private function ' + fn + ' should not be accessible');
		deepEqual(typeof this.gft[ut_fn], 'function', 'Unit test alias ' + ut_fn + ' should exist');
	}
});

test("Constants", function() {
	for (var i in this.constants) {
		var constant = this.constants[i];
		ok(this.gft.hasOwnProperty(constant), 'Constant ' + constant + ' should exist');
	}
	
	deepEqual(this.gft.GFT_PATH,'/fusiontables/v1/query');
	deepEqual(this.gft.ACCESS_TOKEN_URL,'http://gft.rdmr.ch/services/OAuthToken.php?jsonp=?');
	deepEqual(this.gft.clientId, '63601791805.apps.googleusercontent.com');
    deepEqual(this.gft.apiKey, 'AIzaSyCAI2GoGWfLBvgygLKQp5suUk3RCG7r_ME');
    deepEqual(this.gft.scope, 'https://www.googleapis.com/auth/fusiontables');
	deepEqual(this.gft.accessToken, null);
});

asyncTest("sendRequest", 6, function() {
	var testCb = function(resp) {
		console.log(resp);
		ok(resp.hasOwnProperty('kind'), "Response should have 'kind' property");
		ok(resp.hasOwnProperty('columns'), "Response should have 'columns' property");
		ok(resp.hasOwnProperty('rows'), "Response should have 'rows' property");
		
		equal(resp.kind, 'fusiontables#sqlresponse', 'Response should be a sql response');
		equal(resp.rows.length,1, 'There should be exactly one result row');
		ok(resp.columns.length >= 1, 'There should be at least one column');
		
		start();
	}
	var params = {
		path: this.gft.GFT_PATH,
		params: { 
			sql: "select * from " + this.testGftTable + " limit 1"
		}
	};
	this.gft.__sendRequest(params,testCb);
});

asyncTest("readRequest", 7, function() {
	var testCb = function(data,status) {
		if (data === null) {
			ok(false, "readRequest failed with status: " + status);
			start();
			return;
		}
		equal(data.columns[0],"Text");
		equal(data.columns[1],"Number");
		equal(data.columns[2],"Location");
		equal(data.columns[3],"Date");
		equal(data.rows[0][0],"Some record");
		equal(data.rows[0][2],"Zurich");
		
		var statusObj = JSON.parse(status);
		equal(statusObj.gapiRequest.data.statusText, "OK", "Status 'OK' expected");
		start();
	}
	this.gft.__readRequest(testCb,'select * from ' + this.testGftTable + ' limit 1');
});

asyncTest("writeRequest", 5, function() {
	var testCb = function(data,status) {
		if (data === null) {
			ok(false, "writeRequest failed with status: " + status);
			start();
			return;
		}
		equal(data.rows.length,1);
		equal(data.columns.length,1);
		equal(data.columns[0],"rowid");
		ok($.isNumeric(data.rows[0][0]));
		
		var statusObj = JSON.parse(status);
		equal(statusObj.gapiRequest.data.statusText, "OK", "Status 'OK' expected");
		start();
	}
	this.gft.__writeRequest(testCb,'insert into  ' + this.testGftInsertTable + ' (Text) values (\'Test\')');
});

asyncTest("Exec SQL", 7, function() {
	var testCb = function(data,status) {
		equal(data.columns[0],"Text");
		equal(data.columns[1],"Number");
		equal(data.columns[2],"Location");
		equal(data.columns[3],"Date");
		equal(data.rows[0][0],"Some record");
		equal(data.rows[0][2],"Zurich");
		
		var statusObj = JSON.parse(status);
		equal(statusObj.gapiRequest.data.statusText, "OK", "Status 'OK' expected");
		start();
	}
	this.gft.execSql(testCb, 'select * from ' + this.testGftTable + ' limit 1');
});

asyncTest("ConvertToObject for single object", 4, function() {
	var gft = this.gft;
	var testCb = function(data,status) {
		var gftObjs = gft.convertToObject(data);
		equal(gftObjs[0].text, 'Some record');
		equal(gftObjs[0].number, 3);
		equal(gftObjs[0].location, 'Zurich');
		equal(gftObjs[0].date, '03.03.2012');
		start();
	}
	this.gft.execSql(testCb, 'select * from ' + this.testGftTable + ' limit 1');
});

asyncTest("ConvertToObject for multiple objects", 4, function() {
	var gft = this.gft;
	var testCb = function(data,status) {
		var gftObjs = gft.convertToObject(data);
		equal(gftObjs[0].text, 'Some record');
		equal(gftObjs[1].text, 'Another record');
		equal(gftObjs[2].text, 'And another record');
		equal(gftObjs[3].text, 'Yet another record');
		start();
	}
	this.gft.execSql(testCb, 'select * from ' + this.testGftTable + ' limit 4');
});

asyncTest("ExecSelect: Condition", 8, function() {
	var testCb = function(data,status) {
		equal(data.rows.length,1);
		equal(data.columns[0],"Text");
		equal(data.columns[1],"Number");
		equal(data.columns[2],"Location");
		equal(data.columns[3],"Date");
		equal(data.rows[0][0],"Some record");
		equal(data.rows[0][2],"Zurich");
		
		var statusObj = JSON.parse(status);
		equal(statusObj.gapiRequest.data.statusText, "OK", "Status 'OK' expected");
		start();
	}
	this.gft.execSelect(testCb, {table:this.testGftTable, condition:"Text = 'Some record'"});
});

asyncTest("ExecSelect: Projection", 6, function() {
	var testCb = function(data,status) {
		equal(data.rows.length,1);
		equal(data.rows[0].length,1);
		equal(data.columns.length,1);
		equal(data.columns[0],"mytext");
		equal(data.rows[0][0],"Some record");
		
		var statusObj = JSON.parse(status);
		equal(statusObj.gapiRequest.data.statusText, "OK", "Status 'OK' expected");
		start();
	}
	this.gft.execSelect(testCb, {table:this.testGftTable, fields:"Text as mytext",  limit:1});
});

asyncTest("ExecSelect: Order by", 3, function() {
	var testCb = function(data,status) {
		equal(data.rows[0][0],"Yet another record");
		equal(data.rows[1][0],"Some record");
		
		var statusObj = JSON.parse(status);
		equal(statusObj.gapiRequest.data.statusText, "OK", "Status 'OK' expected");
		start();
	}
	this.gft.execSelect(testCb, {table:this.testGftTable, fields:"Text", orderby:"Text desc", limit:2});
});

//TODO: This does currently not work due to a bug in the new API: http://code.google.com/p/fusion-tables/issues/detail?id=1086
asyncTest("ExecSelect: Group by", 4, function() {
	var testCb = function(data,status) {
		
		equal(data.rows.length,1);
		ok(true,"uncomment the following line when bug 1086 is fixed");
		//equal(data.rows[0][0],2); -> 
		equal(data.rows[0][1],3);
		
		var statusObj = JSON.parse(status);
		equal(statusObj.gapiRequest.data.statusText, "OK", "Status 'OK' expected");
		start();
	}
	this.gft.execSelect(testCb, {table:this.testGftTable, fields:"count(),Number", condition:"Number = 3", groupby:"Number"});
});

asyncTest("ExecInsert", 5, function() {
	var gft = this.gft;
	
	var testCb = function(data,status) {
		if (data === null) {
			ok(false, "writeRequest failed with status: " + status);
			start();
			return;
		}
		
		equal(data.columns.length,1);
		equal(data.columns[0],'rowid');
		equal(data.rows.length,1);
		ok($.isNumeric(data.rows[0][0]));

		var statusObj = JSON.parse(status);
		equal(statusObj.gapiRequest.data.statusText, "OK", "Status 'OK' expected");
		start();
	}
	
	gft.execInsert(testCb, {table:this.testGftInsertTable, fields:"Text,Number,Location,Date", values:"'Insert by Unit-Test',33,'','"+getDateString()+"'"});
});
