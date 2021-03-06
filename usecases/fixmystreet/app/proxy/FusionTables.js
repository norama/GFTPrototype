Ext.define('FixMyStreet.proxy.FusionTables', {
    extend: 'Ext.data.proxy.Proxy',

    alias: 'proxy.fusiontables',
	
	constructor: function(config) {
		this.callParent(arguments);
        var me = this;
		
		me.gftLib = new GftLib();
    },
	getGftLib: function() {
		return this.gftLib;
	},
	
    create: function(operation, callback, scope) {
		Ext.Logger.log('[gftproxy] create');
        var me = this;
        
		operation.setStarted();
        var records = operation.getRecords();
		var callbackCount = records.length;
		var callbackRecv = 0;
		
		var onInsertRecordFinished = function(success) {
			callbackRecv++;
			if (callbackRecv === callbackCount) {
				operation.setSuccessful();
				operation.setCompleted();
				if (typeof callback == 'function') {
					callback.call(scope || this, operation);
				}
			}
		}
		
		// insert all given records
		for(var i = 0; i < records.length; i++) {
			me.insertRecord(records[i], onInsertRecordFinished);
		}
    },
	
	read: function(operation, callback, scope) {
		Ext.Logger.log('[gftproxy] read');
		var me = this;
		
		var fields = operation.query || me.config.settings.idfield + ', ' + me.config.settings.fields.join(', ') || '*';
		
		var recieveData = function(data) {
			me.applyDataToModel(data, operation, callback, scope);
		};
		
		// recieve data from fusion table
		me.getGftLib().execSelect(recieveData, {
			table: me.config.settings.readTableId,
			fields: fields,
			condition: me.config.settings.condition
		}, me);
    },
	
	destroy: function(operation, callback, scope) {
		Ext.Logger.log('[gftproxy] destroy');
		
		var me = this;
		
		var records = operation.getRecords();
		var callbackCount = records.length;
		var callbackRecv = 0;
		var onDestroyRecordFinished = function(success) {
			callbackRecv++;
			if (callbackRecv === callbackCount) {
				operation.setSuccessful();
				operation.setCompleted();
				if (typeof callback == 'function') {
					callback.call(scope || this, operation);
				}
			}
		}
		
		// delete all given records
		for(var i = 0; i < records.length; i++) {
			me.deleteRecord(records[i], onDestroyRecordFinished);
		}
	},
	
	parseData: function(data) {
		var me = this;
		var objs = me.getGftLib().convertToObject(data);
		var records = [];
		
		for(var problem in objs) {
			var record = Ext.create(me.getModel(), objs[problem]);
			record.commit();
			records.push(record);
		}
		
		return records;
	},
	
	applyDataToModel: function(data, operation, callback, scope) {
		var me = this;

		var records = me.parseData(data);
		operation.setResultSet(Ext.create('Ext.data.ResultSet', {
            records: records,
            total  : records.length,
            loaded : true,
			success: true
        }));
		
		operation.setRecords(records);
		operation.setSuccessful();
		operation.setCompleted();
		
		// finish with callback
		if(typeof callback == "function") {
			callback.call(scope || me, operation);
		}
    },
	
	insertRecord: function(record, callback) {
		var me = this;
		var data = record.getData();
		var fields = [];
		var values = [];
		
		// extract fields and values from data
		for(var field in data) {
			if(me.config.settings.fields.indexOf(field) > -1) {
				fields.push(field);
				values.push(data[field]);
			}
		}
		
		var onInsertComplete = function(data) {
			var success = false;
			if(data.rows) {
				success = true;
				// use correct id from table for record id
				var idfield = data.rows[0][0];
				record.setId(idfield);
				record.commit();
			}
			callback(success);
		};
		
		// insert record to fusion table
		me.getGftLib().execInsert(onInsertComplete, {
			table: me.config.settings.writeTableId,
			fields: fields,
			values: values
		}, me);
	},
	
	deleteRecord: function(record, callback) {
		var me = this;
		var data = record.getData();
		
		var onDeleteComplete = function(data) {
			var success = true;
			if (data.error) {
				success = false;
			}
			callback(success);
		};
		
		// delete record from fusion table
		me.getGftLib().execDelete(onDeleteComplete, {
			table: me.config.settings.writeTableId,
			condition: me.config.settings.idfield + " = '" + data[me.config.settings.idfield] + "'"
		}, me);
	}
});
